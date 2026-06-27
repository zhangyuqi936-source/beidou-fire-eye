<template>
  <view class="page" v-if="law">
    <text class="law-code">{{ law.code }}</text>
    <text class="law-name">{{ law.name }}</text>
    <view class="tag-row">
      <text class="tag">{{ law.category }}</text>
      <text class="tag" v-if="law.level">{{ law.level }}</text>
    </view>
    <view class="content-card" v-if="law.content">
      <text class="content-label">条款内容</text>
      <text class="content-text">{{ law.content }}</text>
    </view>
    <view class="content-card" v-if="law.penalty">
      <text class="content-label">处罚标准</text>
      <text class="penalty-text">{{ law.penalty }}</text>
    </view>
    <view class="empty-state" v-if="!law.content && !law.penalty">
      <text class="empty-text">暂无详细信息</text>
    </view>
  </view>
  <view class="page flex-center" v-else>
    <text class="empty-text">未找到法规信息</text>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const law = ref(null);
onMounted(() => {
  try { law.value = JSON.parse(uni.getStorageSync('law_detail')); } catch (_) {}
});
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; padding: $spacing-base; }
.flex-center { @include flex-center; }
.law-code { font-family: $font-mono; font-size: $fs-caption; color: $brand-red-primary; font-weight: 700; display: block; }
.law-name { font-family: $font-serif; font-size: $fs-h2; font-weight: 700; margin-top: 4px; display: block; }
.tag-row { display: flex; gap: 8px; margin-top: 8px; }
.tag { padding: 3px 10px; border-radius: $radius-full; font-size: $fs-tiny; background: $brand-red-light; color: $brand-red-primary; }
.content-card { @include card-base; padding: $spacing-base; margin-top: $spacing-base; }
.content-label { font-size: $fs-caption; color: $text-secondary; display: block; margin-bottom: 8px; }
.content-text { font-size: $fs-body; color: $text-primary; line-height: 1.8; display: block; }
.penalty-text { font-size: $fs-body; color: $error-red; font-weight: 600; display: block; }
.empty-state { @include flex-center; padding: 40px 0; }
.empty-text { font-size: $fs-desc; color: $text-tertiary; }
</style>
