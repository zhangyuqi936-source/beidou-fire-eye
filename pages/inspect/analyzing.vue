<template>
  <view class="page">
    <view class="analyzing-container" v-if="!error">
      <!-- 旋转动画 -->
      <view class="spinner"></view>

      <!-- 状态文字 -->
      <text class="analyzing-title">AI正在识别消防隐患</text>
      <text class="analyzing-desc">{{ statusText }}</text>

      <!-- 链路步骤预览 -->
      <view class="chain-preview" v-if="chainSteps.length > 0">
        <view class="chain-step" v-for="(step, i) in chainSteps" :key="i"
          :class="{ active: step.active, done: step.done }">
          <text class="step-icon">{{ step.done ? '✅' : step.active ? '⏳' : '○' }}</text>
          <text class="step-text">{{ step.text }}</text>
        </view>
      </view>
    </view>

    <!-- 失败态 -->
    <view class="error-state" v-else>
      <text class="error-icon">❌</text>
      <text class="error-title">识别失败</text>
      <text class="error-msg">{{ error }}</text>
      <view class="retry-btn" @click="startAnalysis">🔄 重试</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { recognizeImage } from '@/utils/ai-service.js';

const statusText = ref('正在上传图片...');
const error = ref(null);
const chainSteps = ref([
  { text: '场景分类', active: false, done: false },
  { text: 'Layer1 消防设施检测', active: false, done: false },
  { text: 'Layer2 通道环境检测', active: false, done: false },
  { text: 'Layer3 危险源检测', active: false, done: false },
  { text: '风险量化', active: false, done: false },
  { text: '法规匹配', active: false, done: false },
  { text: '报告生成', active: false, done: false }
]);

const statusMessages = [
  '正在上传图片...',
  '正在进行场景分类...',
  'Layer1 检测消防设施状态...',
  'Layer2 检查疏散通道环境...',
  'Layer3 检测危险源...',
  '正在进行风险量化评估...',
  '正在匹配消防法规条款...',
  '正在生成检查报告...'
];

const updateChain = (index) => {
  chainSteps.value.forEach((s, i) => {
    if (i < index) { s.done = true; s.active = false; }
    else if (i === index) { s.active = true; s.done = false; }
    else { s.active = false; s.done = false; }
  });
  if (index < statusMessages.length) {
    statusText.value = statusMessages[index];
  }
};

const startAnalysis = async () => {
  error.value = null;
  const imageBase64 = uni.getStorageSync('capture_image');
  if (!imageBase64) {
    error.value = '未找到待识别的图片，请返回重新拍照';
    return;
  }

  /* Simulate chain steps */
  let step = 0;
  const interval = setInterval(() => {
    updateChain(step);
    step++;
    if (step >= chainSteps.value.length) clearInterval(interval);
  }, 800);

  try {
    const result = await recognizeImage(imageBase64, 'image/jpeg');
    clearInterval(interval);
    /* Mark all done */
    chainSteps.value.forEach(s => { s.done = true; s.active = false; });
    statusText.value = '识别完成！';
    /* Navigate to result */
    setTimeout(() => {
      uni.setStorageSync('recognition_result', JSON.stringify(result));
      uni.redirectTo({ url: '/pages/inspect/result' });
    }, 500);
  } catch (e) {
    clearInterval(interval);
    error.value = e.message || '识别服务异常，请重试';
  }
};

onMounted(() => { startAnalysis(); });
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';

.page { @include page-base; @include flex-center; flex-direction: column; }

.analyzing-container { @include flex-center; flex-direction: column; padding: $spacing-xl; }

.spinner {
  width: 56px; height: 56px;
  border: 4px solid $brand-red-light;
  border-top-color: $brand-red-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: $spacing-lg;
}
@keyframes spin { to { transform: rotate(360deg); } }

.analyzing-title { font-family: $font-serif; font-size: $fs-h2; font-weight: 700; color: $text-primary; }
.analyzing-desc { font-size: $fs-desc; color: $text-secondary; margin-top: $spacing-sm; }

.chain-preview {
  margin-top: $spacing-lg; width: 100%; max-width: 300px;
  display: flex; flex-direction: column; gap: 6px;
}
.chain-step {
  display: flex; align-items: center; gap: $spacing-sm;
  padding: 8px 12px; border-radius: $radius-md;
  font-size: $fs-caption; color: $text-tertiary;
  background: #F9FAFB;
  &.active { color: $brand-red-primary; background: $brand-red-light; }
  &.done { color: $safe-green; background: #DCFCE7; }
}
.step-icon { font-size: 14px; }
.step-text { flex: 1; }

.error-state { @include flex-center; flex-direction: column; padding: $spacing-xl; text-align: center; }
.error-icon { font-size: 48px; }
.error-title { font-size: $fs-h2; font-weight: 700; color: $error-red; margin-top: $spacing-base; }
.error-msg { font-size: $fs-desc; color: $text-secondary; margin-top: $spacing-sm; }
.retry-btn { @include btn-primary; margin-top: $spacing-lg; max-width: 200px; }
</style>
