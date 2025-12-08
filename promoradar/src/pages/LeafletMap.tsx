import React from 'react';
import { Box, Stack, Typography, Avatar, Chip } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { PromotionRecord, StoreRecord, BrandMeta } from '../types/promo';
import { EVENT_TAG_META } from '../config/promotionMeta';

type MarkerData = {
	store: StoreRecord;
	brandName: string;
	logo?: string;
	brand: BrandMeta;
	promotions: PromotionRecord[];
	eventTags: string[];
};

const defaultIcon = L.icon({
	iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
	iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
	shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

function createLogoIcon(brand: BrandMeta, brandName: string) {
	if (!brand.logo) {
		// 如果沒有 logo，使用品牌顏色的圓形標記，顯示品牌名稱首字母
		return L.divIcon({
			html: `<div style="width:40px;height:40px;border-radius:50%;background:${brand.primaryColor};display:flex;align-items:center;justify-content:center;border:3px solid ${brand.secondaryColor || '#fff'};color:#fff;font-weight:700;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
				${brandName.charAt(0).toUpperCase()}
			</div>`,
			iconSize: [40, 40],
			iconAnchor: [20, 40],
			className: 'brand-logo-marker',
		});
	}
	return L.divIcon({
		html: `<div style="width:40px;height:40px;border-radius:50%;background:${brand.primaryColor};display:flex;align-items:center;justify-content:center;border:3px solid ${brand.secondaryColor || '#fff'};box-shadow:0 2px 8px rgba(0,0,0,0.3);">
			<img src="${brand.logo}" style="width:75%;height:75%;object-fit:contain;" alt="${brandName}" />
		</div>`,
		iconSize: [40, 40],
		iconAnchor: [20, 40],
		className: 'brand-logo-marker',
	});
}

function FitToMarkers({ coords }: { coords: Array<[number, number]> }) {
	const map = useMap();
	React.useEffect(() => {
		if (coords.length === 0) return;
		const bounds = L.latLngBounds(coords);
		map.fitBounds(bounds.pad(0.2));
	}, [coords, map]);
	return null;
}

function MyLocation({ pos }: { pos: [number, number] | null }) {
	const map = useMap();
	const centeredRef = React.useRef(false);
	React.useEffect(() => {
		if (pos && !centeredRef.current) {
			// 確保位置格式正確：Leaflet 使用 [緯度, 經度]
			const [lat, lng] = pos;
			if (Number.isFinite(lat) && Number.isFinite(lng)) {
				map.setView([lat, lng], 16);
				centeredRef.current = true;
			}
		}
	}, [pos, map]);
	const meIcon = L.icon({
		iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
		shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		shadowSize: [41, 41],
	});
	if (!pos) return null;
	const [lat, lng] = pos;
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
	return <Marker position={[lat, lng]} icon={meIcon} />;
}

function CenterOnStore({ 
	storeId, 
	storePosition 
}: { 
	storeId: number | null; 
	storePosition: [number, number] | null;
}) {
	const map = useMap();
	const prevStoreIdRef = React.useRef<number | null>(null);
	
	React.useEffect(() => {
		if (!storeId || !storePosition || storeId === prevStoreIdRef.current) return;
		
		const [lat, lng] = storePosition;
		
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
		
		// 使用 flyTo 實現平滑移動效果（縮短動畫時間以提升響應速度）
		map.flyTo([lat, lng], 16, {
			animate: true,
			duration: 0.5,
		});
		
		prevStoreIdRef.current = storeId;
	}, [storeId, storePosition, map]);
	
	return null;
}

type Props = {
	markers: MarkerData[];
	myPos: [number, number] | null;
	selectedStoreId: number | null;
	selectedStorePosition: [number, number] | null;
	onSelectStore?: (id: number) => void;
};

export default function LeafletMap({ markers, myPos, selectedStoreId, selectedStorePosition, onSelectStore }: Props) {
	// 處理座標，確保格式正確 [緯度, 經度]
	const coords = markers
		.map((m) => {
			let lat = Number(m.store.lat);
			let lng = Number(m.store.lng);
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
			
			// 檢查是否可能搞混了順序
			const isLatInRange = lat >= 21 && lat <= 26;
			const isLngInRange = lng >= 119 && lng <= 122;
			const isLatInLngRange = lat >= 119 && lat <= 122;
			const isLngInLatRange = lng >= 21 && lng <= 26;
			
			if (!isLatInRange || !isLngInRange) {
				if (isLatInLngRange && isLngInLatRange) {
					[lat, lng] = [lng, lat];
				}
			}
			
			return [lat, lng] as [number, number];
		})
		.filter((coord): coord is [number, number] => coord !== null);
	
	// 漸進式載入：逐步顯示標記（由近到遠，markers 已經按距離排序）
	const [visibleCount, setVisibleCount] = React.useState(0);
	
	React.useEffect(() => {
		// 重置計數器
		setVisibleCount(0);
		
		if (markers.length === 0) return;
		
		// 立即顯示前 20 個標記（最重要的）
		setVisibleCount(Math.min(20, markers.length));
		
		if (markers.length <= 20) return;
		
		// 剩餘標記快速載入
		const batchSize = Math.max(10, Math.min(30, Math.ceil(markers.length / 5)));
		const interval = 30; // 縮短間隔
		
		let currentCount = 20;
		const timer = setInterval(() => {
			currentCount += batchSize;
			if (currentCount >= markers.length) {
				setVisibleCount(markers.length);
				clearInterval(timer);
			} else {
				setVisibleCount(currentCount);
			}
		}, interval);
		
		return () => clearInterval(timer);
	}, [markers.length]);
	
	// 緩存圖標創建，避免每次渲染都重新創建
	const iconCache = React.useMemo(() => {
		const cache = new Map<string, L.DivIcon | L.Icon>();
		markers.forEach((marker) => {
			const cacheKey = `${marker.brandName}-${marker.brand.logo || 'no-logo'}-${marker.brand.primaryColor}`;
			if (!cache.has(cacheKey)) {
				cache.set(cacheKey, createLogoIcon(marker.brand, marker.brandName));
			}
		});
		return cache;
	}, [markers]);
	
	// 只顯示前 visibleCount 個標記（已經按距離排序，由近到遠）
	const visibleMarkers = markers.slice(0, visibleCount);

	return (
		<MapContainer center={[25.034, 121.564]} zoom={13} style={{ height: '100%', borderRadius: 16, overflow: 'hidden' }}>
			{coords.length > 0 && !myPos && <FitToMarkers coords={coords} />}
			<TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap & CARTO" />
			<MyLocation pos={myPos} />
			<CenterOnStore storeId={selectedStoreId} storePosition={selectedStorePosition} />
			{visibleMarkers.map((marker) => {
				// 確保位置格式正確：Leaflet 使用 [緯度, 經度] 格式
				// 台灣範圍：緯度 21.9-25.3，經度 119.3-122.0
				let lat = Number(marker.store.lat);
				let lng = Number(marker.store.lng);
				
				// 驗證數值有效性
				if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
				
				// 檢查是否可能搞混了順序
				// 台灣的緯度應該在 21-26 之間，經度應該在 119-122 之間
				const isLatInRange = lat >= 21 && lat <= 26;
				const isLngInRange = lng >= 119 && lng <= 122;
				const isLatInLngRange = lat >= 119 && lat <= 122;
				const isLngInLatRange = lng >= 21 && lng <= 26;
				
				// 如果兩個值都不在正確範圍，但交換後都在正確範圍，則交換
				// 或者如果只有一個在正確範圍，但交換後兩個都在正確範圍，也交換
				if ((!isLatInRange || !isLngInRange) && isLatInLngRange && isLngInLatRange) {
					// 順序錯了，交換一下
					const originalLat = lat;
					const originalLng = lng;
					[lat, lng] = [lng, lat];
					console.log(`已修正順序: ${marker.store.name} [${originalLat}, ${originalLng}] -> [${lat}, ${lng}]`);
				}
				
				// 最終驗證：確保在台灣範圍內（稍微放寬範圍以容納誤差）
				if (lat < 20 || lat > 27 || lng < 118 || lng > 123) {
					console.warn(`門市 ${marker.store.name} (${marker.store.address}) 的位置可能不準確: [${lat}, ${lng}]`);
					// 仍然顯示，但記錄警告
				}
				
				const position: [number, number] = [lat, lng];
				const cacheKey = `${marker.brandName}-${marker.brand.logo || 'no-logo'}-${marker.brand.primaryColor}`;
				const icon = iconCache.get(cacheKey) || createLogoIcon(marker.brand, marker.brandName);
				const active = selectedStoreId === marker.store.storeId;
				return (
					<Marker
						key={marker.store.storeId}
						position={position}
						icon={icon as any}
						eventHandlers={{
							click: () => onSelectStore?.(marker.store.storeId),
						}}
					>
						<Popup>
							<Stack spacing={0.75}>
								<Stack direction="row" spacing={1} alignItems="center">
									<Avatar variant="rounded" src={marker.logo} sx={{ width: 32, height: 32, bgcolor: marker.brand.primaryColor }}>
										{marker.brandName[0]}
									</Avatar>
									<Box>
										<Typography fontWeight={700}>{marker.store.name}</Typography>
										<Typography variant="body2" color="text.secondary">
											{marker.brandName}
										</Typography>
									</Box>
								</Stack>
								{marker.store.address && (
									<Typography variant="body2" color="text.secondary">
										{marker.store.address}
									</Typography>
								)}
								<Typography variant="body2" fontWeight={600}>
									{marker.promotions.length > 0 ? '可使用優惠：' : '目前沒有符合條件的優惠'}
								</Typography>
								<Stack spacing={0.25}>
									{marker.promotions.slice(0, 3).map((promo) => (
										<Typography key={promo.promoId} variant="body2" color="text.secondary">
											• {promo.title}
										</Typography>
									))}
								</Stack>
								{marker.eventTags.length > 0 && (
									<Stack direction="row" spacing={0.5} flexWrap="wrap">
										{marker.eventTags.slice(0, 2).map((tag) => {
											const meta = EVENT_TAG_META[tag as keyof typeof EVENT_TAG_META];
											if (!meta) return null;
											return (
												<Chip key={tag} label={meta.label} size="small" sx={{ bgcolor: `${meta.color}22`, color: meta.color }} />
											);
										})}
									</Stack>
								)}
								{active && (
									<Typography variant="caption" color="primary">
										已同步至右側列表
									</Typography>
								)}
							</Stack>
						</Popup>
					</Marker>
				);
			})}
		</MapContainer>
	);
}
