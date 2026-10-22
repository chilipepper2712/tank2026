import { defineConfig } from 'vite';
import pkg from './package.json';

// Relative base so the same build runs on itch.io, GitHub Pages or any sub-folder.
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
});
