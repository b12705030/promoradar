import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addPromotionFavorite, clearPromotionFavorites, fetchPromotionFavorites, removePromotionFavorite } from '../lib/userApi';

type FavoriteState = {
	mode: 'guest' | 'user';
	guestFavorites: number[];
	userFavorites: number[];
	loading: boolean;
	error: string | null;
	toggleFavorite: (promoId: number, token?: string) => Promise<void> | void;
	clearFavorites: (token?: string) => Promise<void>;
	syncFromServer: (token: string) => Promise<void>;
	resetUserFavorites: () => void;
};

const toggleIds = (list: number[], promoId: number) => {
	return list.includes(promoId) ? list.filter((id) => id !== promoId) : [...list, promoId];
};

export const usePromotionFavorites = create<FavoriteState>()(
	persist(
		(set, get) => ({
			mode: 'guest',
			guestFavorites: [],
			userFavorites: [],
			loading: false,
			error: null,
			async syncFromServer(token) {
				set({ loading: true, error: null });
				try {
					const list = await fetchPromotionFavorites(token);
					set({ userFavorites: list, mode: 'user', loading: false });
				} catch (err) {
					set({
						loading: false,
						error: err instanceof Error ? err.message : '載入收藏失敗',
					});
					throw err;
				}
			},
			resetUserFavorites() {
				set({ userFavorites: [], mode: 'guest', loading: false, error: null });
			},
			async toggleFavorite(promoId, token) {
				if (!promoId) return;
				if (!token) {
					set((state) => ({
						guestFavorites: toggleIds(state.guestFavorites, promoId),
						mode: state.mode === 'user' ? state.mode : 'guest',
					}));
					return;
				}
				set({ loading: true, error: null });
				try {
					const hasFavorite = get().userFavorites.includes(promoId);
					const next = hasFavorite
						? await removePromotionFavorite(token, promoId)
						: await addPromotionFavorite(token, promoId);
					set({ userFavorites: next, mode: 'user', loading: false });
				} catch (err) {
					set({
						loading: false,
						error: err instanceof Error ? err.message : '更新收藏失敗',
					});
					throw err;
				}
			},
			async clearFavorites(token) {
				if (!token) {
					set({ guestFavorites: [] });
					return;
				}
				set({ loading: true, error: null });
				try {
					const next = await clearPromotionFavorites(token);
					set({ userFavorites: next, mode: 'user', loading: false });
				} catch (err) {
					set({
						loading: false,
						error: err instanceof Error ? err.message : '清除收藏失敗',
					});
					throw err;
				}
			},
		}),
		{
			name: 'promotion-favorites',
			partialize: (state) => ({ guestFavorites: state.guestFavorites }),
			onRehydrateStorage: () => (state) => {
				if (!state) return;
				state.mode = 'guest';
				state.userFavorites = [];
				state.loading = false;
				state.error = null;
			},
		},
	),
);

