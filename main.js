import { createSSRApp } from 'vue';
import App from './App.vue';
import { setupErrorHandler } from '@/utils/error-handler.js';

export function createApp() {
  const app = createSSRApp(App);

  /* 全局错误处理 */
  setupErrorHandler(app);

  return { app };
}
