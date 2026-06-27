<template>
  <view class="page">
    <view v-if="loading" class="skeleton"><view class="sk-card"></view></view>
    <view v-else>
      <view class="section-title">📹 视频检查</view>
      <view class="upload-area" @click="pickVideo" v-if="!videoPath">
        <text class="upload-icon">🎬</text>
        <text class="upload-hint">点击选择巡查视频\n支持 MP4/MOV，最大 100MB</text>
      </view>
      <view class="video-info" v-else>
        <text class="video-name">已选择: {{ videoName }}</text>
      </view>
      <view class="fps-selector">
        <text class="selector-label">抽帧频率</text>
        <view class="fps-options">
          <view class="fps-opt" v-for="f in [1,2,5]" :key="f" :class="{ active: fps === f }" @click="fps = f">{{ f }}帧/秒</view>
        </view>
      </view>
      <view class="btn-primary" @click="startAnalysis" v-if="videoPath">🔍 开始分析</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
const loading = ref(false);
const videoPath = ref('');
const videoName = ref('');
const fps = ref(1);

const pickVideo = () => {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    maxDuration: 60,
    success: (res) => {
      videoPath.value = res.tempFilePath;
      videoName.value = res.tempFilePath.split('/').pop();
    }
  });
};
const startAnalysis = () => {
  uni.showToast({ title: '视频分析功能开发中', icon: 'none' });
};
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; padding: $spacing-base; }
.section-title { font-family: $font-serif; font-size: $fs-h2; font-weight: 700; margin-bottom: $spacing-base; }
.upload-area { @include flex-center; flex-direction: column; background: $bg-card; border-radius: $radius-xl; padding: 48px; border: 2px dashed $border-color; }
.upload-icon { font-size: 48px; margin-bottom: 12px; }
.upload-hint { font-size: $fs-desc; color: $text-tertiary; text-align: center; white-space: pre-line; }
.video-info { padding: $spacing-base; background: $bg-card; border-radius: $radius-md; margin-bottom: $spacing-base; }
.video-name { font-size: $fs-desc; color: $text-secondary; }
.fps-selector { margin: $spacing-base 0; }
.selector-label { font-size: $fs-desc; color: $text-secondary; display: block; margin-bottom: 8px; }
.fps-options { display: flex; gap: 8px; }
.fps-opt { padding: 8px 16px; border-radius: $radius-md; background: $bg-card; font-size: $fs-desc; color: $text-secondary;
  &.active { background: $brand-red-primary; color: #fff; }
}
.btn-primary { @include btn-primary; margin-top: $spacing-base; }
.skeleton { padding: $spacing-base; }
.sk-card { height: 200px; @include skeleton-base; border-radius: $radius-xl; }
</style>
