import React from 'react';
import {
	Box,
	Stack,
	Typography,
	Card,
	CardContent,
	Avatar,
	Chip,
	IconButton,
	TextField,
	InputAdornment,
	Button,
	Divider,
	Snackbar,
	Alert,
} from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { getBrandMeta } from '../config/brands';
import { PROMO_TYPE_META } from '../config/promotionMeta';
import { usePromotionFavorites } from '../store/usePromotionFavorites';
import { useAuth } from '../store/useAuth';
import type { PromotionRecord } from '../types/promo';

type PromotionTileProps = {
	promo: PromotionRecord;
	isFavorite: boolean;
	onToggle: () => void;
	onView: () => void;
};

function PromotionTile({ promo, isFavorite, onToggle, onView }: PromotionTileProps) {
	const brand = getBrandMeta(promo.brandName);
	const typeMeta = PROMO_TYPE_META[promo.promoType] ?? { label: promo.promoType, color: '#94a3b8' };
	const endText = dayjs(promo.endDatetime).format('MM/DD');
	return (
		<Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
			<CardContent>
				<Stack spacing={1}>
					<Stack direction="row" spacing={1} alignItems="center">
						<Avatar src={brand.logo} variant="rounded" sx={{ width: 36, height: 36, bgcolor: brand.primaryColor }}>
							{brand.displayName[0]}
						</Avatar>
						<Box>
							<Typography fontWeight={700}>{promo.title}</Typography>
							<Typography variant="body2" color="text.secondary">
								{brand.displayName}
							</Typography>
						</Box>
						<Box flex={1} />
						<IconButton size="small" color={isFavorite ? 'secondary' : 'default'} onClick={onToggle}>
							{isFavorite ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
						</IconButton>
					</Stack>
					<Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, overflow: 'hidden', WebkitBoxOrient: 'vertical' }}>
						{promo.description}
					</Typography>
					<Stack spacing={0.75}>
						<Stack direction="row" spacing={0.75} flexWrap="wrap">
							<Chip label={typeMeta.label} size="small" sx={{ bgcolor: `${typeMeta.color}22`, color: typeMeta.color }} />
							<Chip label={`結束 ${endText}`} size="small" />
							{promo.needMembership && <Chip label="需會員" size="small" variant="outlined" />}
							{promo.needCode && <Chip label="需優惠碼" size="small" variant="outlined" />}
						</Stack>
						<Button variant="outlined" size="small" onClick={onView} sx={{ alignSelf: 'flex-start' }}>
							查看詳情
						</Button>
					</Stack>
				</Stack>
			</CardContent>
		</Card>
	);
}

export default function WishlistPage() {
	const { promotions } = useData();
	const { token, user } = useAuth();
	const navigate = useNavigate();
	const [showAuthAlert, setShowAuthAlert] = React.useState(false);

	// 如果未登入，顯示提示並導向登入頁面
	React.useEffect(() => {
		if (!token || !user) {
			setShowAuthAlert(true);
			setTimeout(() => navigate('/auth'), 1500);
		}
	}, [token, user, navigate]);

	const favorites = usePromotionFavorites((state) =>
		state.mode === 'user' ? state.userFavorites : state.guestFavorites,
	);
	const toggleFavorite = usePromotionFavorites((state) => state.toggleFavorite);
	const clearFavorites = usePromotionFavorites((state) => state.clearFavorites);
	const [query, setQuery] = React.useState('');
	const deferredQuery = React.useDeferredValue(query);

	const handleToggleFavorite = (promoId: number) => {
		if (!token) {
			setShowAuthAlert(true);
			setTimeout(() => navigate('/auth'), 1500);
			return;
		}
		void toggleFavorite(promoId, token);
	};

	const handleClearFavorites = () => {
		if (!token) {
			setShowAuthAlert(true);
			setTimeout(() => navigate('/auth'), 1500);
			return;
		}
		void clearFavorites(token);
	};

	const favoriteSet = React.useMemo(() => new Set(favorites), [favorites]);

	const filteredAll = React.useMemo(() => {
		const q = deferredQuery.trim().toLowerCase();
		const list = promotions.filter((promo) => {
			if (!q) return true;
			const brand = getBrandMeta(promo.brandName).displayName.toLowerCase();
			return promo.title.toLowerCase().includes(q) || brand.includes(q);
		});
		return list.sort((a, b) => dayjs(a.endDatetime).valueOf() - dayjs(b.endDatetime).valueOf());
	}, [promotions, deferredQuery]);

	const favoritePromotions = filteredAll.filter((promo) => favoriteSet.has(promo.promoId));
	const nonFavoritePromotions = filteredAll.filter((promo) => !favoriteSet.has(promo.promoId));

	return (
		<Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: { xs: 2, sm: 4 }, pb: { xs: 10, sm: 4 }, bgcolor: '#fafafa', minHeight: '100%' }}>
			<Stack spacing={3}>
				<Card>
					<CardContent>
						<Stack spacing={2}>
							<Typography variant="h5" fontWeight={800}>
								關注我的優惠
							</Typography>
							<Typography variant="body2" color="text.secondary">
								挑選想追蹤的活動，後續可在首頁與地圖快速看到剩餘名額與到期資訊。
							</Typography>
							<TextField
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="搜尋活動或品牌"
								fullWidth
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<SearchRoundedIcon />
										</InputAdornment>
									),
									endAdornment: query ? (
										<InputAdornment position="end">
											<IconButton size="small" onClick={() => setQuery('')}>
												<ClearRoundedIcon fontSize="small" />
											</IconButton>
										</InputAdornment>
									) : undefined,
								}}
							/>
						</Stack>
					</CardContent>
				</Card>

				<Box>
					<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
						<Typography variant="h6" fontWeight={700}>
							已收藏的活動
						</Typography>
						<Button
							size="small"
							onClick={handleClearFavorites}
							disabled={favorites.length === 0 || !token}
						>
							清空
						</Button>
					</Stack>
					{favoritePromotions.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							還沒有收藏任何活動，從下方列表挑選吧！
						</Typography>
					) : (
						<Stack spacing={1.5}>
							{favoritePromotions.map((promo) => (
								<PromotionTile
									key={promo.promoId}
									promo={promo}
									isFavorite
									onToggle={() => handleToggleFavorite(promo.promoId)}
									onView={() => navigate(`/promotions/${promo.promoId}`)}
								/>
							))}
						</Stack>
					)}
				</Box>

				<Divider />

				<Box>
					<Typography variant="h6" fontWeight={700} mb={1}>
						全部活動
					</Typography>
					<Stack spacing={1.5}>
						{nonFavoritePromotions.length === 0 ? (
							<Typography variant="body2" color="text.secondary">
								沒有符合條件的活動。
							</Typography>
						) : (
							nonFavoritePromotions.map((promo) => (
								<PromotionTile
									key={promo.promoId}
									promo={promo}
									isFavorite={false}
									onToggle={() => handleToggleFavorite(promo.promoId)}
									onView={() => navigate(`/promotions/${promo.promoId}`)}
								/>
							))
						)}
					</Stack>
				</Box>
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
