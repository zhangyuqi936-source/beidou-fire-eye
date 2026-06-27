<template>
  <view class="page">
    <!-- 品牌区 — 复刻 index-reference.html .brand-bar -->
    <view class="brand-bar">
      <view class="brand-title">消防智查</view>
      <view class="brand-subtitle">消防安全智能检查</view>
    </view>

    <!-- Hero 推广位 — 复刻 .hero -->
    <view class="hero">
      <text class="hero-title">拍一下，\n自动发现消防隐患</text>
      <text class="hero-desc">AI 视觉识别 + 法规自动匹配 + 一键生成整改报告</text>
    </view>

    <!-- 操作卡片 — 复刻 .action-cards -->
    <view class="action-cards">
      <view class="action-card" @click="goCapture">
        <text class="action-emoji">📷</text>
        <view class="action-info">
          <text class="action-title">拍照检查</text>
          <text class="action-desc">拍摄消防场景，AI 自动识别隐患</text>
        </view>
        <text class="action-arrow">→</text>
      </view>
      <view class="action-card alt" @click="goVideo">
        <text class="action-emoji">🎬</text>
        <view class="action-info">
          <text class="action-title">视频检查</text>
          <text class="action-desc">上传巡查视频，逐帧分析去重汇总</text>
        </view>
        <text class="action-arrow">→</text>
      </view>
    </view>

    <!-- 开始巡检按钮 — 复刻 .cta-btn -->
    <view class="cta-wrap">
      <view class="cta-btn" @click="goCapture">🔍 开始巡检</view>
    </view>

    <!-- 竹节分隔线 — 复刻 .bamboo-divider -->
    <view class="bamboo-divider">
      <view class="bd-dot"></view>
      <view class="bd-line"></view>
      <view class="bd-dot"></view>
    </view>

    <!-- 快捷工具网格 — 复刻 .tool-grid -->
    <view class="tool-grid">
      <view class="tool-card" @click="goExpert">
        <text class="tool-emoji">🧠</text>
        <text class="tool-title">消防AI专家</text>
        <text class="tool-desc">消防法规智能问答</text>
      </view>
      <view class="tool-card" @click="goHistory">
        <text class="tool-emoji">📋</text>
        <text class="tool-title">历史报告</text>
        <text class="tool-desc">查看与管理检查记录</text>
      </view>
      <view class="tool-card" @click="goKnowledge">
        <text class="tool-emoji">📚</text>
        <text class="tool-title">法规库</text>
        <text class="tool-desc">消防国标法规浏览</text>
      </view>
      <view class="tool-card" @click="goSettings">
        <text class="tool-emoji">⚙️</text>
        <text class="tool-title">AI设置</text>
        <text class="tool-desc">API配置与主题切换</text>
      </view>
    </view>

    <!-- 底部安全提示 — 复刻 .safety-tip -->
    <view class="safety-tip">
      <text>⚠️</text>
      <text>AI识别仅作辅助，重大隐患请委托具备资质的专业机构复核。</text>
    </view>

    <!-- 底部留白 (TabBar 占位) -->
    <view style="height:60px"></view>
  </view>
</template>

<script setup>
const goCapture = () => uni.navigateTo({ url: '/pages/inspect/capture' });
const goVideo = () => uni.navigateTo({ url: '/pages/inspect/video' });
const goExpert = () => uni.navigateTo({ url: '/pages/expert/chat' });
const goHistory = () => uni.switchTab({ url: '/pages/report/history' });
const goKnowledge = () => uni.switchTab({ url: '/pages/knowledge/index' });
const goSettings = () => uni.switchTab({ url: '/pages/settings/index' });
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';

.page { @include page-base; padding-bottom: 0; }

.brand-bar { @include brand-bar; }
.brand-title { @include brand-title; }
.brand-subtitle { font-size: $fs-tiny; opacity: 0.8; margin-top: 2px; }

.hero {
  margin: $spacing-base;
  padding: 24px 20px;
  border-radius: $radius-xl;
  background: $gradient-hero;
  color: #fff;
}
.hero-title { font-family: $font-serif; font-size: 28px; line-height: 1.3; display: block; }
.hero-desc { font-size: $fs-desc; opacity: 0.9; margin-top: 6px; display: block; }

.action-cards { margin: 0 $spacing-base; display: flex; flex-direction: column; gap: 10px; }
.action-card {
  @include card-base;
  padding: $spacing-base;
  display: flex; align-items: center; gap: $spacing-md;
  border-left: 4px solid $brand-red-primary;
  @include card-hover;
  &.alt { border-left-color: $brand-red-light; background: $brand-red-pale; }
}
.action-emoji { font-size: 28px; }
.action-info { flex: 1; }
.action-title { font-family: $font-serif; font-size: $fs-h2; font-weight: 700; color: $text-primary; display: block; }
.action-desc { font-size: $fs-tiny; color: $text-tertiary; margin-top: 2px; display: block; }
.action-arrow { color: $brand-red-primary; font-size: $fs-h2; font-weight: 700; }

.cta-wrap { margin: 6px $spacing-base $spacing-base; }
.cta-btn { @include btn-primary; font-size: $fs-h3; }

.bamboo-divider { @include bamboo-divider; margin: 4px $spacing-base $spacing-base; }

.tool-grid { margin: 0 $spacing-base; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.tool-card { @include card-base; padding: $spacing-base; @include card-hover; }
.tool-emoji { font-size: 24px; display: block; }
.tool-title { font-family: $font-serif; font-size: 15px; font-weight: 700; color: $text-primary; display: block; margin-top: 6px; }
.tool-desc { font-size: $fs-tiny; color: $text-tertiary; margin-top: 3px; display: block; }

.safety-tip {
  margin: 20px $spacing-base 24px;
  padding: 12px 14px;
  background: #FEF9C3;
  border-radius: 10px;
  font-size: $fs-tag; color: #854D0E; line-height: 1.5;
  display: flex; align-items: flex-start; gap: 6px;
}
</style>
