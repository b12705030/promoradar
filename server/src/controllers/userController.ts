import type { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';

export const userController = {
	async profile(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.auth!.userId;
			const profile = await userService.getProfile(userId);
			res.json(profile);
		} catch (err) {
			next(err);
		}
	},

	async listBrandFavorites(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.auth!.userId;
			const favorites = await userService.listBrandFavorites(userId);
			res.json({ items: favorites });
		} catch (err) {
			next(err);
		}
	},

	async addBrandFavorite(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.auth!.userId;
			const favorites = await userService.addBrandFavorite(userId, req.body?.brandName);
			res.status(201).json({ items: favorites });
		} catch (err) {
			next(err);
		}
	},

	async removeBrandFavorite(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.auth!.userId;
			const brandName = decodeURIComponent(req.params.brandName ?? '').trim();
			const favorites = await userService.removeBrandFavorite(userId, brandName);
			res.json({ items: favorites });
		} catch (err) {
			next(err);
		}
	},

	async clearBrandFavorites(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.auth!.userId;
			const favorites = await userService.clearBrandFavorites(userId);
			res.json({ items: favorites });
		} catch (err) {
			next(err);
		}
	},

	async listPromotionFavorites(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.auth!.userId;
			const favorites = await userService.listPromotionFavorites(userId);
			res.json({ items: favorites });
		} catch (err) {
			next(err);
		}
	},

	async addPromotionFavorite(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.auth!.userId;
			const favorites = await userService.addPromotionFavorite(userId, Number(req.body?.promoId));
			res.status(201).json({ items: favorites });
		} catch (err) {
			next(err);
		}
	},

	async removePromotionFavorite(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.auth!.userId;
			const promoId = Number(req.params.promoId);
			const favorites = await userService.removePromotionFavorite(userId, promoId);
			res.json({ items: favorites });
		} catch (err) {
			next(err);
		}
	},

	async clearPromotionFavorites(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.auth!.userId;
			const favorites = await userService.clearPromotionFavorites(userId);
			res.json({ items: favorites });
		} catch (err) {
			next(err);
		}
	},

	async adminBrands(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.auth!.userId;
			const items = await userService.adminBrands(userId);
			res.json({ items });
		} catch (err) {
			next(err);
		}
	},

	async promotionUsage(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.auth!.userId;
			const items = await userService.promotionUsage(userId);
			res.json({ items });
		} catch (err) {
			next(err);
		}
	},

	async userRankings(req: Request, res: Response, next: NextFunction) {
		try {
			const limit = Number(req.query.limit) || 100;
			const rankings = await userService.getUserRankings(limit);
			res.json({ items: rankings });
		} catch (err) {
			next(err);
		}
	},
};


