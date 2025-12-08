import { supabase } from '../lib/supabaseClient';

const TABLE = 'favorite_brand';

export const favoriteBrandRepository = {
	async findByUser(userId: number): Promise<string[]> {
		const { data, error } = await supabase
			.from(TABLE)
			.select('brand_name')
			.eq('user_id', userId)
			.order('created_at', { ascending: true });
		if (error) throw error;
		return (data ?? []).map((row: any) => String(row.brand_name));
	},

	async add(userId: number, brandName: string): Promise<void> {
		const normalized = brandName.trim();
		if (!normalized) return;
		const { error } = await supabase
			.from(TABLE)
			.upsert(
				[{ user_id: userId, brand_name: normalized }],
				{ onConflict: 'user_id,brand_name' },
			);
		if (error) throw error;
	},

	async remove(userId: number, brandName: string): Promise<void> {
		const normalized = brandName.trim();
		if (!normalized) return;
		const { error } = await supabase
			.from(TABLE)
			.delete()
			.eq('user_id', userId)
			.eq('brand_name', normalized);
		if (error) throw error;
	},

	async clear(userId: number): Promise<void> {
		const { error } = await supabase.from(TABLE).delete().eq('user_id', userId);
		if (error) throw error;
	},
};


