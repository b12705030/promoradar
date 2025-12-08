import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';

export function createServer() {
	const app = express();

	app.use(helmet());

	app.use((_req, res, next) => {
		res.set('Cache-Control', 'no-store');
		next();
	});
	
	app.use(
		cors({
			origin: [
				'http://localhost:4000', 
				'http://localhost:5173',
				'http://192.168.1.110:4000',
				process.env.FRONTEND_URL, // 生產環境前端網址
			].filter((url): url is string => typeof url === 'string'), // 移除 undefined
			credentials: true,
		}),
	);
	app.use(express.json());
	app.use(morgan('dev'));

	app.get('/health', (_req, res) => {
		res.json({ status: 'ok', time: new Date().toISOString() });
	});

	app.use('/api', routes);

	app.use(notFoundHandler);
	app.use(errorHandler);

	return app;
}

