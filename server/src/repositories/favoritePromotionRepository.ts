import { supabase } from '../lib/supabaseClient';

const TABLE = 'favorite_promotion';

export const favoritePromotionRepository = {
	async findByUser(userId: number): Promise<number[]> {
		const { data, error } = await supabase
			.from(TABLE)
			.select('promo_id')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });
		if (error) throw error;
		return (data ?? []).map((row: any) => Number(row.promo_id));
	},

	async add(userId: number, promoId: number): Promise<void> {
		const { error } = await supabase
			.from(TABLE)
			.upsert([{ user_id: userId, promo_id: promoId }], { onConflict: 'user_id,promo_id' });
		if (error) throw error;
	},

	async remove(userId: number, promoId: number): Promise<void> {
		const { error } = await supabase.from(TABLE).delete().eq('user_id', userId).eq('promo_id', promoId);
		if (error) throw error;
	},

	async clear(userId: number): Promise<void> {
		const { error } = await supabase.from(TABLE).delete().eq('user_id', userId);
		if (error) throw error;
	},
};


