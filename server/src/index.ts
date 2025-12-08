import { createServer } from './server';
import { config } from './config/env';

const app = createServer();

app.listen(config.PORT, () => {
	console.log(`[server] listening on port ${config.PORT}`);
});

