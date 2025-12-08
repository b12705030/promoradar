import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
	PORT: z.coerce.number().default(5050),
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	DATABASE_URL: z.string().default('postgresql://postgres:password@localhost:5432/promo'),
	JWT_SECRET: z.string().min(8).default('dev-secret-please-change'),
	MONGODB_URI: z.string().optional(),
	MONGODB_DB_NAME: z.string().default('coupon_radar'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const config: EnvConfig = envSchema.parse({
	PORT: process.env.PORT,
	NODE_ENV: process.env.NODE_ENV,
	DATABASE_URL: process.env.DATABASE_URL,
	JWT_SECRET: process.env.JWT_SECRET,
	MONGODB_URI: process.env.MONGODB_URI,
	MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
});

