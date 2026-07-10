import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Fully disable HMR to prevent WebSocket connection errors in sandboxed environment
      hmr: false,
      // Disable file watching to save CPU during edits
      watch: null,
    },
  };
});
