import { favoriteBrandRepository } from '../repositories/favoriteBrandRepository';
import { favoritePromotionRepository } from '../repositories/favoritePromotionRepository';
import { adminBrandRepository } from '../repositories/adminBrandRepository';
import { userPromotionRepository } from '../repositories/userPromotionRepository';
import { userRepository } from '../repositories/userRepository';
import type { PromotionUsageSummary } from '../types/user';

const sanitizeBrandName = (name?: string) => name?.trim() ?? '';

export const userService = {
	async getProfile(userId: number) {
		const user = await userRepository.findById(userId);
		if (!user) {
			const err = new Error('User not found');
			(err as Error & { status?: number }).status = 404;
			throw err;
		}
		const [brandFavorites, promotionFavorites, adminBrands, usage] = await Promise.all([
			adminBrandRepository.findBrandsByAdmin(userId),
			favoriteBrandRepository.findByUser(userId),
			favoritePromotionRepository.findByUser(userId),
			userPromotionRepository.listUsage(userId),
		]);
		return {
			user: {
				userId: user.userId,
				username: user.username,
				email: user.email,
				isAdmin: user.isAdmin,
			},
			brandFavorites,
			promotionFavorites,
			adminBrands,
			usage,
		};
	},

	async listBrandFavorites(userId: number) {
		return favoriteBrandRepository.findByUser(userId);
	},

	async addBrandFavorite(userId: number, brandName?: string) {
		const normalized = sanitizeBrandName(brandName);
		if (!normalized) {
			const err = new Error('brandName is required');
			(err as Error & { status?: number }).status = 400;
			throw err;
		}
		await favoriteBrandRepository.add(userId, normalized);
		return favoriteBrandRepository.findByUser(userId);
	},

	async removeBrandFavorite(userId: number, brandName?: string) {
		const normalized = sanitizeBrandName(brandName);
		if (!normalized) return favoriteBrandRepository.findByUser(userId);
		await favoriteBrandRepository.remove(userId, normalized);
		return favoriteBrandRepository.findByUser(userId);
	},

	async clearBrandFavorites(userId: number) {
		await favoriteBrandRepository.clear(userId);
		return favoriteBrandRepository.findByUser(userId);
	},

	async listPromotionFavorites(userId: number) {
		return favoritePromotionRepository.findByUser(userId);
	},

	async addPromotionFavorite(userId: number, promoId?: number) {
		if (!promoId || Number.isNaN(promoId)) {
			const err = new Error('promoId is required');
			(err as Error & { status?: number }).status = 400;
			throw err;
		}
		await favoritePromotionRepository.add(userId, promoId);
		return favoritePromotionRepository.findByUser(userId);
	},

	async removePromotionFavorite(userId: number, promoId?: number) {
		if (!promoId || Number.isNaN(promoId)) {
			return favoritePromotionRepository.findByUser(userId);
		}
		await favoritePromotionRepository.remove(userId, promoId);
		return favoritePromotionRepository.findByUser(userId);
	},

	async clearPromotionFavorites(userId: number) {
		await favoritePromotionRepository.clear(userId);
		return favoritePromotionRepository.findByUser(userId);
	},

	async adminBrands(userId: number) {
		return adminBrandRepository.findBrandsByAdmin(userId);
	},

	async promotionUsage(userId: number): Promise<PromotionUsageSummary[]> {
		return userPromotionRepository.listUsage(userId);
	},

	async getUserRankings(limit = 100) {
		return userPromotionRepository.getUserRankings(limit);
	},
};


