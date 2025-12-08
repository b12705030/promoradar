import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchPromotionUsage, markPromotionUsed } from '../lib/userApi';
import type { PromotionUsageEntry } from '../types/promo';

type UsageEntry = {
	count: number;
	lastUsed?: string | null;
};

const toRecord = (items: PromotionUsageEntry[]): Record<number, UsageEntry> =>
	items.reduce<Record<number, UsageEntry>>((acc, item) => {
		acc[item.promoId] = { count: item.count, lastUsed: item.lastUsed };
		return acc;
	}, {});

type UsageState = {
	mode: 'guest' | 'user';
	guestUsage: Record<number, UsageEntry>;
	userUsage: Record<number, UsageEntry>;
	loading: boolean;
	error: string | null;
	markUsed: (promoId: number, token?: string) => Promise<void> | void;
	resetUsage: (promoId: number) => void;
	syncFromServer: (token: string) => Promise<void>;
	resetUserUsage: () => void;
};

export const usePromotionUsage = create<UsageState>()(
	persist(
		(set, get) => ({
			mode: 'guest',
			guestUsage: {},
			userUsage: {},
			loading: false,
			error: null,
			async syncFromServer(token) {
				set({ loading: true, error: null });
				try {
					const list = await fetchPromotionUsage(token);
					set({ userUsage: toRecord(list), mode: 'user', loading: false });
				} catch (err) {
					set({
						loading: false,
						error: err instanceof Error ? err.message : '載入使用紀錄失敗',
					});
					throw err;
				}
			},
			resetUserUsage() {
				set({ userUsage: {}, mode: 'guest', loading: false, error: null });
			},
			async markUsed(promoId, token) {
				if (!token) {
					set((state) => {
						const current = state.guestUsage[promoId] ?? { count: 0 };
						return {
							guestUsage: {
								...state.guestUsage,
								[promoId]: {
									count: current.count + 1,
									lastUsed: new Date().toISOString(),
								},
							},
						};
					});
					return;
				}
				set({ loading: true, error: null });
				try {
					const usage = await markPromotionUsed(token, promoId);
					if (usage) {
						set((state) => ({
							userUsage: {
								...state.userUsage,
								[usage.promoId]: { count: usage.count, lastUsed: usage.lastUsed },
							},
							mode: 'user',
							loading: false,
						}));
					} else {
						set({ loading: false });
					}
				} catch (err) {
					set({
						loading: false,
						error: err instanceof Error ? err.message : '紀錄使用失敗',
					});
					throw err;
				}
			},
			resetUsage(promoId) {
				set((state) => {
					const source = state.mode === 'user' ? 'userUsage' : 'guestUsage';
					if (!state[source][promoId]) return state;
					const next = { ...state[source] };
					delete next[promoId];
					return { [source]: next } as Partial<UsageState>;
				});
			},
		}),
		{
			name: 'promotion-usage',
			partialize: (state) => ({ guestUsage: state.guestUsage }),
			onRehydrateStorage: () => (state) => {
				if (!state) return;
				state.mode = 'guest';
				state.userUsage = {};
				state.loading = false;
				state.error = null;
			},
		},
	),
);

