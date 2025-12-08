import { supabase } from '../lib/supabaseClient';

const TABLE = 'admin_brand';
const normalizeKey = (value: string) => value?.trim().toLowerCase() ?? '';

export const adminBrandRepository = {
	async findBrandsByAdmin(userId: number): Promise<string[]> {
		const { data, error } = await supabase.from(TABLE).select('brand_name').eq('admin_id', userId);
		if (error) throw error;
		// 返回原始的品牌名稱（保留大小寫），用於顯示
		return (data ?? []).map((row: any) => String(row.brand_name));
	},

	async isAdminForBrand(userId: number, brandName: string): Promise<boolean> {
		const normalized = normalizeKey(brandName);
		if (!normalized) return false;
		// 先查詢該用戶的所有品牌，然後在應用層過濾（因為資料庫中的 brand_name 可能不是小寫）
		const { data, error } = await supabase.from(TABLE).select('brand_name').eq('admin_id', userId);
		if (error) throw error;
		// 在應用層過濾，使用標準化比較以確保不區分大小寫
		const matched = (data ?? []).find((row) => normalizeKey(String(row.brand_name)) === normalized);
		return Boolean(matched);
	},

	async addAdmin(userId: number, brandName: string): Promise<void> {
		const normalized = normalizeKey(brandName);
		if (!normalized) return;
		const { error } = await supabase
			.from(TABLE)
			.upsert([{ admin_id: userId, brand_name: normalized }], { onConflict: 'admin_id,brand_name' });
		if (error) throw error;
	},
};


