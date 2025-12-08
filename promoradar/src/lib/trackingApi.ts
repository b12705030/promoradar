import { apiFetch } from './apiClient';
import type { UserBehaviorAction } from '../types/tracking';

export interface TrackUserBehaviorPayload {
	action: UserBehaviorAction;
	promo_id?: string | null;
	brand_name?: string | null;
	search_keyword?: string | null;
	tags?: string[] | null;
}

export async function trackUserBehavior(token: string | null, payload: TrackUserBehaviorPayload): Promise<void> {
	try {
		await apiFetch('/track', {
			method: 'POST',
			body: JSON.stringify(payload),
			token: token ?? undefined,
		});
	} catch (error) {
		// 追蹤失敗不應該影響用戶體驗，只記錄錯誤
		console.warn('[trackingApi] Failed to track user behavior:', error);
	}
}

