import dayjs from 'dayjs';
import { supabase } from '../lib/supabaseClient';
import type { PromotionUsageSummary } from '../types/user';

const TABLE = 'user_promotion';

const mapUsage = (entries: any[]): PromotionUsageSummary[] => {
	const map = new Map<number, PromotionUsageSummary>();
	for (const row of entries ?? []) {
		const promoId = Number(row.promo_id);
		if (!Number.isFinite(promoId)) continue;
		const createdAt = row.created_at ? String(row.created_at) : null;
		const existing = map.get(promoId);
		if (!existing) {
			map.set(promoId, { promoId, count: 1, lastUsed: createdAt });
		} else {
			existing.count += 1;
			if (!existing.lastUsed || (createdAt && createdAt > existing.lastUsed)) {
				existing.lastUsed = createdAt;
			}
		}
	}
	return Array.from(map.values()).sort((a, b) => {
		const timeA = a.lastUsed ?? '';
		const timeB = b.lastUsed ?? '';
		return timeB.localeCompare(timeA);
	});
};

export const userPromotionRepository = {
	async addUsage(userId: number, promoId: number): Promise<void> {
		const { error } = await supabase.from(TABLE).insert({ user_id: userId, promo_id: promoId });
		if (error) throw error;
	},

	async listUsage(userId: number): Promise<PromotionUsageSummary[]> {
		const { data, error } = await supabase
			.from(TABLE)
			.select('promo_id, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });
		if (error) throw error;
		return mapUsage(data ?? []);
	},

	async usageForPromotion(userId: number, promoId: number): Promise<PromotionUsageSummary | undefined> {
		const { data, error } = await supabase
			.from(TABLE)
			.select('promo_id, created_at')
			.eq('user_id', userId)
			.eq('promo_id', promoId)
			.order('created_at', { ascending: false });
		if (error) throw error;
		const summary = mapUsage(data ?? []);
		return summary[0];
	},

	async countForPromotion(promoId: number): Promise<number> {
		const { count, error } = await supabase
			.from(TABLE)
			.select('*', { count: 'exact', head: true })
			.eq('promo_id', promoId);
		if (error) throw error;
		return count ?? 0;
	},

	async dailyUsageForPromotion(promoId: number, days = 30) {
		const since = dayjs().subtract(days, 'day').startOf('day').toISOString();
		const { data, error } = await supabase
			.rpc('get_promotion_daily_usage', { p_promo_id: promoId, p_since: since });
		// In case rpc not exists, fallback to manual aggregation
		// PGRST202: function not found, PGRST204: no rows returned
		if (error && error.code !== 'PGRST202' && error.code !== 'PGRST204') throw error;
		if (!error && data) return data as Array<{ date: string; count: number }>;

		const { data: rows, error: selectError } = await supabase
			.from(TABLE)
			.select('created_at')
			.eq('promo_id', promoId)
			.gte('created_at', since);
		if (selectError) throw selectError;
		const bucket = new Map<string, number>();
		for (const row of rows ?? []) {
			const key = dayjs(row.created_at).format('YYYY-MM-DD');
			bucket.set(key, (bucket.get(key) ?? 0) + 1);
		}
		return Array.from(bucket.entries())
			.map(([date, count]) => ({ date, count }))
			.sort((a, b) => a.date.localeCompare(b.date));
	},

	async getUserRankings(limit = 100): Promise<Array<{ userId: number; username: string; totalUsage: number; rank: number }>> {
		// 獲取所有用戶的使用次數統計
		const { data, error } = await supabase
			.from(TABLE)
			.select('user_id');
		if (error) throw error;

		// 統計每個用戶的使用次數
		const usageMap = new Map<number, number>();
		for (const row of data ?? []) {
			const userId = Number(row.user_id);
			if (!Number.isFinite(userId)) continue;
			usageMap.set(userId, (usageMap.get(userId) ?? 0) + 1);
		}

		// 獲取用戶名稱
		const userIds = Array.from(usageMap.keys());
		if (userIds.length === 0) return [];

		const { data: users, error: userError } = await supabase
			.from('User')
			.select('user_id, username')
			.in('user_id', userIds);
		if (userError) throw userError;

		const usernameMap = new Map<number, string>();
		for (const user of users ?? []) {
			usernameMap.set(user.user_id, user.username);
		}

		// 構建排名列表
		const rankings = Array.from(usageMap.entries())
			.map(([userId, totalUsage]) => ({
				userId,
				username: usernameMap.get(userId) ?? `用戶 ${userId}`,
				totalUsage,
				rank: 0, // 稍後計算
			}))
			.sort((a, b) => b.totalUsage - a.totalUsage)
			.slice(0, limit);

		// 計算排名（相同使用次數共享排名）
		let currentRank = 1;
		for (let i = 0; i < rankings.length; i++) {
			if (i > 0 && rankings[i].totalUsage < rankings[i - 1].totalUsage) {
				currentRank = i + 1;
			}
			rankings[i].rank = currentRank;
		}

		return rankings;
	},
};


