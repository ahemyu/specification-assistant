import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/upload': 'http://localhost:8000',
      '/delete-pdf': 'http://localhost:8000',
      '/download': 'http://localhost:8000',
      '/preview': 'http://localhost:8000',
      '/pdf': 'http://localhost:8000',
      '/ask-question-stream': 'http://localhost:8000',
      '/extract-keys': 'http://localhost:8000',
      '/upload-excel-template': 'http://localhost:8000',
      '/extract-keys-from-template': 'http://localhost:8000',
      '/download-filled-excel': 'http://localhost:8000',
      '/download-extraction-excel': 'http://localhost:8000',
      '/detect-product-type': 'http://localhost:8000',
      '/compare-pdfs': 'http://localhost:8000',
      '/detect-core-winding-count': 'http://localhost:8000',
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
  }
})
