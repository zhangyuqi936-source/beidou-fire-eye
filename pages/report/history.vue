<template>
  <view class="page">
    <view class="header-bar">
      <text class="header-title">历史检查报告</text>
    </view>
    <view class="search-bar">
      <input class="search-input" v-model="searchText" placeholder="搜索报告..." />
    </view>
    <view v-if="loading" class="skeleton"><view class="sk-item" v-for="i in 3" :key="i"></view></view>
    <view v-else-if="isEmpty" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无检查报告</text>
    </view>
    <view v-else class="report-list">
      <view class="report-card" v-for="r in filteredReports" :key="r.id" @click="goDetail(r)">
        <text class="rpt-title">{{ r.title }}</text>
        <text class="rpt-location">📍 {{ r.location }}</text>
        <text class="rpt-date">{{ r.inspectDate }}</text>
        <text class="rpt-status" :class="r.status">{{ r.status }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getReports } from '@/utils/ai-service.js';

const loading = ref(true);
const isEmpty = ref(false);
const searchText = ref('');
const reports = ref([]);

const filteredReports = computed(() => {
  if (!searchText.value) return reports.value;
  const q = searchText.value.toLowerCase();
  return reports.value.filter(r =>
    r.title.toLowerCase().includes(q) || r.location.toLowerCase().includes(q)
  );
});

const goDetail = (r) => {
  uni.setStorageSync('report_data', JSON.stringify(r));
  uni.navigateTo({ url: '/pages/report/detail' });
};

onMounted(async () => {
  try {
    const res = await getReports();
    reports.value = res.reports || [];
    isEmpty.value = reports.value.length === 0;
  } catch (e) {
    isEmpty.value = true;
  }
  loading.value = false;
});
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; padding-bottom: 60px; }
.header-bar { padding: $spacing-base; }
.header-title { font-family: $font-serif; font-size: $fs-h2; font-weight: 700; }
.search-bar { padding: 0 $spacing-base $spacing-sm; }
.search-input { width: 100%; padding: 10px 14px; border-radius: $radius-full; background: $bg-card; font-size: $fs-body; border: 1px solid $border-color; }
.report-list { padding: 0 $spacing-base; display: flex; flex-direction: column; gap: 10px; }
.report-card { @include card-base; padding: $spacing-base; @include card-hover; }
.rpt-title { font-size: $fs-h3; font-weight: 600; display: block; }
.rpt-location { font-size: $fs-desc; color: $text-secondary; margin-top: 4px; display: block; }
.rpt-date { font-size: $fs-tiny; color: $text-tertiary; margin-top: 4px; display: block; }
.rpt-status { display: inline-block; margin-top: 6px; padding: 2px 8px; border-radius: $radius-full; font-size: $fs-tiny;
  background: $brand-red-light; color: $brand-red-primary;
}
.empty-state { @include flex-center; flex-direction: column; padding: 80px 0; }
.empty-icon { font-size: 48px; opacity: 0.4; }
.empty-text { font-size: $fs-h3; color: $text-tertiary; margin-top: 12px; }
.skeleton { padding: $spacing-base; }
.sk-item { height: 80px; @include skeleton-base; border-radius: $radius-lg; margin-bottom: 10px; }
</style>
