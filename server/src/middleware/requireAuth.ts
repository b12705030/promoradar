import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export type AuthPayload = {
	userId: number;
	isAdmin: boolean;
	email: string;
};

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			auth?: AuthPayload;
		}
	}
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const header = req.headers.authorization;
	if (!header || !header.startsWith('Bearer ')) {
		return res.status(401).json({ message: 'Missing authorization header' });
	}
	const token = header.slice(7);
	try {
		const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
		req.auth = payload;
		return next();
	} catch {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
}

