<template>
  <view class="page" v-if="!loading && report">
    <view class="report-header">
      <text class="report-title">{{ report.title }}</text>
      <text class="report-id">{{ report.id }}</text>
      <text class="report-date">{{ report.inspectDate }}</text>
    </view>
    <view class="info-card">
      <text class="info-row"><text class="info-label">检查地点</text>{{ report.location }}</text>
      <text class="info-row"><text class="info-label">检查人员</text>{{ report.inspector }}</text>
      <text class="info-row"><text class="info-label">检查日期</text>{{ report.inspectDate }}</text>
      <text class="info-row"><text class="info-label">状态</text><text class="status-tag">{{ report.status }}</text></text>
    </view>
    <text class="section-title">隐患详情</text>
    <view class="hazard-list" v-if="report.hazards">
      <view class="hazard-card" v-for="h in report.hazards" :key="h.id" :class="'level-' + (h.riskLevel || 'II')">
        <view class="hazard-head">
          <text class="hazard-title">{{ h.title }}</text>
          <text class="risk-badge" :class="'l' + (h.riskLevel === 'IV' ? 4 : h.riskLevel === 'III' ? 3 : h.riskLevel === 'II' ? 2 : 1)">
            {{ h.riskLevel === 'IV' ? 'IV 级·立即整改' : h.riskLevel === 'III' ? 'III 级·限期7天' : h.riskLevel === 'II' ? 'II 级·限期30天' : 'I 级·可接受' }}
          </text>
        </view>
        <text class="hazard-desc">{{ h.description }}</text>
        <view class="law-section" v-if="h.matchedLaws?.length">
          <text class="law-label">📋 法规依据</text>
          <view class="law-item" v-for="law in h.matchedLaws" :key="law.lawId">
            <text class="law-code">{{ law.title }}</text>
            <text class="law-clause">{{ law.clause }}</text>
            <text class="law-penalty" v-if="law.penalty">{{ law.penalty }}</text>
          </view>
        </view>
        <view class="rectify-box" v-if="h.rectification">💡 {{ h.rectification }}</view>
      </view>
    </view>
    <view class="empty-state" v-else>
      <text class="empty-text">暂无隐患数据</text>
    </view>
    <view class="export-btns">
      <view class="btn-secondary" @click="exportJSON">📄 导出JSON</view>
      <view class="btn-primary" @click="exportText">📋 导出文本</view>
    </view>
  </view>
  <view class="page flex-center" v-else-if="loading">
    <view class="sk-card" style="height:200px"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const loading = ref(true);
const report = ref(null);

onMounted(() => {
  try {
    const stored = uni.getStorageSync('report_data');
    if (stored) report.value = JSON.parse(stored);
  } catch (_) {}
  loading.value = false;
});

const exportJSON = () => uni.showToast({ title: '导出功能开发中', icon: 'none' });
const exportText = () => uni.showToast({ title: '导出功能开发中', icon: 'none' });
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; padding: $spacing-base; padding-bottom: 80px; }
.flex-center { @include flex-center; }
.report-header { margin-bottom: $spacing-base; }
.report-title { font-family: $font-serif; font-size: $fs-h2; font-weight: 700; display: block; }
.report-id { font-size: $fs-caption; color: $text-tertiary; display: block; margin-top: 4px; }
.report-date { font-size: $fs-tiny; color: $text-placeholder; display: block; }
.info-card { @include card-base; padding: $spacing-base; margin-bottom: $spacing-base; }
.info-row { font-size: $fs-desc; color: $text-secondary; display: block; padding: 6px 0; border-bottom: 1px solid $border-light; }
.info-label { color: $text-tertiary; margin-right: 12px; width: 64px; display: inline-block; }
.status-tag { padding: 2px 8px; border-radius: $radius-full; font-size: $fs-tiny; background: $brand-red-light; color: $brand-red-primary; }
.section-title { font-family: $font-serif; font-size: $fs-h3; font-weight: 700; margin-bottom: 12px; display: block; }
.hazard-list { display: flex; flex-direction: column; gap: 12px; }
.hazard-card { @include card-base; overflow: hidden; border-left: 5px solid #EAB308; padding: 14px 16px;
  &.level-I { border-left-color: $risk-level-i; }
  &.level-II { border-left-color: $risk-level-ii; }
  &.level-III { border-left-color: $risk-level-iii; }
  &.level-IV { border-left-color: $risk-level-iv; }
}
.hazard-head { @include flex-between; margin-bottom: 8px; }
.hazard-title { font-size: 15px; font-weight: 700; }
.risk-badge { padding: 3px 10px; border-radius: $radius-full; font-size: $fs-tiny; font-weight: 700; white-space: nowrap;
  &.l1 { @include risk-badge('I'); } &.l2 { @include risk-badge('II'); }
  &.l3 { @include risk-badge('III'); } &.l4 { @include risk-badge('IV'); }
}
.hazard-desc { font-size: $fs-desc; color: #555; line-height: 1.6; display: block; }
.law-section { background: #F8F8F8; border-radius: 10px; padding: 12px; margin-top: 10px; }
.law-label { font-size: $fs-tiny; color: $brand-red-primary; font-weight: 700; display: block; margin-bottom: 6px; }
.law-item { padding: 6px 0; border-bottom: 1px solid #eee; &:last-child { border: none; } }
.law-code { font-family: $font-mono; font-size: $fs-tag; font-weight: 700; color: $brand-red-primary; display: block; }
.law-clause { font-size: $fs-tag; color: $text-secondary; display: block; }
.law-penalty { font-size: $fs-tiny; color: $brand-red-primary; margin-top: 2px; background: #FEE2E2; padding: 2px 6px; border-radius: 4px; display: inline-block; }
.rectify-box { background: #EFF6FF; border-radius: 10px; padding: 12px; margin-top: 10px; font-size: $fs-caption; color: #1E40AF; line-height: 1.5; }
.empty-state { @include flex-center; padding: 40px 0; }
.empty-text { font-size: $fs-desc; color: $text-tertiary; }
.export-btns { display: flex; gap: 10px; margin-top: 20px; }
.btn-primary { flex: 1; @include btn-primary; }
.btn-secondary { flex: 1; @include btn-secondary; }
.sk-card { width: 100%; @include skeleton-base; border-radius: $radius-lg; }
</style>
