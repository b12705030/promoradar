import type { Request, Response, NextFunction } from 'express';
import { promotionService } from '../services/promotionService';

export const promotionController = {
	async list(req: Request, res: Response, next: NextFunction) {
		try {
			const promotions = await promotionService.list(req.query);
			res.json({ items: promotions });
		} catch (err) {
			next(err);
		}
	},

	async detail(req: Request, res: Response, next: NextFunction) {
		try {
			const id = Number(req.params.id);
			const data = await promotionService.detail(id);
			if (!data) return res.status(404).json({ message: 'Promotion not found' });
			res.json(data);
		} catch (err) {
			next(err);
		}
	},

	async dataset(req: Request, res: Response, next: NextFunction) {
		try {
			const data = await promotionService.dataset();
			res.json(data);
		} catch (err) {
			next(err);
		}
	},

	async claim(req: Request, res: Response, next: NextFunction) {
		try {
			const id = Number(req.params.id);
			const userId = req.auth?.userId ?? 0;
			const data = await promotionService.claim(id, userId);
			res.json(data);
		} catch (err) {
			next(err);
		}
	},
};

