import dayjs from 'dayjs';
import type { PromotionFilter, PromotionRecord, PromotionStoreExclusion } from '../types/promo';
import { supabase } from '../lib/supabaseClient';
import { brandRepository } from './brandRepository';

const normalizeKey = (value: string) => value.trim().toLowerCase();

const mapPromotion = (row: any): PromotionRecord => ({
	promoId: row.promo_id,
	brandName: row.brand_name,
	title: row.title,
	description: row.description,
	promoType: row.promo_type,
	eventTag: row.event_tag,
	startDatetime: row.start_datetime,
	endDatetime: row.end_datetime,
	stackingRule: row.stacking_rule,
	needMembership: row.need_membership,
	needCode: row.need_code,
	perUserLimit: row.per_user_limit,
	globalQuota: row.global_quota,
	dailyQuota: row.daily_quota,
	lastUpdated: row.last_updated,
	creatorId: row.creator_id,
	status: row.status,
});

export const promotionRepository = {
	async findAll(filter: PromotionFilter = {}): Promise<PromotionRecord[]> {
		const query = supabase.from('promotion').select('*');

		if (filter.search) {
			const keyword = `%${filter.search}%`;
			query.ilike('title', keyword).or(`description.ilike.${keyword}`);
		}
		if (filter.eventTags?.length) query.in('event_tag', filter.eventTags);
		if (filter.promoTypes?.length) query.in('promo_type', filter.promoTypes);
		if (filter.needMembership !== undefined) query.eq('need_membership', filter.needMembership);

		const { data, error } = await query;
		if (error) throw error;

		const parsed = (data ?? []).map(mapPromotion);

		return parsed.filter((promo) => {
			if (filter.brandNames?.length && !filter.brandNames.includes(normalizeKey(promo.brandName))) return false;
			if (filter.onlyActive) {
				const now = dayjs();
				if (!(now.isAfter(promo.startDatetime) && now.isBefore(promo.endDatetime))) return false;
			}
			return true;
		});
	},

	async findById(promoId: number): Promise<PromotionRecord | undefined> {
		const { data, error } = await supabase.from('promotion').select('*').eq('promo_id', promoId).maybeSingle();
		if (error) {
			if (error.code === 'PGRST116') return undefined;
			throw error;
		}
		return data ? mapPromotion(data) : undefined;
	},

	async findByBrand(brandName: string, statuses?: PromotionRecord['status'][]): Promise<PromotionRecord[]> {
		const normalized = normalizeKey(brandName);
		// 先查詢所有資料，然後在應用層過濾（因為資料庫中的 brand_name 可能不是小寫）
		// 這樣可以確保不區分大小寫的匹配
		const query = supabase.from('promotion').select('*');
		if (statuses?.length) query.in('status', statuses);
		const { data, error } = await query;
		if (error) throw error;
		// 在應用層過濾，使用標準化比較以確保不區分大小寫
		const filtered = (data ?? []).filter((row) => normalizeKey(row.brand_name) === normalized);
		return filtered.map(mapPromotion);
	},

	async create(payload: {
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
		creatorId: number;
		status: PromotionRecord['status'];
	}) {
		// 先查詢 brand 表，找到正確的 brand_name 格式（用於外鍵約束）
		const normalizedBrandName = normalizeKey(payload.brandName);
		const { data: brandData, error: brandError } = await supabase
			.from('brand')
			.select('brand_name')
			.ilike('brand_name', normalizedBrandName)
			.maybeSingle();
		if (brandError && brandError.code !== 'PGRST116') throw brandError;
		if (!brandData) {
			const err = new Error(`品牌 ${payload.brandName} 不存在`);
			(err as Error & { status?: number }).status = 404;
			throw err;
		}
		const actualBrandName = String(brandData.brand_name); // 使用資料庫中的實際格式

		const now = new Date().toISOString();
		const { data, error } = await supabase
			.from('promotion')
			.insert({
				brand_name: actualBrandName, // 使用資料庫中的實際格式，確保外鍵約束通過
				title: payload.title,
				description: payload.description ?? '',
				promo_type: payload.promoType,
				event_tag: payload.eventTag,
				start_datetime: payload.startDatetime,
				end_datetime: payload.endDatetime,
				stacking_rule: payload.stackingRule ?? null,
				need_membership: payload.needMembership,
				need_code: payload.needCode,
				per_user_limit: payload.perUserLimit,
				global_quota: payload.globalQuota,
				daily_quota: payload.dailyQuota,
				creator_id: payload.creatorId,
				status: payload.status,
				last_updated: now,
			})
			.select('*')
			.single();
		if (error) throw error;
		return mapPromotion(data);
	},

	async update(promoId: number, updates: Partial<Omit<PromotionRecord, 'promoId' | 'brandName'>>) {
		const payload: Record<string, unknown> = {};
		if (updates.title !== undefined) payload.title = updates.title;
		if (updates.description !== undefined) payload.description = updates.description;
		if (updates.promoType !== undefined) payload.promo_type = updates.promoType;
		if (updates.eventTag !== undefined) payload.event_tag = updates.eventTag;
		if (updates.startDatetime !== undefined) payload.start_datetime = updates.startDatetime;
		if (updates.endDatetime !== undefined) payload.end_datetime = updates.endDatetime;
		if (updates.stackingRule !== undefined) payload.stacking_rule = updates.stackingRule;
		if (updates.needMembership !== undefined) payload.need_membership = updates.needMembership;
		if (updates.needCode !== undefined) payload.need_code = updates.needCode;
		if (updates.perUserLimit !== undefined) payload.per_user_limit = updates.perUserLimit;
		if (updates.globalQuota !== undefined) payload.global_quota = updates.globalQuota;
		if (updates.dailyQuota !== undefined) payload.daily_quota = updates.dailyQuota;
		if (updates.status !== undefined) payload.status = updates.status;
		if (Object.keys(payload).length === 0) return this.findById(promoId);
		payload.last_updated = new Date().toISOString();
		const { data, error } = await supabase.from('promotion').update(payload).eq('promo_id', promoId).select('*').single();
		if (error) throw error;
		return mapPromotion(data);
	},

	async setStatus(promoId: number, status: PromotionRecord['status']) {
		const { data, error } = await supabase
			.from('promotion')
			.update({ status, last_updated: new Date().toISOString() })
			.eq('promo_id', promoId)
			.select('*')
			.single();
		if (error) throw error;
		return mapPromotion(data);
	},

	async findExclusions(promoId: number): Promise<PromotionStoreExclusion[]> {
		const { data, error } = await supabase.from('promotionstore').select('*').eq('promo_id', promoId);
		if (error) throw error;
		return (data ?? []).map((row: any) => ({
			promoId: row.promo_id,
			storeId: row.store_id,
			reason: row.reason ?? undefined,
		}));
	},

	async findAllExclusions(): Promise<PromotionStoreExclusion[]> {
		const { data, error } = await supabase.from('promotionstore').select('*');
		if (error) throw error;
		return (data ?? []).map((row: any) => ({
			promoId: row.promo_id,
			storeId: row.store_id,
			reason: row.reason ?? undefined,
		}));
	},

	async addExclusion(promoId: number, storeId: number, reason?: string): Promise<PromotionStoreExclusion> {
		const { data, error } = await supabase
			.from('promotionstore')
			.insert({
				promo_id: promoId,
				store_id: storeId,
				reason: reason ?? null,
			})
			.select()
			.single();
		if (error) throw error;
		return {
			promoId: data.promo_id,
			storeId: data.store_id,
			reason: data.reason ?? undefined,
		};
	},

	async removeExclusion(promoId: number, storeId: number): Promise<void> {
		const { error } = await supabase
			.from('promotionstore')
			.delete()
			.eq('promo_id', promoId)
			.eq('store_id', storeId);
		if (error) throw error;
	},

	async setExclusions(promoId: number, storeIds: number[]): Promise<PromotionStoreExclusion[]> {
		// 先刪除所有現有的 exclusions
		const { error: deleteError } = await supabase
			.from('promotionstore')
			.delete()
			.eq('promo_id', promoId);
		if (deleteError) throw deleteError;

		// 如果沒有要添加的，直接返回空陣列
		if (storeIds.length === 0) return [];

		// 批量插入新的 exclusions
		const { data, error } = await supabase
			.from('promotionstore')
			.insert(storeIds.map((storeId) => ({ promo_id: promoId, store_id: storeId })))
			.select();
		if (error) throw error;
		return (data ?? []).map((row: any) => ({
			promoId: row.promo_id,
			storeId: row.store_id,
			reason: row.reason ?? undefined,
		}));
	},
};

