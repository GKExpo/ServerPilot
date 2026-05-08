const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-renderer',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
