export type UserRecord = {
	userId: number;
	username: string;
	email: string;
	passwordHash: string;
	isAdmin: boolean;
	createdAt: string;
};

export type FavoriteBrandRecord = {
	userId: number;
	brandName: string;
	createdAt?: string;
};

export type FavoritePromotionRecord = {
	userId: number;
	promoId: number;
	createdAt?: string;
};

export type AdminBrandRecord = {
	adminId: number;
	brandName: string;
};

export type PromotionUsageSummary = {
	promoId: number;
	count: number;
	lastUsed: string | null;
};

