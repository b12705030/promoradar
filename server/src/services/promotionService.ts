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
		// 使用 stored procedure 來處理領取優惠（包含交易管理和併行控制）
		// 這個 stored procedure 會：
		// 1. 使用 SELECT FOR UPDATE 鎖定優惠記錄（併行控制）
		// 2. 檢查所有名額限制（global_quota, daily_quota, per_user_limit）
		// 3. 插入使用記錄
		// 4. 所有操作在一個交易中完成（原子性）
		const { data, error } = await promotionRepository.claimPromotion(userId, promoId);
		if (error) {
			// 處理 stored procedure 拋出的錯誤
			// Supabase RPC 錯誤格式：error.message 或 error.details
			const errorMessage = error.message || error.details || '領取優惠失敗';
			const err = new Error(errorMessage);
			(err as Error & { status?: number }).status = 400;
			throw err;
		}
		// 取得更新後的使用記錄
		const usage = await userPromotionRepository.usageForPromotion(userId, promoId);
		return { success: true, usage, quota: data };
	},
};

