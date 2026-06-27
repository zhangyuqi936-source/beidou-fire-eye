<template>
  <view class="app-root" :data-theme="currentTheme">
    <router-view />
  </view>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { getCurrentTheme, applyTheme } from '@/utils/theme-manager.js';

const currentTheme = ref('light');

onMounted(() => {
  currentTheme.value = getCurrentTheme();
  applyTheme(currentTheme.value);

  /* 监听系统主题变化 */
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => {
      const stored = uni.getStorageSync('theme-mode') || 'auto';
      if (stored === 'auto') {
        currentTheme.value = e.matches ? 'dark' : 'light';
        applyTheme(currentTheme.value);
      }
    });
  }
});

/* 全局网络状态监听 */
uni.onNetworkStatusChange((res) => {
  if (!res.isConnected) {
    uni.showToast({ title: '网络已断开，部分功能受限', icon: 'none', duration: 2000 });
  }
});
</script>

<style lang="scss">
@import '~@/static/theme.scss';

.app-root {
  min-height: 100vh;
  background: $bg-page;
  font-family: $font-sans;
  color: $text-primary;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 全局过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
