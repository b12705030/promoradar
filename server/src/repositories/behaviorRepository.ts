import { getMongoDb } from '../lib/mongodbClient';

export type UserBehaviorAction =
	| 'click_promo'
	| 'view_promo'
	| 'search'
	| 'filter'
	| 'open_map'
	| 'open_brand'
	| 'scroll_list';

export type AdminAction = 'create_promo' | 'update_promo' | 'delete_promo' | 'edit_store';

export interface UserBehaviorLog {
	user_id: string;
	action: UserBehaviorAction;
	promo_id?: string | null;
	brand_name?: string | null;
	search_keyword?: string | null;
	tags?: string[] | null;
	timestamp: Date;
}

export interface AdminActionLog {
	admin_id: string;
	brand_name?: string | null;
	action: AdminAction;
	promo_id?: string | null;
	store_id?: string | null;
	timestamp: Date;
}

export const behaviorRepository = {
	async logUserBehavior(log: Omit<UserBehaviorLog, 'timestamp'>): Promise<void> {
		try {
			const db = await getMongoDb();
			// 構建文檔，只包含非 null 的欄位（MongoDB Schema 驗證可能不允許 null）
			const doc: any = {
				user_id: log.user_id,
				action: log.action,
				timestamp: new Date(),
			};
			if (log.promo_id != null) doc.promo_id = log.promo_id;
			if (log.brand_name != null) doc.brand_name = log.brand_name;
			if (log.search_keyword != null) doc.search_keyword = log.search_keyword;
			if (log.tags != null && log.tags.length > 0) doc.tags = log.tags;
			
			await db.collection('users_behavior').insertOne(doc);
		} catch (error) {
			// 記錄錯誤但不中斷主流程
			console.error('[behaviorRepository] Failed to log user behavior:', error);
		}
	},

	async logAdminAction(log: Omit<AdminActionLog, 'timestamp'>): Promise<void> {
		try {
			const db = await getMongoDb();
			// 構建文檔，只包含非 null 的欄位
			const doc: any = {
				admin_id: log.admin_id,
				action: log.action,
				timestamp: new Date(),
			};
			if (log.brand_name != null) doc.brand_name = log.brand_name;
			if (log.promo_id != null) doc.promo_id = log.promo_id;
			if (log.store_id != null) doc.store_id = log.store_id;
			
			await db.collection('admin_actions').insertOne(doc);
		} catch (error) {
			// 記錄錯誤但不中斷主流程
			console.error('[behaviorRepository] Failed to log admin action:', error);
		}
	},
};

