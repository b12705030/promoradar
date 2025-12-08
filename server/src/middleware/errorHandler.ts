import type { Request, Response, NextFunction } from 'express';

type AppError = Error & { status?: number };

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
	const status = err.status ?? 500;
	const message = err.message || 'Unexpected error';
	if (process.env.NODE_ENV !== 'test') {
		console.error('[error]', err);
	}
	res.status(status).json({ message });
}

