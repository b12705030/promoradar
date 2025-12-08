import { create } from 'zustand';
import type { EventTag, PromoType } from '../types/promo';

export type PromotionSortOption = 'soonest_end' | 'newest' | 'brand';

export type PromotionFilters = {
	search: string;
	brandKeys: string[];
	eventTags: EventTag[];
	promoTypes: PromoType[];
	onlyActive: boolean;
	needMembership?: boolean;
	sortBy: PromotionSortOption;
};

type PromotionFilterState = PromotionFilters & {
	setSearch: (value: string) => void;
	toggleBrand: (key: string) => void;
	toggleEventTag: (tag: EventTag) => void;
	togglePromoType: (type: PromoType) => void;
	setNeedMembership: (value: boolean | undefined) => void;
	setSortBy: (sort: PromotionSortOption) => void;
	setOnlyActive: (value: boolean) => void;
	reset: () => void;
};

const initialFilters: PromotionFilters = {
	search: '',
	brandKeys: [],
	eventTags: [],
	promoTypes: [],
	onlyActive: true,
	needMembership: undefined,
	sortBy: 'soonest_end',
};

export const usePromotionFilters = create<PromotionFilterState>((set) => ({
	...initialFilters,
	setSearch: (value) => set({ search: value }),
	toggleBrand: (key) =>
		set((state) => ({
			brandKeys: state.brandKeys.includes(key)
				? state.brandKeys.filter((b) => b !== key)
				: [...state.brandKeys, key],
		})),
	toggleEventTag: (tag) =>
		set((state) => ({
			eventTags: state.eventTags.includes(tag)
				? state.eventTags.filter((t) => t !== tag)
				: [...state.eventTags, tag],
		})),
	togglePromoType: (type) =>
		set((state) => ({
			promoTypes: state.promoTypes.includes(type)
				? state.promoTypes.filter((t) => t !== type)
				: [...state.promoTypes, type],
		})),
	setNeedMembership: (value) => set({ needMembership: value }),
	setSortBy: (sortBy) => set({ sortBy }),
	setOnlyActive: (value) => set({ onlyActive: value }),
	reset: () => set(initialFilters),
}));

