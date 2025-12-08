import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addFavoriteBrand, clearFavoriteBrands, fetchFavoriteBrands, removeFavoriteBrand } from '../lib/userApi';

const normalizeKey = (value: string) => value.trim().toLowerCase();

const toggleList = (list: string[], value: string) => {
	const key = normalizeKey(value);
	const exists = list.some((item) => normalizeKey(item) === key);
	return exists ? list.filter((item) => normalizeKey(item) !== key) : [...list, value];
};

type BrandFollowState = {
	mode: 'guest' | 'user';
	guestFollows: string[];
	userFollows: string[];
	loading: boolean;
	error: string | null;
	syncFromServer: (token: string) => Promise<void>;
	resetUserState: () => void;
	toggleFollow: (brandName: string, token?: string) => Promise<void> | void;
	clearFollows: (token?: string) => Promise<void> | void;
};

export const useBrandFollow = create<BrandFollowState>()(
	persist(
		(set, get) => ({
			mode: 'guest',
			guestFollows: [],
			userFollows: [],
			loading: false,
			error: null,
			async syncFromServer(token) {
				set({ loading: true, error: null });
				try {
					const items = await fetchFavoriteBrands(token);
					set({ userFollows: items, mode: 'user', loading: false });
				} catch (err) {
					set({
						loading: false,
						error: err instanceof Error ? err.message : '載入品牌關注失敗',
					});
					throw err;
				}
			},
			resetUserState() {
				set({ userFollows: [], mode: 'guest', loading: false, error: null });
			},
			async toggleFollow(brandName, token) {
				const name = brandName.trim();
				if (!name) return;
				if (!token) {
					set((state) => ({
						guestFollows: toggleList(state.guestFollows, name),
						mode: state.mode === 'user' ? state.mode : 'guest',
					}));
					return;
				}
				set({ loading: true, error: null });
				try {
					const hasFollow = get().userFollows.some((b) => normalizeKey(b) === normalizeKey(name));
					const items = hasFollow
						? await removeFavoriteBrand(token, name)
						: await addFavoriteBrand(token, name);
					set({ userFollows: items, mode: 'user', loading: false });
				} catch (err) {
					set({
						loading: false,
						error: err instanceof Error ? err.message : '更新品牌關注失敗',
					});
					throw err;
				}
			},
			async clearFollows(token) {
				if (!token) {
					set({ guestFollows: [] });
					return;
				}
				set({ loading: true, error: null });
				try {
					const items = await clearFavoriteBrands(token);
					set({ userFollows: items, mode: 'user', loading: false });
				} catch (err) {
					set({
						loading: false,
						error: err instanceof Error ? err.message : '清除品牌關注失敗',
					});
					throw err;
				}
			},
		}),
		{
			name: 'brand-follow',
			partialize: (state) => ({ guestFollows: state.guestFollows }),
			onRehydrateStorage: () => (state) => {
				if (!state) return;
				state.mode = 'guest';
				state.userFollows = [];
				state.loading = false;
				state.error = null;
			},
		},
	),
);


