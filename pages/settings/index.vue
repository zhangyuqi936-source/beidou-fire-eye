<template>
  <view class="page">
    <text class="page-title">AI服务设置</text>
    <text class="page-desc">配置 DeepSeek API 和其他选项</text>

    <view class="section">
      <text class="section-title">API 配置</text>
      <view class="form-item">
        <text class="form-label">API Key</text>
        <input class="form-input" type="password" v-model="apiKey" placeholder="sk-..." />
      </view>
      <view class="form-item">
        <text class="form-label">Base URL</text>
        <input class="form-input" v-model="baseUrl" placeholder="https://api.deepseek.com" />
      </view>
      <view class="form-item">
        <text class="form-label">模型</text>
        <input class="form-input" v-model="model" placeholder="deepseek-chat" />
      </view>
      <view class="btn-secondary" @click="testConnection">🔗 测试连接</view>
    </view>

    <view class="section">
      <text class="section-title">深色主题</text>
      <view class="theme-options">
        <view class="theme-opt" v-for="t in themes" :key="t.key" :class="{ active: currentTheme === t.key }" @click="setTheme(t.key)">
          <text class="theme-icon">{{ t.icon }}</text>
          <text class="theme-label">{{ t.label }}</text>
        </view>
      </view>
    </view>

    <view class="nav-item" @click="goFeedback">
      <text class="nav-label">📝 反馈收集</text>
      <text class="nav-arrow">→</text>
    </view>

    <view class="version-info">
      <text class="version-text">北斗火眼·消防智查 v3.0.0</text>
      <text class="version-text">BDHY-Hybrid Hazard Recognition v1</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { setTheme, getThemeMode } from '@/utils/theme-manager.js';

const apiKey = ref('');
const baseUrl = ref('https://api.deepseek.com');
const model = ref('deepseek-chat');
const currentTheme = ref(getThemeMode());
const themes = [
  { key: 'auto', icon: '🌞', label: '跟随系统' },
  { key: 'light', icon: '☀️', label: '浅色' },
  { key: 'dark', icon: '🌙', label: '深色' }
];

const switchTheme = (mode) => {
  setTheme(mode);
  currentTheme.value = mode;
};
const testConnection = () => uni.showToast({ title: '连接测试功能开发中', icon: 'none' });
const goFeedback = () => uni.navigateTo({ url: '/pages/feedback/index' });
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; padding: $spacing-base; padding-bottom: 80px; }
.page-title { font-family: $font-serif; font-size: $fs-h2; font-weight: 700; display: block; }
.page-desc { font-size: $fs-desc; color: $text-secondary; margin-top: 4px; display: block; }
.section { @include card-base; padding: $spacing-base; margin-top: $spacing-base; }
.section-title { font-family: $font-serif; font-size: $fs-h3; font-weight: 700; margin-bottom: 12px; display: block; }
.form-item { margin-bottom: 12px; }
.form-label { font-size: $fs-desc; color: $text-secondary; display: block; margin-bottom: 4px; }
.form-input { width: 100%; padding: 10px 14px; border-radius: $radius-md; background: $bg-input; font-size: $fs-body; border: 1px solid $border-color; }
.theme-options { display: flex; gap: 8px; }
.theme-opt { flex: 1; padding: 12px; border-radius: $radius-md; text-align: center; background: $bg-page;
  &.active { background: $brand-red-light; }
}
.theme-icon { font-size: 20px; display: block; }
.theme-label { font-size: $fs-tag; color: $text-secondary; margin-top: 4px; display: block; }
.btn-secondary { @include btn-secondary; margin-top: 8px; }
.nav-item { @include flex-between; @include card-base; padding: 14px $spacing-base; margin-top: $spacing-base; }
.nav-label { font-size: $fs-body; color: $text-primary; }
.nav-arrow { font-size: $fs-body; color: $brand-red-primary; }
.version-info { text-align: center; padding: 24px; margin-top: $spacing-base; }
.version-text { font-size: $fs-tag; color: $text-placeholder; display: block; margin-top: 4px; }
</style>
