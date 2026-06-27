<template>
  <view class="page">
    <view class="score-header">
      <text class="score-letter">A</text>
      <text class="score-text">综合评级</text>
      <text class="score-percent">综合得分 85%</text>
    </view>
    <view class="category-grid">
      <view class="cat-item" v-for="c in categories" :key="c.name">
        <text class="cat-name">{{ c.name }}</text>
        <text class="cat-score">{{ c.score }}/{{ c.total }}</text>
      </view>
    </view>
    <view class="detail-list">
      <view class="detail-section" v-for="(items, cat) in groupedItems" :key="cat">
        <text class="detail-cat">{{ cat }}</text>
        <view class="detail-item" v-for="item in items" :key="item.title">
          <text class="detail-icon">{{ item.result === 'pass' ? '✅' : item.result === 'fail' ? '❌' : '➖' }}</text>
          <text class="detail-title">{{ item.title }}</text>
        </view>
      </view>
    </view>
    <view class="action-btns">
      <view class="btn-secondary" @click="goHome">返回首页</view>
      <view class="btn-primary" @click="exportReport">导出报告</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';

const score = ref(85);
const grade = ref('A');
const categories = ref([]);
const allItems = ref([]);

const groupedItems = computed(() => {
  const groups = {};
  categories.value.forEach(cat => {
    groups[cat.name] = { items: [], score: 0, total: 0 };
  });
  allItems.value.forEach(item => {
    const cat = item.category || '';
    const items = groups[cat]?.items || [];
    items.push(item);
    groups[cat].score += item.result === 'pass' ? 1 : 0;
    groups[cat].total += 1;
  });
  return Object.entries(groups).map(([name, data]) => ({
    name,
    score: data.score,
    total: data.total,
    rate: data.total > 0 ? Math.round(data.score / data.total * 100) + '%' : ''
  }));
});
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; padding: $spacing-base; padding-bottom: 80px; }
.score-header { @include flex-center; flex-direction: column; padding: 24px 0; background: $gradient-hero; color: #fff; border-radius: $radius-xl; margin-bottom: 12px; }
.score-letter { font-family: $font-serif; font-size: 48px; font-weight: 700; color: $brand-red-primary; }
.score-text { font-size: $fs-body; color: $text-secondary; margin-top: 4px; }
.score-percent { font-size: 28px; font-weight: 700; color: $safe-green; margin-top: 8px; }
.category-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
.cat-item { @include card-base; padding: $spacing-base; text-align: center; }
.cat-name { font-size: $fs-h3; font-weight: 600; display: block; }
.cat-score { font-size: $fs-desc; color: $text-tertiary; margin-left: 8px; }
.detail-list { display: flex; flex-direction: column; gap: 10px; }
.detail-section { margin-bottom: 12px; }
.detail-cat { font-size: $fs-desc; color: $brand-red-primary; font-weight: 600; display: block; margin-bottom: 6px; }
.detail-item { padding: 10px 0; border-bottom: 1px solid $border-light; }
.detail-icon { font-size: 14px; margin-right: 8px; }
.detail-title { font-size: $fs-h3; font-weight: 600; }
.action-btns { @include flex-between; margin-top: 20px; }
.btn-secondary { @include btn-secondary; flex: 1; }
.btn-primary { @include btn-primary; flex: 1; }
</style>
