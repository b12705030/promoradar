import React from 'react';
import {
	Card,
	CardContent,
	CardActionArea,
	Stack,
	Avatar,
	Typography,
	Chip,
	IconButton,
	Box,
	Snackbar,
	Alert,
} from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import dayjs from 'dayjs';
import { PROMO_TYPE_META, EVENT_TAG_META } from '../config/promotionMeta';
import { getBrandMeta } from '../config/brands';
import { useData } from '../context/DataContext';
import type { PromotionRecord } from '../types/promo';
import { usePromotionFavorites } from '../store/usePromotionFavorites';
import { useAuth } from '../store/useAuth';
import { useNavigate } from 'react-router-dom';
import { trackUserBehavior } from '../lib/trackingApi';

type Props = {
	promo: PromotionRecord;
	now: dayjs.Dayjs;
	onOpen: (id: number) => void;
	size?: 'default' | 'compact';
};

export default function PromotionCard({ promo, now, onOpen, size = 'default' }: Props) {
	const { brandMetaByKey } = useData();
	const brandKey = promo.brandName.trim().toLowerCase();
	const brand = brandMetaByKey.get(brandKey) ?? getBrandMeta(promo.brandName);
	const start = dayjs(promo.startDatetime);
	const end = dayjs(promo.endDatetime);
	const isActive = now.isAfter(start) && now.isBefore(end);
	const duration = `${start.format('MM/DD')} - ${end.format('MM/DD')}`;
	const typeMeta = PROMO_TYPE_META[promo.promoType] ?? { label: promo.promoType, color: '#94a3b8' };
	const eventMeta = EVENT_TAG_META[promo.eventTag] ?? { label: promo.eventTag, color: '#94a3b8' };
	const { token } = useAuth();
	const navigate = useNavigate();
	const favorites = usePromotionFavorites((state) =>
		state.mode === 'user' ? state.userFavorites : state.guestFavorites,
	);
	const toggleFavorite = usePromotionFavorites((state) => state.toggleFavorite);
	const favoritesLoading = usePromotionFavorites((state) => state.loading);
	const isFavorite = favorites.includes(promo.promoId);
	const compact = size === 'compact';
	const [showAuthAlert, setShowAuthAlert] = React.useState(false);

	const handleToggleFavorite = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!token) {
			setShowAuthAlert(true);
			setTimeout(() => navigate('/auth'), 1500);
			return;
		}
		void toggleFavorite(promo.promoId, token);
	};

	const handleClick = () => {
		// 追蹤點擊行為
		void trackUserBehavior(token, {
			action: 'click_promo',
			promo_id: promo.promoId.toString(),
			brand_name: promo.brandName,
			tags: promo.eventTag ? [promo.eventTag] : null,
		});
		onOpen(promo.promoId);
	};

	return (
	<Card
		elevation={0}
		sx={{
			borderRadius: 2,
			border: '1px solid',
			borderColor: 'divider',
			height: '100%',
		}}
	>
			<CardActionArea component="div" onClick={handleClick}>
			<CardContent sx={{ py: compact ? 1.5 : 2, px: compact ? 1.5 : 2.25, height: '100%' }}>
				<Stack spacing={compact ? 1.1 : 1.25} sx={{ height: '100%' }}>
						<Stack direction="row" spacing={compact ? 1.1 : 1.35} alignItems="flex-start">
							<Avatar
								src={brand.logo}
								variant="rounded"
								sx={{
									width: compact ? 40 : 48,
									height: compact ? 40 : 48,
									bgcolor: brand.primaryColor,
									'& img': { objectFit: 'contain' },
								}}
							>
								{brand.displayName[0]}
							</Avatar>
							<Box sx={{ minWidth: 0, flex: 1 }}>
								<Typography
									variant={compact ? 'subtitle2' : 'subtitle1'}
									fontWeight={700}
									sx={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: compact ? 1 : 2, overflow: 'hidden' }}
								>
									{promo.title}
								</Typography>
								<Typography variant="body2" color="text.secondary" noWrap={compact}>
									{duration}
								</Typography>
							</Box>
							<Stack direction="row" spacing={compact ? 0.5 : 1} alignItems="center" sx={{ flexShrink: 0 }}>
								<Chip
									size="small"
									label={isActive ? '進行中' : now.isBefore(start) ? '即將開始' : '已結束'}
									color={isActive ? 'success' : now.isBefore(start) ? 'warning' : 'default'}
									variant={isActive ? 'filled' : 'outlined'}
									sx={
										compact
											? {
													height: 22,
													'& .MuiChip-label': {
														px: 0.7,
														pt: 0.2,
														pd: 0,
														fontSize: 11,
													},
											  }
											: undefined
									}
								/>
								<IconButton
									size="small"
									color={isFavorite ? 'secondary' : 'default'}
									disabled={Boolean(token) && favoritesLoading}
									onClick={handleToggleFavorite}
									aria-label="收藏活動"
								>
									{isFavorite ? <FavoriteRoundedIcon fontSize="small" /> : <FavoriteBorderRoundedIcon fontSize="small" />}
								</IconButton>
							</Stack>
						</Stack>
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{
								display: '-webkit-box',
								WebkitLineClamp: compact ? 2 : 3,
								overflow: 'hidden',
								WebkitBoxOrient: 'vertical',
								minHeight: compact ? 0 : undefined,
							}}
						>
							{promo.description || '尚未提供活動描述'}
						</Typography>
						<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
							<Chip
								label={typeMeta.label}
								size="small"
								sx={{
									bgcolor: `${typeMeta.color}22`,
									color: typeMeta.color,
									fontWeight: 600,
								}}
							/>
							<Chip
								label={eventMeta.label}
								size="small"
								sx={{ bgcolor: `${eventMeta.color}22`, color: eventMeta.color, fontWeight: 600 }}
							/>
							{promo.needMembership && <Chip label="需會員" size="small" color="secondary" variant="outlined" />}
							{promo.needCode && <Chip label="需優惠碼" size="small" color="secondary" variant="outlined" />}
							{promo.perUserLimit > 0 && <Chip label={`每人${promo.perUserLimit}次`} size="small" />}
							{promo.globalQuota && <Chip label={`總量 ${promo.globalQuota}`} size="small" />}
							{promo.dailyQuota && <Chip label={`每日 ${promo.dailyQuota}`} size="small" />}
						</Stack>
					</Stack>
				</CardContent>
			</CardActionArea>
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
		</Card>
	);
}

