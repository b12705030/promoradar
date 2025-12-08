import React from 'react';
import { loadPromotionDataset } from '../lib/promoData';
import type { BrandMeta, PromotionDataset, PromotionRecord, PromotionStoreExclusion, StoreRecord } from '../types/promo';

type DataContextValue = {
	loading: boolean;
	promotions: PromotionRecord[];
	stores: StoreRecord[];
	exclusions: PromotionStoreExclusion[];
	storeIdToStore: Map<number, StoreRecord>;
	promotionIdToPromotion: Map<number, PromotionRecord>;
	storesByBrand: Map<string, StoreRecord[]>;
	promotionsByBrand: Map<string, PromotionRecord[]>;
	brandMetaByKey: Map<string, BrandMeta>;
};

const DataContext = React.createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
	const [loading, setLoading] = React.useState(true);
	const [dataset, setDataset] = React.useState<PromotionDataset>({ promotions: [], stores: [], exclusions: [], brands: [] });

	React.useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const data = await loadPromotionDataset();
				if (!mounted) return;
				setDataset(data);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const promotions = dataset.promotions;
	const stores = dataset.stores;
	const exclusions = dataset.exclusions;

	const storeIdToStore = React.useMemo(
		() => new Map(stores.map((s) => [s.storeId, s])),
		[stores],
	);
	const promotionIdToPromotion = React.useMemo(
		() => new Map(promotions.map((p) => [p.promoId, p])),
		[promotions],
	);

	const storesByBrand = React.useMemo(() => {
		const map = new Map<string, StoreRecord[]>();
		for (const store of stores) {
			const key = store.brandName.trim().toLowerCase();
			const arr = map.get(key) ?? [];
			arr.push(store);
			map.set(key, arr);
		}
		return map;
	}, [stores]);

	const promotionsByBrand = React.useMemo(() => {
		const map = new Map<string, PromotionRecord[]>();
		for (const promo of promotions) {
			const key = promo.brandName.trim().toLowerCase();
			const arr = map.get(key) ?? [];
			arr.push(promo);
			map.set(key, arr);
		}
		return map;
	}, [promotions]);

	const brandMetaByKey = React.useMemo(() => {
		const map = new Map<string, BrandMeta>();
		(dataset.brands ?? []).forEach((meta) => {
			const key = (meta.key || meta.displayName || '').trim().toLowerCase();
			if (!key) return;
			map.set(key, meta);
		});
		return map;
	}, [dataset.brands]);

	const value: DataContextValue = {
		loading,
		promotions,
		stores,
		exclusions,
		storeIdToStore,
		promotionIdToPromotion,
		storesByBrand,
		promotionsByBrand,
		brandMetaByKey,
	};

	return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
	const ctx = React.useContext(DataContext);
	if (!ctx) throw new Error('useData must be used within DataProvider');
	return ctx;
}
