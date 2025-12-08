import { z } from 'zod';
import { userRepository } from '../repositories/userRepository';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/token';

const signupSchema = z.object({
	username: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(6),
});

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

export const authService = {
	async signup(payload: unknown) {
		const data = signupSchema.parse(payload);
		const existing = await userRepository.findByEmail(data.email);
		if (existing) {
			const err = new Error('Email already registered');
			(err as Error & { status?: number }).status = 409;
			throw err;
		}
		const record = await userRepository.create({
			username: data.username,
			email: data.email,
			passwordHash: hashPassword(data.password),
			isAdmin: false,
		});
		const token = signToken({ userId: record.userId, email: record.email, isAdmin: record.isAdmin });
		return { token, user: { userId: record.userId, username: record.username, email: record.email, isAdmin: record.isAdmin } };
	},

	async login(payload: unknown) {
		const data = loginSchema.parse(payload);
		const user = await userRepository.findByEmail(data.email);
		if (!user || !verifyPassword(data.password, user.passwordHash)) {
			const err = new Error('Invalid email or password');
			(err as Error & { status?: number }).status = 401;
			throw err;
		}
		const token = signToken({ userId: user.userId, email: user.email, isAdmin: user.isAdmin });
		return { token, user: { userId: user.userId, username: user.username, email: user.email, isAdmin: user.isAdmin } };
	},
};

