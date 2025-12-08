import type { UserRecord } from '../types/user';
import { supabase } from '../lib/supabaseClient';

const mapUser = (row: any): UserRecord => ({
	userId: row.user_id,
	username: row.username,
	email: row.email,
	passwordHash: row.password_hash ?? row.password ?? '',
	isAdmin: Boolean(row.is_admin),
	createdAt: row.created_at ?? new Date().toISOString(),
});

export const userRepository = {
	async findByEmail(email: string): Promise<UserRecord | undefined> {
		const { data, error } = await supabase.from('User').select('*').ilike('email', email).maybeSingle();
		if (error && error.code !== 'PGRST116') throw error;
		return data ? mapUser(data) : undefined;
	},

	async create(user: Omit<UserRecord, 'userId' | 'createdAt'>): Promise<UserRecord> {
		const { data: maxRow, error: maxError } = await supabase
			.from('User')
			.select('user_id')
			.order('user_id', { ascending: false })
			.limit(1)
			.maybeSingle();
		if (maxError && maxError.code !== 'PGRST116') throw maxError;
		const nextId = (maxRow?.user_id ?? 0) + 1;

		const payload = {
			user_id: nextId,
			username: user.username,
			email: user.email,
			password: user.passwordHash,
			is_admin: user.isAdmin ?? false,
			created_at: new Date().toISOString(),
		};
		const { data, error } = await supabase.from('User').insert(payload).select('*').single();
		if (error) throw error;
		return mapUser(data);
	},

	async findById(userId: number): Promise<UserRecord | undefined> {
		const { data, error } = await supabase.from('User').select('*').eq('user_id', userId).maybeSingle();
		if (error && error.code !== 'PGRST116') throw error;
		return data ? mapUser(data) : undefined;
	},

	async setAdminFlag(userId: number, isAdmin: boolean) {
		const { data, error } = await supabase
			.from('User')
			.update({ is_admin: isAdmin })
			.eq('user_id', userId)
			.select('*')
			.single();
		if (error) throw error;
		return mapUser(data);
	},
};

