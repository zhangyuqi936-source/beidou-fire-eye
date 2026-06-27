<template>
  <view class="page" v-if="!loading && result">
    <!-- 摘要卡片 — 复刻 result-reference.html .summary-card -->
    <view class="summary-card">
      <view class="summary-header">
        <text class="summary-label">发现隐患</text>
        <text class="summary-count">{{ hazards.length }}</text>
      </view>
      <view class="risk-bar-row" v-if="riskBar.length">
        <view class="risk-chip" v-for="bar in riskBar" :key="bar.level"
          :style="{ background: bar.color, flex: bar.flex }">
          {{ bar.level }}×{{ bar.count }}
        </view>
      </view>
    </view>

    <!-- 隐患列表 — 复刻 .hazard-card -->
    <view class="hazard-list" v-if="hazards.length > 0">
      <view class="hazard-card" v-for="(h, i) in hazards" :key="h.id || i"
        :class="'level-' + (h.riskLevel || 'II')">
        <view class="hazard-header">
          <view class="title-area">
            <text class="hazard-title">{{ h.title }}</text>
            <text class="hazard-category">{{ h.category }} · {{ h.taxonomyCode }}</text>
          </view>
          <text class="risk-badge" :class="'l' + riskNum(h.riskLevel)">
            {{ riskLabel(h.riskLevel) }}
          </text>
        </view>
        <view class="hazard-body">
          <text class="hazard-desc">{{ h.description }}</text>
          <text class="confidence">置信度 <text :class="h.confidence">{{ h.confidence }}</text> · 风险值 {{ h.riskScore }}</text>
        </view>
        <!-- 法规匹配区 — 复刻 .law-section -->
        <view class="law-section" v-if="h.matchedLaws && h.matchedLaws.length > 0">
          <text class="law-label">📋 匹配法规 ({{ h.matchedLaws.length }}条)</text>
          <view class="law-item" v-for="law in h.matchedLaws" :key="law.lawId">
            <text class="law-code">{{ law.title?.split(' ')[0] || law.code }}</text>
            <text class="law-clause">{{ law.clause }}</text>
            <text class="law-content" v-if="law.content">{{ law.content }}</text>
            <text class="law-penalty" v-if="law.penalty">{{ law.penalty }}</text>
          </view>
        </view>
        <!-- 整改建议 — 复刻 .rectify-box -->
        <view class="rectify-box" v-if="h.rectification">
          💡 <text style="font-weight:700">整改建议</text>：{{ h.rectification }}
        </view>
      </view>
    </view>

    <!-- meta.chain 链路可视化 — 复刻 .chain-section -->
    <view class="chain-section" v-if="result.meta">
      <text class="chain-title">🔗 识别链路 · {{ degradationLabel }} · {{ chainTime }}</text>
      <view class="chain-steps">
        <view class="chain-step" v-for="(step, i) in chainData" :key="i">
          <text class="step-icon" :class="step.status">{{ step.icon }}</text>
          <text class="step-text">{{ step.text }}</text>
        </view>
      </view>
      <!-- meta 标签行 — 复刻 .meta-row -->
      <view class="meta-row">
        <text class="meta-tag mode">🤖 {{ modeLabel }}</text>
        <text class="meta-tag">DeepSeek Vision</text>
        <text class="meta-tag">{{ degradationLabel }}</text>
        <text class="meta-tag" v-if="result.meta.sceneType">📍 {{ result.meta.sceneType }}</text>
      </view>
    </view>

    <!-- 底部操作 — 复刻 .bottom-bar -->
    <view class="bottom-bar">
      <view class="btn-secondary" @click="goRecheck">🔄 重新检查</view>
      <view class="btn-primary" @click="goReport">📄 生成报告</view>
    </view>

    <view style="height:80px"></view>
  </view>

  <!-- 加载/错误态 -->
  <view class="page flex-center" v-else-if="loading">
    <view class="skeleton-card"></view>
  </view>
  <view class="page flex-center" v-else>
    <text class="error-msg">暂无识别结果</text>
    <view class="retry-btn" @click="goRecheck">返回拍照</view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { parseChainSteps, getDegradationTag, getModeLabel, getRiskUIConfig, getRiskBarConfig } from '@/utils/chain-visualizer.js';

const loading = ref(true);
const result = ref(null);

const hazards = computed(() => result.value?.hazards || []);
const riskBar = computed(() => {
  const counts = { I: 0, II: 0, III: 0, IV: 0 };
  hazards.value.forEach(h => { counts[h.riskLevel] = (counts[h.riskLevel] || 0) + 1; });
  return getRiskBarConfig(counts);
});
const chainData = computed(() => parseChainSteps(result.value?.meta?.chain || []));
const degradationLabel = computed(() => getDegradationTag(result.value?.meta?.degradationLevel || 'L0').text);
const modeLabel = computed(() => getModeLabel(result.value?.meta?.mode || 'hybrid_ai').text);
const chainTime = computed(() => {
  const len = (result.value?.meta?.chain || []).length;
  return (len * 0.5).toFixed(1) + '秒';
});

const riskNum = (level) => ({ I: 1, II: 2, III: 3, IV: 4 }[level] || 2);
const riskLabel = (level) => getRiskUIConfig(level).label;

const goRecheck = () => uni.redirectTo({ url: '/pages/inspect/capture' });
const goReport = () => {
  uni.setStorageSync('report_data', JSON.stringify({
    hazards: hazards.value,
    meta: result.value?.meta
  }));
  uni.navigateTo({ url: '/pages/report/detail' });
};

onMounted(() => {
  try {
    const stored = uni.getStorageSync('recognition_result');
    if (stored) result.value = JSON.parse(stored);
  } catch (e) {
    /* ignore */
  }
  loading.value = false;
});
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';

.page { @include page-base; padding-bottom: 0; }
.flex-center { @include flex-center; flex-direction: column; }

.summary-card {
  margin: $spacing-base; padding: 16px 20px;
  @include card-base; border-radius: 14px;
}
.summary-header { @include flex-between; margin-bottom: 12px; }
.summary-label { font-size: $fs-desc; color: $text-secondary; }
.summary-count { font-size: $fs-stat; font-family: $font-serif; font-weight: 700; color: $brand-red-primary; }
.risk-bar-row { display: flex; gap: 8px; margin-top: 8px; }
.risk-chip {
  padding: 6px 0; border-radius: $radius-md;
  font-size: $fs-tag; text-align: center; color: #fff; font-weight: 600;
}

.hazard-list { margin: 0 $spacing-base; display: flex; flex-direction: column; gap: 12px; }
.hazard-card {
  @include card-base; border-radius: 14px; overflow: hidden; border-left: 5px solid #EAB308;
  &.level-I { border-left-color: $risk-level-i; }
  &.level-II { border-left-color: $risk-level-ii; }
  &.level-III { border-left-color: $risk-level-iii; }
  &.level-IV { border-left-color: $risk-level-iv; }
}
.hazard-header { padding: 14px 16px 0; display: flex; justify-content: space-between; align-items: flex-start; }
.title-area { flex: 1; }
.hazard-title { font-size: 15px; font-weight: 700; color: $text-primary; display: block; }
.hazard-category { margin-top: 4px; font-size: $fs-tag; color: $text-tertiary; display: block; }
.risk-badge {
  padding: 3px 10px; border-radius: $radius-full; font-size: $fs-tiny; font-weight: 700; white-space: nowrap;
  &.l1 { @include risk-badge('I'); }
  &.l2 { @include risk-badge('II'); }
  &.l3 { @include risk-badge('III'); }
  &.l4 { @include risk-badge('IV'); }
}
.hazard-body { padding: 10px 16px; }
.hazard-desc { font-size: $fs-desc; color: #555; line-height: 1.6; display: block; }
.confidence { margin-top: 6px; font-size: $fs-tiny; color: $text-tertiary; display: block;
  .high { @include confidence-badge('high'); }
  .medium { @include confidence-badge('medium'); }
  .low { @include confidence-badge('low'); }
}

.law-section { background: #F8F8F8; margin: 0 16px 12px; border-radius: 10px; padding: 12px; }
.law-label { font-size: $fs-tiny; color: $brand-red-primary; font-weight: 700; display: block; margin-bottom: 6px; }
.law-item { padding: 8px 0; border-bottom: 1px solid #eee; line-height: 1.5;
  &:last-child { border: none; }
}
.law-code { font-family: $font-mono; font-size: $fs-tag; font-weight: 700; color: $brand-red-primary; display: block; }
.law-clause { color: $text-secondary; font-size: $fs-tag; display: block; }
.law-content { color: $text-tertiary; font-size: $fs-tag; margin-top: 2px; display: block; }
.law-penalty { color: $brand-red-primary; font-size: $fs-tiny; margin-top: 2px; background: #FEE2E2; padding: 2px 6px; border-radius: 4px; display: inline-block; }

.rectify-box { background: #EFF6FF; margin: 12px 16px; border-radius: 10px; padding: 12px; font-size: $fs-caption; color: #1E40AF; line-height: 1.5; }

.chain-section { margin: $spacing-base; padding: 14px 16px; @include card-base; border-radius: 14px; }
.chain-title { font-size: $fs-caption; color: $text-tertiary; margin-bottom: 10px; display: block; }
.chain-steps { display: flex; flex-direction: column; gap: 6px; }
.chain-step { display: flex; align-items: center; gap: 8px; font-size: $fs-tag; color: $text-secondary; padding: 6px 10px; background: #F9FAFB; border-radius: $radius-md; }
.step-icon { font-size: 14px; &.done { color: $safe-green; } &.warn { color: $warn-yellow; } }
.step-text { flex: 1; }

.meta-row { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }
.meta-tag { padding: 4px 10px; border-radius: $radius-full; font-size: $fs-tiny; background: #F3F4F6; color: $text-secondary;
  &.mode { background: $brand-red-light; color: $brand-red-primary; }
}

.bottom-bar { position: sticky; bottom: 0; background: $bg-card; padding: 12px $spacing-base; @include safe-bottom(12px); border-top: 1px solid $border-light; display: flex; gap: 10px; }
.btn-primary { flex: 1; @include btn-primary; }
.btn-secondary { flex: 1; @include btn-secondary; }

.skeleton-card { width: 90%; height: 200px; @include skeleton-base; border-radius: 14px; }
.error-msg { font-size: $fs-desc; color: $text-tertiary; }
.retry-btn { @include btn-primary; margin-top: $spacing-lg; max-width: 200px; }
</style>
