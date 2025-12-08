import React from 'react';
import {
	Alert,
	Avatar,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Collapse,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Divider,
	FormControl,
	FormControlLabel,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Switch,
	Tab,
	Tabs,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import dayjs from 'dayjs';
import { useAuth } from '../store/useAuth';
import type { BrandMeta, PromotionRecord, StoreRecord } from '../types/promo';
import { PROMO_TYPE_VALUES, EVENT_TAG_VALUES } from '../types/promo';
import { PROMO_TYPE_META, EVENT_TAG_META } from '../config/promotionMeta';
import {
	adminListBrands,
	adminCreateBrand,
	adminUpdateBrand,
	adminListStores,
	adminCreateStore,
	adminUpdateStore,
	adminListPromotions,
	adminCreatePromotion,
	adminUpdatePromotion,
	adminPublishPromotion,
	adminCancelPromotion,
	adminGetPromotionQuota,
	adminGetPromotionExclusions,
	adminSetPromotionExclusions,
} from '../lib/adminApi';

const BRAND_CATEGORIES = [
	'Drink-Tea',
	'Drink-Milk',
	'Drink-Juice',
	'Drink-Coffee',
	'Convenience_Coffee',
	'Dessert',
	'Bakery',
	'Fast_Food',
	'Bubble_Tea',
	'Smoothie',
	'Ice_Cream',
	'Breakfast',
	'Other',
] as const;

type InputEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

type QuotaState = Awaited<ReturnType<typeof adminGetPromotionQuota>> | null;

type BrandFormState = {
	key: string;
	displayName: string;
	category: string;
	logoUrl: string;
	primaryColor: string;
	secondaryColor: string;
	textColor: string;
};

type PromoFormState = {
	title: string;
	description: string;
	stackingRule: string;
	promoType: PromotionRecord['promoType'];
	eventTag: PromotionRecord['eventTag'];
	startDatetime: string;
	endDatetime: string;
	perUserLimit: number;
	globalQuota: string;
	dailyQuota: string;
	needMembership: boolean;
	needCode: boolean;
};

type PromotionStats = {
	globalQuota: number | null;
	dailyQuota: number | null;
	totalUsed: number;
	remaining: number | null;
	daily: Array<{ date: string; count: number }>;
	clickCount?: number;
	viewCount?: number;
};

const createDefaultPromoForm = (): PromoFormState => ({
	title: '',
	description: '',
	stackingRule: '',
	promoType: PROMO_TYPE_VALUES[0],
	eventTag: EVENT_TAG_VALUES[0],
	startDatetime: dayjs().format('YYYY-MM-DDTHH:mm'),
	endDatetime: dayjs().add(7, 'day').format('YYYY-MM-DDTHH:mm'),
	perUserLimit: 0,
	globalQuota: '',
	dailyQuota: '',
	needMembership: false,
	needCode: false,
});

const FieldGrid = ({
	columnsMd,
	children,
}: {
	columnsMd: number;
	children: React.ReactNode;
}) => (
	<Box
		sx={{
			display: 'grid',
			gap: 2,
			gridTemplateColumns: { xs: '1fr', md: `repeat(${columnsMd}, minmax(0, 1fr))` },
		}}
	>
		{children}
	</Box>
);

export default function AdminDashboardPage() {
	const { token, user } = useAuth();
	const isAdmin = Boolean(token && user?.isAdmin);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [initializing, setInitializing] = React.useState(false);
	const [actionLoading, setActionLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [brands, setBrands] = React.useState<BrandMeta[]>([]);
	const [selectedBrand, setSelectedBrand] = React.useState('');
	const [stores, setStores] = React.useState<StoreRecord[]>([]);
	const [promotions, setPromotions] = React.useState<PromotionRecord[]>([]);
	const [quota, setQuota] = React.useState<QuotaState>(null);

	const [brandForm, setBrandForm] = React.useState<BrandFormState>({
		key: '',
		displayName: '',
		category: BRAND_CATEGORIES[0],
		logoUrl: '',
		primaryColor: '#4B5563',
		secondaryColor: '#9CA3AF',
		textColor: '#111827',
	});

	const [storeForm, setStoreForm] = React.useState({
		name: '',
		address: '',
		lat: '',
		lng: '',
		region: '',
	});

	const [promoForm, setPromoForm] = React.useState<PromoFormState>(() => createDefaultPromoForm());
	const [analysisLoading, setAnalysisLoading] = React.useState(false);
	const [promoStats, setPromoStats] = React.useState<Record<number, PromotionStats>>({});
	const [brandPanelOpen, setBrandPanelOpen] = React.useState(true);
	const [storePanelOpen, setStorePanelOpen] = React.useState(false);
	const [promoPanelOpen, setPromoPanelOpen] = React.useState(false);
	const [currentTab, setCurrentTab] = React.useState(0);
	const [storeFormOpen, setStoreFormOpen] = React.useState(false);
	const [promoFormOpen, setPromoFormOpen] = React.useState(false);
	const [editingPromoId, setEditingPromoId] = React.useState<number | null>(null);
	const [excludedStoreIds, setExcludedStoreIds] = React.useState<number[]>([]);
	const [promotionExclusions, setPromotionExclusions] = React.useState<Record<number, number[]>>({});

    const showBrandSetup = brands.length === 0;

const handleBrandChange =
	<K extends keyof BrandFormState>(field: K) =>
	(event: InputEvent | SelectChangeEvent<string>) => {
		const value = event.target.value as BrandFormState[K];
		setBrandForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleError = (err: unknown) => {
		const message = err instanceof Error ? err.message : '操作失敗，請稍後再試';
		setError(message);
	};

	const hydrateBrands = React.useCallback(async () => {
		if (!token) return;
		setInitializing(true);
		setError(null);
		try {
			const items = await adminListBrands(token);
			setBrands(items);
			if (items.length) {
				setSelectedBrand((prev) => (prev && items.some((b) => b.key === prev) ? prev : items[0].key));
			} else {
				setSelectedBrand('');
			}
		} catch (err) {
			handleError(err);
		} finally {
			setInitializing(false);
		}
	}, [token]);

	React.useEffect(() => {
		if (isAdmin) {
			hydrateBrands();
		} else {
			setBrands([]);
			setSelectedBrand('');
		}
	}, [isAdmin, hydrateBrands]);

	React.useEffect(() => {
		if (!token || !selectedBrand) {
			setStores([]);
			setPromotions([]);
			return;
		}
		let cancelled = false;
		setInitializing(true);
		setError(null);
		Promise.all([adminListStores(token, selectedBrand), adminListPromotions(token, selectedBrand)])
			.then(([storeList, promoList]) => {
				if (cancelled) return;
				console.log('[AdminDashboard] 載入資料:', {
					selectedBrand,
					storesCount: storeList.length,
					promotionsCount: promoList.length,
					promotions: promoList.map((p) => ({ id: p.promoId, title: p.title, brandName: p.brandName })),
				});
				setStores(storeList);
				setPromotions(promoList);
				// 加載所有活動的不適用分店
				Promise.all(
					promoList.map((promo) =>
						adminGetPromotionExclusions(token, promo.promoId)
							.then((exclusions) => ({ promoId: promo.promoId, storeIds: exclusions.map((e) => e.storeId) }))
							.catch(() => ({ promoId: promo.promoId, storeIds: [] })),
					),
				).then((entries) => {
					if (cancelled) return;
					const map: Record<number, number[]> = {};
					for (const entry of entries) {
						map[entry.promoId] = entry.storeIds;
					}
					setPromotionExclusions(map);
				});
				const current = brands.find((b) => b.key === selectedBrand);
				if (current) {
					setBrandForm((prev) => ({
						...prev,
						key: current.key,
						displayName: current.displayName,
						category: current.categories?.[0] ?? prev.category,
						logoUrl: current.logo ?? '',
						primaryColor: current.primaryColor,
						secondaryColor: current.secondaryColor ?? '',
						textColor: current.textColor ?? '',
					}));
				}
			})
			.catch(handleError)
			.finally(() => {
				if (!cancelled) setInitializing(false);
			});
		return () => {
			cancelled = true;
		};
	}, [token, selectedBrand, brands]);

	React.useEffect(() => {
		if (!token || !promotions.length) {
			setPromoStats({});
			return;
		}
		let cancelled = false;
		setAnalysisLoading(true);
		Promise.all(
			promotions.map((promo) =>
				adminGetPromotionQuota(token, promo.promoId)
					.then((data) => ({ promoId: promo.promoId, stats: data.stats }))
					.catch(() => null),
			),
		)
			.then((entries) => {
				if (cancelled) return;
				const map: Record<number, PromotionStats> = {};
				for (const entry of entries) {
					if (!entry) continue;
					map[entry.promoId] = entry.stats;
				}
				setPromoStats(map);
			})
			.finally(() => {
				if (!cancelled) setAnalysisLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [token, promotions]);

	React.useEffect(() => {
		if (showBrandSetup) {
			setBrandPanelOpen(true);
			setStorePanelOpen(false);
			setPromoPanelOpen(false);
		}
	}, [showBrandSetup]);

	const handleCreateBrandInternal = async () => {
		if (!token) return;
		setActionLoading(true);
		setError(null);
		try {
			const created = await adminCreateBrand(token, {
				key: brandForm.key.trim().toLowerCase(),
				displayName: brandForm.displayName,
				category: brandForm.category,
				logoUrl: brandForm.logoUrl,
				primaryColor: brandForm.primaryColor,
				secondaryColor: brandForm.secondaryColor,
				textColor: brandForm.textColor,
			});
			setBrands((prev) => [...prev, created]);
			setSelectedBrand(created.key);
		} catch (err) {
			handleError(err);
		} finally {
			setActionLoading(false);
		}
	};

	const handleUpdateBrandInternal = async () => {
		if (!token || !selectedBrand) return;
		setActionLoading(true);
		setError(null);
		try {
			const updated = await adminUpdateBrand(token, selectedBrand, {
				displayName: brandForm.displayName,
				category: brandForm.category,
				logoUrl: brandForm.logoUrl,
				primaryColor: brandForm.primaryColor,
				secondaryColor: brandForm.secondaryColor,
				textColor: brandForm.textColor,
			});
			setBrands((prev) => prev.map((b) => (b.key === updated.key ? updated : b)));
		} catch (err) {
			handleError(err);
		} finally {
			setActionLoading(false);
		}
	};

	const handleCreateStoreInternal = async () => {
		if (!token || !selectedBrand) return;
		setActionLoading(true);
		setError(null);
		try {
			const created = await adminCreateStore(token, {
				brandName: selectedBrand,
				name: storeForm.name,
				address: storeForm.address,
				region: storeForm.region,
				lat: Number(storeForm.lat),
				lng: Number(storeForm.lng),
			});
			setStores((prev) => [created, ...prev]);
			setStoreForm({ name: '', address: '', lat: '', lng: '', region: '' });
			setStoreFormOpen(false); // 新增成功後自動收起表單
		} catch (err) {
			handleError(err);
		} finally {
			setActionLoading(false);
		}
	};

	const handleToggleStoreInternal = async (store: StoreRecord) => {
		if (!token) return;
		setActionLoading(true);
		setError(null);
		try {
			const updated = await adminUpdateStore(token, store.storeId, { isActive: !store.isActive });
			if (updated) {
				setStores((prev) => prev.map((item) => (item.storeId === updated.storeId ? updated : item)));
			}
		} catch (err) {
			handleError(err);
		} finally {
			setActionLoading(false);
		}
	};

	const handleCreatePromotionInternal = async () => {
		if (!token || !selectedBrand) return;
		setActionLoading(true);
		setError(null);
		try {
			let promoId: number;
			if (editingPromoId) {
				// 更新現有活動
				const updated = await adminUpdatePromotion(token, editingPromoId, {
					title: promoForm.title,
					description: promoForm.description,
					stackingRule: (promoForm.stackingRule || null) as any,
					promoType: promoForm.promoType,
					eventTag: promoForm.eventTag,
					startDatetime: new Date(promoForm.startDatetime).toISOString(),
					endDatetime: new Date(promoForm.endDatetime).toISOString(),
					needMembership: promoForm.needMembership,
					needCode: promoForm.needCode,
					perUserLimit: promoForm.perUserLimit,
					globalQuota: promoForm.globalQuota ? Number(promoForm.globalQuota) : null,
					dailyQuota: promoForm.dailyQuota ? Number(promoForm.dailyQuota) : null,
				} as any);
				setPromotions((prev) => prev.map((p) => (p.promoId === editingPromoId ? updated : p)));
				promoId = editingPromoId;
			} else {
				// 新增活動
				const created = await adminCreatePromotion(token, {
					brandName: selectedBrand,
					title: promoForm.title,
					description: promoForm.description,
					stackingRule: promoForm.stackingRule || null,
					promoType: promoForm.promoType,
					eventTag: promoForm.eventTag,
					startDatetime: new Date(promoForm.startDatetime).toISOString(),
					endDatetime: new Date(promoForm.endDatetime).toISOString(),
					needMembership: promoForm.needMembership,
					needCode: promoForm.needCode,
					perUserLimit: promoForm.perUserLimit,
					globalQuota: promoForm.globalQuota ? Number(promoForm.globalQuota) : null,
					dailyQuota: promoForm.dailyQuota ? Number(promoForm.dailyQuota) : null,
				} as Partial<PromotionRecord> & { brandName: string });
				setPromotions((prev) => [created, ...prev]);
				promoId = created.promoId;
			}
			// 保存不適用分店
			await adminSetPromotionExclusions(token, promoId, excludedStoreIds);
			setPromotionExclusions((prev) => ({ ...prev, [promoId]: excludedStoreIds }));
			setPromoForm(createDefaultPromoForm());
			setExcludedStoreIds([]);
			setEditingPromoId(null);
			setPromoFormOpen(false); // 新增/更新成功後自動收起表單
		} catch (err) {
			handleError(err);
		} finally {
			setActionLoading(false);
		}
	};

	const handleEditPromotion = async (promo: PromotionRecord) => {
		// 只有草稿狀態才能編輯
		if (promo.status !== 'Draft') {
			setError('只有草稿狀態的活動才能編輯');
			return;
		}
		if (!token) return;
		setPromoForm({
			title: promo.title,
			description: promo.description || '',
			stackingRule: promo.stackingRule || '',
			promoType: promo.promoType,
			eventTag: promo.eventTag,
			startDatetime: dayjs(promo.startDatetime).format('YYYY-MM-DDTHH:mm'),
			endDatetime: dayjs(promo.endDatetime).format('YYYY-MM-DDTHH:mm'),
			perUserLimit: promo.perUserLimit,
			globalQuota: promo.globalQuota?.toString() || '',
			dailyQuota: promo.dailyQuota?.toString() || '',
			needMembership: promo.needMembership,
			needCode: promo.needCode,
		});
		setEditingPromoId(promo.promoId);
		// 加載現有的不適用分店
		try {
			const exclusions = await adminGetPromotionExclusions(token, promo.promoId);
			const storeIds = exclusions.map((e) => e.storeId);
			setExcludedStoreIds(storeIds);
			setPromotionExclusions((prev) => ({ ...prev, [promo.promoId]: storeIds }));
		} catch (err) {
			console.error('Failed to load exclusions:', err);
			setExcludedStoreIds([]);
		}
		setPromoFormOpen(true); // 展開表單
	};

	const handlePublishPromotion = async (promoId: number) => {
		if (!token) return;
		setActionLoading(true);
		setError(null);
		try {
			const updated = await adminPublishPromotion(token, promoId);
			setPromotions((prev) => prev.map((promo) => (promo.promoId === updated.promoId ? updated : promo)));
		} catch (err) {
			handleError(err);
		} finally {
			setActionLoading(false);
		}
	};

	const handleCancelPromotion = async (promoId: number) => {
		if (!token) return;
		setActionLoading(true);
		setError(null);
		try {
			const updated = await adminCancelPromotion(token, promoId);
			setPromotions((prev) => prev.map((promo) => (promo.promoId === updated.promoId ? updated : promo)));
		} catch (err) {
			handleError(err);
		} finally {
			setActionLoading(false);
		}
	};

	const handleLoadQuota = async (promoId: number) => {
		if (!token) {
			console.error('[handleLoadQuota] No token');
			return;
		}
		setActionLoading(true);
		setError(null);
		try {
			console.log('[handleLoadQuota] Loading quota for promoId:', promoId);
			const data = await adminGetPromotionQuota(token, promoId);
			console.log('[handleLoadQuota] Quota data loaded:', data);
			setQuota(data);
		} catch (err) {
			console.error('[handleLoadQuota] Error:', err);
			handleError(err);
		} finally {
			setActionLoading(false);
		}
	};

	// 確保只顯示當前品牌的活動（雙重檢查）
	// 使用標準化比較（小寫、去除空格）以確保匹配
	const normalizeBrandName = (name: string) => name.trim().toLowerCase();
	const filteredPromotions = React.useMemo(() => {
		if (!selectedBrand) return [];
		const normalizedSelected = normalizeBrandName(selectedBrand);
		const filtered = promotions.filter((promo) => normalizeBrandName(promo.brandName) === normalizedSelected);
		// 除錯：如果 promotions 有資料但 filtered 為空，可能是品牌名稱不匹配
		if (promotions.length > 0 && filtered.length === 0) {
			console.warn('[AdminDashboard] 品牌名稱可能不匹配:', {
				selectedBrand,
				normalizedSelected,
				promotions: promotions.map((p) => ({ id: p.promoId, brandName: p.brandName, normalized: normalizeBrandName(p.brandName) })),
			});
		}
		return filtered;
	}, [promotions, selectedBrand]);

	// 取得當前選中的品牌資訊（用於顯示）
	const selectedBrandMeta = React.useMemo(() => {
		if (!selectedBrand) return null;
		return brands.find((b) => b.key === selectedBrand) || null;
	}, [selectedBrand, brands]);

	// 計算品牌總覽統計
	const brandOverview = React.useMemo(() => {
		if (!selectedBrand) return null;
		const currentBrand = selectedBrandMeta;
		const activeStores = stores.filter((s) => s.isActive).length;
		const publishedPromos = filteredPromotions.filter((p) => p.status === 'Published').length;
		const todayKey = dayjs().format('YYYY-MM-DD');
		const todayUsage = Object.values(promoStats).reduce((sum, stats) => {
			const today = stats.daily.find((entry) => entry.date === todayKey);
			return sum + (today?.count ?? 0);
		}, 0);

		return {
			brand: currentBrand,
			activeStores,
			totalStores: stores.length,
			publishedPromos,
			totalPromos: filteredPromotions.length,
			todayUsage,
		};
	}, [selectedBrand, selectedBrandMeta, stores, filteredPromotions, promoStats]);

	// 品牌總覽卡片
	const brandOverviewCard = brandOverview ? (() => {
		const primaryColor = brandOverview.brand?.primaryColor || '#667eea';
		const secondaryColor = brandOverview.brand?.secondaryColor || primaryColor;
		let textColor = brandOverview.brand?.textColor || '#ffffff';
		
		// 混合白色讓背景變淡（混合 65% 白色，讓背景更淡）
		const lightenColor = (hex: string, whitePercent: number) => {
			const num = parseInt(hex.replace('#', ''), 16);
			const r = (num >> 16) & 0xff;
			const g = (num >> 8) & 0xff;
			const b = num & 0xff;
			const rNew = Math.round(r + (255 - r) * whitePercent);
			const gNew = Math.round(g + (255 - g) * whitePercent);
			const bNew = Math.round(b + (255 - b) * whitePercent);
			return `#${((rNew << 16) | (gNew << 8) | bNew).toString(16).padStart(6, '0')}`;
		};

		const lightPrimary = lightenColor(primaryColor, 0.65);
		const lightSecondary = secondaryColor && secondaryColor !== primaryColor 
			? lightenColor(secondaryColor, 0.65) 
			: lightPrimary;
		
		// 計算背景亮度，決定文字顏色
		const getLuminance = (hex: string) => {
			const num = parseInt(hex.replace('#', ''), 16);
			const r = (num >> 16) & 0xff;
			const g = (num >> 8) & 0xff;
			const b = num & 0xff;
			return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		};
		
		const bgLuminance = getLuminance(lightPrimary);
		// 如果背景較亮（亮度 > 0.5），使用深色文字；否則使用白色文字
		// 但為了確保對比度，在淡色背景上使用更深的文字顏色
		if (bgLuminance > 0.5) {
			// 背景較亮，使用深色文字（使用原始品牌顏色的深色版本）
			const darkenColor = (hex: string, darkPercent: number) => {
				const num = parseInt(hex.replace('#', ''), 16);
				const r = (num >> 16) & 0xff;
				const g = (num >> 8) & 0xff;
				const b = num & 0xff;
				const rNew = Math.round(r * (1 - darkPercent));
				const gNew = Math.round(g * (1 - darkPercent));
				const bNew = Math.round(b * (1 - darkPercent));
				return `#${((rNew << 16) | (gNew << 8) | bNew).toString(16).padStart(6, '0')}`;
			};
			textColor = darkenColor(primaryColor, 0.3); // 使用原始顏色的 70% 亮度版本
		} else {
			// 背景較暗，使用白色文字
			textColor = '#ffffff';
		}
		
		// 如果有 secondaryColor 且與 primaryColor 不同，使用漸層；否則使用單色
		const background =
			secondaryColor && secondaryColor !== primaryColor
				? `linear-gradient(135deg, ${lightPrimary} 0%, ${lightSecondary} 100%)`
				: lightPrimary;

		return (
			<Card sx={{ background, color: textColor }}>
				<CardContent sx={{ p: { xs: 2, sm: 3 } }}>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
					{brandOverview.brand?.logo && (
						<Avatar
							src={brandOverview.brand.logo}
							alt={brandOverview.brand.displayName}
							sx={{ width: 80, height: 80, border: `3px solid ${textColor}`, bgcolor: 'rgba(255,255,255,0.1)' }}
						/>
					)}
					<Box sx={{ flex: 1 }}>
						<Typography variant="h5" fontWeight={800} gutterBottom>
							{brandOverview.brand?.displayName || selectedBrand}
						</Typography>
						{brandOverview.brand?.categories && brandOverview.brand.categories.length > 0 && (
							<Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
								{brandOverview.brand.categories.map((cat) => (
									<Chip
										key={cat}
										label={cat}
										size="small"
										sx={{
											bgcolor: 'rgba(255,255,255,0.2)',
											color: textColor,
											fontWeight: 600,
											border: `1px solid ${textColor}40`,
										}}
									/>
								))}
							</Stack>
						)}
					</Box>
					<Stack direction={{ xs: 'row', sm: 'column' }} spacing={{ xs: 2, sm: 1 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
						<Box>
							<Typography variant="h4" fontWeight={800}>
								{brandOverview.activeStores}
							</Typography>
							<Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.84rem', sm: '0.875rem' } }}>
								啟用門市 / {brandOverview.totalStores} 間
							</Typography>
						</Box>
						<Box>
							<Typography variant="h4" fontWeight={800}>
								{brandOverview.publishedPromos}
							</Typography>
							<Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.84rem', sm: '0.875rem' } }}>
								上架活動 / {brandOverview.totalPromos} 個
							</Typography>
						</Box>
						<Box>
							<Typography variant="h4" fontWeight={800}>
								{brandOverview.todayUsage}
							</Typography>
							<Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.84rem', sm: '0.875rem' } }}>
								今日使用次數
							</Typography>
						</Box>
					</Stack>
				</Stack>
			</CardContent>
		</Card>
		);
	})() : null;

	const analysisCard = (
		<Card>
			<CardContent sx={{ p: { xs: 2, sm: 3 } }}>
				<Stack spacing={2}>
					<Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={700}>
						活動名額分析{selectedBrandMeta ? ` · ${selectedBrandMeta.displayName}` : selectedBrand ? ` · ${selectedBrand}` : ''}
					</Typography>
					{filteredPromotions.length === 0 ? (
						<Typography color="text.secondary">
							{selectedBrandMeta
								? `目前 ${selectedBrandMeta.displayName} 共有 0 個活動`
								: selectedBrand
									? `目前 ${selectedBrand} 共有 0 個活動`
									: '目前共有 0 個活動'}
						</Typography>
					) : analysisLoading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
							<CircularProgress size={24} />
						</Box>
					) : (
						<FieldGrid columnsMd={3}>
							{filteredPromotions.map((promo) => {
								const stats = promoStats[promo.promoId];
								const remaining =
									stats == null
										? '載入中'
										: stats.remaining ?? (stats.globalQuota == null ? '不限' : Math.max(stats.globalQuota - stats.totalUsed, 0));
								const totalUsed = stats == null ? '載入中' : stats.totalUsed;
								const dailyQuota = stats == null ? '載入中' : stats.dailyQuota ?? '不限';
								const todayKey = dayjs().format('YYYY-MM-DD');
								const todayUsage =
									stats == null ? '載入中' : stats.daily.find((entry) => entry.date === todayKey)?.count ?? 0;
								return (
									<Box
										key={promo.promoId}
										sx={{
											border: '1px solid',
											borderColor: 'divider',
											borderRadius: 2,
											p: 2,
											display: 'flex',
											flexDirection: 'column',
											gap: 0.75,
										}}
									>
										<Typography fontWeight={700}>{promo.title}</Typography>
										<Typography variant="body2" color="text.secondary">
											狀態：{promo.status}
										</Typography>
										<Typography>剩餘名額：{remaining}</Typography>
										<Typography>已使用：{totalUsed}</Typography>
										<Typography>每日名額：{dailyQuota}</Typography>
										<Typography>今天領用：{todayUsage}</Typography>
										<Button
											variant="text"
											size="small"
											sx={{ alignSelf: 'flex-start', mt: 1 }}
											onClick={() => handleLoadQuota(promo.promoId)}
										>
											查看詳細
										</Button>
									</Box>
								);
							})}
						</FieldGrid>
					)}
				</Stack>
			</CardContent>
		</Card>
	);

	const brandCard = (
		<Card>
			<CardContent sx={{ p: { xs: 2, sm: 3 } }}>
				<Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={700} gutterBottom>
					{showBrandSetup ? '建立品牌' : '品牌設定'}
				</Typography>
				<Stack spacing={2}>
					{showBrandSetup ? (
						<>
							<TextField label="品牌代號 (key)" value={brandForm.key} onChange={handleBrandChange('key')} />
							<TextField label="品牌名稱" value={brandForm.displayName} onChange={handleBrandChange('displayName')} />
							<FormControl fullWidth>
								<InputLabel>分類</InputLabel>
								<Select label="分類" value={brandForm.category} onChange={handleBrandChange('category')}>
									{BRAND_CATEGORIES.map((cat) => (
										<MenuItem key={cat} value={cat}>
											{cat}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<TextField label="Logo URL" value={brandForm.logoUrl} onChange={handleBrandChange('logoUrl')} />
							<FieldGrid columnsMd={3}>
								<TextField label="主色" value={brandForm.primaryColor} onChange={handleBrandChange('primaryColor')} />
								<TextField label="副色" value={brandForm.secondaryColor} onChange={handleBrandChange('secondaryColor')} />
								<TextField label="文字顏色" value={brandForm.textColor} onChange={handleBrandChange('textColor')} />
							</FieldGrid>
							<Button
								variant="contained"
								onClick={handleCreateBrandInternal}
								disabled={actionLoading || !brandForm.key.trim() || !brandForm.displayName.trim()}
							>
								建立品牌並進入管理
							</Button>
						</>
					) : (
						<>
							<FormControl fullWidth>
								<InputLabel>選擇品牌</InputLabel>
								<Select label="選擇品牌" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
									{brands.map((brand) => (
										<MenuItem key={brand.key} value={brand.key}>
											{brand.displayName}
										</MenuItem>
									))}
								</Select>
							</FormControl>
							<FieldGrid columnsMd={2}>
								<TextField
									label="品牌名稱"
									fullWidth
									value={brandForm.displayName}
									onChange={handleBrandChange('displayName')}
								/>
								<FormControl fullWidth>
									<InputLabel>分類</InputLabel>
									<Select label="分類" value={brandForm.category} onChange={handleBrandChange('category')}>
										{BRAND_CATEGORIES.map((cat) => (
											<MenuItem key={cat} value={cat}>
												{cat}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</FieldGrid>
							<TextField label="Logo URL" fullWidth value={brandForm.logoUrl} onChange={handleBrandChange('logoUrl')} />
							<FieldGrid columnsMd={3}>
								<TextField label="主色" fullWidth value={brandForm.primaryColor} onChange={handleBrandChange('primaryColor')} />
								<TextField label="副色" fullWidth value={brandForm.secondaryColor} onChange={handleBrandChange('secondaryColor')} />
								<TextField label="文字顏色" fullWidth value={brandForm.textColor} onChange={handleBrandChange('textColor')} />
							</FieldGrid>
							<Button variant="contained" onClick={handleUpdateBrandInternal} disabled={actionLoading}>
								更新品牌資訊
							</Button>
						</>
					)}
				</Stack>
			</CardContent>
		</Card>
	);

	const storeCard = (
		<Card>
			<CardContent sx={{ p: { xs: 2, sm: 3 } }}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
					<Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={700}>
						門市管理
					</Typography>
					<Button
						variant="outlined"
						size="small"
						onClick={() => setStoreFormOpen((prev) => !prev)}
					>
						{storeFormOpen ? '收起' : '新增門市'}
					</Button>
				</Stack>
				<Collapse in={storeFormOpen}>
					<Box sx={{ mb: 2 }}>
						<TextField
							label="門市名稱"
							fullWidth
							value={storeForm.name}
							onChange={(e: InputEvent) => setStoreForm((prev) => ({ ...prev, name: e.target.value }))}
						/>
						<TextField
							label="地址"
							fullWidth
							value={storeForm.address}
							onChange={(e: InputEvent) => setStoreForm((prev) => ({ ...prev, address: e.target.value }))}
							sx={{ mt: 2 }}
						/>
						<Box sx={{ mt: 2 }}>
							<FieldGrid columnsMd={3}>
							<TextField
								label="行政區"
								fullWidth
								value={storeForm.region}
								onChange={(e: InputEvent) => setStoreForm((prev) => ({ ...prev, region: e.target.value }))}
							/>
							<TextField
								label="經度"
								fullWidth
								value={storeForm.lng}
								onChange={(e: InputEvent) => setStoreForm((prev) => ({ ...prev, lng: e.target.value }))}
							/>
							<TextField
								label="緯度"
								fullWidth
								value={storeForm.lat}
								onChange={(e: InputEvent) => setStoreForm((prev) => ({ ...prev, lat: e.target.value }))}
							/>
							</FieldGrid>
						</Box>
						<Button
							variant="contained"
							sx={{ mt: 2 }}
							onClick={handleCreateStoreInternal}
							disabled={actionLoading || !storeForm.name.trim()}
						>
							新增門市
						</Button>
					</Box>
				</Collapse>
				<Divider sx={{ my: 2 }} />
				<Typography variant="subtitle1" fontWeight={700} gutterBottom>
					門市列表
				</Typography>
				{stores.length === 0 ? (
					<Typography color="text.secondary" sx={{ py: 2 }}>
						尚無門市資料
					</Typography>
				) : (
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>門市名稱</TableCell>
									<TableCell>區域</TableCell>
									<TableCell>地址</TableCell>
									<TableCell align="center">狀態</TableCell>
									<TableCell align="center">操作</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{stores.map((store) => (
									<TableRow key={store.storeId} hover>
										<TableCell>
											<Typography fontWeight={600}>{store.name}</Typography>
										</TableCell>
										<TableCell>{store.region}</TableCell>
										<TableCell>
											<Typography variant="body2" color="text.secondary">
												{store.address}
											</Typography>
										</TableCell>
										<TableCell align="center">
											<Chip
												label={store.isActive ? '營業中' : '暫停'}
												color={store.isActive ? 'success' : 'default'}
												size="small"
											/>
										</TableCell>
										<TableCell align="center">
											<FormControlLabel
												control={
													<Switch
														checked={store.isActive}
														onChange={() => handleToggleStoreInternal(store)}
														color="primary"
														size="small"
													/>
												}
												label=""
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</CardContent>
		</Card>
	);

	const promotionCard = (
		<Card>
			<CardContent sx={{ p: { xs: 2, sm: 3 } }}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
					<Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={700}>
						活動管理
					</Typography>
					<Button
						variant="outlined"
						size="small"
						onClick={() => {
							if (promoFormOpen) {
								// 收起時，如果正在編輯，取消編輯狀態
								if (editingPromoId) {
									setPromoForm(createDefaultPromoForm());
									setEditingPromoId(null);
									setExcludedStoreIds([]);
								}
							}
							setPromoFormOpen((prev) => !prev);
						}}
					>
						{promoFormOpen ? '收起' : '新增活動'}
					</Button>
				</Stack>
				<Collapse in={promoFormOpen}>
					<Box sx={{ mb: 2 }}>
						{/* 活動名稱 */}
				<TextField
					label="活動名稱"
					fullWidth
					value={promoForm.title}
					onChange={(e: InputEvent) => setPromoForm((prev) => ({ ...prev, title: e.target.value }))}
				/>
				{/* 活動主題 活動類型 */}
				<Box sx={{ mt: 2 }}>
					<FieldGrid columnsMd={2}>
					<FormControl fullWidth>
						<InputLabel>活動主題</InputLabel>
						<Select
							label="活動主題"
							value={promoForm.eventTag}
							onChange={(e) =>
								setPromoForm((prev) => ({
									...prev,
									eventTag: e.target.value as PromotionRecord['eventTag'],
								}))
							}
						>
							{EVENT_TAG_VALUES.map((tag) => (
								<MenuItem key={tag} value={tag}>
									{EVENT_TAG_META[tag]?.label || tag}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl fullWidth>
						<InputLabel>活動類型</InputLabel>
						<Select
							label="活動類型"
							value={promoForm.promoType}
							onChange={(e) =>
								setPromoForm((prev) => ({
									...prev,
									promoType: e.target.value as PromotionRecord['promoType'],
								}))
							}
						>
							{PROMO_TYPE_VALUES.map((type) => (
								<MenuItem key={type} value={type}>
									{PROMO_TYPE_META[type]?.label || type}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					</FieldGrid>
				</Box>
				{/* 每人限領次數 總名額(可空白) 每日名額(可空白) */}
				<Box sx={{ mt: 2 }}>
					<FieldGrid columnsMd={3}>
						<TextField
							label="每人限領次數 (0 表示不限)"
							type="number"
							fullWidth
							value={promoForm.perUserLimit}
							onChange={(e: InputEvent) =>
								setPromoForm((prev) => ({ ...prev, perUserLimit: Number(e.target.value) }))
							}
						/>
						<TextField
							label="總名額 (可空白)"
							type="number"
							fullWidth
							value={promoForm.globalQuota}
							onChange={(e: InputEvent) => setPromoForm((prev) => ({ ...prev, globalQuota: e.target.value }))}
						/>
						<TextField
							label="每日名額 (可空白)"
							type="number"
							fullWidth
							value={promoForm.dailyQuota}
							onChange={(e: InputEvent) => setPromoForm((prev) => ({ ...prev, dailyQuota: e.target.value }))}
						/>
					</FieldGrid>
				</Box>
				{/* 開始時間 結束時間 */}
				<Box sx={{ mt: 2 }}>
					<FieldGrid columnsMd={2}>
					<TextField
						label="開始時間"
						type="datetime-local"
						fullWidth
						value={promoForm.startDatetime}
						onChange={(e: InputEvent) => setPromoForm((prev) => ({ ...prev, startDatetime: e.target.value }))}
					/>
					<TextField
						label="結束時間"
						type="datetime-local"
						fullWidth
						value={promoForm.endDatetime}
						onChange={(e: InputEvent) => setPromoForm((prev) => ({ ...prev, endDatetime: e.target.value }))}
					/>
					</FieldGrid>
				</Box>
				{/* 活動說明 */}
				<TextField
					label="活動說明"
					fullWidth
					multiline
					minRows={3}
					value={promoForm.description}
					onChange={(e: InputEvent) => setPromoForm((prev) => ({ ...prev, description: e.target.value }))}
					sx={{ mt: 2 }}
				/>
				{/* 注意事項 */}
				<TextField
					label="注意事項"
					fullWidth
					multiline
					minRows={3}
					value={promoForm.stackingRule}
					onChange={(e: InputEvent) => setPromoForm((prev) => ({ ...prev, stackingRule: e.target.value }))}
					sx={{ mt: 2 }}
				/>
				{/* 不適用分店 */}
				<FormControl fullWidth sx={{ mt: 2 }}>
					<InputLabel>不適用分店（可多選）</InputLabel>
					<Select
						multiple
						label="不適用分店（可多選）"
						value={excludedStoreIds}
						onChange={(e) => setExcludedStoreIds(e.target.value as number[])}
						renderValue={(selected) => {
							if (selected.length === 0) return '無';
							const selectedStores = stores.filter((s) => selected.includes(s.storeId));
							return selectedStores.map((s) => s.name).join(', ');
						}}
					>
						{stores.map((store) => (
							<MenuItem key={store.storeId} value={store.storeId}>
								{store.name} - {store.address}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				{/* 不限會員/需會員身分   無需優惠碼/需優惠碼 */}
				<Stack direction="row" spacing={2} sx={{ mt: 2 }}>
					<Chip
						color={promoForm.needMembership ? 'primary' : 'default'}
						label={promoForm.needMembership ? '需會員身分' : '不限會員'}
						onClick={() => setPromoForm((prev) => ({ ...prev, needMembership: !prev.needMembership }))}
					/>
					<Chip
						color={promoForm.needCode ? 'primary' : 'default'}
						label={promoForm.needCode ? '需優惠碼' : '無需優惠碼'}
						onClick={() => setPromoForm((prev) => ({ ...prev, needCode: !prev.needCode }))}
					/>
				</Stack>
						<Button
							variant="contained"
							sx={{ mt: 2 }}
							onClick={handleCreatePromotionInternal}
							disabled={actionLoading || !promoForm.title.trim()}
						>
							{editingPromoId ? '更新草稿' : '新增草稿'}
						</Button>
					</Box>
				</Collapse>
				<Divider sx={{ my: 2 }} />
				<Stack spacing={1.5}>
					{promotions.length === 0 && <Typography color="text.secondary">尚無活動</Typography>}
					{promotions.map((promo) => (
						<Box
							key={promo.promoId}
							sx={{
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: 2,
								p: 2,
							}}
						>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Box>
									<Typography fontWeight={700}>{promo.title}</Typography>
									<Typography variant="body2" color="text.secondary">
										{dayjs(promo.startDatetime).format('MM/DD')} -{' '}
										{dayjs(promo.endDatetime).format('MM/DD')}
									</Typography>
									{promotionExclusions[promo.promoId] && promotionExclusions[promo.promoId].length > 0 && (
										<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
											不適用分店：{promotionExclusions[promo.promoId]
												.map((storeId) => {
													const store = stores.find((s) => s.storeId === storeId);
													return store ? store.name : `門市 ${storeId}`;
												})
												.join(', ')}
										</Typography>
									)}
									<Box sx={{ mt: 1 }}>
										<Chip
											label={promo.status}
											size="small"
											color={
												promo.status === 'Published'
													? 'success'
													: promo.status === 'Draft'
														? 'warning'
														: 'default'
											}
										/>
									</Box>
								</Box>
								<Stack direction="row" spacing={1}>
									<Button size="small" variant="outlined" onClick={() => handleLoadQuota(promo.promoId)}>
										名額
									</Button>
									{promo.status === 'Draft' && (
										<>
											<Button
												size="small"
												variant="outlined"
												onClick={() => handleEditPromotion(promo)}
											>
												編輯
											</Button>
											<Button
												size="small"
												variant="outlined"
												onClick={() => handlePublishPromotion(promo.promoId)}
											>
												發布
											</Button>
										</>
									)}
									{promo.status !== 'Canceled' && (
										<Button size="small" color="error" onClick={() => handleCancelPromotion(promo.promoId)}>
											取消
										</Button>
									)}
								</Stack>
							</Stack>
						</Box>
					))}
				</Stack>
			</CardContent>
		</Card>
	);

	// 名額彈出視窗
	const quotaDialog = quota ? (
		<Dialog open={true} onClose={() => setQuota(null)} maxWidth="md" fullWidth>
			<DialogTitle>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="h6" fontWeight={700}>
						{quota.promotion.title} · 名額使用狀況
					</Typography>
					<IconButton
						aria-label="關閉"
						onClick={() => setQuota(null)}
						sx={{
							position: 'absolute',
							right: 8,
							top: 8,
							color: (theme) => theme.palette.grey[500],
						}}
					>
						×
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mt: 1 }}>
					<Box flex={{ md: 1 }}>
						<Typography variant="subtitle2" fontWeight={600} gutterBottom>
							名額資訊
						</Typography>
						<Stack spacing={1.5} sx={{ mt: 1 }}>
							<Typography>總名額：{quota.stats.globalQuota ?? '不限'}</Typography>
							<Typography>已使用：{quota.stats.totalUsed}</Typography>
							<Typography>
								剩餘：
								{quota.stats.remaining ??
									(quota.stats.globalQuota == null
										? '不限'
										: Math.max(quota.stats.globalQuota - quota.stats.totalUsed, 0))}
							</Typography>
							<Typography>每日名額：{quota.stats.dailyQuota ?? '不限'}</Typography>
						</Stack>
						{(quota.stats.clickCount != null || quota.stats.viewCount != null) && (
							<>
								<Divider sx={{ my: 2 }} />
								<Typography variant="subtitle2" fontWeight={600} gutterBottom>
									互動統計
								</Typography>
								<Stack spacing={1.5} sx={{ mt: 1 }}>
									<Typography>點擊次數：{quota.stats.clickCount ?? 0}</Typography>
									<Typography>瀏覽次數：{quota.stats.viewCount ?? 0}</Typography>
									{quota.stats.viewCount != null && quota.stats.viewCount > 0 && (
										<Typography variant="body2" color="text.secondary">
											轉換率：{quota.stats.totalUsed > 0 ? ((quota.stats.totalUsed / quota.stats.viewCount) * 100).toFixed(1) : 0}%
										</Typography>
									)}
								</Stack>
							</>
						)}
					</Box>
					<Box flex={{ md: 1.5 }}>
						<Typography variant="subtitle2" fontWeight={600} gutterBottom>
							最近 30 天使用量
						</Typography>
						<Box
							sx={{
								maxHeight: 400,
								overflowY: 'auto',
								mt: 1,
								pr: 1,
							}}
						>
							<Stack spacing={0.5}>
								{quota.stats.daily.length === 0 && (
									<Typography color="text.secondary" sx={{ py: 2 }}>
										尚無使用紀錄
									</Typography>
								)}
								{quota.stats.daily.map((entry) => (
									<Box
										key={entry.date}
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											py: 0.5,
											px: 1,
											borderRadius: 1,
											'&:hover': {
												backgroundColor: 'action.hover',
											},
										}}
									>
										<Typography variant="body2">{entry.date}</Typography>
										<Typography variant="body2" fontWeight={600}>
											{entry.count}
										</Typography>
									</Box>
								))}
							</Stack>
						</Box>
					</Box>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => setQuota(null)}>關閉</Button>
			</DialogActions>
		</Dialog>
	) : null;

	if (!isAdmin) {
		return (
			<Box sx={{ px: { xs: 2, md: 4 }, py: 6 }}>
				<Typography variant="h5" fontWeight={800} gutterBottom>
					品牌管理僅限 Admin 使用
				</Typography>
				<Typography color="text.secondary">
					若你是品牌方管理者，請先登入並由你的後台帳號啟用 Admin 權限或完成品牌註冊流程。
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 3 } }}>
			<Stack spacing={{ xs: 2, sm: 3 }}>
				<Box>
					<Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={800}>
						品牌管理後台
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						{selectedBrandMeta
							? `目前管理品牌：${selectedBrandMeta.displayName}`
							: selectedBrand
								? `目前管理品牌：${selectedBrand}`
								: '尚未選擇品牌'}
					</Typography>
				</Box>

				{error && <Alert severity="error">{error}</Alert>}

				{brandOverviewCard}

				{initializing && (
					<Box sx={{ display: 'flex', justifyContent: 'center' }}>
						<CircularProgress />
					</Box>
				)}

				{showBrandSetup ? (
					brandCard
				) : (
					<>
						<Tabs
							value={currentTab}
							onChange={(_, v) => setCurrentTab(v)}
							variant={isMobile ? 'scrollable' : 'standard'}
							scrollButtons={isMobile ? 'auto' : false}
							sx={{
								borderBottom: 1,
								borderColor: 'divider',
								'& .MuiTab-root': {
									minWidth: isMobile ? 80 : 'auto',
									fontSize: isMobile ? '0.875rem' : '1rem',
									padding: isMobile ? '12px 16px' : '16px 24px',
								},
							}}
						>
							<Tab label="總覽" />
							<Tab label="基本資料" />
							<Tab label="門市管理" />
							<Tab label="活動管理" />
						</Tabs>
						<Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
							{currentTab === 0 && analysisCard}
							{currentTab === 1 && brandCard}
							{currentTab === 2 && storeCard}
							{currentTab === 3 && promotionCard}
						</Box>
					</>
				)}
			</Stack>
			{quotaDialog}
		</Box>
	);
}


