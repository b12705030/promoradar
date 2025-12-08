import type { StoreRecord } from '../types/promo';
import { supabase } from '../lib/supabaseClient';
import { brandRepository } from './brandRepository';

const normalizeKey = (value: string) => value?.trim().toLowerCase() ?? '';

const mapStore = (row: any): StoreRecord => ({
	storeId: row.store_id,
	brandName: row.brand_name,
	name: row.name,
	address: row.address,
	lat: row.lat,
	lng: row.lng,
	region: row.region ?? '',
	isActive: row.is_active ?? true,
});

export const storeRepository = {
	async findAll(): Promise<StoreRecord[]> {
		const { data, error } = await supabase.from('store').select('*');
		if (error) throw error;
		return (data ?? []).map(mapStore);
	},

	async findByBrand(brandName: string): Promise<StoreRecord[]> {
		const { data, error } = await supabase.from('store').select('*').ilike('brand_name', brandName);
		if (error) throw error;
		return (data ?? []).map(mapStore);
	},

	async findById(storeId: number): Promise<StoreRecord | undefined> {
		const { data, error } = await supabase.from('store').select('*').eq('store_id', storeId).maybeSingle();
		if (error && error.code !== 'PGRST116') throw error;
		return data ? mapStore(data) : undefined;
	},

	async create(payload: Omit<StoreRecord, 'storeId' | 'isActive'> & { isActive?: boolean }) {
		// 先查詢 brand 表，找到正確的 brand_name 格式（用於外鍵約束）
		const normalizedBrandName = normalizeKey(payload.brandName);
		const brand = await brandRepository.findByKey(payload.brandName);
		if (!brand) {
			const err = new Error(`品牌 ${payload.brandName} 不存在`);
			(err as Error & { status?: number }).status = 404;
			throw err;
		}
		// 使用 brand 表中的實際 brand_name（從資料庫查詢得到的）
		// 但我們需要從 brandRepository 返回的資料中取得原始格式
		// 由於 findByKey 返回的是標準化後的 key，我們需要查詢原始資料
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

		const { data, error } = await supabase
			.from('store')
			.insert({
				brand_name: actualBrandName, // 使用資料庫中的實際格式，確保外鍵約束通過
				name: payload.name,
				address: payload.address,
				lat: payload.lat,
				lng: payload.lng,
				region: payload.region,
				is_active: payload.isActive ?? true,
			})
			.select('*')
			.single();
		if (error) throw error;
		return mapStore(data);
	},

	async update(
		storeId: number,
		payload: Partial<Omit<StoreRecord, 'storeId'>> & { isActive?: boolean },
	): Promise<StoreRecord | undefined> {
		const updates: Record<string, unknown> = {};
		if (payload.brandName !== undefined) {
			// 先查詢 brand 表，找到正確的 brand_name 格式
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
			updates.brand_name = String(brandData.brand_name); // 使用資料庫中的實際格式
		}
		if (payload.name !== undefined) updates.name = payload.name;
		if (payload.address !== undefined) updates.address = payload.address;
		if (payload.lat !== undefined) updates.lat = payload.lat;
		if (payload.lng !== undefined) updates.lng = payload.lng;
		if (payload.region !== undefined) updates.region = payload.region;
		if (payload.isActive !== undefined) updates.is_active = payload.isActive;
		if (Object.keys(updates).length === 0) return this.findById(storeId);
		const { data, error } = await supabase.from('store').update(updates).eq('store_id', storeId).select('*').single();
		if (error) throw error;
		return mapStore(data);
	},
};

