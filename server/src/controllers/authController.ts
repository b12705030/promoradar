import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

export const authController = {
	async signup(req: Request, res: Response, next: NextFunction) {
		try {
			const result = await authService.signup(req.body);
			res.status(201).json(result);
		} catch (err) {
			next(err);
		}
	},

	async login(req: Request, res: Response, next: NextFunction) {
		try {
			const result = await authService.login(req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	},
};

