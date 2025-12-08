import React from 'react';
import {
	Box,
	Stack,
	Typography,
	Chip,
	Card,
	CardContent,
	Button,
	Avatar,
	Divider,
	TextField,
	InputAdornment,
	IconButton,
	LinearProgress,
	Snackbar,
	Alert,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import LoyaltyRoundedIcon from '@mui/icons-material/LoyaltyRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { getBrandMeta } from '../config/brands';
import { EVENT_TAG_META, PROMO_TYPE_META } from '../config/promotionMeta';
import { usePromotionFavorites } from '../store/usePromotionFavorites';
import { usePromotionUsage } from '../store/usePromotionUsage';
import { useAuth } from '../store/useAuth';
import { useBrandFollow } from '../store/useBrandFollow';
import { trackUserBehavior } from '../lib/trackingApi';
import type { StoreRecord } from '../types/promo';
import { alpha } from '@mui/material/styles';

function StoreList({
	title,
	stores,
	search,
	onSearchChange,
	emptyText,
}: {
	title: string;
	stores: StoreRecord[];
	search: string;
	onSearchChange: (value: string) => void;
	emptyText: string;
}) {
	const filtered = React.useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return stores;
		return stores.filter(
			(store) =>
				store.name.toLowerCase().includes(q) ||
				(store.address || '').toLowerCase().includes(q) ||
				(store.region || '').toLowerCase().includes(q),
		);
	}, [stores, search]);

	return (
		<Card>
			<CardContent>
				<Stack spacing={2}>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
						<Typography variant="h6" fontWeight={700}>
							{title} · {stores.length} 間
						</Typography>
						<Box flex={1} />
						<TextField
							value={search}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder="搜尋門市 / 地址"
							size="small"
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<MapRoundedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
							sx={{ width: { xs: '100%', sm: 240 } }}
						/>
					</Stack>
					{filtered.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							{emptyText}
						</Typography>
					) : (
						<Stack spacing={1.2}>
							{filtered.map((store) => (
								<Box key={store.storeId} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.25 }}>
									<Typography fontWeight={700}>{store.name}</Typography>
									<Typography variant="body2" color="text.secondary">
										{store.address || '地址未提供'}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{store.region || '地區未提供'}
									</Typography>
								</Box>
							))}
						</Stack>
					)}
				</Stack>
			</CardContent>
		</Card>
	);
}

export default function PromotionDetailPage() {
	const { promoId } = useParams();
	const navigate = useNavigate();
	const { promotionIdToPromotion, storesByBrand, exclusions, brandMetaByKey } = useData();
	const { token } = useAuth();
	const favorites = usePromotionFavorites((state) =>
		state.mode === 'user' ? state.userFavorites : state.guestFavorites,
	);
	const toggleFavorite = usePromotionFavorites((state) => state.toggleFavorite);
	const usageMode = usePromotionUsage((state) => state.mode);
	const usageMap = usePromotionUsage((state) =>
		state.mode === 'user' ? state.userUsage : state.guestUsage,
	);
	const markUsage = usePromotionUsage((state) => state.markUsed);
	const resetUsage = usePromotionUsage((state) => state.resetUsage);
	const brandFollows = useBrandFollow((state) =>
		state.mode === 'user' ? state.userFollows : state.guestFollows,
	);
	const toggleBrandFollow = useBrandFollow((state) => state.toggleFollow);
	const brandFollowLoading = useBrandFollow((state) => state.loading);
	const promotion = promoId ? promotionIdToPromotion.get(Number(promoId)) : undefined;

	// 所有 hooks 必須在早期返回之前調用
	const [appSearch, setAppSearch] = React.useState('');
	const [exSearch, setExSearch] = React.useState('');

	const stackingRules = React.useMemo(() => {
		if (!promotion || !promotion.stackingRule) return [];
		
		// stacking_rule 是文字欄位，可以包含多行文字
		let raw = String(promotion.stackingRule).trim();
		if (!raw) return [];
		
		// 如果內容是 "Cannot_Stack"，轉換為中文說明
		if (raw === 'Cannot_Stack') {
			raw = '不得與其他優惠併用';
		}

		// 規則 1: 優先按換行符分割
		const linesByNewline = raw.split(/\n/).map((line) => line.trim()).filter((line) => line.length > 0);
		if (linesByNewline.length > 1) {
			// 如果已經有換行，檢查每一行是否還有編號需要進一步分割
			const result: string[] = [];
			for (const line of linesByNewline) {
				// 檢查這一行是否包含多個編號（如 "1.xxx 2.yyy"）
				// 匹配模式：在 "數字 + 點 + 空格" 或 "數字 + 點 + 中文字符" 前分割
				const numberedParts = line
					.split(/(?=\d+\.(?:\s|[\u4e00-\u9fa5]))/) // 在編號前分割
					.map((part) => part.trim())
					.filter((part) => part.length > 0);
				
				if (numberedParts.length > 1) {
					// 驗證是否真的包含編號（以數字+點開頭）
					const validParts = numberedParts.filter((part) => /^\d+\./.test(part));
					if (validParts.length > 1) {
						result.push(...validParts);
					} else {
						result.push(line);
					}
				} else {
					result.push(line);
				}
			}
			return result;
		}

		// 規則 2: 如果沒有換行符，嘗試按編號分割（支援 1. 2. 3. 等格式）
		// 匹配模式：在 "數字 + 點 + 空格" 或 "數字 + 點 + 中文字符" 前分割
		const numberedParts = raw
			.split(/(?=\d+\.(?:\s|[\u4e00-\u9fa5]))/) // 在編號前分割
			.map((part) => part.trim())
			.filter((part) => part.length > 0);
		
		if (numberedParts.length > 1) {
			// 驗證分割結果是否真的包含編號（以數字+點開頭）
			const validParts = numberedParts.filter((part) => /^\d+\./.test(part));
			if (validParts.length > 1) {
				// 保留編號，直接返回分割後的結果
				return validParts;
			}
		}

		// 規則 3: 嘗試按句號分割（中文句號、全形句號、英文句號）
		const sentenceParts = raw
			.split(/(?<=[。．\.])\s*/u) // 在句號後分割
			.map((part) => part.trim())
			.filter((part) => part.length > 0);
		
		if (sentenceParts.length > 1) {
			return sentenceParts;
		}

		// 規則 4: 如果都沒有，直接返回完整內容
		return [raw];
	}, [promotion?.stackingRule]);

	React.useEffect(() => {
		if (!promotion) {
			// 如果查無活動，導回首頁
			const timer = setTimeout(() => navigate('/', { replace: true }), 2500);
			return () => clearTimeout(timer);
		}
		// 追蹤瀏覽行為
		void trackUserBehavior(token, {
			action: 'view_promo',
			promo_id: promotion.promoId.toString(),
			brand_name: promotion.brandName,
			tags: promotion.eventTag ? [promotion.eventTag] : null,
		});
	}, [promotion, navigate, token]);

	if (!promotion) {
		return (
			<Box sx={{ px: 2, py: 6, textAlign: 'center' }}>
				<Typography variant="h6" fontWeight={700}>
					找不到這個活動
				</Typography>
				<Typography variant="body2" color="text.secondary">
					活動可能已下架或網址輸入錯誤，即將帶你回首頁。
				</Typography>
			</Box>
		);
	}

	const brandKey = promotion.brandName.trim().toLowerCase();
	const brand = brandMetaByKey.get(brandKey) ?? getBrandMeta(promotion.brandName);
	const accentColor = brand.secondaryColor || brand.primaryColor;
	const eventMeta = EVENT_TAG_META[promotion.eventTag] ?? EVENT_TAG_META.Other;
	const typeMeta = PROMO_TYPE_META[promotion.promoType] ?? PROMO_TYPE_META.Other;
	const isBrandFollowed = brandFollows.some((name) => name.trim().toLowerCase() === brandKey);

	const brandStores = storesByBrand.get(brandKey) ?? [];
	const excludedSet = new Set(
		exclusions.filter((ex) => ex.promoId === promotion.promoId).map((ex) => ex.storeId),
	);
	const applicableStores = brandStores.filter((store) => !excludedSet.has(store.storeId));
	const excludedStores = brandStores.filter((store) => excludedSet.has(store.storeId));

	const isFavorite = favorites.includes(promotion.promoId);
	const usageEntry = usageMap[promotion.promoId];
	const usageCount = usageEntry?.count ?? 0;
	const lastUsedDisplay = usageEntry?.lastUsed ? dayjs(usageEntry.lastUsed).format('YYYY/MM/DD HH:mm') : null;
	const perUserLimit = promotion.perUserLimit;
	const usageLimitReached = perUserLimit > 0 && usageCount >= perUserLimit;

	const now = dayjs();
	const startTime = dayjs(promotion.startDatetime);
	const endTime = dayjs(promotion.endDatetime);
	const endYear = endTime.year();
	const isActive = now.isAfter(startTime) && now.isBefore(endTime);
	const hasNotStarted = now.isBefore(startTime);
	const daysLeft = Math.max(endTime.diff(now, 'day'), 0);
	const isIndefinite = endYear > 2100; // 結束日期年份 > 2100 表示無限期
	
	const urgencyLabel = hasNotStarted
		? `將於 ${startTime.format('MM/DD HH:mm')} 開始`
		: isActive
			? isIndefinite
				? '長期活動 · 無截止日期'
				: daysLeft <= 0
					? '最後一天 · 把握時間'
					: `倒數 ${daysLeft} 天 · ${endTime.format('MM/DD HH:mm')} 截止`
			: isIndefinite
				? '長期活動 · 無截止日期'
				: `活動已於 ${endTime.format('MM/DD HH:mm')} 結束`;

	const [showAuthAlert, setShowAuthAlert] = React.useState(false);

	const handleMarkUsed = () => {
		if (!token) {
			setShowAuthAlert(true);
			setTimeout(() => navigate('/auth'), 1500);
			return;
		}
		if (usageLimitReached) return;
		void markUsage(promotion.promoId, token);
	};

	const handleToggleFavorite = () => {
		if (!token) {
			setShowAuthAlert(true);
			setTimeout(() => navigate('/auth'), 1500);
			return;
		}
		void toggleFavorite(promotion.promoId, token);
	};

	const handleToggleBrandFollow = () => {
		if (!token) {
			setShowAuthAlert(true);
			setTimeout(() => navigate('/auth'), 1500);
			return;
		}
		void toggleBrandFollow(promotion.brandName, token);
	};

	const usageProgress = perUserLimit > 0 ? Math.min((usageCount / perUserLimit) * 100, 100) : 0;

	return (
		<Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: { xs: 2, sm: 4 }, pb: { xs: 10, sm: 4 }, bgcolor: '#fafafa', minHeight: '100%' }}>
			<Stack spacing={3}>
				<Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(-1)} sx={{ alignSelf: 'flex-start' }}>
					返回上一頁
				</Button>

				<Card
					sx={{
						position: 'relative',
						overflow: 'hidden',
						color: 'text.primary',
						borderRadius: 2,
						border: 'none',
						boxShadow: `0 24px 60px ${alpha(brand.primaryColor, 0.18)}`,
						background: '#fff',
					}}
				>
					<Box
						sx={{
							position: 'absolute',
							inset: 0,
							background: `radial-gradient(circle at 20% -10%, ${alpha(
								accentColor,
								0.45,
							)} 0%, transparent 45%), radial-gradient(circle at 110% 30%, ${alpha(
								brand.primaryColor,
								0.35,
							)} 0%, transparent 40%)`,
							opacity: 0.35,
							pointerEvents: 'none',
						}}
					/>
					<CardContent sx={{ position: 'relative' }}>
						<Stack spacing={2.75}>
							<Stack
								direction={{ xs: 'column', sm: 'row' }}
								spacing={{ xs: 1.5, sm: 2 }}
								alignItems={{ xs: 'flex-start', sm: 'center' }}
								justifyContent="space-between"
							>
								<Stack direction="row" spacing={1.5} alignItems="center">
									<Avatar src={brand.logo} sx={{ width: 60, height: 60, bgcolor: alpha(brand.primaryColor, 0.12) }}>
										{brand.displayName[0]}
									</Avatar>
									<Box>
										<Typography variant="h5" fontWeight={900}>
											{promotion.title}
										</Typography>
										<Typography variant="body2">{brand.displayName}</Typography>
									</Box>
								</Stack>
								<Button
									variant={isBrandFollowed ? 'contained' : 'outlined'}
									color="secondary"
									startIcon={<LoyaltyRoundedIcon />}
									onClick={handleToggleBrandFollow}
									disabled={Boolean(token) && brandFollowLoading}
									sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}
								>
									{isBrandFollowed ? '已關注品牌' : '關注品牌'}
								</Button>
							</Stack>
							<Stack direction="row" spacing={1} flexWrap="wrap">
								<Chip label={eventMeta.label} sx={{ bgcolor: alpha(eventMeta.color, 0.18), color: eventMeta.color, fontWeight: 700 }} />
								<Chip label={typeMeta.label} variant="outlined" sx={{ borderColor: alpha(brand.primaryColor, 0.4), color: brand.primaryColor }} />
								{promotion.needMembership && <Chip label="需會員" variant="outlined" sx={{ borderColor: alpha(brand.primaryColor, 0.4), color: brand.primaryColor }} />}
								{promotion.needCode && <Chip label="需優惠碼" variant="outlined" sx={{ borderColor: alpha(brand.primaryColor, 0.4), color: brand.primaryColor }} />}
							</Stack>
							<Typography variant="body1" color="text.secondary">
								{promotion.description || '尚未提供活動描述'}
							</Typography>
							<Box
								sx={{
									bgcolor: alpha(accentColor, 0.08),
									borderRadius: 2,
									p: { xs: 1.5, sm: 2 },
									display: 'flex',
									flexDirection: 'column',
									gap: 1.2,
									border: `1px solid ${alpha(accentColor, 0.25)}`,
								}}
							>
								<Stack direction="row" spacing={1} alignItems="center">
									<AccessTimeRoundedIcon fontSize="small" />
									<Typography variant="subtitle2" fontWeight={800}>
										{urgencyLabel}
									</Typography>
								</Stack>
								<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
									<Stack direction="row" spacing={2} alignItems="baseline">
										<Typography variant="h3" fontWeight={900} color={brand.primaryColor} lineHeight={1}>
											{usageCount}
										</Typography>
										<Box>
											<Typography variant="subtitle2" color="text.secondary">
												已使用次數
											</Typography>
											<Typography variant="body2" fontWeight={700}>
												{perUserLimit > 0 ? `剩餘 ${Math.max(perUserLimit - usageCount, 0)} 次` : '無上限'}
											</Typography>
										</Box>
									</Stack>
									{lastUsedDisplay && (
										<Box sx={{ ml: { sm: 'auto' } }}>
											<Typography variant="caption" color="text.secondary">
												最後使用 · {lastUsedDisplay}
											</Typography>
										</Box>
									)}
								</Stack>
								{perUserLimit > 0 ? (
									<>
										<LinearProgress
											variant="determinate"
											value={usageProgress}
											sx={{
												bgcolor: alpha(accentColor, 0.25),
												height: 8,
												borderRadius: 999,
												'& .MuiLinearProgress-bar': { bgcolor: accentColor },
											}}
										/>
										<Stack direction="row" alignItems="center" justifyContent="space-between">
											<Typography variant="body2" fontWeight={700}>
												已使用 {usageCount} / {perUserLimit} 次
											</Typography>
											{usageCount > 0 && usageMode === 'guest' && (
												<Button
													variant="text"
													size="small"
													color="inherit"
													startIcon={<RestartAltRoundedIcon fontSize="small" />}
													onClick={() => {
														if (!token) {
															setShowAuthAlert(true);
															setTimeout(() => navigate('/auth'), 1500);
															return;
														}
														resetUsage(promotion.promoId);
													}}
												>
													重置記錄
												</Button>
											)}
										</Stack>
									</>
								) : (
									<Typography variant="body2">已使用 {usageCount} 次 · 無上限</Typography>
								)}
							</Box>
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
								<Button
									variant="contained"
									color="secondary"
									startIcon={<CheckCircleRoundedIcon />}
									onClick={handleMarkUsed}
									disabled={usageLimitReached}
									sx={{ fontWeight: 700 }}
								>
									{usageLimitReached ? '已達使用上限' : '我已使用一次'}
								</Button>
								<Button
									variant={isFavorite ? 'outlined' : 'contained'}
									color="inherit"
									startIcon={isFavorite ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
									onClick={handleToggleFavorite}
									sx={{ bgcolor: isFavorite ? 'transparent' : 'rgba(255,255,255,0.14)' }}
								>
									{isFavorite ? '已收藏' : '收藏這個優惠'}
								</Button>
							</Stack>
						</Stack>
					</CardContent>
				</Card>

				<Card>
					<CardContent>
						<Stack spacing={1.5}>
							<Typography variant="h6" fontWeight={700}>
								活動資訊
							</Typography>
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
								<Box sx={{ flex: 1 }}>
									<Typography variant="subtitle2" color="text.secondary">
										期間
									</Typography>
									<Typography fontWeight={700}>
										{(() => {
											const startYear = dayjs(promotion.startDatetime).year();
											const endYear = dayjs(promotion.endDatetime).year();
											
											// 如果起始日期年份小於 2000，只顯示結束日期，格式為 "~ 結束日期"
											if (startYear < 2000) {
												const endStr = dayjs(promotion.endDatetime).format('YYYY/MM/DD HH:mm');
												return `~ ${endStr}`;
											}
											
											// 如果結束日期年份大於 2100，只顯示起始日期，格式為 "起始日期 起"
											if (endYear > 2100) {
												const startStr = dayjs(promotion.startDatetime).format('YYYY/MM/DD HH:mm');
												return `${startStr} 起`;
											}
											
											// 正常情況：顯示完整日期範圍
											const startStr = dayjs(promotion.startDatetime).format('YYYY/MM/DD HH:mm');
											const endStr = dayjs(promotion.endDatetime).format('YYYY/MM/DD HH:mm');
											return `${startStr} - ${endStr}`;
										})()}
									</Typography>
								</Box>
								<Box sx={{ flex: 1 }}>
									<Typography variant="subtitle2" color="text.secondary">
										每人/總量
									</Typography>
									<Typography fontWeight={700}>
										{promotion.perUserLimit > 0 ? `每人 ${promotion.perUserLimit} 次` : '不限次數'} ·{' '}
										{promotion.globalQuota ? `共 ${promotion.globalQuota}` : '不限名額'}
										{promotion.dailyQuota ? ` / 每日 ${promotion.dailyQuota}` : ''}
									</Typography>
								</Box>
								<Box sx={{ flex: 1 }}>
									<Typography variant="subtitle2" color="text.secondary">
										堆疊規則
									</Typography>
									<Typography fontWeight={700}>
										{stackingRules.length ? `共 ${stackingRules.length} 條` : '未註明'}
									</Typography>
								</Box>
							</Stack>
							<Divider />
							<Stack direction="row" spacing={1} flexWrap="wrap">
								<Chip icon={<LocalOfferRoundedIcon />} label={typeMeta.label} />
								{promotion.perUserLimit > 0 && (
									<Chip icon={<LoyaltyRoundedIcon />} label={`每人 ${promotion.perUserLimit} 次`} />
								)}
								{promotion.needMembership && <Chip label="需會員身份" />}
								{promotion.needCode && <Chip label="需輸入優惠碼" />}
							</Stack>
						</Stack>
					</CardContent>
				</Card>

				{stackingRules.length > 0 && (
					<Card sx={{ width: '100%', maxWidth: '100%' }}>
						<CardContent sx={{ width: '100%', maxWidth: '100%', overflow: 'visible' }}>
							<Stack spacing={1.5} sx={{ width: '100%' }}>
								<Typography variant="h6" fontWeight={700}>
									注意事項
								</Typography>
								<Stack spacing={1.2} sx={{ width: '100%' }}>
									{stackingRules.length === 0 ? (
										<Typography variant="body2" color="text.secondary">
											未提供注意事項
										</Typography>
									) : (
										stackingRules.map((rule, idx) => {
											// 如果規則已經以編號開頭（如 "1. " 或 "1.本活動"），移除原本的編號
											const cleanedRule = rule.replace(/^\d+\.\s*/, '').trim();
											return (
												<Stack key={`rule-${idx}`} direction="row" spacing={1.25} alignItems="flex-start" sx={{ width: '100%' }}>
													<Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 26, flexShrink: 0 }}>
														{idx + 1}.
													</Typography>
													<Box sx={{ flex: 1, minWidth: 0, width: '100%', maxWidth: '100%' }}>
														<Typography
															variant="body2"
															component="div"
															sx={{
																whiteSpace: 'pre-wrap',
																wordBreak: 'break-word',
																overflowWrap: 'anywhere',
																overflow: 'visible',
																width: '100%',
																maxWidth: '100%',
																display: 'block',
															}}
														>
															{cleanedRule}
														</Typography>
													</Box>
												</Stack>
											);
										})
									)}
								</Stack>
							</Stack>
						</CardContent>
					</Card>
				)}

				<StoreList
					title="適用門市"
					stores={applicableStores}
					search={appSearch}
					onSearchChange={setAppSearch}
					emptyText="此活動目前沒有可用門市。"
				/>

				{excludedStores.length > 0 && (
					<StoreList
						title="不適用門市"
						stores={excludedStores}
						search={exSearch}
						onSearchChange={setExSearch}
						emptyText="沒有標記不適用的門市。"
					/>
				)}
			</Stack>
			<Snackbar
				open={showAuthAlert}
				autoHideDuration={1500}
				onClose={() => setShowAuthAlert(false)}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
			>
				<Alert severity="info" onClose={() => setShowAuthAlert(false)}>
					請先登入以使用此功能
				</Alert>
			</Snackbar>
		</Box>
	);
}

