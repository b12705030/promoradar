import { supabase } from '../lib/supabaseClient';
import type { BrandMetaRecord, BrandCategoryRecord } from '../types/promo';

const normalizeKey = (value: string) => value?.trim().toLowerCase() ?? '';

const mapBrand = (row: any): BrandMetaRecord | null => {
	const key = normalizeKey(row.brand_name ?? row.brandName ?? row.key ?? row.name);
	if (!key) return null;
	return {
		brandName: key,
		displayName: (row.display_name ?? row.name ?? row.brand_label ?? row.brandName ?? row.brand_name ?? '未知品牌') as string,
		logoUrl: row.logo_url ?? row.logo ?? undefined,
		primaryColor: row.primary_color ?? row.primaryColor ?? undefined,
		secondaryColor: row.secondary_color ?? row.secondaryColor ?? undefined,
		textColor: row.text_color ?? row.textColor ?? undefined,
	};
};

const mapCategory = (row: any): BrandCategoryRecord | null => {
	const key = normalizeKey(row.brand_name ?? row.brandName);
	if (!key) return null;
	const category = (row.category ?? row.category_name ?? row.tag ?? '').trim();
	if (!category) return null;
	return { brandName: key, category };
};

export const brandRepository = {
	async findAll(): Promise<BrandMetaRecord[]> {
		const { data, error } = await supabase.from('brand').select('*');
		if (error) throw error;
		return (data ?? []).map(mapBrand).filter((row): row is BrandMetaRecord => Boolean(row));
	},

	async findByKey(brandName: string): Promise<BrandMetaRecord | undefined> {
		const normalized = normalizeKey(brandName);
		// 先查詢所有資料，然後在應用層過濾（因為資料庫中的 brand_name 可能不是小寫）
		const { data, error } = await supabase.from('brand').select('*');
		if (error && error.code !== 'PGRST116') throw error;
		// 在應用層過濾，使用標準化比較以確保不區分大小寫
		const matched = (data ?? []).find((row) => normalizeKey(row.brand_name) === normalized);
		return matched ? mapBrand(matched) ?? undefined : undefined;
	},

	async create(payload: {
		brandName: string;
		displayName: string;
		category: string;
		logoUrl: string;
		primaryColor?: string;
		secondaryColor?: string;
		textColor?: string;
	}) {
		const now = new Date().toISOString();
		const { error, data } = await supabase
			.from('brand')
			.insert({
				brand_name: payload.brandName.trim().toLowerCase(),
				name: payload.displayName,
				category: payload.category,
				logo_url: payload.logoUrl,
				primary_color: payload.primaryColor ?? '#4B5563',
				secondary_color: payload.secondaryColor ?? null,
				text_color: payload.textColor ?? '#111827',
				created_at: now,
			})
			.select('*')
			.single();
		if (error) throw error;
		return mapBrand(data);
	},

	async update(
		brandName: string,
		payload: {
			displayName?: string;
			category?: string;
			logoUrl?: string | null;
			primaryColor?: string | null;
			secondaryColor?: string | null;
			textColor?: string | null;
		},
	) {
		const updates: Record<string, unknown> = {};
		if (payload.displayName !== undefined) updates.name = payload.displayName;
		if (payload.category !== undefined) updates.category = payload.category;
		if (payload.logoUrl !== undefined) updates.logo_url = payload.logoUrl;
		if (payload.primaryColor !== undefined) updates.primary_color = payload.primaryColor;
		if (payload.secondaryColor !== undefined) updates.secondary_color = payload.secondaryColor;
		if (payload.textColor !== undefined) updates.text_color = payload.textColor;
		if (Object.keys(updates).length === 0) {
			return this.findByKey(brandName) as Promise<BrandMetaRecord | undefined>;
		}
		const { data, error } = await supabase
			.from('brand')
			.update(updates)
			.eq('brand_name', brandName.trim().toLowerCase())
			.select('*')
			.single();
		if (error) throw error;
		return mapBrand(data);
	},

	async findCategories(): Promise<BrandCategoryRecord[]> {
		const { data, error } = await supabase.from('brand_category').select('*');
		if (error) throw error;
		return (data ?? []).map(mapCategory).filter((row): row is BrandCategoryRecord => Boolean(row));
	},
};


