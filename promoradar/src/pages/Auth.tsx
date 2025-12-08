import React from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	Stack,
	TextField,
	Typography,
	Alert,
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material';
import { useAuth } from '../store/useAuth';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
	const [mode, setMode] = React.useState<'login' | 'signup'>('login');
	const [form, setForm] = React.useState({ username: '', email: '', password: '' });
	const [message, setMessage] = React.useState<string | null>(null);
	const { login, signup, loading, error, user, logout } = useAuth();
	const navigate = useNavigate();

	const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = evt.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
		evt.preventDefault();
		setMessage(null);
		try {
			if (mode === 'login') {
				await login({ email: form.email, password: form.password });
				setMessage('登入成功！');
				// 登入成功後自動跳轉到儀表板
				setTimeout(() => navigate('/'), 1000);
			} else {
				await signup({ username: form.username, email: form.email, password: form.password });
				setMessage('註冊並登入成功！');
				// 註冊成功後自動跳轉到儀表板
				setTimeout(() => navigate('/'), 1000);
			}
		} catch (err) {
			if (err instanceof Error) setMessage(err.message);
		}
	};

	return (
		<Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 3, sm: 5 }, minHeight: '100%', bgcolor: '#fafafa' }}>
			<Stack spacing={3} maxWidth={480} mx="auto">
				<Box textAlign="center">
					<Typography variant="h5" fontWeight={800}>
						帳號中心
					</Typography>
					<Typography variant="body2" color="text.secondary">
						登入或註冊以管理收藏、名額扣減與後續會員功能。
					</Typography>
				</Box>

				<Card>
					<CardContent component="form" onSubmit={handleSubmit}>
						<Stack spacing={2}>
							<ToggleButtonGroup
								value={mode}
								exclusive
								onChange={(_, value) => value && setMode(value)}
								size="small"
							>
								<ToggleButton value="login">登入</ToggleButton>
								<ToggleButton value="signup">註冊</ToggleButton>
							</ToggleButtonGroup>

							{mode === 'signup' && (
								<TextField
									label="使用者名稱"
									name="username"
									value={form.username}
									onChange={handleChange}
									required
									fullWidth
								/>
							)}
							<TextField
								label="電子郵件"
								type="email"
								name="email"
								value={form.email}
								onChange={handleChange}
								required
								fullWidth
							/>
							<TextField
								label="密碼"
								type="password"
								name="password"
								value={form.password}
								onChange={handleChange}
								required
								fullWidth
							/>

							<Button type="submit" variant="contained" size="large" disabled={loading}>
								{mode === 'login' ? '登入' : '註冊'}
							</Button>

							{(message || error) && (
								<Alert severity={message?.includes('成功') ? 'success' : 'error'}>
									{message || error}
								</Alert>
							)}
						</Stack>
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
}

