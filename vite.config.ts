import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        sourcemapExcludeSources: false,
      },
    },
    minify: 'esbuild',
  },
  server: {
    sourcemapIgnoreList: false,
    hmr: {
      overlay: false, // Disable error overlay which can cause source map issues
    },
  },
  esbuild: {
    sourcemap: true,
  },
  define: {
    // Ensure proper environment variables for development
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
});
