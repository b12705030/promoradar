-- ============================================
-- 交易管理與併行控制 Stored Procedures
-- ============================================
-- 
-- 此檔案包含兩個 stored procedures：
-- 1. claim_promotion() - 處理使用者領取優惠（交易管理 + 併行控制）
-- 2. update_promotion_quota() - 安全地更新優惠名額（併行控制）
--
-- 使用方式：
-- 在 Supabase Dashboard → SQL Editor 中執行此檔案
-- ============================================

-- ============================================
-- 1. claim_promotion() - 使用者領取優惠
-- ============================================
-- 
-- 功能：
-- - 使用 SELECT FOR UPDATE 鎖定優惠記錄（併行控制）
-- - 檢查所有名額限制（global_quota, daily_quota, per_user_limit）
-- - 插入使用記錄
-- - 所有操作在一個交易中完成（原子性）
--
-- 參數：
-- - p_user_id: 使用者 ID
-- - p_promo_id: 優惠 ID
--
-- 返回值：
-- - JSON 物件，包含更新後的名額資訊
-- ============================================

CREATE OR REPLACE FUNCTION claim_promotion(
  p_user_id INT,
  p_promo_id INT
) RETURNS JSON AS $$
DECLARE
  v_promotion RECORD;
  v_total_used INT;
  v_daily_used INT;
  v_user_used INT;
  v_result JSON;
BEGIN
  -- 使用 SELECT FOR UPDATE 鎖定優惠記錄（併行控制）
  -- 這確保同時只有一個交易可以處理同一個優惠的領取
  SELECT * INTO v_promotion
  FROM promotion
  WHERE promo_id = p_promo_id
  FOR UPDATE;  -- 🔒 鎖定這一行，直到交易結束

  -- 檢查優惠是否存在
  IF NOT FOUND THEN
    RAISE EXCEPTION '優惠不存在';
  END IF;

  -- 檢查優惠狀態
  IF v_promotion.status != 'Published' THEN
    RAISE EXCEPTION '優惠尚未發布或已取消';
  END IF;

  -- 檢查優惠是否在有效期間內
  IF CURRENT_TIMESTAMP < v_promotion.start_datetime OR 
     CURRENT_TIMESTAMP > v_promotion.end_datetime THEN
    RAISE EXCEPTION '優惠不在有效期間內';
  END IF;

  -- 計算總使用次數
  SELECT COUNT(*) INTO v_total_used
  FROM user_promotion
  WHERE promo_id = p_promo_id;

  -- 檢查總名額限制（global_quota）
  IF v_promotion.global_quota IS NOT NULL AND v_total_used >= v_promotion.global_quota THEN
    RAISE EXCEPTION '優惠名額已用完';
  END IF;

  -- 計算今日使用次數
  SELECT COUNT(*) INTO v_daily_used
  FROM user_promotion
  WHERE promo_id = p_promo_id
    AND DATE(created_at) = CURRENT_DATE;

  -- 檢查每日名額限制（daily_quota）
  IF v_promotion.daily_quota IS NOT NULL AND v_daily_used >= v_promotion.daily_quota THEN
    RAISE EXCEPTION '今日名額已用完';
  END IF;

  -- 計算使用者已使用次數
  SELECT COUNT(*) INTO v_user_used
  FROM user_promotion
  WHERE promo_id = p_promo_id
    AND user_id = p_user_id;

  -- 檢查個人使用次數限制（per_user_limit）
  IF v_promotion.per_user_limit IS NOT NULL AND v_user_used >= v_promotion.per_user_limit THEN
    RAISE EXCEPTION '已達個人使用上限';
  END IF;

  -- 插入使用記錄
  INSERT INTO user_promotion (user_id, promo_id, created_at)
  VALUES (p_user_id, p_promo_id, CURRENT_TIMESTAMP);

  -- 重新計算使用次數（插入後）
  SELECT COUNT(*) INTO v_total_used
  FROM user_promotion
  WHERE promo_id = p_promo_id;

  SELECT COUNT(*) INTO v_daily_used
  FROM user_promotion
  WHERE promo_id = p_promo_id
    AND DATE(created_at) = CURRENT_DATE;

  -- 返回更新後的名額資訊
  v_result := json_build_object(
    'promo_id', p_promo_id,
    'global_quota', v_promotion.global_quota,
    'daily_quota', v_promotion.daily_quota,
    'per_user_limit', v_promotion.per_user_limit,
    'total_used', v_total_used,
    'daily_used', v_daily_used,
    'remaining', CASE 
      WHEN v_promotion.global_quota IS NOT NULL 
      THEN GREATEST(v_promotion.global_quota - v_total_used, 0)
      ELSE NULL
    END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. update_promotion_quota() - 更新優惠名額
-- ============================================
-- 
-- 功能：
-- - 使用 SELECT FOR UPDATE 鎖定優惠記錄（併行控制）
-- - 檢查新名額是否合理（不小於已使用次數）
-- - 更新名額欄位
-- - 所有操作在一個交易中完成（原子性）
--
-- 參數：
-- - p_promo_id: 優惠 ID
-- - p_global_quota: 總名額（可選，NULL 表示不更新）
-- - p_daily_quota: 每日名額（可選，NULL 表示不更新）
-- - p_per_user_limit: 個人使用上限（可選，NULL 表示不更新）
--
-- 返回值：
-- - JSON 物件，包含更新後的名額資訊
-- ============================================

CREATE OR REPLACE FUNCTION update_promotion_quota(
  p_promo_id INT,
  p_global_quota INT DEFAULT NULL,
  p_daily_quota INT DEFAULT NULL,
  p_per_user_limit INT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_promotion RECORD;
  v_total_used INT;
  v_result JSON;
BEGIN
  -- 使用 SELECT FOR UPDATE 鎖定優惠記錄（併行控制）
  -- 這確保更新名額時，不會與使用者領取優惠的操作衝突
  SELECT * INTO v_promotion
  FROM promotion
  WHERE promo_id = p_promo_id
  FOR UPDATE;  -- 🔒 鎖定這一行，直到交易結束

  -- 檢查優惠是否存在
  IF NOT FOUND THEN
    RAISE EXCEPTION '優惠不存在';
  END IF;

  -- 計算當前總使用次數
  SELECT COUNT(*) INTO v_total_used
  FROM user_promotion
  WHERE promo_id = p_promo_id;

  -- 檢查 global_quota 是否合理（如果提供）
  IF p_global_quota IS NOT NULL AND p_global_quota < v_total_used THEN
    RAISE EXCEPTION '總名額不能小於已使用次數 (%)', v_total_used;
  END IF;

  -- 更新名額欄位（只更新提供的欄位）
  UPDATE promotion
  SET
    global_quota = COALESCE(p_global_quota, global_quota),
    daily_quota = COALESCE(p_daily_quota, daily_quota),
    per_user_limit = COALESCE(p_per_user_limit, per_user_limit)
  WHERE promo_id = p_promo_id;

  -- 重新讀取更新後的優惠資訊
  SELECT * INTO v_promotion
  FROM promotion
  WHERE promo_id = p_promo_id;

  -- 返回更新後的名額資訊
  v_result := json_build_object(
    'promo_id', p_promo_id,
    'global_quota', v_promotion.global_quota,
    'daily_quota', v_promotion.daily_quota,
    'per_user_limit', v_promotion.per_user_limit,
    'total_used', v_total_used,
    'remaining', CASE 
      WHEN v_promotion.global_quota IS NOT NULL 
      THEN GREATEST(v_promotion.global_quota - v_total_used, 0)
      ELSE NULL
    END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 完成
-- ============================================
-- 
-- 已建立兩個 stored procedures：
-- ✅ claim_promotion() - 使用者領取優惠
-- ✅ update_promotion_quota() - 更新優惠名額
--
-- 這些 stored procedures 已經在以下程式碼中使用：
-- - server/src/repositories/promotionRepository.ts
-- - server/src/services/promotionService.ts
-- - server/src/services/adminService.ts
-- ============================================

