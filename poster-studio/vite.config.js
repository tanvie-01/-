import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Poster Studio is shipped as a section of the Notice App: the production
// build goes straight into ../bengali-notice-app/poster/ (relative base, so
// it works from any sub-path) with stable, un-hashed file names so the
// Notice App's service worker can pre-cache it for offline use.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../bengali-notice-app/poster',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/poster-studio.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
