import { apiFetch } from './apiClient';
import type { PromotionUsageEntry } from '../types/promo';

type ListResponse<T> = { items: T };

export async function fetchPromotionFavorites(token: string) {
	const data = await apiFetch<ListResponse<number[]>>('/user/favorites/promotions', { token });
	return data.items ?? [];
}

export async function addPromotionFavorite(token: string, promoId: number) {
	const data = await apiFetch<ListResponse<number[]>>('/user/favorites/promotions', {
		method: 'POST',
		token,
		body: JSON.stringify({ promoId }),
	});
	return data.items ?? [];
}

export async function removePromotionFavorite(token: string, promoId: number) {
	const data = await apiFetch<ListResponse<number[]>>(`/user/favorites/promotions/${promoId}`, {
		method: 'DELETE',
		token,
	});
	return data.items ?? [];
}

export async function clearPromotionFavorites(token: string) {
	const data = await apiFetch<ListResponse<number[]>>('/user/favorites/promotions', {
		method: 'DELETE',
		token,
	});
	return data.items ?? [];
}

export async function fetchFavoriteBrands(token: string) {
	const data = await apiFetch<ListResponse<string[]>>('/user/favorites/brands', { token });
	return data.items ?? [];
}

export async function addFavoriteBrand(token: string, brandName: string) {
	const data = await apiFetch<ListResponse<string[]>>('/user/favorites/brands', {
		method: 'POST',
		token,
		body: JSON.stringify({ brandName }),
	});
	return data.items ?? [];
}

export async function removeFavoriteBrand(token: string, brandName: string) {
	const encoded = encodeURIComponent(brandName);
	const data = await apiFetch<ListResponse<string[]>>(`/user/favorites/brands/${encoded}`, {
		method: 'DELETE',
		token,
	});
	return data.items ?? [];
}

export async function clearFavoriteBrands(token: string) {
	const data = await apiFetch<ListResponse<string[]>>('/user/favorites/brands', {
		method: 'DELETE',
		token,
	});
	return data.items ?? [];
}

export async function fetchAdminBrands(token: string) {
	const data = await apiFetch<ListResponse<string[]>>('/user/admin-brands', { token });
	return data.items ?? [];
}

export async function fetchPromotionUsage(token: string) {
	const data = await apiFetch<ListResponse<PromotionUsageEntry[]>>('/user/promotion-usage', { token });
	return data.items ?? [];
}

export async function markPromotionUsed(token: string, promoId: number) {
	const data = await apiFetch<{ success: boolean; usage?: PromotionUsageEntry }>(`/promotions/${promoId}/claim`, {
		method: 'POST',
		token,
	});
	return data.usage;
}

export type UserRanking = {
	userId: number;
	username: string;
	totalUsage: number;
	rank: number;
};

export async function fetchUserRankings(token: string, limit = 100) {
	const data = await apiFetch<ListResponse<UserRanking[]>>(`/user/rankings?limit=${limit}`, { token });
	return data.items ?? [];
}


