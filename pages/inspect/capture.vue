<template>
  <view class="page">
    <!-- 图片预览区 -->
    <view class="preview-area" v-if="!imageSrc">
      <text class="preview-icon">📷</text>
      <text class="preview-hint">拍摄消防场景照片\nAI 将自动识别隐患</text>
    </view>
    <view class="preview-area has-image" v-else>
      <image :src="imageSrc" mode="aspectFit" class="preview-image" />
    </view>

    <!-- 操作区 -->
    <view class="action-area">
      <template v-if="!imageSrc">
        <view class="btn-primary" @click="takePhoto">📸 拍照</view>
        <view class="btn-secondary" @click="pickFromAlbum">🖼️ 从相册选择</view>
      </template>
      <template v-else>
        <view class="btn-primary" @click="startRecognize">🔍 开始识别</view>
        <view class="btn-secondary" @click="reSelect">🔄 重新选择</view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { showLoading, hideLoading } from '@/utils/loading-service.js';

const imageSrc = ref('');
const imageBase64 = ref('');

const takePhoto = () => {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res) => {
      imageSrc.value = res.tempFilePaths[0];
      convertToBase64(res.tempFilePaths[0]);
    }
  });
};

const pickFromAlbum = () => {
  uni.chooseImage({
    count: 1,
    sourceType: ['album'],
    success: (res) => {
      imageSrc.value = res.tempFilePaths[0];
      convertToBase64(res.tempFilePaths[0]);
    }
  });
};

const convertToBase64 = (path) => {
  uni.getFileSystemManager().readFile({
    filePath: path,
    encoding: 'base64',
    success: (res) => { imageBase64.value = res.data; }
  });
};

const reSelect = () => {
  imageSrc.value = '';
  imageBase64.value = '';
};

const startRecognize = () => {
  if (!imageBase64.value) {
    uni.showToast({ title: '请先选择图片', icon: 'none' });
    return;
  }
  uni.setStorageSync('capture_image', imageBase64.value);
  uni.navigateTo({ url: '/pages/inspect/analyzing' });
};
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';

.page { @include page-base; display: flex; flex-direction: column; }

.preview-area {
  flex: 1;
  @include flex-center;
  flex-direction: column;
  background: #F0F0F0;
  margin: $spacing-base;
  border-radius: $radius-xl;
  min-height: 300px;
  &.has-image { background: #E8E8E8; padding: 0; }
}
.preview-icon { font-size: 64px; opacity: 0.5; }
.preview-hint { font-size: $fs-desc; color: $text-tertiary; margin-top: $spacing-base; text-align: center; white-space: pre-line; }
.preview-image { width: 100%; height: 100%; border-radius: $radius-xl; }

.action-area {
  padding: $spacing-base;
  display: flex; flex-direction: column; gap: 10px;
  @include safe-bottom(16px);
}
.btn-primary { @include btn-primary; }
.btn-secondary { @include btn-secondary; }
</style>
