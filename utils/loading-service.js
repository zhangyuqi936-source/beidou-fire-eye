/* ═══════════════════════════════════════════════════════════════
   loading-service.js — 全局加载状态管理
   ═══════════════════════════════════════════════════════════════ */

let loadingCount = 0;
let currentMessage = '';

export function showLoading(message = '加载中...') {
  loadingCount++;
  currentMessage = message;
  uni.showLoading({ title: message, mask: true });
}

export function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) {
    uni.hideLoading();
  }
}

export function updateLoadingMessage(message) {
  currentMessage = message;
  /* uni.showLoading doesn't support dynamic update, hide and re-show */
  uni.hideLoading();
  uni.showLoading({ title: message, mask: true });
}

export function isLoading() {
  return loadingCount > 0;
}

export function forceHideAll() {
  loadingCount = 0;
  uni.hideLoading();
}
