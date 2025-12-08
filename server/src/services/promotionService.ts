import { z } from 'zod';
import { promotionRepository } from '../repositories/promotionRepository';
import { storeRepository } from '../repositories/storeRepository';
import { brandRepository } from '../repositories/brandRepository';
import { userPromotionRepository } from '../repositories/userPromotionRepository';
import type { PromotionFilter } from '../types/promo';

const filterSchema = z.object({
	search: z.string().optional(),
	brandNames: z
		.preprocess(
			(val) =>
				Array.isArray(val)
					? val.map((name) => String(name).trim().toLowerCase())
					: val === undefined
						? undefined
						: [String(val).trim().toLowerCase()],
			z.string().array().optional(),
		)
		.optional(),
	eventTags: z.preprocess(
		(val) => (Array.isArray(val) ? val : typeof val === 'string' ? [val] : undefined),
		z.string().array().optional(),
	),
	promoTypes: z.preprocess(
		(val) => (Array.isArray(val) ? val : typeof val === 'string' ? [val] : undefined),
		z.string().array().optional(),
	),
	onlyActive: z.coerce.boolean().optional(),
	needMembership: z.preprocess(
		(val) => {
			if (val === undefined) return undefined;
			if (val === 'true' || val === true) return true;
			if (val === 'false' || val === false) return false;
			return undefined;
		},
		z.boolean().optional(),
	),
});

export const promotionService = {
	async list(rawFilter: unknown) {
		const parsed = filterSchema.safeParse(rawFilter);
		const filter: PromotionFilter = parsed.success ? (parsed.data as PromotionFilter) : {};
		const promotions = await promotionRepository.findAll(filter);
		return promotions;
	},

	async detail(promoId: number) {
		const [promotion, exclusions] = await Promise.all([
			promotionRepository.findById(promoId),
			promotionRepository.findExclusions(promoId),
		]);
		if (!promotion) return null;
		return {
			promotion,
			stores: await storeRepository.findByBrand(promotion.brandName),
			exclusions,
		};
	},

	async dataset() {
		const [promotions, stores, exclusions, brands, categories] = await Promise.all([
			promotionRepository.findAll(),
			storeRepository.findAll(),
			promotionRepository.findAllExclusions(),
			brandRepository.findAll(),
			brandRepository.findCategories(),
		]);
		const categoryMap = categories.reduce<Map<string, string[]>>((map, entry) => {
			const list = map.get(entry.brandName) ?? [];
			list.push(entry.category);
			map.set(entry.brandName, list);
			return map;
		}, new Map());
		const brandWithCategories = brands.map((brand) => ({
			key: brand.brandName,
			displayName: brand.displayName,
			logo: brand.logoUrl ?? null,
			primaryColor: brand.primaryColor ?? '#4B5563',
			secondaryColor: brand.secondaryColor ?? null,
			textColor: brand.textColor ?? null,
			categories: categoryMap.get(brand.brandName) ?? [],
		}));
		return { promotions, stores, exclusions, brands: brandWithCategories };
	},

	async claim(promoId: number, userId: number) {
		const promotion = await promotionRepository.findById(promoId);
		if (!promotion) {
			const err = new Error('promotion not found');
			(err as Error & { status?: number }).status = 404;
			throw err;
		}
		const existing = await userPromotionRepository.usageForPromotion(userId, promoId);
		if (promotion.perUserLimit > 0 && existing && existing.count >= promotion.perUserLimit) {
			const err = new Error('已達使用上限');
			(err as Error & { status?: number }).status = 400;
			throw err;
		}
		await userPromotionRepository.addUsage(userId, promoId);
		const usage = await userPromotionRepository.usageForPromotion(userId, promoId);
		return { success: true, usage };
	},
};

