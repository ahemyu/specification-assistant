import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173,
		proxy: {
			'/upload': {
				target: 'http://localhost:8000',
				changeOrigin: true
			},
			'/delete-pdf': {
				target: 'http://localhost:8000',
				changeOrigin: true
			},
			'/preview': {
				target: 'http://localhost:8000',
				changeOrigin: true
			},
			'/download': {
				target: 'http://localhost:8000',
				changeOrigin: true
			},
			'/ask-question-stream': {
				target: 'http://localhost:8000',
				changeOrigin: true
			},
			'/extract-keys': {
				target: 'http://localhost:8000',
				changeOrigin: true
			},
			'/upload-excel-template': {
				target: 'http://localhost:8000',
				changeOrigin: true
			},
			'/extract-keys-from-template': {
				target: 'http://localhost:8000',
				changeOrigin: true
			},
			'/download-extraction-excel': {
				target: 'http://localhost:8000',
				changeOrigin: true
			},
			'/download-filled-excel': {
				target: 'http://localhost:8000',
				changeOrigin: true
			}
		}
	}
});
