<template>
  <view class="page">
    <view class="header">
      <text class="header-title">新手引导</text>
      <text class="skip-btn" @click="skip">跳过</text>
    </view>
    <swiper class="swiper" :current="current" @change="onSwipe" circular>
      <swiper-item v-for="(step, i) in steps" :key="i">
        <view class="slide" :style="{ background: step.bg }">
          <text class="slide-icon">{{ step.icon }}</text>
          <text class="slide-title">{{ step.title }}</text>
          <text class="slide-desc">{{ step.desc }}</text>
        </view>
      </swiper-item>
    </swiper>
    <view class="dots">
      <view class="dot" v-for="(_, i) in steps" :key="i" :class="{ active: i === current }"></view>
    </view>
    <view class="next-btn" @click="next">{{ current < steps.length - 1 ? '下一步' : '开始使用' }}</view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const current = ref(0);
const steps = [
  { icon: '📷', title: '拍照检查', desc: '拍摄消防场景照片，AI 自动识别隐患并匹配法规', bg: 'linear-gradient(135deg, #D92121, #F97316)' },
  { icon: '📋', title: '生成报告', desc: '一键生成包含法规依据和整改建议的检查报告', bg: 'linear-gradient(135deg, #F97316, #EAB308)' },
  { icon: '📚', title: '法规查询', desc: '内置消防国标法规库，支持搜索和自定义法规', bg: 'linear-gradient(135deg, #EAB308, #16A34A)' },
  { icon: '⚙️', title: '智能设置', desc: '配置 AI 服务、切换深色主题，适配各种使用场景', bg: 'linear-gradient(135deg, #16A34A, #3B82F6)' }
];

const onSwipe = (e) => { current.value = e.detail.current; };
const next = () => {
  if (current.value < steps.length - 1) { current.value++; }
  else { skip(); }
};
const skip = () => {
  uni.setStorageSync('onboarding_done', true);
  uni.switchTab({ url: '/pages/index/index' });
};
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';

.page { min-height: 100vh; display: flex; flex-direction: column; }
.header { @include flex-between; padding: 16px 20px; }
.header-title { font-family: $font-serif; font-size: $fs-h2; font-weight: 700; }
.skip-btn { font-size: $fs-body; color: $brand-red-primary; }

.swiper { flex: 1; }
.slide { @include flex-center; flex-direction: column; height: 100%; padding: 40px; color: #fff; text-align: center; }
.slide-icon { font-size: 72px; margin-bottom: 24px; }
.slide-title { font-family: $font-serif; font-size: 28px; font-weight: 700; margin-bottom: 12px; }
.slide-desc { font-size: $fs-body; opacity: 0.9; line-height: 1.6; }

.dots { @include flex-center; gap: 8px; padding: 16px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: $border-color;
  &.active { background: $brand-red-primary; width: 24px; border-radius: 4px; }
}

.next-btn { @include btn-primary; margin: 16px 20px 32px; }
</style>
