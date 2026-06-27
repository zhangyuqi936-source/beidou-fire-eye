<template>
  <view class="page">
    <view class="header-bar">
      <text class="header-title">消防知识库</text>
    </view>
    <view class="search-bar">
      <input class="search-input" v-model="searchText" placeholder="搜索法规..." />
    </view>
    <view v-if="loading" class="skeleton"><view class="sk-item" v-for="i in 4" :key="i"></view></view>
    <view v-else-if="isEmpty" class="empty-state">
      <text class="empty-icon">📚</text>
      <text class="empty-text">未找到相关法规</text>
    </view>
    <view v-else class="law-list">
      <view class="law-card" v-for="law in filteredLaws" :key="law.id" @click="goDetail(law)">
        <text class="law-code">{{ law.code }}</text>
        <text class="law-name">{{ law.name }}</text>
        <text class="law-clause">{{ law.clause }}</text>
        <text class="law-category">{{ law.category }}</text>
      </view>
    </view>
    <view class="add-btn" @click="goEditor">+</view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getLaws } from '@/utils/ai-service.js';

const loading = ref(true);
const isEmpty = ref(false);
const searchText = ref('');
const laws = ref([]);

const filteredLaws = computed(() => {
  if (!searchText.value) return laws.value;
  const q = searchText.value.toLowerCase();
  return laws.value.filter(l =>
    l.code.toLowerCase().includes(q) || l.name.toLowerCase().includes(q) ||
    l.clause?.toLowerCase().includes(q) || l.category?.toLowerCase().includes(q)
  );
});

const goDetail = (law) => {
  uni.setStorageSync('law_detail', JSON.stringify(law));
  uni.navigateTo({ url: '/pages/knowledge/detail' });
};
const goEditor = () => uni.navigateTo({ url: '/pages/knowledge/editor' });

onMounted(async () => {
  try {
    const res = await getLaws();
    laws.value = res.laws || [];
    isEmpty.value = laws.value.length === 0;
  } catch (e) {
    isEmpty.value = true;
  }
  loading.value = false;
});
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; padding-bottom: 80px; }
.header-bar { padding: $spacing-base; }
.header-title { font-family: $font-serif; font-size: $fs-h2; font-weight: 700; }
.search-bar { padding: 0 $spacing-base $spacing-sm; }
.search-input { width: 100%; padding: 10px 14px; border-radius: $radius-full; background: $bg-card; font-size: $fs-body; border: 1px solid $border-color; }
.law-list { padding: 0 $spacing-base; display: flex; flex-direction: column; gap: 10px; }
.law-card { @include card-base; padding: $spacing-base; @include card-hover; }
.law-code { font-family: $font-mono; font-size: $fs-tag; color: $brand-red-primary; font-weight: 700; display: block; }
.law-name { font-size: $fs-h3; font-weight: 600; display: block; margin-top: 4px; }
.law-clause { font-size: $fs-desc; color: $text-secondary; margin-top: 4px; display: block; }
.law-category { display: inline-block; margin-top: 6px; padding: 2px 8px; border-radius: $radius-full; font-size: $fs-tiny; background: $brand-red-light; color: $brand-red-primary; }
.add-btn { position: fixed; right: 20px; bottom: 80px; width: 48px; height: 48px; border-radius: 50%; background: $brand-red-primary; color: #fff; font-size: 28px; @include flex-center; box-shadow: $shadow-brand; }
.empty-state { @include flex-center; flex-direction: column; padding: 80px 0; }
.empty-icon { font-size: 48px; opacity: 0.4; }
.empty-text { font-size: $fs-h3; color: $text-tertiary; margin-top: 12px; }
.skeleton { padding: $spacing-base; }
.sk-item { height: 80px; @include skeleton-base; border-radius: $radius-lg; margin-bottom: 10px; }
</style>
