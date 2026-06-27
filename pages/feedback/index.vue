<template>
  <view class="page">
    <text class="page-title">📝 产品反馈</text>
    <text class="page-desc">帮助我们改进北斗火眼</text>

    <view class="section">
      <text class="section-label">反馈来源</text>
      <view class="source-tabs">
        <text class="source-tab" v-for="s in sources" :key="s" :class="{ active: form.source === s }" @click="form.source = s">{{ s }}</text>
      </view>
    </view>

    <view class="section">
      <text class="section-label">评分 (1-5)</text>
      <view class="rating-item" v-for="dim in dimensions" :key="dim.key">
        <text class="rating-label">{{ dim.label }}</text>
        <view class="stars">
          <text class="star" v-for="n in 5" :key="n" :class="{ filled: n <= form.ratings[dim.key] }" @click="form.ratings[dim.key] = n">{{ n <= form.ratings[dim.key] ? '★' : '☆' }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-label">关键发现</text>
      <view class="finding-tags">
        <text class="finding-tag" v-for="f in findings" :key="f.key" :class="{ active: form.findings.includes(f.key) }" @click="toggleFinding(f.key)">{{ f.label }}</text>
      </view>
    </view>

    <view class="section">
      <text class="section-label">文字反馈 (至少50字)</text>
      <textarea class="feedback-input" v-model="form.text" placeholder="请详细描述您的使用体验、发现的问题或改进建议..." :maxlength="500" />
      <text class="char-count">{{ form.text.length }}/50</text>
    </view>

    <view class="btn-primary" @click="submit">提交反馈</view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { submitFeedback } from '@/utils/ai-service.js';

const sources = ['真人专家', 'DeepSeek', 'Claude Code', '豆包'];
const dimensions = [
  { key: 'ui', label: 'UI美观度' }, { key: 'function', label: '功能完整度' },
  { key: 'accuracy', label: 'AI准确度' }, { key: 'practical', label: '实用价值' },
  { key: 'smooth', label: '操作流畅度' }
];
const findings = [
  { key: 'bug', label: 'Bug' }, { key: 'feature', label: '功能建议' },
  { key: 'ui', label: 'UI问题' }, { key: 'data', label: '数据错误' },
  { key: 'other', label: '其他' }
];

const form = ref({
  source: '真人专家',
  ratings: { ui: 5, function: 5, accuracy: 5, practical: 5, smooth: 5 },
  text: '',
  findings: []
});

const toggleFinding = (key) => {
  const idx = form.value.findings.indexOf(key);
  if (idx > -1) form.value.findings.splice(idx, 1);
  else form.value.findings.push(key);
};

const submit = async () => {
  if (form.value.text.length < 50) {
    uni.showToast({ title: '反馈至少需要50字', icon: 'none' });
    return;
  }
  try {
    await submitFeedback(form.value);
    uni.showToast({ title: '提交成功！感谢反馈', icon: 'success' });
    form.value.text = '';
    form.value.findings = [];
  } catch (e) {
    uni.showToast({ title: '提交失败，请重试', icon: 'none' });
  }
};
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; padding: $spacing-base; padding-bottom: 80px; }
.page-title { font-family: $font-serif; font-size: $fs-h2; font-weight: 700; display: block; }
.page-desc { font-size: $fs-desc; color: $text-secondary; margin-top: 4px; display: block; }
.section { margin-top: $spacing-base; }
.section-label { font-size: $fs-desc; font-weight: 600; color: $text-primary; display: block; margin-bottom: 8px; }
.source-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.source-tab { padding: 6px 14px; border-radius: $radius-full; font-size: $fs-desc; color: $text-secondary; background: $bg-card;
  &.active { background: $brand-red-light; color: $brand-red-primary; font-weight: 600; }
}
.rating-item { @include flex-between; padding: 10px 0; border-bottom: 1px solid $border-light; }
.rating-label { font-size: $fs-body; color: $text-primary; }
.stars { display: flex; gap: 2px; }
.star { font-size: 20px; color: $border-color; &.filled { color: #EAB308; } }
.finding-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.finding-tag { padding: 6px 14px; border-radius: $radius-full; font-size: $fs-desc; color: $text-secondary; background: $bg-card;
  &.active { background: $brand-red-light; color: $brand-red-primary; font-weight: 600; }
}
.feedback-input { width: 100%; padding: 12px; border-radius: $radius-md; background: $bg-card; font-size: $fs-body; border: 1px solid $border-color; min-height: 120px; }
.char-count { font-size: $fs-tag; color: $text-placeholder; text-align: right; display: block; margin-top: 4px; }
.btn-primary { @include btn-primary; margin-top: 20px; }
</style>
