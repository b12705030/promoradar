import { Request, Response, NextFunction } from 'express';
import { trackingService } from '../services/trackingService';
import { requireAuth } from '../middleware/requireAuth';

export const trackingController = {
	async track(req: Request, res: Response, next: NextFunction) {
		try {
			// 從 JWT 獲取 user_id，如果沒有則使用 guest ID
			const userId = (req as any).user?.userId?.toString() ?? `guest_${req.ip}_${Date.now()}`;
			await trackingService.trackUserBehavior(userId, req.body);
			res.status(200).json({ success: true });
		} catch (error) {
			next(error);
		}
	},
};

