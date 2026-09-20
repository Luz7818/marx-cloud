import { defineConfig } from 'vite';

// base './' 使产物可部署到任意子路径(GitHub Pages、静态服务器)
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 900
  }
});
