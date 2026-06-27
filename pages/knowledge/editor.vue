<template>
  <view class="page">
    <text class="page-title">法规编辑器</text>
    <text class="page-desc">添加或编辑自定义消防法规</text>
    <view class="form">
      <view class="form-item">
        <text class="form-label">法规编号</text>
        <input class="form-input" v-model="form.code" placeholder="如: GB XXXXX-XXXX" />
      </view>
      <view class="form-item">
        <text class="form-label">法规名称</text>
        <input class="form-input" v-model="form.name" placeholder="法规名称" />
      </view>
      <view class="form-item">
        <text class="form-label">类别</text>
        <view class="category-options">
          <text class="cat-opt" v-for="c in categories" :key="c" :class="{ active: form.category === c }" @click="form.category = c">{{ c }}</text>
        </view>
      </view>
      <view class="form-item">
        <text class="form-label">条款内容</text>
        <textarea class="form-textarea" v-model="form.content" placeholder="输入法规条款全文..." :maxlength="2000" />
      </view>
      <view class="btn-primary" @click="save">保存</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { request } from '@/utils/api-client.js';

const categories = ['消防设施', '疏散通道', '电气安全', '火源管理', '消防管理', '建筑防火'];
const form = ref({ code: '', name: '', category: '消防设施', content: '' });

const save = async () => {
  if (!form.value.code || !form.value.name || !form.value.content) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }
  try {
    await request('POST', '/api/laws', form.value);
    uni.showToast({ title: '保存成功', icon: 'success' });
    uni.navigateBack();
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
};
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; padding: $spacing-base; }
.page-title { font-family: $font-serif; font-size: $fs-h2; font-weight: 700; display: block; }
.page-desc { font-size: $fs-desc; color: $text-secondary; margin-top: 4px; display: block; }
.form { margin-top: $spacing-lg; }
.form-item { margin-bottom: $spacing-base; }
.form-label { font-size: $fs-desc; color: $text-secondary; display: block; margin-bottom: 6px; }
.form-input { width: 100%; padding: 10px 14px; border-radius: $radius-md; background: $bg-card; font-size: $fs-body; border: 1px solid $border-color; }
.form-textarea { width: 100%; padding: 10px 14px; border-radius: $radius-md; background: $bg-card; font-size: $fs-body; border: 1px solid $border-color; min-height: 120px; }
.category-options { display: flex; flex-wrap: wrap; gap: 8px; }
.cat-opt { padding: 6px 14px; border-radius: $radius-full; font-size: $fs-desc; color: $text-secondary; background: $bg-card;
  &.active { background: $brand-red-light; color: $brand-red-primary; font-weight: 600; }
}
.btn-primary { @include btn-primary; margin-top: 20px; }
</style>
