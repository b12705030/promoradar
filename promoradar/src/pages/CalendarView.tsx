import React from 'react';
import {
	Box,
	Stack,
	Typography,
	Card,
	CardContent,
	TextField,
	InputAdornment,
	IconButton,
	ToggleButtonGroup,
	ToggleButton,
	Button,
	Chip,
	SwipeableDrawer,
	FormControlLabel,
	Switch,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { useData } from '../context/DataContext';
import { usePromotionFilters } from '../store/usePromotionFilters';
import { useFilteredPromotions } from '../hooks/useFilteredPromotions';
import { useBrandFollow } from '../store/useBrandFollow';
import { EVENT_TAG_META, PROMO_TYPE_META } from '../config/promotionMeta';
import { getBrandMeta } from '../config/brands';
import { EVENT_TAG_VALUES, PROMO_TYPE_VALUES, type PromotionRecord } from '../types/promo';
import PromotionCard from '../components/PromotionCard';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const MAX_EVENT_TAG_CHIPS = 6;

export default function CalendarViewPage() {
	const navigate = useNavigate();
	const { promotions, brandMetaByKey } = useData();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const dayCellSize = React.useMemo(() => (isMobile ? 'clamp(32px, 12vw, 44px)' : 40), [isMobile]);
	const weekGap = React.useMemo(() => (isMobile ? 0.25 : 0.5), [isMobile]);
	const [filterDrawerOpen, setFilterDrawerOpen] = React.useState(false);
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

	const [calendarDate, setCalendarDate] = React.useState(dayjs().startOf('day'));
	const [onlyFollowedBrands, setOnlyFollowedBrands] = React.useState(false);
	const brandFollows = useBrandFollow((state) =>
		state.mode === 'user' ? state.userFollows : state.guestFollows,
	);
	const followedBrandSet = React.useMemo(() => {
		const set = new Set<string>();
		brandFollows.forEach((brandName) => {
			set.add(brandName.trim().toLowerCase());
		});
		return set;
	}, [brandFollows]);

	const eventsByDate = React.useMemo(() => {
		const map = new Map<string, PromotionRecord[]>();
		filtered.forEach((promo) => {
			let current = dayjs(promo.startDatetime).startOf('day');
			const end = dayjs(promo.endDatetime).startOf('day');
			const normalizedEnd = end.isBefore(current) ? current : end;
			let iterations = 0;
			while ((current.isBefore(normalizedEnd) || current.isSame(normalizedEnd, 'day')) && iterations < 120) {
				const key = current.format('YYYY-MM-DD');
				const arr = map.get(key) ?? [];
				arr.push(promo);
				map.set(key, arr);
				iterations += 1;
				current = current.add(1, 'day');
			}
			if (iterations === 0) {
				const key = current.format('YYYY-MM-DD');
				const arr = map.get(key) ?? [];
				arr.push(promo);
				map.set(key, arr);
			}
		});
		return map;
	}, [filtered]);

	const brandColorsByDate = React.useMemo(() => {
		const map = new Map<string, string[]>();
		eventsByDate.forEach((promos, key) => {
			const uniqueColors: string[] = [];
			const seen = new Set<string>();
			for (const promo of promos) {
				const brandKey = promo.brandName.trim().toLowerCase();
				if (seen.has(brandKey)) continue;
				seen.add(brandKey);
				const meta = brandMetaByKey.get(brandKey) ?? getBrandMeta(promo.brandName);
				uniqueColors.push(meta.primaryColor ?? '#6b7280');
			}
			map.set(key, uniqueColors);
		});
		return map;
	}, [eventsByDate, brandMetaByKey]);

	const DayWithBadges = React.useMemo(() => {
		return function DayWithBadgesDay(props: PickersDayProps) {
			const key = props.day.format('YYYY-MM-DD');
			const colors = brandColorsByDate.get(key) ?? [];
			const condensed = colors.length >= 4;
			const dots = condensed ? colors.slice(0, 2) : colors.slice(0, 3);
			const extraCount = condensed ? colors.length - 2 : 0;
			return (
				<Box
					sx={{
						position: 'relative',
						display: 'inline-flex',
						justifyContent: 'center',
						alignItems: 'center',
						width: '100%',
					}}
				>
					<PickersDay {...props} />
					{dots.length > 0 && (
						<Box
							sx={{
								position: 'absolute',
								bottom: condensed ? 2 : 3,
								left: 0,
								right: 0,
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								gap: 0.35,
							}}
						>
							{dots.map((color, idx) => (
								<Box
									key={`${key}-${color}-${idx}`}
									component="span"
									sx={{
										width: 6,
										height: 6,
										borderRadius: '50%',
										backgroundColor: color,
										border: '1px solid #fff',
									}}
								/>
							))}
							{extraCount > 0 && (
								<Box
									component="span"
									sx={{
										fontSize: 9,
										lineHeight: 1,
										fontWeight: 700,
										color: '#fff',
										bgcolor: '#6b7280',
										px: 0.4,
										borderRadius: 999,
										border: '1px solid #fff',
									}}
								>
									+{extraCount}
								</Box>
							)}
						</Box>
					)}
				</Box>
			);
		};
	}, [brandColorsByDate]);

	const selectedDateKey = calendarDate.format('YYYY-MM-DD');
	const allPromotionsOnSelectedDate = eventsByDate.get(selectedDateKey) ?? [];
	const promotionsOnSelectedDate = React.useMemo(() => {
		if (!onlyFollowedBrands) return allPromotionsOnSelectedDate;
		return allPromotionsOnSelectedDate.filter((promo) => {
			const brandKey = promo.brandName.trim().toLowerCase();
			return followedBrandSet.has(brandKey);
		});
	}, [allPromotionsOnSelectedDate, onlyFollowedBrands, followedBrandSet]);

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

	const filterSummary = React.useMemo(() => {
		const segments = [];
		segments.push(brandKeys.length ? `${brandKeys.length} 品牌` : '全部品牌');
		if (eventTags.length) segments.push(`${eventTags.length} 主題`);
		if (promoTypes.length) segments.push(`${promoTypes.length} 類型`);
		return `目前篩選 · ${segments.join(' · ')}`;
	}, [brandKeys, eventTags, promoTypes]);

	const filterControls = (
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

	return (
		<Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: { xs: 1.5, sm: 3.5 }, pb: { xs: 10, sm: 3.5 }, bgcolor: '#fafafa', minHeight: '100%' }}>
			<Stack spacing={2.5}>

				<Card sx={{ mt: -1 }}>
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
											{filterControls}
											<Button variant="outlined" onClick={reset}>
												重設篩選
											</Button>
										</Stack>
									</Box>
								</SwipeableDrawer>
							</>
						) : (
							filterControls
						)}
					</CardContent>
				</Card>

				{!isMobile && (
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: { xs: 2.5, sm: 2.5 } }}>
						<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
							{filterSummary}
						</Typography>
						<Box flex={1} />
						<Button variant="outlined" size="small" onClick={reset}>
							重設篩選
						</Button>
					</Box>
				)}

				<Card>
					<CardContent>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
							<Box
								sx={{
									flex: { xs: '0 0 auto', md: '0 0 320px' },
									width: { xs: '100%', md: 'min(320px, 100%)' },
									mx: { xs: 0, md: 1 },
									px: { xs: 0, sm: 0 },
								}}
							>
								<LocalizationProvider dateAdapter={AdapterDayjs}>
									<DateCalendar
										value={calendarDate}
										onChange={(value) => value && setCalendarDate(value.startOf('day'))}
										slots={{ day: DayWithBadges }}
										sx={{
											mx: 'auto',
											width: '100%',
											maxWidth: { xs: 300, sm: 400, md: 500 },
											height: { xs: 320, md: 500 },  
											maxHeight: {md:360},
											'& .MuiPickersCalendarHeader-root': {
												px: { xs: 0, sm: 0.75, md: 1.25 },
											},
											'& .MuiDayCalendar-weekDayLabel': {
												width: { xs: 34, sm: 36, md: 42 },
												display: 'flex',
												justifyContent: 'center',
												mx: 'auto',
												fontWeight: 600,
												fontSize: { xs: 12, md: 13 },
											},
											'& .MuiDayCalendar-weekContainer': {
												justifyContent: 'center',
												gap: { xs: 0.25, md: 0.35 },
												mx: 'auto',
											},
											'& .MuiPickersDay-root': {
												fontSize: 14,
												width: { xs: 34, sm: 36, md: 42 },
												height: { xs: 34, sm: 36, md: 42 },
												margin: '0 auto',
											},
											'& .MuiDayCalendar-slideTransition': {
												minHeight: { xs: 220, md: 280 },   // 在這裡改 min-height
											},
										}}
									/>
								</LocalizationProvider>
								<Button fullWidth variant="outlined" sx={{ mt: 1 }} onClick={() => setCalendarDate(dayjs().startOf('day'))}>
									回到今天
								</Button>
							</Box>
							<Stack spacing={1.25} sx={{ flex: 1 }}>
								<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 0.5, sm: 0 }}>
									<Typography variant="subtitle1" fontWeight={700}>
										{calendarDate.format('YYYY/MM/DD ddd')} · {promotionsOnSelectedDate.length} 則活動
									</Typography>
									<FormControlLabel
										control={
											<Switch
												checked={onlyFollowedBrands}
												onChange={(e) => setOnlyFollowedBrands(e.target.checked)}
												size="small"
											/>
										}
										label="Only Followed"
										labelPlacement="end"
										sx={{ m: 0 }}
									/>
								</Stack>
								{promotionsOnSelectedDate.length === 0 ? (
									<Typography variant="body2" color="text.secondary">
										這一天沒有符合篩選條件的活動。
									</Typography>
								) : (
									<Stack spacing={1.5}>
										{promotionsOnSelectedDate.map((promo) => (
											<PromotionCard key={`calendar-${promo.promoId}`} promo={promo} now={now} onOpen={(id) => navigate(`/promotions/${id}`)} />
										))}
									</Stack>
								)}
							</Stack>
						</Stack>
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
}

