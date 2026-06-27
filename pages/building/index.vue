<template>
  <view class="page">
    <view class="header-bar">
      <text class="header-title">🏢 场所管理</text>
    </view>
    <view v-if="loading" class="skeleton"><view class="sk-item" v-for="i in 2" :key="i"></view></view>
    <view v-else-if="isEmpty" class="empty-state">
      <text class="empty-icon">🏢</text>
      <text class="empty-text">暂无场所，点击添加</text>
    </view>
    <view v-else>
      <view class="building-card current" v-if="currentBuilding">
        <text class="bld-icon">📍</text>
        <view class="bld-info">
          <text class="bld-name">{{ currentBuilding.name }}</text>
          <text class="bld-addr">{{ currentBuilding.address }}</text>
          <text class="bld-stats">检查 {{ currentBuilding.inspections }} 次 · 隐患 {{ currentBuilding.hazards }} 处</text>
        </view>
      </view>
      <view class="building-card" v-for="b in buildings" :key="b.name" @click="setCurrent(b)">
        <text class="bld-name">{{ b.name }}</text>
        <text class="bld-addr">{{ b.address }}</text>
        <text class="set-btn">设为当前</text>
      </view>
    </view>
    <view class="add-btn" @click="showForm = true">+</view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
const loading = ref(false);
const isEmpty = ref(true);
const showForm = ref(false);
const currentBuilding = ref(null);
const buildings = ref([]);
const setCurrent = (b) => { currentBuilding.value = b; };
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; padding-bottom: 80px; }
.header-bar { padding: $spacing-base; }
.header-title { font-family: $font-serif; font-size: $fs-h2; font-weight: 700; }
.building-card { @include card-base; margin: $spacing-sm $spacing-base; padding: $spacing-base; display: flex; align-items: center; gap: 12px;
  &.current { border-left: 4px solid $brand-red-primary; }
}
.bld-icon { font-size: 28px; }
.bld-info { flex: 1; }
.bld-name { font-size: $fs-h3; font-weight: 600; display: block; }
.bld-addr { font-size: $fs-desc; color: $text-secondary; margin-top: 2px; display: block; }
.bld-stats { font-size: $fs-tiny; color: $text-tertiary; margin-top: 4px; display: block; }
.set-btn { font-size: $fs-caption; color: $brand-red-primary; font-weight: 600; }
.add-btn { position: fixed; right: 20px; bottom: 80px; width: 48px; height: 48px; border-radius: 50%; background: $brand-red-primary; color: #fff; font-size: 28px; @include flex-center; box-shadow: $shadow-brand; }
.empty-state { @include flex-center; flex-direction: column; padding: 80px 0; }
.empty-icon { font-size: 48px; opacity: 0.4; }
.empty-text { font-size: $fs-h3; color: $text-tertiary; margin-top: 12px; }
.skeleton { padding: $spacing-base; }
.sk-item { height: 80px; @include skeleton-base; border-radius: $radius-lg; margin-bottom: 10px; }
</style>
