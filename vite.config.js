import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'assets',
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/main.jsx',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'index.js',
        assetFileNames: 'index.[ext]',
      },
    },
  },
});
