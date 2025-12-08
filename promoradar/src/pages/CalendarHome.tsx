import React from 'react';
import {
	Box,
	Stack,
	Typography,
	Card,
	CardContent,
	Chip,
	TextField,
	InputAdornment,
	IconButton,
	ToggleButtonGroup,
	ToggleButton,
	Button,
	Divider,
	SwipeableDrawer,
	Fade,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useData } from '../context/DataContext';
import { usePromotionFilters, type PromotionSortOption } from '../store/usePromotionFilters';
import { EVENT_TAG_META, PROMO_TYPE_META } from '../config/promotionMeta';
import { getBrandMeta } from '../config/brands';
import { EVENT_TAG_VALUES, PROMO_TYPE_VALUES, type PromotionRecord, type EventTag, type PromoType, type BrandMeta } from '../types/promo';
import { useFilteredPromotions } from '../hooks/useFilteredPromotions';
import { useNavigate } from 'react-router-dom';
import PromotionCard from '../components/PromotionCard';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SwipeRoundedIcon from '@mui/icons-material/SwipeRounded';

dayjs.extend(relativeTime);

const MAX_EVENT_TAG_CHIPS = 6;

type FilterControlsProps = {
	search: string;
	setSearch: (value: string) => void;
	eventTags: EventTag[];
	toggleEventTag: (tag: EventTag) => void;
	brandKeys: string[];
	brandList: BrandMeta[];
	toggleBrand: (key: string) => void;
	promoTypes: PromoType[];
	togglePromoType: (type: PromoType) => void;
	sortBy: PromotionSortOption;
	setSortBy: (value: PromotionSortOption) => void;
	onlyActive: boolean;
	setOnlyActive: (value: boolean) => void;
	needMembership?: boolean;
	setNeedMembership: (value: boolean | undefined) => void;
};

type MuiIconColor = 'inherit' | 'primary' | 'secondary' | 'action' | 'disabled' | 'error' | 'info' | 'success' | 'warning';

type SummaryCardConfig = {
	id: string;
	value: number;
	label: string;
	Icon: React.ElementType;
	iconColor: MuiIconColor;
};

type PromoCarouselSectionProps = {
	id: string;
	title: string;
	description: string;
	items: PromotionRecord[];
	now: dayjs.Dayjs;
	onOpen: (promoId: number) => void;
	onViewAll: () => void;
	showSwipeTip?: boolean;
	onInteract?: () => void;
	edgeToEdge?: boolean;
};

function FilterControls({
	search,
	setSearch,
	eventTags,
	toggleEventTag,
	brandKeys,
	brandList,
	toggleBrand,
	promoTypes,
	togglePromoType,
	sortBy,
	setSortBy,
	onlyActive,
	setOnlyActive,
	needMembership,
	setNeedMembership,
}: FilterControlsProps) {
	return (
		<Stack spacing={2}>
			<TextField
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder="搜尋活動或品牌"
				fullWidth
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<SearchRoundedIcon />
						</InputAdornment>
					),
					endAdornment: search ? (
						<InputAdornment position="end">
							<IconButton size="small" onClick={() => setSearch('')}>
								<ClearRoundedIcon fontSize="small" />
							</IconButton>
						</InputAdornment>
					) : undefined,
				}}
			/>

			<Stack spacing={1.5}>
				<Typography variant="subtitle2" color="text.secondary">
					熱門主題
				</Typography>
				<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
					{EVENT_TAG_VALUES.slice(0, MAX_EVENT_TAG_CHIPS).map((tag) => {
						const meta = EVENT_TAG_META[tag];
						const selected = eventTags.includes(tag);
						return (
							<Chip
								key={tag}
								label={meta.label}
								onClick={() => toggleEventTag(tag)}
								variant={selected ? 'filled' : 'outlined'}
								sx={{
									bgcolor: selected ? meta.color : undefined,
									color: selected ? '#fff' : meta.color,
									borderColor: meta.color,
								}}
							/>
						);
					})}
				</Stack>
			</Stack>

			<Stack spacing={1.5}>
				<Typography variant="subtitle2" color="text.secondary">
					品牌
				</Typography>
				<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
					{brandList.map((meta) => {
						const selected = brandKeys.includes(meta.key);
						return (
							<Chip
								key={meta.key}
								label={meta.displayName}
								onClick={() => toggleBrand(meta.key)}
								variant={selected ? 'filled' : 'outlined'}
								sx={{
									bgcolor: selected ? meta.primaryColor : undefined,
									color: selected ? '#fff' : meta.primaryColor,
									borderColor: meta.primaryColor,
								}}
							/>
						);
					})}
				</Stack>
			</Stack>

			<Stack spacing={1.5}>
				<Typography variant="subtitle2" color="text.secondary">
					活動類型
				</Typography>
				<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
					{PROMO_TYPE_VALUES.map((type) => {
						const meta = PROMO_TYPE_META[type];
						const selected = promoTypes.includes(type);
						return (
							<Chip
								key={type}
								label={meta.label}
								onClick={() => togglePromoType(type)}
								variant={selected ? 'filled' : 'outlined'}
								sx={{
									bgcolor: selected ? meta.color : undefined,
									color: selected ? '#fff' : meta.color,
									borderColor: meta.color,
								}}
							/>
						);
					})}
				</Stack>
			</Stack>

			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
				<ToggleButtonGroup color="primary" value={sortBy} exclusive onChange={(_, value) => value && setSortBy(value)} size="small">
					<ToggleButton value="soonest_end">即將結束</ToggleButton>
					<ToggleButton value="newest">最新上架</ToggleButton>
					<ToggleButton value="brand">品牌排序</ToggleButton>
				</ToggleButtonGroup>
				<Stack direction="row" spacing={1}>
					<Chip label="只看進行中" variant={onlyActive ? 'filled' : 'outlined'} onClick={() => setOnlyActive(!onlyActive)} />
					<Chip
						label={needMembership ? '只看需會員' : '顯示全部'}
						variant={needMembership ? 'filled' : 'outlined'}
						onClick={() => setNeedMembership(needMembership ? undefined : true)}
					/>
				</Stack>
			</Stack>
		</Stack>
	);
}

function SummaryStatCard({ value, label, Icon, iconColor, dense = false }: SummaryCardConfig & { dense?: boolean }) {
	return (
		<Card sx={{ flex: 1, height: '100%' }}>
			<CardContent sx={{ pt: dense ? 1.1 : 2, pb: dense ? 0.2 : 2, px: dense ? 1.25 : 2 }}>
				<Stack direction="row" spacing={dense ? 1 : 2} alignItems="center">
					<Icon color={iconColor} sx={{ fontSize: dense ? 26 : 32 }} />
					<Box>
						<Typography variant={dense ? 'h6' : 'h4'} fontWeight={800}>
							{value}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{label}
						</Typography>
					</Box>
				</Stack>
			</CardContent>
		</Card>
	);
}

function PromoCarouselSection({ id, title, description, items, now, onOpen, onViewAll, showSwipeTip, onInteract, edgeToEdge }: PromoCarouselSectionProps) {
	if (!items.length) return null;
	const containerPadding = edgeToEdge ? { xs: 0, sm: 0 } : { xs: 1.5, sm: 0 };
	const titlePadding = edgeToEdge ? { xs: 2, sm: 0 } : 0;
	return (
		<Box key={id} sx={{ px: containerPadding }}>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="flex-start"
				mb={0.75}
				spacing={1}
				sx={{ px: titlePadding }}
			>
				<Box>
					<Typography variant="h6" fontWeight={800}>
						{title}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{description}
					</Typography>
				</Box>
				<Button size="small" onClick={onViewAll}>
					查看全部
				</Button>
			</Stack>
			<Fade in={Boolean(showSwipeTip)} timeout={{ enter: 300, exit: 200 }} unmountOnExit>
				<Stack
					direction="row"
					spacing={0.5}
					alignItems="center"
					sx={{ color: 'text.secondary', mb: 0.5, pointerEvents: 'none', px: titlePadding }}
				>
					<SwipeRoundedIcon fontSize="inherit" />
					<Typography variant="caption">左右滑動查看更多</Typography>
				</Stack>
			</Fade>
			<Box
				sx={{
					display: 'flex',
					gap: 1.25,
					overflowX: 'auto',
					pb: 1,
					scrollSnapType: 'x mandatory',
					scrollPadding: edgeToEdge ? '0 1.5rem' : 0,
					'&::-webkit-scrollbar': { display: 'none' },
					px: edgeToEdge ? { xs: 0, sm: 0.5 } : 0.5,
				}}
				onScroll={onInteract ? (() => onInteract()) : undefined}
				onTouchStart={onInteract ? (() => onInteract()) : undefined}
				onMouseDown={onInteract ? (() => onInteract()) : undefined}
			>
				{items.map((promo, index) => (
					<Box
						key={`${id}-${promo.promoId}`}
						sx={{
							minWidth: '66vw',
							maxWidth: 280,
							flex: '0 0 auto',
							scrollSnapAlign: 'start',
							ml: edgeToEdge && index === 0 ? { xs: 1.5, sm: 0 } : 0,
							mr: edgeToEdge && index === items.length - 1 ? { xs: 1.5, sm: 0 } : 0,
						}}
					>
						<PromotionCard promo={promo} now={now} onOpen={onOpen} size="compact" />
					</Box>
				))}
			</Box>
		</Box>
	);
}

export default function CalendarHomePage() {
	const navigate = useNavigate();
	const { promotions, stores, brandMetaByKey } = useData();
	const { filtered, filters, now } = useFilteredPromotions(promotions);
	const {
		search,
		setSearch,
		eventTags,
		toggleEventTag,
		setSortBy,
		sortBy,
		onlyActive,
		setOnlyActive,
		reset,
		brandKeys,
		toggleBrand,
		promoTypes,
		togglePromoType,
		needMembership,
		setNeedMembership,
	} = usePromotionFilters();

	const totalActive = promotions.filter((promo) => {
		const start = dayjs(promo.startDatetime);
		const end = dayjs(promo.endDatetime);
		return now.isAfter(start) && now.isBefore(end);
	}).length;
	const totalUpcoming = promotions.filter((promo) => dayjs(promo.startDatetime).isAfter(now)).length;

	const handleOpenPromo = React.useCallback(
		(id: number) => {
			navigate(`/promotions/${id}`);
		},
		[navigate],
	);
	const allListRef = React.useRef<HTMLDivElement | null>(null);
	const scrollToAll = React.useCallback(() => {
		allListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}, []);

	const expiringSoonAll = React.useMemo(
		() =>
			filtered.filter((promo) => {
				const end = dayjs(promo.endDatetime);
				return end.isAfter(now) && end.diff(now, 'day') <= 10;
			}),
		[filtered, now],
	);
	const upcomingSoonAll = React.useMemo(
		() =>
			filtered.filter((promo) => {
				const start = dayjs(promo.startDatetime);
				return start.isAfter(now) && start.diff(now, 'day') <= 14;
			}),
		[filtered, now],
	);
	const membershipPromosAll = React.useMemo(() => filtered.filter((promo) => promo.needMembership), [filtered]);
	const limitedSpotlightAll = React.useMemo(
		() => filtered.filter((promo) => promo.promoType === 'Limited_Offer' || promo.eventTag === 'Limited_Time'),
		[filtered],
	);
	const christmasPromosAll = React.useMemo(
		() => filtered.filter((promo) => promo.eventTag === 'Christmas'),
		[filtered],
	);
	const expiringSoonPreview = expiringSoonAll.slice(0, 4);
	const mobileShowcaseSections = React.useMemo(
		() =>
			[
				{
					id: 'expiring',
					title: '最後衝刺',
					description: '即將結束的優惠，把握最後幾天。',
					items: expiringSoonAll.slice(0, 8),
				},
				{
					id: 'christmas',
					title: '聖誕節',
					description: '聖誕節相關的優惠活動。',
					items: christmasPromosAll.slice(0, 8),
				},
				{
					id: 'upcoming',
					title: '即將開跑',
					description: '先收藏起來，到時間就提醒自己。',
					items: upcomingSoonAll.slice(0, 8),
				},
				{
					id: 'member',
					title: '會員限定',
					description: '會員或 App 專屬活動，享受加碼好康。',
					items: membershipPromosAll.slice(0, 8),
				},
				{
					id: 'limited',
					title: '限量/限定',
					description: '限時、限量或限定門市的特色活動。',
					items: limitedSpotlightAll.slice(0, 8),
				},
			].filter((section) => section.items.length > 0),
		[expiringSoonAll, christmasPromosAll, upcomingSoonAll, membershipPromosAll, limitedSpotlightAll],
	);

	const brandList = React.useMemo(() => {
		const entries = new Map<string, string>();
		for (const promo of promotions) {
			const key = promo.brandName.trim().toLowerCase();
			if (!entries.has(key)) entries.set(key, promo.brandName);
		}
		return Array.from(entries.entries())
			.map(([key, originalName]) => brandMetaByKey.get(key) ?? getBrandMeta(originalName || key))
			.sort((a, b) => a.displayName.localeCompare(b.displayName));
	}, [promotions, brandMetaByKey]);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [filterDrawerOpen, setFilterDrawerOpen] = React.useState(false);
	const [showSwipeTip, setShowSwipeTip] = React.useState(true);

	React.useEffect(() => {
		if (!isMobile) {
			setShowSwipeTip(false);
			return;
		}
		setShowSwipeTip(true);
		const timer = window.setTimeout(() => {
			setShowSwipeTip(false);
		}, 4000);
		return () => window.clearTimeout(timer);
	}, [isMobile]);

	const dismissSwipeTip = React.useCallback(() => {
		setShowSwipeTip(false);
	}, []);
	const summaryCards: SummaryCardConfig[] = React.useMemo(
		() => [
			{ id: 'active', value: totalActive, label: '進行中活動', Icon: TodayRoundedIcon, iconColor: 'primary' },
			{ id: 'upcoming', value: totalUpcoming, label: '即將開跑', Icon: AccessTimeRoundedIcon, iconColor: 'warning' },
			{ id: 'stores', value: stores.length, label: '參與門市', Icon: LocalOfferRoundedIcon, iconColor: 'success' },
			{ id: 'filtered', value: filtered.length, label: '符合篩選', Icon: StarRoundedIcon, iconColor: 'secondary' },
		],
		[totalActive, totalUpcoming, stores.length, filtered.length],
	);

	const filterSummary = React.useMemo(() => {
		const segments = [];
		segments.push(brandKeys.length ? `${brandKeys.length} 品牌` : '全部品牌');
		if (eventTags.length) segments.push(`${eventTags.length} 主題`);
		if (promoTypes.length) segments.push(`${promoTypes.length} 類型`);
		return `目前篩選 · ${segments.join(' · ')}`;
	}, [brandKeys, eventTags, promoTypes]);

	return (
		<Box sx={{ px: { xs: 0, sm: 2.5 }, py: { xs: 1.5, sm: 3.5 }, pb: { xs: 10, sm: 3.5 }, bgcolor: '#fafafa', minHeight: '100%' }}>
			<Stack spacing={2.5}>
				<Box sx={{ px: { xs: 1.5, sm: 0 } }}>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
						{isMobile ? (
							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
									gap: 1.5,
									width: '100%',
								}}
							>
								{summaryCards.map((card) => (
									<Box key={card.id}>
										<SummaryStatCard {...card} dense />
									</Box>
								))}
							</Box>
						) : (
							<Stack direction="row" spacing={2} sx={{ flex: 1 }}>
								{summaryCards.map((card) => (
									<SummaryStatCard key={card.id} {...card} />
								))}
							</Stack>
						)}
					</Stack>
				</Box>

				<Box sx={{ px: { xs: 1.5, sm: 0 } }}>
					<Card>
						<CardContent
							sx={{
								pb: isMobile ? 1.25 : 2.5,
								'&:last-child': { pb: isMobile ? 1.25 : 2.5 },
							}}
						>
						{isMobile ? (
							<>
								<Button
									variant="outlined"
									startIcon={<FilterListRoundedIcon />}
									onClick={() => setFilterDrawerOpen(true)}
									fullWidth
								>
									開啟篩選
								</Button>
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ mt: 0.75, display: 'block', textAlign: 'center', width: '100%' }}
								>
									{filterSummary}
								</Typography>
								<SwipeableDrawer
									anchor="bottom"
									open={filterDrawerOpen}
									onClose={() => setFilterDrawerOpen(false)}
									onOpen={() => setFilterDrawerOpen(true)}
									disableSwipeToOpen={true}
									PaperProps={{ sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24 } }}
								>
									<Box sx={{ p: 2, maxHeight: '80vh', overflow: 'auto' }}>
										<Stack spacing={2}>
											<Stack direction="row" justifyContent="space-between" alignItems="center">
												<Typography variant="h6" fontWeight={800}>
													篩選條件
												</Typography>
												<IconButton onClick={() => setFilterDrawerOpen(false)}>
													<CloseRoundedIcon />
												</IconButton>
											</Stack>
											<FilterControls
												search={search}
												setSearch={setSearch}
												eventTags={eventTags}
												toggleEventTag={toggleEventTag}
												brandKeys={brandKeys}
												toggleBrand={toggleBrand}
												brandList={brandList}
												promoTypes={promoTypes}
												togglePromoType={togglePromoType}
												sortBy={sortBy}
												setSortBy={setSortBy}
												onlyActive={onlyActive}
												setOnlyActive={setOnlyActive}
												needMembership={needMembership}
												setNeedMembership={setNeedMembership}
											/>
											<Button variant="outlined" onClick={reset}>
												重設篩選
											</Button>
										</Stack>
									</Box>
								</SwipeableDrawer>
							</>
						) : (
							<FilterControls
								search={search}
								setSearch={setSearch}
								eventTags={eventTags}
								toggleEventTag={toggleEventTag}
								brandKeys={brandKeys}
								brandList={brandList}
								toggleBrand={toggleBrand}
								promoTypes={promoTypes}
								togglePromoType={togglePromoType}
								sortBy={sortBy}
								setSortBy={setSortBy}
								onlyActive={onlyActive}
								setOnlyActive={setOnlyActive}
								needMembership={needMembership}
								setNeedMembership={setNeedMembership}
							/>
						)}
						</CardContent>
				</Card>

				{!isMobile && (
					<Box sx={{ px: { xs: 1.5, sm: 0 }, display: 'flex', alignItems: 'center', gap: 1, mt: { xs: 2.5, sm: 2.5 } }}>
						<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
							{filterSummary}
						</Typography>
						<Box flex={1} />
						<Button variant="outlined" size="small" onClick={reset}>
							重設篩選
						</Button>
					</Box>
				)}
				</Box>

				{isMobile ? (
					<>
						<Stack spacing={3}>
							{mobileShowcaseSections.map((section, idx) => (
								<PromoCarouselSection
									key={section.id}
									id={section.id}
									title={section.title}
									description={section.description}
									items={section.items}
									now={now}
									onOpen={handleOpenPromo}
									onViewAll={scrollToAll}
									showSwipeTip={idx === 0 && showSwipeTip}
									onInteract={showSwipeTip ? dismissSwipeTip : undefined}
									edgeToEdge
								/>
							))}
						</Stack>
						<Divider sx={{ my: 2, mx: { xs: 1.5, sm: 0 } }} />
						<Box ref={allListRef} sx={{ px: { xs: 1.5, sm: 0 } }}>
							<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
								<Typography variant="h6" fontWeight={700}>
									全部活動一覽
								</Typography>
								<Typography variant="body2" color="text.secondary">
									共 {filtered.length} 筆
								</Typography>
							</Stack>
							<Stack spacing={1.25}>
								{filtered.length === 0 ? (
									<Typography variant="body2" color="text.secondary">
										沒有找到符合篩選條件，換個篩選條件試試。
									</Typography>
								) : (
									filtered.map((promo) => (
										<PromotionCard key={promo.promoId} promo={promo} now={now} onOpen={handleOpenPromo} />
									))
								)}
							</Stack>
						</Box>
					</>
				) : (
					<>
						<Box sx={{ px: { xs: 1.5, sm: 0 } }}>
							<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
								<Typography variant="h6" fontWeight={700}>
									即將到期
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{expiringSoonPreview.length} 筆
								</Typography>
							</Stack>
							<Stack spacing={1.5}>
								{expiringSoonPreview.length === 0 ? (
									<Typography variant="body2" color="text.secondary">
										目前沒有符合篩選條件且即將到期的活動。
									</Typography>
								) : (
									expiringSoonPreview.map((promo) => (
										<PromotionCard key={promo.promoId} promo={promo} now={now} onOpen={handleOpenPromo} />
									))
								)}
							</Stack>
						</Box>

						<Divider sx={{ my: 2, mx: { xs: 1.5, sm: 0 } }} />

						<Box ref={allListRef} sx={{ px: { xs: 1.5, sm: 0 } }}>
							<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
								<Typography variant="h6" fontWeight={700}>
									所有符合條件的活動
								</Typography>
								<Typography variant="body2" color="text.secondary">
									共 {filtered.length} 筆
								</Typography>
							</Stack>
							<Stack spacing={1.5}>
								{filtered.length === 0 ? (
									<Typography variant="body2" color="text.secondary">
										沒有找到符合篩選條件，換個篩選條件試試。
									</Typography>
								) : (
									filtered.map((promo) => (
										<PromotionCard key={promo.promoId} promo={promo} now={now} onOpen={handleOpenPromo} />
									))
								)}
							</Stack>
						</Box>
					</>
				)}
			</Stack>
		</Box>
	);
}
