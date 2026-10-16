import { defineConfig } from 'vite';

// Relative base so the same build runs on itch.io, GitHub Pages or any sub-folder.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
});
