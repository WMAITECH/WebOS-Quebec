import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react', '@mlc-ai/web-llm'],
  },
  resolve: {
    alias: {
      '@mlc-ai/web-llm': '@mlc-ai/web-llm',
    },
  },
  build: {
    rollupOptions: {
      external: ['@mlc-ai/web-llm'],
    },
  },
  server: {
    open: '/WOSQ.html',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  publicDir: 'public',
});
