<template>
  <view class="page">
    <view v-if="loading" class="skeleton"><view class="sk-card" v-for="i in 4" :key="i"></view></view>
    <view v-else-if="error" class="error-card"><text class="error-msg">{{ error }}</text></view>
    <view v-else-if="isEmpty" class="empty-state"><text class="empty-text">暂无统计数据</text></view>
    <view v-else>
      <view class="stat-grid">
        <view class="stat-card" v-for="s in statsCards" :key="s.label">
          <text class="stat-value">{{ s.value }}</text>
          <text class="stat-label">{{ s.label }}</text>
        </view>
      </view>
      <text class="section-title">隐患类型分布</text>
      <view class="pie-area">
        <view class="pie-bar" v-for="t in stats.hazardTypes" :key="t.name" :style="{ width: (t.value / maxHazard * 100) + '%' }">
          <text class="pie-label">{{ t.name }} {{ t.value }}</text>
        </view>
      </view>
      <text class="section-title">场所统计</text>
      <view class="building-list">
        <view class="building-card" v-for="b in stats.buildingStats" :key="b.name">
          <text class="bld-name">{{ b.name }}</text>
          <text class="bld-stats">检查 {{ b.inspections }} 次 · 隐患 {{ b.hazards }} 处 · 最近 {{ b.lastCheck }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getStatistics } from '@/utils/ai-service.js';

const loading = ref(true);
const error = ref(null);
const isEmpty = ref(false);
const stats = ref({ totalChecks: 0, totalHazards: 0, completedRectifications: 0, hazardTypes: [], buildingStats: [] });

const maxHazard = computed(() => Math.max(...(stats.value.hazardTypes || []).map(t => t.value), 1));
const rectificationRate = computed(() => stats.value.totalHazards > 0
  ? Math.round(stats.value.completedRectifications / stats.value.totalHazards * 100) : 0);

const statsCards = computed(() => [
  { label: '总检查数', value: stats.value.totalChecks },
  { label: '隐患总数', value: stats.value.totalHazards },
  { label: '整改完成', value: stats.value.completedRectifications },
  { label: '整改率', value: rectificationRate.value + '%' }
]);

onMounted(async () => {
  try {
    const res = await getStatistics();
    stats.value = res;
    isEmpty.value = !res.totalChecks;
  } catch (e) {
    error.value = e.message;
  }
  loading.value = false;
});
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; padding: $spacing-base; padding-bottom: 80px; }
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: $spacing-base; }
.stat-card { @include card-base; padding: $spacing-base; text-align: center; box-shadow: $shadow-brand; }
.stat-value { font-size: $fs-stat; font-family: $font-serif; font-weight: 700; color: $brand-red-primary; display: block; }
.stat-label { font-size: $fs-tag; color: $text-secondary; margin-top: 4px; display: block; }
.section-title { font-family: $font-serif; font-size: $fs-h3; font-weight: 700; margin: $spacing-base 0 12px; display: block; }
.pie-area { display: flex; flex-direction: column; gap: 6px; }
.pie-bar { height: 28px; background: $brand-red-primary; border-radius: 4px; min-width: 40px; @include flex-center; }
.pie-label { font-size: $fs-tag; color: #fff; font-weight: 600; white-space: nowrap; padding: 0 8px; }
.building-list { display: flex; flex-direction: column; gap: 8px; }
.building-card { @include card-base; padding: $spacing-base; }
.bld-name { font-size: $fs-h3; font-weight: 600; display: block; }
.bld-stats { font-size: $fs-caption; color: $text-secondary; margin-top: 4px; display: block; }
.skeleton { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.sk-card { height: 80px; @include skeleton-base; border-radius: $radius-lg; }
.error-card { @include card-base; padding: 24px; text-align: center; }
.error-msg { font-size: $fs-desc; color: $error-red; }
.empty-state { @include flex-center; padding: 80px 0; }
.empty-text { font-size: $fs-h3; color: $text-tertiary; }
</style>
