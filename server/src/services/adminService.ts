import { brandRepository } from '../repositories/brandRepository';
import { storeRepository } from '../repositories/storeRepository';
import { promotionRepository } from '../repositories/promotionRepository';
import { adminBrandRepository } from '../repositories/adminBrandRepository';
import { userRepository } from '../repositories/userRepository';
import { userPromotionRepository } from '../repositories/userPromotionRepository';
import { behaviorRepository } from '../repositories/behaviorRepository';
import type { PromotionRecord } from '../types/promo';

async function ensureBrandAdmin(userId: number, brandName: string) {
	const isAdmin = await adminBrandRepository.isAdminForBrand(userId, brandName);
	if (!isAdmin) {
		const err = new Error('無權操作此品牌');
		(err as Error & { status?: number }).status = 403;
		throw err;
	}
}

export const adminService = {
	async listManagedBrands(userId: number) {
		const brandKeys = await adminBrandRepository.findBrandsByAdmin(userId);
		if (!brandKeys.length) return [];
		// 使用標準化的 key 來查詢品牌資料（用於比對），但保留原始的 key 用於顯示
		const normalizeKey = (value: string) => value?.trim().toLowerCase() ?? '';
		const [metas, categories] = await Promise.all([
			Promise.all(brandKeys.map((key) => brandRepository.findByKey(key))),
			brandRepository.findCategories(),
		]);
		const categoryMap = new Map<string, string[]>();
		for (const entry of categories) {
			const arr = categoryMap.get(entry.brandName) ?? [];
			arr.push(entry.category);
			categoryMap.set(entry.brandName, arr);
		}
		const result = brandKeys.map((originalKey, idx) => {
			const meta = metas[idx];
			const normalizedKey = normalizeKey(originalKey);
			// 除錯：記錄品牌資料載入情況
			if (!meta) {
				console.warn(`[adminService] 品牌 ${originalKey} 的資料未找到`);
			} else {
				console.log(`[adminService] 品牌 ${originalKey} 的顏色:`, {
					primaryColor: meta.primaryColor,
					secondaryColor: meta.secondaryColor,
					textColor: meta.textColor,
				});
			}
			return {
				key: originalKey, // 使用原始的品牌名稱（保留大小寫）
				displayName: meta?.displayName ?? originalKey,
				logo: meta?.logoUrl ?? null,
				primaryColor: meta?.primaryColor ?? '#4B5563',
				secondaryColor: meta?.secondaryColor ?? null,
				textColor: meta?.textColor ?? '#111827',
				categories: categoryMap.get(normalizedKey) ?? [], // 使用標準化的 key 來查找分類
			};
		});
		return result;
	},

	async createBrand(userId: number, payload: {
		key: string;
		displayName: string;
		category: string;
		logoUrl: string;
		primaryColor?: string;
		secondaryColor?: string;
		textColor?: string;
	}) {
		const existing = await brandRepository.findByKey(payload.key);
		if (existing) {
			const err = new Error('品牌代號已存在');
			(err as Error & { status?: number }).status = 409;
			throw err;
		}
		const brand = await brandRepository.create({
			brandName: payload.key,
			displayName: payload.displayName,
			category: payload.category,
			logoUrl: payload.logoUrl,
			primaryColor: payload.primaryColor,
			secondaryColor: payload.secondaryColor,
			textColor: payload.textColor,
		});
		await adminBrandRepository.addAdmin(userId, payload.key);
		const user = await userRepository.findById(userId);
		if (user && !user.isAdmin) {
			await userRepository.setAdminFlag(userId, true);
		}
		return brand;
	},

	async updateBrand(userId: number, brandName: string, payload: {
		displayName?: string;
		category?: string;
		logoUrl?: string | null;
		primaryColor?: string | null;
		secondaryColor?: string | null;
		textColor?: string | null;
	}) {
		await ensureBrandAdmin(userId, brandName);
		return brandRepository.update(brandName, payload);
	},

	async createStore(userId: number, payload: {
		brandName: string;
		name: string;
		address: string;
		lat: number;
		lng: number;
		region: string;
	}) {
		await ensureBrandAdmin(userId, payload.brandName);
		const store = await storeRepository.create({ ...payload, isActive: true });
		// 記錄 admin action
		await behaviorRepository.logAdminAction({
			admin_id: userId.toString(),
			brand_name: payload.brandName,
			action: 'edit_store',
			store_id: store.storeId.toString(),
		});
		return store;
	},

	async updateStore(userId: number, storeId: number, payload: {
		brandName?: string;
		name?: string;
		address?: string;
		lat?: number;
		lng?: number;
		region?: string;
		isActive?: boolean;
	}) {
		const store = await storeRepository.findById(storeId);
		if (!store) {
			const err = new Error('門市不存在');
			(err as Error & { status?: number }).status = 404;
			throw err;
		}
		await ensureBrandAdmin(userId, payload.brandName ?? store.brandName);
		const updated = await storeRepository.update(storeId, payload);
		// 記錄 admin action
		await behaviorRepository.logAdminAction({
			admin_id: userId.toString(),
			brand_name: payload.brandName ?? store.brandName,
			action: 'edit_store',
			store_id: storeId.toString(),
		});
		return updated;
	},

	async createPromotion(userId: number, payload: {
		brandName: string;
		title: string;
		description?: string;
		promoType: string;
		eventTag: string;
		startDatetime: string;
		endDatetime: string;
		stackingRule?: string | null;
		needMembership: boolean;
		needCode: boolean;
		perUserLimit: number;
		globalQuota: number | null;
		dailyQuota: number | null;
	}) {
		await ensureBrandAdmin(userId, payload.brandName);
		const promotion = await promotionRepository.create({
			...payload,
			creatorId: userId,
			status: 'Draft',
		});
		// 記錄 admin action
		await behaviorRepository.logAdminAction({
			admin_id: userId.toString(),
			brand_name: payload.brandName,
			action: 'create_promo',
			promo_id: promotion.promoId.toString(),
		});
		return promotion;
	},

	async updatePromotion(userId: number, promoId: number, payload: Partial<Omit<PromotionRecord, 'promoId' | 'brandName'>>) {
		const promotion = await promotionRepository.findById(promoId);
		if (!promotion) {
			const err = new Error('活動不存在');
			(err as Error & { status?: number }).status = 404;
			throw err;
		}
		if (promotion.status !== 'Draft') {
			const err = new Error('已發布活動不可修改');
			(err as Error & { status?: number }).status = 400;
			throw err;
		}
		await ensureBrandAdmin(userId, promotion.brandName);
		const updated = await promotionRepository.update(promoId, payload);
		// 記錄 admin action
		await behaviorRepository.logAdminAction({
			admin_id: userId.toString(),
			brand_name: promotion.brandName,
			action: 'update_promo',
			promo_id: promoId.toString(),
		});
		return updated;
	},

	async publishPromotion(userId: number, promoId: number) {
		const promotion = await promotionRepository.findById(promoId);
		if (!promotion) {
			const err = new Error('活動不存在');
			(err as Error & { status?: number }).status = 404;
			throw err;
		}
		if (promotion.status !== 'Draft') {
			const err = new Error('活動已發布或已取消');
			(err as Error & { status?: number }).status = 400;
			throw err;
		}
		await ensureBrandAdmin(userId, promotion.brandName);
		return promotionRepository.setStatus(promoId, 'Published');
	},

	async cancelPromotion(userId: number, promoId: number) {
		const promotion = await promotionRepository.findById(promoId);
		if (!promotion) {
			const err = new Error('活動不存在');
			(err as Error & { status?: number }).status = 404;
			throw err;
		}
		if (promotion.status === 'Canceled') {
			return promotion;
		}
		await ensureBrandAdmin(userId, promotion.brandName);
		const canceled = await promotionRepository.setStatus(promoId, 'Canceled');
		// 記錄 admin action
		await behaviorRepository.logAdminAction({
			admin_id: userId.toString(),
			brand_name: promotion.brandName,
			action: 'delete_promo',
			promo_id: promoId.toString(),
		});
		return canceled;
	},

	async getPromotionExclusions(userId: number, promoId: number) {
		const promo = await promotionRepository.findById(promoId);
		if (!promo) {
			const err = new Error('活動不存在');
			(err as Error & { status?: number }).status = 404;
			throw err;
		}
		await ensureBrandAdmin(userId, promo.brandName);
		return await promotionRepository.findExclusions(promoId);
	},

	async setPromotionExclusions(userId: number, promoId: number, storeIds: number[]) {
		const promo = await promotionRepository.findById(promoId);
		if (!promo) {
			const err = new Error('活動不存在');
			(err as Error & { status?: number }).status = 404;
			throw err;
		}
		await ensureBrandAdmin(userId, promo.brandName);
		// 驗證所有 storeIds 都屬於該品牌
		const stores = await storeRepository.findByBrand(promo.brandName);
		const validStoreIds = new Set(stores.map((s) => s.storeId));
		const invalidStoreIds = storeIds.filter((id) => !validStoreIds.has(id));
		if (invalidStoreIds.length > 0) {
			const err = new Error(`無效的門市 ID: ${invalidStoreIds.join(', ')}`);
			(err as Error & { status?: number }).status = 400;
			throw err;
		}
		return await promotionRepository.setExclusions(promoId, storeIds);
	},

	async getPromotionQuota(userId: number, promoId: number) {
		const promotion = await promotionRepository.findById(promoId);
		if (!promotion) {
			const err = new Error('活動不存在');
			(err as Error & { status?: number }).status = 404;
			throw err;
		}
		await ensureBrandAdmin(userId, promotion.brandName);
		const totalUsed = await userPromotionRepository.countForPromotion(promoId);
		const daily = await userPromotionRepository.dailyUsageForPromotion(promoId, 30);
		const remaining = promotion.globalQuota != null ? Math.max(promotion.globalQuota - totalUsed, 0) : null;
		return {
			promotion,
			stats: {
				globalQuota: promotion.globalQuota,
				dailyQuota: promotion.dailyQuota,
				totalUsed,
				remaining,
				daily,
			},
		};
	},

	async listStores(userId: number, brandName: string) {
		await ensureBrandAdmin(userId, brandName);
		return storeRepository.findByBrand(brandName);
	},

	async listPromotions(userId: number, brandName: string) {
		await ensureBrandAdmin(userId, brandName);
		return promotionRepository.findByBrand(brandName);
	},
};


