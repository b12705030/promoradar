import type { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService';

export const adminController = {
	async listBrands(req: Request, res: Response, next: NextFunction) {
		try {
			const brands = await adminService.listManagedBrands(req.auth!.userId);
			res.json({ items: brands });
		} catch (err) {
			next(err);
		}
	},

	async createBrand(req: Request, res: Response, next: NextFunction) {
		try {
			const brand = await adminService.createBrand(req.auth!.userId, req.body);
			res.status(201).json(brand);
		} catch (err) {
			next(err);
		}
	},

	async updateBrand(req: Request, res: Response, next: NextFunction) {
		try {
			const brand = await adminService.updateBrand(req.auth!.userId, req.params.brandKey, req.body ?? {});
			res.json(brand);
		} catch (err) {
			next(err);
		}
	},

	async listStores(req: Request, res: Response, next: NextFunction) {
		try {
			const brandName = req.query.brandName as string;
			if (!brandName) {
				return res.status(400).json({ message: 'brandName is required' });
			}
			const stores = await adminService.listStores(req.auth!.userId, brandName);
			res.json({ items: stores });
		} catch (err) {
			next(err);
		}
	},

	async createStore(req: Request, res: Response, next: NextFunction) {
		try {
			const store = await adminService.createStore(req.auth!.userId, req.body);
			res.status(201).json(store);
		} catch (err) {
			next(err);
		}
	},

	async updateStore(req: Request, res: Response, next: NextFunction) {
		try {
			const storeId = Number(req.params.storeId);
			const store = await adminService.updateStore(req.auth!.userId, storeId, req.body ?? {});
			res.json(store);
		} catch (err) {
			next(err);
		}
	},

	async listPromotions(req: Request, res: Response, next: NextFunction) {
		try {
			const brandName = req.query.brandName as string;
			if (!brandName) {
				return res.status(400).json({ message: 'brandName is required' });
			}
			const promos = await adminService.listPromotions(req.auth!.userId, brandName);
			res.json({ items: promos });
		} catch (err) {
			next(err);
		}
	},

	async createPromotion(req: Request, res: Response, next: NextFunction) {
		try {
			const promo = await adminService.createPromotion(req.auth!.userId, req.body);
			res.status(201).json(promo);
		} catch (err) {
			next(err);
		}
	},

	async updatePromotion(req: Request, res: Response, next: NextFunction) {
		try {
			const promoId = Number(req.params.promoId);
			const promo = await adminService.updatePromotion(req.auth!.userId, promoId, req.body ?? {});
			res.json(promo);
		} catch (err) {
			next(err);
		}
	},

	async publishPromotion(req: Request, res: Response, next: NextFunction) {
		try {
			const promoId = Number(req.params.promoId);
			const promo = await adminService.publishPromotion(req.auth!.userId, promoId);
			res.json(promo);
		} catch (err) {
			next(err);
		}
	},

	async cancelPromotion(req: Request, res: Response, next: NextFunction) {
		try {
			const promoId = Number(req.params.promoId);
			const promo = await adminService.cancelPromotion(req.auth!.userId, promoId);
			res.json(promo);
		} catch (err) {
			next(err);
		}
	},

	async getPromotionExclusions(req: Request, res: Response, next: NextFunction) {
		try {
			const promoId = Number(req.params.promoId);
			const exclusions = await adminService.getPromotionExclusions(req.auth!.userId, promoId);
			res.json({ items: exclusions });
		} catch (err) {
			next(err);
		}
	},

	async setPromotionExclusions(req: Request, res: Response, next: NextFunction) {
		try {
			const promoId = Number(req.params.promoId);
			const { storeIds } = req.body;
			if (!Array.isArray(storeIds)) {
				return res.status(400).json({ message: 'storeIds must be an array' });
			}
			const exclusions = await adminService.setPromotionExclusions(req.auth!.userId, promoId, storeIds);
			res.json({ items: exclusions });
		} catch (err) {
			next(err);
		}
	},

	async promotionQuota(req: Request, res: Response, next: NextFunction) {
		try {
			const promoId = Number(req.params.promoId);
			const data = await adminService.getPromotionQuota(req.auth!.userId, promoId);
			res.json(data);
		} catch (err) {
			next(err);
		}
	},
};


