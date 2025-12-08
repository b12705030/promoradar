import Papa from 'papaparse';
import { parseEventTag, parsePromoType } from '../config/promotionMeta';
import { API_BASE } from './apiClient';
import {
	PromotionStatusSchema,
	type PromotionDataset,
	type PromotionRecord,
	type PromotionStatus,
	type PromotionStoreExclusion,
	type StoreRecord,
	type BrandMeta,
} from '../types/promo';
const PROMOTION_FILES = [
	new URL('../public/data/db/mcd_promotions.csv', import.meta.url).href,
	new URL('../public/data/db/starbucks_promotions.csv', import.meta.url).href,
];

const STORE_FILES = [
	new URL('../public/data/db/mcd_stores.csv', import.meta.url).href,
	new URL('../public/data/db/starbucks_stores.csv', import.meta.url).href,
];

const EXCLUSION_FILE = new URL('../public/data/db/promotion_store_exclusions.csv', import.meta.url).href;

type CsvRow = Record<string, unknown>;

async function fetchCsvRows(url: string): Promise<CsvRow[]> {
	try {
		const res = await fetch(url);
		if (!res.ok) return [];
		const text = await res.text();
		const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
		return ((parsed.data ?? []) as CsvRow[]).filter(Boolean);
	} catch (err) {
		console.warn('[promoData] 無法載入 CSV', url, err);
		return [];
	}
}

const sanitizeString = (value: unknown): string => {
	if (value == null) return '';
	const str = String(value).trim();
	if (!str) return '';
	if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
		return str.slice(1, -1).trim();
	}
	return str;
};

const parseNullableNumber = (value: unknown): number | null => {
	const str = sanitizeString(value);
	if (!str) return null;
	const num = Number(str.replace(/,/g, ''));
	return Number.isFinite(num) ? num : null;
};

const parseNumberOrDefault = (value: unknown, fallback = 0): number => {
	const num = parseNullableNumber(value);
	return num ?? fallback;
};

const parseBoolean = (value: unknown): boolean => {
	const str = sanitizeString(value).toLowerCase();
	if (!str) return false;
	return ['true', '1', 'yes', 'y'].includes(str);
};

const normalizeStatus = (value: unknown): PromotionStatus => {
	const candidate = sanitizeString(value) || 'Published';
	return PromotionStatusSchema.safeParse(candidate).success ? (candidate as PromotionStatus) : 'Published';
};

const normalizeDate = (value: unknown, fallback: string): string => {
	const str = sanitizeString(value);
	return str || fallback;
};

const normalizePromo = (row: CsvRow): PromotionRecord | null => {
	const promoId = parseNullableNumber(row.promo_id);
	const brandNameRaw = sanitizeString(row.brand_name) || sanitizeString(row.brand) || '';
	const brandIdFallback = parseNullableNumber(row.brand_id);
	const brandName = brandNameRaw || (brandIdFallback != null ? `品牌 ${brandIdFallback}` : '');
	if (promoId == null || !brandName) return null;
	return {
		promoId,
		brandName,
		title: sanitizeString(row.title) || '未命名活動',
		description: sanitizeString(row.description),
		promoType: parsePromoType(row.promo_type),
		startDatetime: normalizeDate(row.start_datetime, '1970-01-01 00:00:00'),
		endDatetime: normalizeDate(row.end_datetime, '9999-12-31 23:59:59'),
		stackingRule: sanitizeString(row.stacking_rule) || null,
		needMembership: parseBoolean(row.need_membership),
		needCode: parseBoolean(row.need_code),
		perUserLimit: parseNumberOrDefault(row.per_user_limit, 0),
		globalQuota: parseNullableNumber(row.global_quota),
		dailyQuota: parseNullableNumber(row.daily_quota),
		lastUpdated: sanitizeString(row.last_updated) || null,
		creatorId: parseNullableNumber(row.creator_id),
		status: normalizeStatus(row.status),
		eventTag: parseEventTag(row.event_tag),
	};
};

const normalizeStore = (row: CsvRow): StoreRecord | null => {
	const storeId = parseNullableNumber(row.store_id);
	const storeBrandRaw = sanitizeString(row.brand_name) || sanitizeString(row.brand) || '';
	const storeBrandId = parseNullableNumber(row.brand_id);
	const brandName = storeBrandRaw || (storeBrandId != null ? `品牌 ${storeBrandId}` : '');
	if (storeId == null || !brandName) return null;
	return {
		storeId,
		brandName,
		name: sanitizeString(row.name) || '未命名門市',
		address: sanitizeString(row.address),
		lat: parseNullableNumber(row.lat),
		lng: parseNullableNumber(row.lng),
		region: sanitizeString(row.region),
		isActive: parseBoolean(row.is_active),
	};
};

const normalizeExclusion = (row: CsvRow): PromotionStoreExclusion | null => {
	const promoId = parseNullableNumber(row.promo_id);
	const storeId = parseNullableNumber(row.store_id);
	if (promoId == null || storeId == null) return null;
	return { promoId, storeId };
};

const mapPromotionFromApi = (row: any): PromotionRecord | null => {
	const promoId = parseNullableNumber(row.promoId ?? row.promo_id);
	const brandName = sanitizeString(row.brandName ?? row.brand_name);
	if (promoId == null || !brandName) return null;
	return {
		promoId,
		brandName,
		title: sanitizeString(row.title) || '未命名活動',
		description: sanitizeString(row.description),
		promoType: parsePromoType(row.promoType ?? row.promo_type),
		startDatetime: normalizeDate(row.startDatetime ?? row.start_datetime, '1970-01-01 00:00:00'),
		endDatetime: normalizeDate(row.endDatetime ?? row.end_datetime, '9999-12-31 23:59:59'),
		stackingRule: sanitizeString(row.stackingRule ?? row.stacking_rule) || null,
		needMembership: Boolean(row.needMembership ?? row.need_membership),
		needCode: Boolean(row.needCode ?? row.need_code),
		perUserLimit: parseNumberOrDefault(row.perUserLimit ?? row.per_user_limit, 0),
		globalQuota: parseNullableNumber(row.globalQuota ?? row.global_quota),
		dailyQuota: parseNullableNumber(row.dailyQuota ?? row.daily_quota),
		lastUpdated: sanitizeString(row.lastUpdated ?? row.last_updated) || null,
		creatorId: parseNullableNumber(row.creatorId ?? row.creator_id),
		status: normalizeStatus(row.status),
		eventTag: parseEventTag(row.eventTag ?? row.event_tag),
	};
};

const mapStoreFromApi = (row: any): StoreRecord | null => {
	const storeId = parseNullableNumber(row.storeId ?? row.store_id);
	const brandName = sanitizeString(row.brandName ?? row.brand_name);
	if (storeId == null || !brandName) return null;
	return {
		storeId,
		brandName,
		name: sanitizeString(row.name) || '未命名門市',
		address: sanitizeString(row.address),
		lat: parseNullableNumber(row.lat),
		lng: parseNullableNumber(row.lng),
		region: sanitizeString(row.region),
		isActive: Boolean(row.isActive ?? row.is_active ?? true),
	};
};

const mapExclusionFromApi = (row: any): PromotionStoreExclusion | null => {
	const promoId = parseNullableNumber(row.promoId ?? row.promo_id);
	const storeId = parseNullableNumber(row.storeId ?? row.store_id);
	if (promoId == null || storeId == null) return null;
	return { promoId, storeId };
};

const mapBrandMetaFromApi = (row: any): BrandMeta | null => {
	const key = sanitizeString(row.brandName ?? row.brand_name ?? row.key);
	const displayName = sanitizeString(row.displayName ?? row.name ?? row.brand_label ?? row.brandName ?? row.brand_name);
	if (!key && !displayName) return null;
	const normalizedKey = (key || displayName).toLowerCase();
	const categories = Array.isArray(row.categories)
		? row.categories.map((cat: unknown) => sanitizeString(cat)).filter(Boolean)
		: undefined;
	const primaryColor = sanitizeString(row.primaryColor ?? row.primary_color);
	const secondaryColor = sanitizeString(row.secondaryColor ?? row.secondary_color);
	const textColor = sanitizeString(row.textColor ?? row.text_color);
	const logo = sanitizeString(row.logo ?? row.logoUrl ?? row.logo_url);
	return {
		key: normalizedKey,
		displayName: displayName || key || '未知品牌',
		logo: logo || undefined,
		primaryColor: primaryColor || '#4B5563',
		secondaryColor: secondaryColor || undefined,
		textColor: textColor || undefined,
		categories,
	};
};

async function loadDatasetFromApi(): Promise<PromotionDataset | null> {
	if (!API_BASE) return null;
	try {
		const res = await fetch(`${API_BASE}/promotions/dataset`, { cache: 'no-store' });
		if (!res.ok) throw new Error('API failed');
		const data = await res.json();
		const promotions = Array.isArray(data.promotions)
			? data.promotions
					.map(mapPromotionFromApi)
					.filter((row: PromotionRecord | null): row is PromotionRecord => Boolean(row))
			: [];
		const stores = Array.isArray(data.stores)
			? data.stores.map(mapStoreFromApi).filter((row: StoreRecord | null): row is StoreRecord => Boolean(row))
			: [];
		const exclusions = Array.isArray(data.exclusions)
			? data.exclusions
					.map(mapExclusionFromApi)
					.filter(
						(row: PromotionStoreExclusion | null): row is PromotionStoreExclusion => Boolean(row),
					)
			: [];
		const brands = Array.isArray(data.brands)
			? data.brands.map(mapBrandMetaFromApi).filter((row: BrandMeta | null): row is BrandMeta => Boolean(row))
			: [];
		return { promotions, stores, exclusions, brands };
	} catch (err) {
		console.warn('[promoData] 讀取 API dataset 失敗，改用 CSV mock', err);
		return null;
	}
}

export async function loadPromotions(): Promise<PromotionRecord[]> {
	if (API_BASE) {
		try {
			const res = await fetch(`${API_BASE}/promotions`, { cache: 'no-store' });
			if (!res.ok) throw new Error('API failed');
			const data = await res.json();
			return (data.items ?? []).map((item: any) => ({
				...item,
				brandName: (item.brandName ?? item.brand_name ?? (typeof item.brandId === 'number' ? `品牌 ${item.brandId}` : '未知品牌')) as string,
			})) as PromotionRecord[];
		} catch (err) {
			console.warn('[promoData] 讀取 API 失敗，改用 CSV mock', err);
		}
	}
	const datasets = await Promise.all(PROMOTION_FILES.map(fetchCsvRows));
	return datasets
		.flat()
		.map(normalizePromo)
		.filter((row): row is PromotionRecord => Boolean(row));
}

export async function loadStores(): Promise<StoreRecord[]> {
	const datasets = await Promise.all(STORE_FILES.map(fetchCsvRows));
	return datasets
		.flat()
		.map(normalizeStore)
		.filter((row): row is StoreRecord => Boolean(row));
}

export async function loadPromotionExclusions(): Promise<PromotionStoreExclusion[]> {
	const rows = await fetchCsvRows(EXCLUSION_FILE);
	return rows.map(normalizeExclusion).filter((row): row is PromotionStoreExclusion => Boolean(row));
}

export async function loadPromotionDataset(): Promise<PromotionDataset> {
	const apiDataset = await loadDatasetFromApi();
	if (apiDataset) return apiDataset;
	const [promotions, stores, exclusions] = await Promise.all([
		loadPromotions(),
		loadStores(),
		loadPromotionExclusions(),
	]);
	return { promotions, stores, exclusions, brands: [] };
}

