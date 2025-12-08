import { z } from 'zod';
import { behaviorRepository, type UserBehaviorAction } from '../repositories/behaviorRepository';

const trackUserBehaviorSchema = z.object({
	action: z.enum(['click_promo', 'view_promo', 'search', 'filter', 'open_map', 'open_brand', 'scroll_list']),
	promo_id: z.string().optional().nullable(),
	brand_name: z.string().optional().nullable(),
	search_keyword: z.string().optional().nullable(),
	tags: z.array(z.string()).optional().nullable(),
});

export type TrackUserBehaviorPayload = z.infer<typeof trackUserBehaviorSchema>;

export const trackingService = {
	async trackUserBehavior(userId: string, payload: unknown): Promise<void> {
		const data = trackUserBehaviorSchema.parse(payload);
		await behaviorRepository.logUserBehavior({
			user_id: userId,
			action: data.action,
			promo_id: data.promo_id ?? null,
			brand_name: data.brand_name ?? null,
			search_keyword: data.search_keyword ?? null,
			tags: data.tags ?? null,
		});
	},
};

