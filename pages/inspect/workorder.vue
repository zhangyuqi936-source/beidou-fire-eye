<template>
  <view class="page">
    <view class="header-bar">
      <text class="header-title">巡检工单</text>
      <text class="new-btn" @click="showForm = true">+ 新建工单</text>
    </view>
    <scroll-view scroll-x class="tabs" v-if="!isEmpty">
      <text class="tab" v-for="t in tabs" :key="t.key" :class="{ active: activeTab === t.key }" @click="activeTab = t.key">{{ t.label }}</text>
    </scroll-view>
    <view v-if="loading" class="skeleton"><view class="sk-item" v-for="i in 3" :key="i"></view></view>
    <view v-else-if="isEmpty" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无巡检工单</text>
      <text class="empty-hint">点击右上角新建工单</text>
    </view>
    <view v-else class="order-list">
      <view class="order-card" v-for="o in filteredOrders" :key="o.id">
        <text class="order-title">{{ o.title }}</text>
        <text class="order-location">{{ o.location }}</text>
        <text class="order-status" :class="o.status">{{ o.status }}</text>
        <text class="order-date">{{ o.date }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';

const loading = ref(false);
const isEmpty = ref(true);
const showForm = ref(false);
const activeTab = ref('all');
const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待检查' },
  { key: 'inspecting', label: '检查中' },
  { key: 'done', label: '已完成' }
];
const orders = ref([]);
const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return orders.value;
  return orders.value.filter(o => o.status === activeTab.value);
});
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; }
.header-bar { @include flex-between; padding: $spacing-base; }
.header-title { font-family: $font-serif; font-size: $fs-h2; font-weight: 700; }
.new-btn { font-size: $fs-body; color: $brand-red-primary; font-weight: 600; }
.tabs { white-space: nowrap; padding: 0 $spacing-base $spacing-sm; }
.tab { display: inline-block; padding: 6px 16px; border-radius: $radius-full; font-size: $fs-desc; color: $text-secondary; margin-right: 8px;
  &.active { background: $brand-red-light; color: $brand-red-primary; font-weight: 600; }
}
.empty-state { @include flex-center; flex-direction: column; padding: 80px 0; }
.empty-icon { font-size: 48px; opacity: 0.4; }
.empty-text { font-size: $fs-h3; color: $text-tertiary; margin-top: 12px; }
.empty-hint { font-size: $fs-desc; color: $text-placeholder; margin-top: 6px; }
.order-list { padding: 0 $spacing-base; display: flex; flex-direction: column; gap: 10px; }
.order-card { @include card-base; padding: $spacing-base; }
.order-title { font-size: $fs-h3; font-weight: 600; display: block; }
.order-location { font-size: $fs-desc; color: $text-secondary; margin-top: 4px; display: block; }
.order-status { font-size: $fs-tag; margin-top: 6px; display: inline-block; padding: 2px 8px; border-radius: $radius-full;
  background: $brand-red-light; color: $brand-red-primary;
}
.order-date { font-size: $fs-tiny; color: $text-tertiary; margin-left: 8px; }
.skeleton { padding: $spacing-base; }
.sk-item { height: 80px; @include skeleton-base; border-radius: $radius-lg; margin-bottom: 10px; }
</style>
