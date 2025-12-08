import type { EventTag, PromoType, StackingRule } from '../types/promo';

type Meta<T extends string> = Record<T, { label: string; color: string }>;

export const PROMO_TYPE_META: Meta<PromoType> = {
	Buy1Get1: { label: '買一送一', color: '#f97316' },
	Discount: { label: '折扣活動', color: '#0ea5e9' },
	Second_Cup: { label: '第二杯優惠', color: '#84cc16' },
	Special_Price: { label: '特價', color: '#d946ef' },
	Gift_With_Purchase: { label: '滿額贈', color: '#facc15' },
	Limited_Offer: { label: '限量活動', color: '#f43f5e' },
	Seasonal: { label: '節慶/季節限定', color: '#2563eb' },
	Other: { label: '其他', color: '#6b7280' },
};

export const STACKING_RULE_META: Meta<StackingRule> = {
	Cannot_Stack: { label: '不可併用', color: '#ef4444' },
	Stack_With_Member: { label: '可併會員', color: '#06b6d4' },
	Stack_With_Discount: { label: '可併折扣', color: '#14b8a6' },
	Stack_With_Points: { label: '可併點數', color: '#8b5cf6' },
	Stack_All: { label: '皆可併用', color: '#f59e0b' },
	Store_Specific: { label: '依門市規則', color: '#64748b' },
	Other: { label: '未註明', color: '#94a3b8' },
};

export const EVENT_TAG_META: Meta<EventTag> = {
	Halloween: { label: '萬聖節', color: '#ea580c' },
	Christmas: { label: '聖誕節', color: '#059669' },
	New_Year: { label: '跨年/元旦', color: '#0369a1' },
	Seasonal: { label: '季節限定', color: '#2563eb' },
	Limited_Time: { label: '限時活動', color: '#dc2626' },
	Member_Exclusive: { label: '會員限定', color: '#7c3aed' },
	Payment_Promo: { label: '支付合作', color: '#0ea5e9' },
	Food_Waste_Reduction: { label: '珍食/友善食光', color: '#10b981' },
	Discount_Festival: { label: '購物節', color: '#9333ea' },
	New_Product: { label: '新品上市', color: '#e11d48' },
	Weekend_Deal: { label: '週末限定', color: '#2563eb' },
	Other: { label: '其他活動', color: '#6b7280' },
	McDelivery: { label: '歡樂送', color: '#0ea5e9' },
	Breakfast: { label: '早餐優惠', color: '#0ea5e9' },
};

const PROMO_TYPE_KEYWORDS: Record<string, PromoType> = {
	'買一送一': 'Buy1Get1',
	'折扣': 'Discount',
	'第二杯': 'Second_Cup',
	'特價': 'Special_Price',
	'滿額贈': 'Gift_With_Purchase',
	'限量': 'Limited_Offer',
	'季節': 'Seasonal',
};

const STACKING_RULE_KEYWORDS: Record<string, StackingRule> = {
	'不可併用': 'Cannot_Stack',
	'不得併用': 'Cannot_Stack',
	'會員': 'Stack_With_Member',
	'折扣': 'Stack_With_Discount',
	'點數': 'Stack_With_Points',
	'依門市': 'Store_Specific',
};

const EVENT_TAG_KEYWORDS: Record<string, EventTag> = {
	'萬聖': 'Halloween',
	'聖誕': 'Christmas',
	'跨年': 'New_Year',
	'元旦': 'New_Year',
	'限時': 'Limited_Time',
	'會員': 'Member_Exclusive',
	'聯名卡': 'Payment_Promo',
	'支付': 'Payment_Promo',
	'珍食': 'Food_Waste_Reduction',
	'友善食光': 'Food_Waste_Reduction',
	'雙11': 'Discount_Festival',
	'雙 11': 'Discount_Festival',
	'雙12': 'Discount_Festival',
	'新品': 'New_Product',
	'週末': 'Weekend_Deal',
};

const normalizeKey = (value: unknown) => (value == null ? '' : String(value).trim());

export function parsePromoType(value: unknown): PromoType {
	const normalized = normalizeKey(value);
	
	// 首先檢查是否已經是有效的英文類型值
	const upperNormalized = normalized.toUpperCase();
	if (normalized === 'buy1get1' || upperNormalized === 'BUY1GET1') return 'Buy1Get1';
	if (normalized === 'discount' || upperNormalized === 'DISCOUNT') return 'Discount';
	if (normalized === 'second_cup' || normalized === 'secondcup' || upperNormalized === 'SECOND_CUP') return 'Second_Cup';
	if (normalized === 'special_price' || normalized === 'specialprice' || upperNormalized === 'SPECIAL_PRICE') return 'Special_Price';
	if (normalized === 'gift_with_purchase' || normalized === 'giftwithpurchase' || upperNormalized === 'GIFT_WITH_PURCHASE') return 'Gift_With_Purchase';
	if (normalized === 'limited_offer' || normalized === 'limitedoffer' || upperNormalized === 'LIMITED_OFFER') return 'Limited_Offer';
	if (normalized === 'seasonal' || upperNormalized === 'SEASONAL') return 'Seasonal';
	if (normalized === 'other' || upperNormalized === 'OTHER') return 'Other';
	
	// 如果沒有匹配到英文值，嘗試用中文關鍵字匹配（向後兼容）
	for (const [key, mapped] of Object.entries(PROMO_TYPE_KEYWORDS)) {
		if (normalized.includes(key)) return mapped;
	}
	return 'Other';
}

export function parseStackingRule(value: unknown): StackingRule | null {
	const normalized = normalizeKey(value);
	if (!normalized) return null;
	for (const [key, mapped] of Object.entries(STACKING_RULE_KEYWORDS)) {
		if (normalized.includes(key)) return mapped;
	}
	return 'Other';
}

export function parseEventTag(value: unknown): EventTag {
	const normalized = normalizeKey(value);
	if (!normalized) return 'Other';
	
	// 首先檢查是否已經是有效的英文標籤值
	const upperNormalized = normalized.toUpperCase();
	if (normalized === 'halloween' || upperNormalized === 'HALLOWEEN') return 'Halloween';
	if (normalized === 'christmas' || upperNormalized === 'CHRISTMAS') return 'Christmas';
	if (normalized === 'new_year' || normalized === 'newyear' || upperNormalized === 'NEW_YEAR') return 'New_Year';
	if (normalized === 'seasonal' || upperNormalized === 'SEASONAL') return 'Seasonal';
	if (normalized === 'limited_time' || normalized === 'limitedtime' || upperNormalized === 'LIMITED_TIME') return 'Limited_Time';
	if (normalized === 'member_exclusive' || normalized === 'memberexclusive' || upperNormalized === 'MEMBER_EXCLUSIVE') return 'Member_Exclusive';
	if (normalized === 'payment_promo' || normalized === 'paymentpromo' || upperNormalized === 'PAYMENT_PROMO') return 'Payment_Promo';
	if (normalized === 'food_waste_reduction' || normalized === 'foodwastereduction' || upperNormalized === 'FOOD_WASTE_REDUCTION') return 'Food_Waste_Reduction';
	if (normalized === 'discount_festival' || normalized === 'discountfestival' || upperNormalized === 'DISCOUNT_FESTIVAL') return 'Discount_Festival';
	if (normalized === 'new_product' || normalized === 'newproduct' || upperNormalized === 'NEW_PRODUCT') return 'New_Product';
	if (normalized === 'weekend_deal' || normalized === 'weekenddeal' || upperNormalized === 'WEEKEND_DEAL') return 'Weekend_Deal';
	if (normalized === 'mcdelivery' || upperNormalized === 'MCDELIVERY') return 'McDelivery';
	if (normalized === 'breakfast' || upperNormalized === 'BREAKFAST') return 'Breakfast';
	if (normalized === 'other' || upperNormalized === 'OTHER') return 'Other';
	
	// 如果沒有匹配到英文值，嘗試用中文關鍵字匹配（向後兼容）
	for (const [key, mapped] of Object.entries(EVENT_TAG_KEYWORDS)) {
		if (normalized.includes(key)) return mapped;
	}
	return normalized.length > 0 ? 'Limited_Time' : 'Other';
}

