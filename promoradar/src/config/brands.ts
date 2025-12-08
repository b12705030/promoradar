import type { BrandMeta } from '../types/promo';

const BRAND_METADATA: Record<string, BrandMeta> = {};

const DEFAULT_META: BrandMeta = {
	key: 'unknown',
	displayName: '未知品牌',
	primaryColor: '#4B5563',
	secondaryColor: '#9CA3AF',
	textColor: '#111827',
};

const normalizeBrandKey = (name: string) => name.trim().toLowerCase();

export function getBrandMeta(brandName: string): BrandMeta {
	const key = normalizeBrandKey(brandName || 'unknown');
	return BRAND_METADATA[key] ?? { ...DEFAULT_META, key, displayName: brandName || '未知品牌' };
}

export function getAllBrands(): BrandMeta[] {
	return Object.values(BRAND_METADATA);
}
