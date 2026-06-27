import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import path from 'path';

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: ''
      }
    }
  },
  server: {
    port: 8000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist/build/h5',
    assetsInlineLimit: 4096,
    cssCodeSplit: false
  }
});
