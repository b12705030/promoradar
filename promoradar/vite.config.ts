import { defineConfig } from 'vite';

export default defineConfig({
	base: '/',
	plugins: [],
	server: {
		port: 4000,
		host: true,
		strictPort: true,
	},
});
