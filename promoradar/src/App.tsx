import React from 'react';
import { flushSync } from 'react-dom';
import {
	AppBar,
	Avatar,
	Box,
	Button,
	Container,
	Toolbar,
	Typography,
	CssBaseline,
	createTheme,
	ThemeProvider,
	Paper,
	BottomNavigation,
	BottomNavigationAction,
	LinearProgress,
	IconButton,
	Drawer,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Divider,
} from '@mui/material';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { useAuth } from './store/useAuth';
import { usePromotionFavorites } from './store/usePromotionFavorites';
import { useBrandFollow } from './store/useBrandFollow';
import { usePromotionUsage } from './store/usePromotionUsage';
import { fetchAdminBrands } from './lib/userApi';
const CalendarHomePage = React.lazy(() => import('./pages/CalendarHome'));
const CalendarViewPage = React.lazy(() => import('./pages/CalendarView'));
const MapPage = React.lazy(() => import('./pages/Map'));
const WishlistPage = React.lazy(() => import('./pages/Wishlist'));
const PromotionDetailPage = React.lazy(() => import('./pages/PromotionDetail'));
const AuthPage = React.lazy(() => import('./pages/Auth'));
const ProfilePage = React.lazy(() => import('./pages/Profile'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboard'));
import { FaRegCalendarCheck } from 'react-icons/fa6';
import { RiDrinksFill } from 'react-icons/ri';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
const promoradarLogo = new URL('../draily_logo_white.png', import.meta.url).href;
const theme = createTheme({
	palette: {
		primary: { main: '#42230B' }, // 柔和藍紫
		secondary: { main: '#FFB3C1' }, // 粉色點綴
		background: { default: '#fafbfd' },
	},
	shape: { borderRadius: 14 },
	typography: {
		fontFamily: `'Baloo 2', 'Noto Sans TC', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif`,
		button: { textTransform: 'none', fontWeight: 700 },
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				'@keyframes fadeInUp': {
					from: { opacity: 0, transform: 'translate3d(0, 6px, 0)' },
					to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
				},
			},
		},
		MuiPaper: { styleOverrides: { root: { borderRadius: 16 } } },
		MuiCard: { styleOverrides: { root: { borderRadius: 16 } } },
		MuiAppBar: { styleOverrides: { root: { boxShadow: 'none' } } },
		MuiContainer: {
			defaultProps: { disableGutters: true }, // 或保留 false
			styleOverrides: {
			  root: {
				paddingLeft: 8,
				paddingRight: 8,
				'@media (min-width:600px)': { paddingLeft: 0, paddingRight: 0 },
			  },
			},
		},
		MuiCardContent: {
			styleOverrides: { root: { 
				'&:last-child': { paddingBottom: 16 },
			} 
		  }
		}
	},
});

function MobileBottomNav() {
	const { user } = useAuth();
	const isAdmin = Boolean(user?.isAdmin);
	const location = useLocation();
	const navigate = useNavigate();
	const currentByPath = React.useMemo(() => {
		if (location.pathname.startsWith('/calendar')) return 'calendar';
		if (location.pathname.startsWith('/map')) return 'map';
		if (location.pathname.startsWith('/wishlist')) return 'wishlist';
		if (location.pathname.startsWith('/auth')) return 'auth';
		if (location.pathname.startsWith('/profile')) return 'profile';
		if (location.pathname.startsWith('/admin')) return 'admin';
		return 'home';
	}, [location.pathname]);
	const [navValue, setNavValue] = React.useState<string>(currentByPath);
	// 同步 URL → 本地狀態（例如返回）
	React.useEffect(() => { setNavValue(currentByPath); }, [currentByPath]);
    const preloadRoute = (v: string) => {
        if (v === 'home') import('./pages/CalendarHome');
        if (v === 'calendar') import('./pages/CalendarView');
        if (v === 'map') import('./pages/Map');
        if (v === 'wishlist') import('./pages/Wishlist');
        if (v === 'auth') import('./pages/Auth');
        if (v === 'profile') import('./pages/Profile');
        if (v === 'admin') import('./pages/AdminDashboard');
    };
    return (
        <Paper square elevation={3} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: { xs: 'block', sm: 'none' }, zIndex: (t) => t.zIndex.appBar, transform: 'translateZ(0)', willChange: 'transform', contain: 'paint', borderRadius: 0 }}>
            <BottomNavigation showLabels value={navValue} onChange={(_, v) => {
                flushSync(() => setNavValue(v)); // 立刻提交狀態並觸發一次繪製
                // 讓瀏覽器先完成至少一幀繪製，再進行導航（避免顏色切換被阻塞）
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        React.startTransition(() => {
                            navigate(v === 'home' ? '/' : `/${v}`);
                        });
                    });
                });
				}} sx={{ 
					height: 64,
					px: 2,
					py:1,
                    '& .MuiBottomNavigationAction-root': { minHeight: 40, px: 0, py: 0, transition: 'none' },
						'& .MuiBottomNavigationAction-label': { fontSize: 12, transform: 'none', transition: 'none' },
						'& .MuiBottomNavigationAction-root.Mui-selected .MuiBottomNavigationAction-label': { fontSize: 12, transform: 'none' },
                    '& .MuiBottomNavigationAction-root.Mui-selected svg': { transform: 'none' },
                    '& .MuiTouchRipple-root': { display: 'none' }
				 }}>
                <BottomNavigationAction disableRipple onMouseEnter={() => preloadRoute('home')} onPointerDown={() => preloadRoute('home')} value="home" label="儀表板" icon={<FaRegCalendarCheck />} sx={{ flex: 1, minWidth: 0, fontWeight: 700, '& svg': { fontSize: 19 }, '&.Mui-selected': { color: 'primary.main', '& svg': { color: 'primary.main' }, backgroundColor: 'action.selected', borderRadius: 1, px: 0.5, py: 0.5 } }} />
				<BottomNavigationAction disableRipple onMouseEnter={() => preloadRoute('calendar')} onPointerDown={() => preloadRoute('calendar')} value="calendar" label="活動日曆" icon={<EventNoteRoundedIcon />} sx={{ flex: 1, minWidth: 0, fontWeight: 700, '& svg': { fontSize: 19 }, '&.Mui-selected': { color: 'primary.main', '& svg': { color: 'primary.main' }, backgroundColor: 'action.selected', borderRadius: 1, px: 0.5, py: 0.5 } }} />
                <BottomNavigationAction disableRipple onMouseEnter={() => preloadRoute('map')} onPointerDown={() => preloadRoute('map')} value="map" label="門市地圖" icon={<MapRoundedIcon/>} sx={{ flex: 1, minWidth: 0,  fontWeight: 700,'& svg': { fontSize: 21 }, '&.Mui-selected': { color: 'primary.main', '& svg': { color: 'primary.main' }, backgroundColor: 'action.selected', borderRadius: 1, px: 0.5, py: 0.5 } }} />
                <BottomNavigationAction disableRipple onMouseEnter={() => preloadRoute('wishlist')} onPointerDown={() => preloadRoute('wishlist')} value="wishlist" label="收藏" icon={<RiDrinksFill />} sx={{ flex: 1, minWidth: 0, fontWeight: 700, '& svg': { fontSize: 19 }, '&.Mui-selected': { color: 'primary.main', '& svg': { color: 'primary.main' }, backgroundColor: 'action.selected', borderRadius: 1, px: 0.5, py: 0.5 } }} />
                <BottomNavigationAction disableRipple onMouseEnter={() => preloadRoute('profile')} onPointerDown={() => preloadRoute('profile')} value="profile" label="帳號" icon={<AccountCircleIcon />} sx={{ flex: 1, minWidth: 0, fontWeight: 700, '& svg': { fontSize: 20 }, '&.Mui-selected': { color: 'primary.main', '& svg': { color: 'primary.main' }, backgroundColor: 'action.selected', borderRadius: 1, px: 0.5, py: 0.5 } }} />
				{isAdmin && (
					<BottomNavigationAction
						disableRipple
						onMouseEnter={() => preloadRoute('admin')}
						onPointerDown={() => preloadRoute('admin')}
						value="admin"
						label="Admin"
						icon={<AdminPanelSettingsRoundedIcon />}
						sx={{
							flex: 1,
							minWidth: 0,
							fontWeight: 700,
							'& svg': { fontSize: 20 },
							'&.Mui-selected': {
								color: 'primary.main',
								'& svg': { color: 'primary.main' },
								backgroundColor: 'action.selected',
								borderRadius: 1,
								px: 0.5,
								py: 0.5,
							},
						}}
					/>
				)}
			</BottomNavigation>
		</Paper>
	);
}

export default function App() {
	const location = useLocation();
	const navigate = useNavigate();
	const { user, logout, token, setAdminBrands } = useAuth();
	const syncFavorites = usePromotionFavorites((state) => state.syncFromServer);
	const resetFavorites = usePromotionFavorites((state) => state.resetUserFavorites);
	const syncBrandFollow = useBrandFollow((state) => state.syncFromServer);
	const resetBrandFollow = useBrandFollow((state) => state.resetUserState);
	const syncUsage = usePromotionUsage((state) => state.syncFromServer);
	const resetUsage = usePromotionUsage((state) => state.resetUserUsage);
	const [drawerOpen, setDrawerOpen] = React.useState(false);

	const navItems = [
		{ label: '儀表板', path: '/', icon: <FaRegCalendarCheck /> },
		{ label: '活動日曆', path: '/calendar', icon: <EventNoteRoundedIcon /> },
		{ label: '門市地圖', path: '/map', icon: <MapRoundedIcon /> },
		{ label: '收藏', path: '/wishlist', icon: <RiDrinksFill /> },
	];
	const enhancedNavItems = React.useMemo(() => {
		const items = [...navItems];
		if (user?.isAdmin) {
			items.push({ label: '品牌管理', path: '/admin', icon: <AdminPanelSettingsRoundedIcon /> });
		}
		return items;
	}, [user?.isAdmin]);

	const handleNavigate = (path: string) => {
		setDrawerOpen(false);
		navigate(path);
	};

	React.useEffect(() => {
		let cancelled = false;
		const hydrate = async () => {
			if (token && user) {
				try {
					const adminPromise = fetchAdminBrands(token).then((brands) => {
						if (!cancelled) setAdminBrands(brands);
					});
					await Promise.all([syncFavorites(token), syncBrandFollow(token), syncUsage(token), adminPromise]);
				} catch (err) {
					if (!cancelled) {
						console.warn('[user-sync] 資料同步失敗', err);
					}
				}
			} else {
				resetFavorites();
				resetBrandFollow();
				resetUsage();
				setAdminBrands([]);
			}
		};
		hydrate();
		return () => {
			cancelled = true;
		};
	}, [
		token,
		user,
		syncFavorites,
		syncBrandFollow,
		syncUsage,
		resetFavorites,
		resetBrandFollow,
		resetUsage,
		setAdminBrands,
	]);
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<DataProvider>
				<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
					<AppBar position="sticky" color="primary" sx={{
						// background: 'linear-gradient(90deg, #6C8EF2 0%, #A78BFA 50%, #FFB3C1 100%)',
						background: '#3B200A',
						borderRadius: 0,
						top: 0,
						zIndex: (t) => t.zIndex.appBar
					}}>
                        <Toolbar sx={{ gap: 1, minHeight: { xs: 64, sm: 64 } }}>
                            <Avatar src={promoradarLogo} variant="square" sx={{ width: 40, height: 40, mr: 0, bgcolor: 'transparent', '& img': { objectFit: 'contain' } }} />
							<Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 1000, mt:{xs:0.8, sm:0.6}, fontSize: { xs: 20, sm: 22 } }}>
                                Promoradar 優惠雷達
							</Typography>
							<IconButton color="inherit" sx={{ display: { xs: 'inline-flex', sm: 'none' } }} onClick={() => setDrawerOpen(true)}>
								<MenuRoundedIcon />
							</IconButton>
                            <Button color="inherit" component={Link} to="/" sx={{ fontSize: { xs: 13, sm: 14 }, display: { xs: 'none', sm: 'inline-flex' }, px: 1.25, mt:0.6, borderRadius: 1, transition: 'background-color .15s ease', '&:hover': { backgroundColor: 'action.hover' } }}>儀表板</Button>
							<Button color="inherit" component={Link} to="/calendar" sx={{ fontSize: { xs: 13, sm: 14 }, display: { xs: 'none', sm: 'inline-flex' }, px: 1.25, mt:0.6, borderRadius: 1, transition: 'background-color .15s ease', '&:hover': { backgroundColor: 'action.hover' } }}>活動日曆</Button>
                            <Button color="inherit" component={Link} to="/map" sx={{ fontSize: { xs: 13, sm: 14 }, display: { xs: 'none', sm: 'inline-flex' }, px: 1.25, mt:0.6, borderRadius: 1, transition: 'background-color .15s ease', '&:hover': { backgroundColor: 'action.hover' } }}>門市地圖</Button>
                            <Button color="inherit" component={Link} to="/wishlist" sx={{ fontSize: { xs: 13, sm: 14 }, display: { xs: 'none', sm: 'inline-flex' }, px: 1.25, mt:0.6, borderRadius: 1, transition: 'background-color .15s ease', '&:hover': { backgroundColor: 'action.hover' } }}>收藏</Button>
							{user?.isAdmin && (
								<Button
									color="inherit"
									component={Link}
									to="/admin"
									startIcon={<AdminPanelSettingsRoundedIcon />}
									sx={{
										fontSize: { xs: 13, sm: 14 },
										display: { xs: 'none', sm: 'inline-flex' },
										px: 1.25,
										mt: 0.6,
										borderRadius: 1,
										transition: 'background-color .15s ease',
										'&:hover': { backgroundColor: 'action.hover' },
									}}
								>
									品牌管理
								</Button>
							)}
                            <Button color="inherit" component={Link} to={user ? "/profile" : "/auth"} startIcon={<AccountCircleIcon />} sx={{ fontSize: { xs: 13, sm: 14 }, display: { xs: 'none', sm: 'inline-flex' }, px: 1.25, mt:0.6, borderRadius: 1, transition: 'background-color .15s ease', '&:hover': { backgroundColor: 'action.hover' } }}>
								{user ? `嗨，${user.username}` : '登入 / 註冊'}
							</Button>
						</Toolbar>
					</AppBar>
					<Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
						<Box sx={{ width: 260, p: 2, display: 'flex', flexDirection: 'column', gap: 2, minHeight: '100%' }}>
							<Box>
								<Typography variant="h6" fontWeight={800}>
									Promoradar
								</Typography>
								<Typography variant="body2" color="text.secondary">
									快速前往各項功能
								</Typography>
							</Box>
							<List>
								{enhancedNavItems.map((item) => (
									<ListItemButton key={item.path} onClick={() => handleNavigate(item.path)} selected={location.pathname === item.path}>
										<ListItemIcon>{item.icon}</ListItemIcon>
										<ListItemText primary={item.label} />
									</ListItemButton>
								))}
							</List>
							<Divider />
							<List>
								<ListItemButton onClick={() => handleNavigate(user ? '/profile' : '/auth')}>
									<ListItemIcon>
										<AccountCircleIcon />
									</ListItemIcon>
									<ListItemText primary={user ? `我的帳號 (${user.username})` : '登入 / 註冊'} />
								</ListItemButton>
								{user && (
									<ListItemButton
										onClick={() => {
											logout();
											setDrawerOpen(false);
											navigate('/auth');
										}}
									>
										<ListItemIcon>
											<LogoutRoundedIcon />
										</ListItemIcon>
										<ListItemText primary="登出" />
									</ListItemButton>
								)}
							</List>
						</Box>
					</Drawer>
					<Container maxWidth="lg" sx={{ flex: 1, px: 0, py: { xs: 0, sm: 0 }, pb: { xs: 0, sm: 0 } }}>
						<React.Suspense fallback={<Box sx={{ px: 2, py: 2 }}><LinearProgress /></Box>}>
							<Box key={location.pathname} sx={{ animation: 'fadeInUp .18s ease-out', willChange: 'transform, opacity' }}>
								<Routes>
									<Route path="/" element={<CalendarHomePage />} />
									<Route path="/calendar" element={<CalendarViewPage />} />
									<Route path="/map" element={<MapPage />} />
									<Route path="/wishlist" element={<WishlistPage />} />
									<Route path="/profile" element={<ProfilePage />} />
									<Route path="/admin" element={<AdminDashboardPage />} />
									<Route path="/auth" element={<AuthPage />} />
									<Route path="/promotions/:promoId" element={<PromotionDetailPage />} />
								</Routes>
							</Box>
						</React.Suspense>
					</Container>
					<MobileBottomNav />
				</Box>
			</DataProvider>
		</ThemeProvider>
	);
}
