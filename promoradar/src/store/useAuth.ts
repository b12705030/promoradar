import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '../lib/apiClient';

type AuthUser = {
	userId: number;
	username: string;
	email: string;
	isAdmin: boolean;
};

type AuthState = {
	token: string | null;
	user: AuthUser | null;
	loading: boolean;
	error: string | null;
	adminBrands: string[];
	login: (input: { email: string; password: string }) => Promise<void>;
	signup: (input: { username: string; email: string; password: string }) => Promise<void>;
	logout: () => void;
	setAdminBrands: (brands: string[]) => void;
};

type AuthResponse = {
	token: string;
	user: AuthUser;
};

export const useAuth = create<AuthState>()(
	persist(
		(set) => ({
			token: null,
			user: null,
			loading: false,
			error: null,
			adminBrands: [],
			login: async (input) => {
				set({ loading: true, error: null });
				try {
					const data = await apiFetch<AuthResponse>('/auth/login', {
						method: 'POST',
						body: JSON.stringify(input),
					});
					set({ token: data.token, user: data.user, loading: false, adminBrands: [] });
				} catch (err) {
					set({ error: err instanceof Error ? err.message : '登入失敗', loading: false });
					throw err;
				}
			},
			signup: async (input) => {
				set({ loading: true, error: null });
				try {
					const data = await apiFetch<AuthResponse>('/auth/signup', {
						method: 'POST',
						body: JSON.stringify(input),
					});
					set({ token: data.token, user: data.user, loading: false, adminBrands: [] });
				} catch (err) {
					set({ error: err instanceof Error ? err.message : '註冊失敗', loading: false });
					throw err;
				}
			},
			logout: () => set({ token: null, user: null, adminBrands: [] }),
			setAdminBrands: (brands) => set({ adminBrands: brands }),
		}),
		{
			name: 'promo-auth',
			partialize: ({ token, user }) => ({ token, user }),
		},
	),
);

