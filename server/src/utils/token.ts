import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import type { AuthPayload } from '../middleware/requireAuth';

export function signToken(payload: AuthPayload) {
	return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '2h' });
}

