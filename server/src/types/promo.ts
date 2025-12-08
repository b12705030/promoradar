export type PromotionStatus = 'Draft' | 'Published' | 'Canceled';

export type PromoType = 'Buy1Get1' | 'Discount' | 'Second_Cup' | 'Special_Price' | 'Gift_With_Purchase' | 'Limited_Offer' | 'Seasonal' | 'Other';
export type EventTag = 'Seasonal' | 'Holiday' | 'Membership' | 'LimitedTime';

export type PromotionRecord = {
	promoId: number;
	brandName: string;
	title: string;
	description: string;
	promoType: PromoType;
	eventTag: EventTag;
	startDatetime: string;
	endDatetime: string;
	needMembership: boolean;
	needCode: boolean;
	perUserLimit: number;
	globalQuota: number | null;
	dailyQuota: number | null;
	stackingRule: string | null;
	status: PromotionStatus;
	lastUpdated?: string | null;
	creatorId?: number | null;
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
	reason?: string;
};

export type BrandMetaRecord = {
	brandName: string;
	displayName: string;
	logoUrl?: string;
	primaryColor?: string;
	secondaryColor?: string;
	textColor?: string;
	categories?: string[];
};

export type BrandCategoryRecord = {
	brandName: string;
	category: string;
};

export type PromotionFilter = {
	search?: string;
	eventTags?: EventTag[];
	promoTypes?: PromoType[];
	brandNames?: string[];
	onlyActive?: boolean;
	needMembership?: boolean;
};

