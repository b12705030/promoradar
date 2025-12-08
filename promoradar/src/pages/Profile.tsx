import React from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	Stack,
	Avatar,
	Chip,
	Divider,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	CircularProgress,
	Alert,
	Button,
} from '@mui/material';
import { useAuth } from '../store/useAuth';
import { usePromotionUsage } from '../store/usePromotionUsage';
import { usePromotionFavorites } from '../store/usePromotionFavorites';
import { useBrandFollow } from '../store/useBrandFollow';
import { useNavigate } from 'react-router-dom';
import { fetchUserRankings, type UserRanking } from '../lib/userApi';
import dayjs from 'dayjs';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StoreIcon from '@mui/icons-material/Store';
import LogoutIcon from '@mui/icons-material/Logout';
import { useMediaQuery, useTheme } from '@mui/material';

export default function ProfilePage() {
	const { user, token, logout } = useAuth();
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const [rankings, setRankings] = React.useState<UserRanking[]>([]);
	const [rankingsLoading, setRankingsLoading] = React.useState(false);
	const [rankingsError, setRankingsError] = React.useState<string | null>(null);

	const userUsage = usePromotionUsage((state) => state.userUsage);
	const promotionFavorites = usePromotionFavorites((state) =>
		state.mode === 'user' ? state.userFavorites : state.guestFavorites,
	);
	const brandFollows = useBrandFollow((state) =>
		state.mode === 'user' ? state.userFollows : state.guestFollows,
	);

	// 計算總使用次數
	const totalUsage = React.useMemo(() => {
		return Object.values(userUsage).reduce((sum, entry) => sum + entry.count, 0);
	}, [userUsage]);

	// 計算使用的優惠活動數量
	const uniquePromotionsUsed = React.useMemo(() => {
		return Object.keys(userUsage).length;
	}, [userUsage]);

	// 獲取用戶排名
	React.useEffect(() => {
		if (!token) return;
		setRankingsLoading(true);
		setRankingsError(null);
		fetchUserRankings(token, 100)
			.then((data) => {
				setRankings(data);
				setRankingsLoading(false);
			})
			.catch((err) => {
				setRankingsError(err instanceof Error ? err.message : '載入排名失敗');
				setRankingsLoading(false);
			});
	}, [token]);

	// 查找當前用戶的排名
	const currentUserRank = React.useMemo(() => {
		if (!user) return null;
		return rankings.find((r) => r.userId === user.userId) ?? null;
	}, [rankings, user]);

	// 成就列表
	const achievements = React.useMemo(() => {
		const list: Array<{ title: string; description: string; unlocked: boolean; icon: React.ReactNode }> = [];
		
		if (totalUsage >= 1) {
			list.push({
				title: '首次使用',
				description: '使用第一次優惠活動',
				unlocked: true,
				icon: '🎉',
			});
		}
		if (totalUsage >= 10) {
			list.push({
				title: '優惠達人',
				description: '使用 10 次優惠活動',
				unlocked: true,
				icon: '⭐',
			});
		}
		if (totalUsage >= 50) {
			list.push({
				title: '優惠大師',
				description: '使用 50 次優惠活動',
				unlocked: true,
				icon: '🏆',
			});
		}
		if (totalUsage >= 100) {
			list.push({
				title: '折扣大王',
				description: '使用 100 次優惠活動',
				unlocked: true,
				icon: '👑',
			});
		}
		if (promotionFavorites.length >= 10) {
			list.push({
				title: '收藏家',
				description: '收藏 10 個優惠活動',
				unlocked: true,
				icon: '❤️',
			});
		}
		if (brandFollows.length >= 5) {
			list.push({
				title: '品牌追蹤者',
				description: '關注 5 個品牌',
				unlocked: true,
				icon: '👀',
			});
		}

		return list;
	}, [totalUsage, promotionFavorites.length, brandFollows.length]);

	// 使用紀錄（最近 10 筆）
	const recentUsage = React.useMemo(() => {
		const entries = Object.entries(userUsage)
			.map(([promoId, entry]) => ({
				promoId: Number(promoId),
				count: entry.count,
				lastUsed: entry.lastUsed,
			}))
			.filter((e) => e.lastUsed)
			.sort((a, b) => (b.lastUsed ?? '').localeCompare(a.lastUsed ?? ''))
			.slice(0, 10);
		return entries;
	}, [userUsage]);

	// 如果未登入，顯示提示（必須在所有 hooks 之後）
	if (!user || !token) {
		return (
			<Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 3, sm: 5 }, pb: { xs: 10, sm: 5 } }}>
				<Card>
					<CardContent>
						<Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
							<Typography variant="h6" color="text.secondary">
								請先登入以查看帳號資訊
							</Typography>
							<Button variant="contained" onClick={() => navigate('/auth')}>
								前往登入
							</Button>
						</Stack>
					</CardContent>
				</Card>
			</Box>
		);
	}

	return (
		<Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 3, sm: 5 }, pb: { xs: 10, sm: 5 } }}>
			<Stack spacing={3}>
				{/* 使用者資訊卡片 */}
				<Card>
					<CardContent>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'center', sm: 'flex-start' }}>
							<Avatar sx={{ width: { xs: 80, sm: 100 }, height: { xs: 80, sm: 100 }, bgcolor: 'primary.main', fontSize: { xs: 32, sm: 40 } }}>
								{user.username.charAt(0).toUpperCase()}
							</Avatar>
							<Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
								<Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} mb={1}>
									<Typography variant="h5" fontWeight={800}>
										{user.username}
									</Typography>
									{user.isAdmin && <Chip label="Admin" size="small" color="primary" />}
								</Stack>
								<Typography variant="body2" color="text.secondary" gutterBottom>
									{user.email}
								</Typography>
								<Stack direction="row" spacing={2} mt={2} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
									<Box>
										<Typography variant="h6" fontWeight={700} color="primary.main">
											{totalUsage}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											總使用次數
										</Typography>
									</Box>
									<Box>
										<Typography variant="h6" fontWeight={700} color="primary.main">
											{uniquePromotionsUsed}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											使用活動數
										</Typography>
									</Box>
									<Box>
										<Typography variant="h6" fontWeight={700} color="primary.main">
											{promotionFavorites.length}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											收藏活動
										</Typography>
									</Box>
									<Box>
										<Typography variant="h6" fontWeight={700} color="primary.main">
											{brandFollows.length}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											關注品牌
										</Typography>
									</Box>
								</Stack>
							</Box>
							<Button
								variant="outlined"
								color="error"
								startIcon={<LogoutIcon />}
								onClick={() => {
									logout();
									navigate('/auth');
								}}
								sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}
							>
								登出
							</Button>
						</Stack>
					</CardContent>
				</Card>

				{/* 折扣大王排名 */}
				<Card>
					<CardContent>
						<Stack direction="row" spacing={1} alignItems="center" mb={2}>
							<EmojiEventsIcon color="primary" />
							<Typography variant="h6" fontWeight={700}>
								折扣大王排行榜
							</Typography>
						</Stack>
						{rankingsLoading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
								<CircularProgress />
							</Box>
						) : rankingsError ? (
							<Alert severity="error">{rankingsError}</Alert>
						) : (
							<Stack spacing={2}>
								{currentUserRank && (
									<Box
										sx={{
											p: 2,
											bgcolor: 'primary.light',
											borderRadius: 2,
											border: '2px solid',
											borderColor: 'primary.main',
										}}
									>
										<Stack direction="row" spacing={2} alignItems="center">
											<Box
												sx={{
													width: 48,
													height: 48,
													borderRadius: '50%',
													bgcolor: 'primary.main',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													color: 'white',
													fontWeight: 700,
													fontSize: 18,
												}}
											>
												{currentUserRank.rank}
											</Box>
											<Box sx={{ flex: 1 }}>
												<Typography variant="subtitle1" fontWeight={700}>
													{currentUserRank.username}（你）
												</Typography>
												<Typography variant="body2" color="text.secondary">
													使用次數：{currentUserRank.totalUsage} 次
												</Typography>
											</Box>
										</Stack>
									</Box>
								)}
								<TableContainer component={Paper} variant="outlined">
									<Table size={isMobile ? 'small' : 'medium'}>
										<TableHead>
											<TableRow>
												<TableCell sx={{ fontWeight: 700 }}>排名</TableCell>
												<TableCell sx={{ fontWeight: 700 }}>使用者</TableCell>
												<TableCell align="right" sx={{ fontWeight: 700 }}>
													使用次數
												</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{rankings.slice(0, 20).map((ranking) => (
												<TableRow
													key={ranking.userId}
													sx={{
														bgcolor: ranking.userId === user.userId ? 'action.selected' : undefined,
													}}
												>
													<TableCell>
														<Stack direction="row" spacing={1} alignItems="center">
															{ranking.rank <= 3 && (
																<EmojiEventsIcon
																	sx={{
																		fontSize: 20,
																		color: ranking.rank === 1 ? '#FFD700' : ranking.rank === 2 ? '#C0C0C0' : '#CD7F32',
																	}}
																/>
															)}
															<Typography fontWeight={ranking.rank <= 3 ? 700 : 400}>
																{ranking.rank}
															</Typography>
														</Stack>
													</TableCell>
													<TableCell>
														{ranking.username}
														{ranking.userId === user.userId && (
															<Chip label="你" size="small" sx={{ ml: 1 }} />
														)}
													</TableCell>
													<TableCell align="right">
														<Typography fontWeight={700}>{ranking.totalUsage}</Typography>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							</Stack>
						)}
					</CardContent>
				</Card>

				{/* 成就系統 */}
				<Card>
					<CardContent>
						<Stack direction="row" spacing={1} alignItems="center" mb={2}>
							<TrendingUpIcon color="primary" />
							<Typography variant="h6" fontWeight={700}>
								成就系統
							</Typography>
						</Stack>
						{achievements.length === 0 ? (
							<Typography color="text.secondary" textAlign="center" py={2}>
								尚未解鎖任何成就
							</Typography>
						) : (
							<Stack spacing={1.5}>
								{achievements.map((achievement, idx) => (
									<Box
										key={idx}
										sx={{
											p: 2,
											borderRadius: 2,
											bgcolor: achievement.unlocked ? 'success.light' : 'action.disabledBackground',
											border: '1px solid',
											borderColor: achievement.unlocked ? 'success.main' : 'divider',
										}}
									>
										<Stack direction="row" spacing={2} alignItems="center">
											<Typography sx={{ fontSize: 32 }}>{achievement.icon}</Typography>
											<Box sx={{ flex: 1 }}>
												<Typography variant="subtitle1" fontWeight={700}>
													{achievement.title}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													{achievement.description}
												</Typography>
											</Box>
											{achievement.unlocked && (
												<Chip label="已解鎖" size="small" color="success" />
											)}
										</Stack>
									</Box>
								))}
							</Stack>
						)}
					</CardContent>
				</Card>

				{/* 使用紀錄 */}
				<Card>
					<CardContent>
						<Stack direction="row" spacing={1} alignItems="center" mb={2}>
							<FavoriteIcon color="primary" />
							<Typography variant="h6" fontWeight={700}>
								最近使用紀錄
							</Typography>
						</Stack>
						{recentUsage.length === 0 ? (
							<Typography color="text.secondary" textAlign="center" py={2}>
								尚無使用紀錄
							</Typography>
						) : (
							<TableContainer component={Paper} variant="outlined">
								<Table size={isMobile ? 'small' : 'medium'}>
									<TableHead>
										<TableRow>
											<TableCell sx={{ fontWeight: 700 }}>活動 ID</TableCell>
											<TableCell sx={{ fontWeight: 700 }}>使用次數</TableCell>
											<TableCell align="right" sx={{ fontWeight: 700 }}>
												最後使用時間
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{recentUsage.map((entry) => (
											<TableRow
												key={entry.promoId}
												onClick={() => navigate(`/promotions/${entry.promoId}`)}
												sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
											>
												<TableCell>#{entry.promoId}</TableCell>
												<TableCell>
													<Typography fontWeight={700}>{entry.count}</Typography>
												</TableCell>
												<TableCell align="right">
													{entry.lastUsed
														? dayjs(entry.lastUsed).format('YYYY/MM/DD HH:mm')
														: '-'}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						)}
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
}

