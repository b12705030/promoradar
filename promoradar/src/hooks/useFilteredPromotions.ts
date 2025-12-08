import React from 'react';
import dayjs from 'dayjs';
import type { PromotionRecord } from '../types/promo';
import { usePromotionFilters } from '../store/usePromotionFilters';
import { getBrandMeta } from '../config/brands';
import { useBrandFollow } from '../store/useBrandFollow';

export function useFilteredPromotions(promotions: PromotionRecord[]) {
	const filters = usePromotionFilters();
	const now = dayjs();
	const followedBrands = useBrandFollow((state) =>
		state.mode === 'user' ? state.userFollows : state.guestFollows,
	);

	const filtered = React.useMemo(() => {
		const searchLower = filters.search.trim().toLowerCase();
		return promotions.filter((promo) => {
			if (promo.status === 'Canceled') return false;
			if (filters.brandKeys.length && !filters.brandKeys.includes(promo.brandName.trim().toLowerCase())) return false;
			if (filters.eventTags.length && !filters.eventTags.includes(promo.eventTag)) return false;
			if (filters.promoTypes.length && !filters.promoTypes.includes(promo.promoType)) return false;
			if (typeof filters.needMembership === 'boolean' && promo.needMembership !== filters.needMembership) return false;
			if (filters.onlyActive) {
				const start = dayjs(promo.startDatetime);
				const end = dayjs(promo.endDatetime);
				if (now.isBefore(start) || now.isAfter(end)) return false;
			}
			if (searchLower) {
				const haystack = `${promo.title} ${promo.description}`.toLowerCase();
				const brandName = getBrandMeta(promo.brandName).displayName.toLowerCase();
				if (!haystack.includes(searchLower) && !brandName.includes(searchLower)) return false;
			}
			return true;
		});
	}, [promotions, filters, now]);

	const sorted = React.useMemo(() => {
		const list = [...filtered];
		switch (filters.sortBy) {
			case 'newest':
				return list.sort((a, b) => dayjs(b.startDatetime).valueOf() - dayjs(a.startDatetime).valueOf());
			case 'brand':
				return list.sort((a, b) =>
					getBrandMeta(a.brandName).displayName.localeCompare(getBrandMeta(b.brandName).displayName),
				);
			case 'soonest_end':
			default:
				return list.sort((a, b) => dayjs(a.endDatetime).valueOf() - dayjs(b.endDatetime).valueOf());
		}
	}, [filtered, filters.sortBy]);

	const prioritized = React.useMemo(() => {
		if (!followedBrands.length) return sorted;
		const set = new Set(followedBrands.map((brand) => brand.trim().toLowerCase()));
		const favored = sorted.filter((promo) => set.has(promo.brandName.trim().toLowerCase()));
		const others = sorted.filter((promo) => !set.has(promo.brandName.trim().toLowerCase()));
		return [...favored, ...others];
	}, [sorted, followedBrands]);

	return { filtered: prioritized, filters, now };
}

