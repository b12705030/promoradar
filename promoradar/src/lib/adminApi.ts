import { apiFetch } from './apiClient';
import type { PromotionRecord, StoreRecord, BrandMeta, PromotionUsageEntry } from '../types/promo';

type ListResponse<T> = { items: T };

export async function adminListBrands(token: string) {
	const data = await apiFetch<ListResponse<(BrandMeta | null)[]>>('/admin/brands', { token });
	return (data.items ?? []).filter(Boolean) as BrandMeta[];
}

export async function adminCreateBrand(
	token: string,
	payload: {
		key: string;
		displayName: string;
		category: string;
		logoUrl: string;
		primaryColor?: string;
		secondaryColor?: string;
		textColor?: string;
	},
) {
	return apiFetch<BrandMeta>('/admin/brands', {
		method: 'POST',
		token,
		body: JSON.stringify(payload),
	});
}

export async function adminUpdateBrand(
	token: string,
	brandKey: string,
	payload: {
		displayName?: string;
		category?: string;
		logoUrl?: string | null;
		primaryColor?: string | null;
		secondaryColor?: string | null;
		textColor?: string | null;
	},
) {
	return apiFetch<BrandMeta>(`/admin/brands/${encodeURIComponent(brandKey)}`, {
		method: 'PUT',
		token,
		body: JSON.stringify(payload),
	});
}

export async function adminListStores(token: string, brandName: string) {
	const params = new URLSearchParams({ brandName });
	const data = await apiFetch<ListResponse<StoreRecord[]>>(`/admin/stores?${params.toString()}`, { token });
	return data.items ?? [];
}

export async function adminCreateStore(
	token: string,
	payload: {
		brandName: string;
		name: string;
		address: string;
		lat: number;
		lng: number;
		region: string;
	},
) {
	return apiFetch<StoreRecord>('/admin/stores', {
		method: 'POST',
		token,
		body: JSON.stringify(payload),
	});
}

export async function adminUpdateStore(
	token: string,
	storeId: number,
	payload: Partial<{
		brandName: string;
		name: string;
		address: string;
		lat: number;
		lng: number;
		region: string;
		isActive: boolean;
	}>,
) {
	return apiFetch<StoreRecord>(`/admin/stores/${storeId}`, {
		method: 'PUT',
		token,
		body: JSON.stringify(payload),
	});
}

export async function adminListPromotions(token: string, brandName: string) {
	const params = new URLSearchParams({ brandName });
	const data = await apiFetch<ListResponse<PromotionRecord[]>>(`/admin/promotions?${params.toString()}`, { token });
	return data.items ?? [];
}

export async function adminCreatePromotion(token: string, payload: Partial<PromotionRecord> & { brandName: string }) {
	return apiFetch<PromotionRecord>('/admin/promotions', {
		method: 'POST',
		token,
		body: JSON.stringify(payload),
	});
}

export async function adminUpdatePromotion(token: string, promoId: number, payload: Partial<PromotionRecord>) {
	return apiFetch<PromotionRecord>(`/admin/promotions/${promoId}`, {
		method: 'PUT',
		token,
		body: JSON.stringify(payload),
	});
}

export async function adminPublishPromotion(token: string, promoId: number) {
	return apiFetch<PromotionRecord>(`/admin/promotions/${promoId}/publish`, {
		method: 'POST',
		token,
	});
}

export async function adminCancelPromotion(token: string, promoId: number) {
	return apiFetch<PromotionRecord>(`/admin/promotions/${promoId}/cancel`, {
		method: 'POST',
		token,
	});
}

export async function adminGetPromotionQuota(token: string, promoId: number) {
	return apiFetch<{
		promotion: PromotionRecord;
		stats: {
			globalQuota: number | null;
			dailyQuota: number | null;
			totalUsed: number;
			remaining: number | null;
			daily: Array<{ date: string; count: number }>;
			clickCount?: number;
			viewCount?: number;
		};
	}>(
		`/admin/promotions/${promoId}/quota`,
		{ token },
	);
}

export async function adminGetPromotionExclusions(token: string, promoId: number) {
	const data = await apiFetch<{ items: Array<{ promoId: number; storeId: number }> }>(
		`/admin/promotions/${promoId}/exclusions`,
		{ token },
	);
	return data.items ?? [];
}

export async function adminSetPromotionExclusions(token: string, promoId: number, storeIds: number[]) {
	const data = await apiFetch<{ items: Array<{ promoId: number; storeId: number }> }>(
		`/admin/promotions/${promoId}/exclusions`,
		{
			method: 'PUT',
			token,
			body: JSON.stringify({ storeIds }),
		},
	);
	return data.items ?? [];
}


