import React from 'react';
import {
	Box,
	Stack,
	Typography,
	CircularProgress,
	TextField,
	InputAdornment,
	IconButton,
	Card,
	CardContent,
	Switch,
	FormControlLabel,
	Chip,
	Button,
	Divider,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import 'leaflet/dist/leaflet.css';
import dayjs from 'dayjs';
import { useData } from '../context/DataContext';
import { useFilteredPromotions } from '../hooks/useFilteredPromotions';
import { EVENT_TAG_META } from '../config/promotionMeta';
import { getBrandMeta } from '../config/brands';
import type { PromotionRecord, StoreRecord } from '../types/promo';
import { useNavigate } from 'react-router-dom';
const LeafletMap = React.lazy(() => import('./LeafletMap'));

function isTaiwan(lat: number, lng: number) {
	return lat >= 20 && lat <= 26 && lng >= 119 && lng <= 123;
}

type StoreMarker = {
	store: StoreRecord;
	brandName: string;
	brand: ReturnType<typeof getBrandMeta>;
	logo?: string;
	promotions: PromotionRecord[];
	nextEnding?: string;
	eventTags: string[];
};

export default function MapPage() {
	const { stores, exclusions, promotions, brandMetaByKey } = useData();
	const { filtered } = useFilteredPromotions(promotions);
	const [myPos, setMyPos] = React.useState<[number, number] | null>(null);
	const [mountMap, setMountMap] = React.useState(true);
	const [query, setQuery] = React.useState('');
	const deferredQuery = React.useDeferredValue(query);
	const [onlyHasPromo, setOnlyHasPromo] = React.useState(true);
	const [selectedStoreId, setSelectedStoreId] = React.useState<number | null>(null);

	const exclusionMap = React.useMemo(() => {
		const map = new Map<number, Set<number>>();
		for (const ex of exclusions) {
			const set = map.get(ex.promoId) ?? new Set<number>();
			set.add(ex.storeId);
			map.set(ex.promoId, set);
		}
		return map;
	}, [exclusions]);

	// 計算兩點之間的距離（Haversine 公式，單位：公里）
	const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
		const R = 6371; // 地球半徑（公里）
		const dLat = ((lat2 - lat1) * Math.PI) / 180;
		const dLng = ((lng2 - lng1) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	};

	// 預先計算品牌名稱的標準化版本，避免重複計算
	const brandNameCache = React.useMemo(() => {
		const cache = new Map<string, string>();
		stores.forEach((store) => {
			const key = store.brandName.trim().toLowerCase();
			if (!cache.has(key)) {
				cache.set(key, store.brandName.trim().toLowerCase());
			}
		});
		return cache;
	}, [stores]);

	const markers = React.useMemo<StoreMarker[]>(() => {
		const q = deferredQuery.trim().toLowerCase();
		const mapped = stores
			.filter((store) => store.lat != null && store.lng != null)
			.map((store) => {
				const brandKey = brandNameCache.get(store.brandName.trim().toLowerCase()) || store.brandName.trim().toLowerCase();
				const brand = brandMetaByKey.get(brandKey) ?? getBrandMeta(store.brandName);
				const storeBrandKey = brandKey;
				
				// 優化：只過濾一次，減少重複的字符串操作
				const promos = filtered.filter((promo) => {
					const promoBrandKey = promo.brandName.trim().toLowerCase();
					if (promoBrandKey !== storeBrandKey) return false;
					const excluded = exclusionMap.get(promo.promoId);
					if (excluded && excluded.has(store.storeId)) return false;
					return true;
				});
				
				const nextEnding = promos.length > 0
					? promos
							.map((promo) => dayjs(promo.endDatetime))
							.filter((d) => d.isValid())
							.sort((a, b) => a.valueOf() - b.valueOf())[0]
					: null;
				
				return {
					store,
					brandName: brand.displayName,
					brand,
					logo: brand.logo,
					promotions: promos,
					eventTags: Array.from(new Set(promos.map((p) => p.eventTag))),
					nextEnding: nextEnding?.format('MM/DD'),
				};
			})
			.filter((marker) => (onlyHasPromo ? marker.promotions.length > 0 : true))
			.filter((marker) => {
				if (!q) return true;
				const storeName = marker.store.name.toLowerCase();
				const address = (marker.store.address || '').toLowerCase();
				const brandName = marker.brandName.toLowerCase();
				return storeName.includes(q) || address.includes(q) || brandName.includes(q);
			});

		// 如果有用戶位置，按距離排序；否則按優惠數量排序
		if (myPos) {
			return mapped
				.map((marker) => ({
					...marker,
					distance: calculateDistance(myPos[0], myPos[1], marker.store.lat as number, marker.store.lng as number),
				}))
				.sort((a, b) => a.distance - b.distance)
				.map(({ distance, ...marker }) => marker); // 移除 distance 屬性，只保留 StoreMarker 類型
		} else {
			return mapped.sort((a, b) => (b.promotions.length - a.promotions.length) || a.brandName.localeCompare(b.brandName));
		}
	}, [stores, filtered, exclusionMap, onlyHasPromo, deferredQuery, brandMetaByKey, myPos, brandNameCache]);

	const selectedMarker = markers.find((m) => m.store.storeId === selectedStoreId) ?? null;
	
	// 計算選中店家的位置（用於地圖移動）
	const selectedStorePosition = React.useMemo<[number, number] | null>(() => {
		if (!selectedMarker || !selectedMarker.store.lat || !selectedMarker.store.lng) return null;
		let lat = Number(selectedMarker.store.lat);
		let lng = Number(selectedMarker.store.lng);
		
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
		
		// 檢查並修正經緯度順序
		const isLatInRange = lat >= 21 && lat <= 26;
		const isLngInRange = lng >= 119 && lng <= 122;
		const isLatInLngRange = lat >= 119 && lat <= 122;
		const isLngInLatRange = lng >= 21 && lng <= 26;
		
		if ((!isLatInRange || !isLngInRange) && isLatInLngRange && isLngInLatRange) {
			[lat, lng] = [lng, lat];
		}
		
		return [lat, lng];
	}, [selectedMarker]);
	
	const navigate = useNavigate();

	React.useEffect(() => {
		if (!('geolocation' in navigator)) return;
		const id = navigator.geolocation.watchPosition(
			(pos) => {
				// 確保位置格式正確：緯度在前，經度在後
				const lat = pos.coords.latitude;
				const lng = pos.coords.longitude;
				if (isTaiwan(lat, lng)) {
					setMyPos([lat, lng]);
				}
			},
			(err) => {
				console.warn('獲取位置失敗:', err);
			},
			{ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
		);
		return () => navigator.geolocation.clearWatch(id);
	}, []);

	return (
		<Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 3 }, bgcolor: '#f5f5f5', minHeight: '100%' }}>
			<Stack spacing={2.5}>
				<Card>
					<CardContent>
						<Stack spacing={2}>
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'stretch' }}>
								<Stack direction="column" spacing={1.5} alignItems="stretch" sx={{ flex: 1, minWidth: 0 }}>
									<TextField
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										placeholder="搜尋門市 / 地址 / 品牌"
										fullWidth
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<SearchRoundedIcon />
												</InputAdornment>
											),
											endAdornment: query ? (
												<InputAdornment position="end">
													<IconButton aria-label="clear" size="small" onClick={() => setQuery('')}>
														<ClearRoundedIcon fontSize="small" />
													</IconButton>
												</InputAdornment>
											) : undefined,
										}}
									/>
									<Typography 
										variant="body2" 
										color="text.secondary"
										sx={{ display: { xs: 'none', sm: 'block' } }}
									>
										目前共有 <strong>{markers.length}</strong> 間門市符合篩選條件，其中{' '}
										<strong>{markers.filter((m) => m.promotions.length > 0).length}</strong> 間提供優惠。
									</Typography>
								</Stack>
								<Stack 
									direction="column" 
									spacing={1.5} 
									alignItems="stretch" 
									sx={{ flexShrink: 0, display: { xs: 'none', sm: 'flex' } }}
								>
									<FormControlLabel
										control={<Switch checked={onlyHasPromo} onChange={(e) => setOnlyHasPromo(e.target.checked)} />}
										label="只顯示有符合條件的門市"
										sx={{ m: 0 }}
									/>
									<Button
										variant="outlined"
										size="small"
										startIcon={<FilterAltRoundedIcon />}
										onClick={() => setOnlyHasPromo(true)}
										sx={{ whiteSpace: 'nowrap' }}
									>
										快速回到熱門門市
									</Button>
								</Stack>
							</Stack>
						</Stack>
					</CardContent>
				</Card>

				<Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="stretch" sx={{ minHeight: 0 }}>
					<Box sx={{ flex: 1, minHeight: { xs: 360, sm: 400, lg: 520 }, height: { xs: 360, sm: 400, lg: 'auto' }, position: 'relative' }}>
						{mountMap ? (
							<React.Suspense
								fallback={
									<Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
										<CircularProgress size={28} sx={{ mb: 1 }} />
										<Typography variant="body2" color="text.secondary">
											地圖載入中…
										</Typography>
									</Box>
								}
							>
								<Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
									<LeafletMap markers={markers} myPos={myPos} selectedStoreId={selectedStoreId} selectedStorePosition={selectedStorePosition} onSelectStore={setSelectedStoreId} />
								</Box>
							</React.Suspense>
						) : (
							<Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<CircularProgress size={28} />
							</Box>
						)}
					</Box>

					<Card sx={{ flexBasis: { xs: '100%', lg: 360 }, maxHeight: 560, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
						<CardContent sx={{ flex: 1, overflowY: 'auto', pr: 1.5 }}>
							<Stack spacing={1.5}>
								{markers.length === 0 && (
									<Typography variant="body2" color="text.secondary">
										目前沒有符合條件的門市，調整篩選或搜尋試試。
									</Typography>
								)}
								{markers.map((marker) => (
									<Box
										key={marker.store.storeId}
										onClick={() => setSelectedStoreId(marker.store.storeId)}
										sx={{
											p: 1.25,
											borderRadius: 1.5,
											bgcolor: selectedStoreId === marker.store.storeId ? 'primary.50' : '#fff',
											border: '1px solid',
											borderColor: selectedStoreId === marker.store.storeId ? 'primary.main' : 'divider',
											cursor: 'pointer',
										}}
									>
										<Stack spacing={0.75}>
											<Stack direction="row" spacing={1} alignItems="center">
												<PlaceRoundedIcon fontSize="small" color="primary" />
												<Box>
													<Typography fontWeight={700}>{marker.store.name}</Typography>
													<Typography variant="body2" color="text.secondary">
														{marker.brandName} · {marker.store.region}
													</Typography>
												</Box>
												<Box flex={1} />
												<Chip label={`${marker.promotions.length} 則優惠`} size="small" color="primary" variant="outlined" />
											</Stack>
											{marker.store.address && (
												<Typography variant="body2" color="text.secondary">
													{marker.store.address}
												</Typography>
											)}
											<Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
												{marker.eventTags.slice(0, 3).map((tag) => {
													const meta = EVENT_TAG_META[tag as keyof typeof EVENT_TAG_META];
													if (!meta) return null;
													return (
														<Chip
															key={tag}
															label={meta.label}
															size="small"
															sx={{ bgcolor: `${meta.color}22`, color: meta.color, fontSize: 12 }}
														/>
													);
												})}
												{marker.nextEnding && (
													<Chip label={`結束 ${marker.nextEnding}`} size="small" color="warning" variant="outlined" />
												)}
											</Stack>
											{marker.promotions.slice(0, 2).map((promo) => (
												<Button
													key={promo.promoId}
													size="small"
													variant="text"
													onClick={(e) => {
														e.stopPropagation();
														navigate(`/promotions/${promo.promoId}`);
													}}
													sx={{ justifyContent: 'flex-start' }}
												>
													查看：{promo.title}
												</Button>
											))}
											{marker.promotions.length > 2 && (
												<Typography variant="caption" color="text.secondary">
													還有 {marker.promotions.length - 2} 則活動
												</Typography>
											)}
										</Stack>
									</Box>
								))}
							</Stack>
						</CardContent>
						{selectedMarker && (
							<Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1.5 }}>
								<Typography variant="subtitle2" fontWeight={700}>
									{selectedMarker.store.name} 的優惠
								</Typography>
								<Stack spacing={0.5} mt={1}>
									{selectedMarker.promotions.slice(0, 3).map((promo) => (
										<Button
											key={promo.promoId}
											size="small"
											variant="text"
											onClick={() => navigate(`/promotions/${promo.promoId}`)}
											sx={{ justifyContent: 'flex-start' }}
										>
											{promo.title}
										</Button>
									))}
									{selectedMarker.promotions.length === 0 && (
										<Typography variant="body2" color="text.secondary">
											目前無符合條件的活動
										</Typography>
									)}
								</Stack>
							</Box>
						)}
					</Card>
				</Stack>

				<Divider light />

				<Typography variant="body2" color="text.secondary">
					提示：地圖顯示的是符合目前篩選條件的門市。關閉「只顯示有符合條件的門市」即可瀏覽所有門市位置。
				</Typography>
			</Stack>
		</Box>
	);
}
