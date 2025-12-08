import { z } from 'zod';

export const PromotionStatusSchema = z.enum(['Draft', 'Published', 'Canceled']);
export type PromotionStatus = z.infer<typeof PromotionStatusSchema>;

export const PROMO_TYPE_VALUES = [
	'Buy1Get1',
	'Discount',
	'Second_Cup',
	'Special_Price',
	'Gift_With_Purchase',
	'Limited_Offer',
	'Seasonal',
	'Other',
] as const;
export type PromoType = (typeof PROMO_TYPE_VALUES)[number];

export const STACKING_RULE_VALUES = [
	'Cannot_Stack',
	'Stack_With_Member',
	'Stack_With_Discount',
	'Stack_With_Points',
	'Stack_All',
	'Store_Specific',
	'Other',
] as const;
export type StackingRule = (typeof STACKING_RULE_VALUES)[number];

export const EVENT_TAG_VALUES = [
	'Halloween',
	'Christmas',
	'New_Year',
	'Seasonal',
	'Limited_Time',
	'Member_Exclusive',
	'Payment_Promo',
	'Food_Waste_Reduction',
	'Discount_Festival',
	'New_Product',
	'Weekend_Deal',
	'McDelivery',
	'Breakfast',
	'Other',
] as const;
export type EventTag = (typeof EVENT_TAG_VALUES)[number];

export type PromotionRecord = {
	promoId: number;
	brandName: string;
	title: string;
	description: string;
	promoType: PromoType;
	startDatetime: string;
	endDatetime: string;
	stackingRule: string | null;
	needMembership: boolean;
	needCode: boolean;
	perUserLimit: number;
	globalQuota: number | null;
	dailyQuota: number | null;
	lastUpdated: string | null;
	creatorId: number | null;
	status: PromotionStatus;
	eventTag: EventTag;
};

export type StoreRecord = {
	storeId: number;
	brandName: string;
	name: string;
	address: string;
	lat: number | null;
	lng: number | null;
	region: string;
	isActive: boolean;
};

export type PromotionStoreExclusion = {
	promoId: number;
	storeId: number;
};

export type PromotionDataset = {
	promotions: PromotionRecord[];
	stores: StoreRecord[];
	exclusions: PromotionStoreExclusion[];
	brands?: BrandMeta[];
};

export type BrandMeta = {
	key: string;
	displayName: string;
	logo?: string;
	primaryColor: string;
	secondaryColor?: string;
	textColor?: string;
	categories?: string[];
};

export type PromotionUsageEntry = {
	promoId: number;
	count: number;
	lastUsed: string | null;
};



