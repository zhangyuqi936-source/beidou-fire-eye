<template>
  <view class="page">
    <view v-if="loading" class="skeleton"><view class="sk-bar"></view><view class="sk-list" v-for="i in 3" :key="i"></view></view>
    <view v-else-if="error" class="error-card"><text class="error-msg">{{ error }}</text><view class="retry-btn" @click="init">重试</view></view>
    <view v-else>
      <view class="progress-bar"><view class="progress-fill" :style="{ width: progress + '%' }"></view></view>
      <text class="step-label">步骤 {{ currentStep + 1 }}/{{ steps.length }}</text>
      <scroll-view scroll-x class="step-tabs">
        <text class="step-tab" v-for="(s, i) in steps" :key="i" :class="{ active: i === currentStep }" @click="currentStep = i">{{ s.category }}</text>
      </scroll-view>
      <view class="check-list">
        <view class="check-item" v-for="(item, idx) in currentItems" :key="idx">
          <text class="check-title">{{ item.title }}</text>
          <text class="check-desc">{{ item.desc }}</text>
          <view class="check-options">
            <text class="opt" :class="{ active: item.result === 'pass' }" @click="item.result = 'pass'">✅ 合格</text>
            <text class="opt" :class="{ active: item.result === 'fail' }" @click="item.result = 'fail'">❌ 不合格</text>
            <text class="opt" :class="{ active: item.result === 'na' }" @click="item.result = 'na'">➖ 不适用</text>
          </view>
        </view>
      </view>
      <view class="nav-btns">
        <view class="btn-secondary" v-if="currentStep > 0" @click="currentStep--">上一步</view>
        <view class="btn-primary" @click="nextStep">{{ currentStep < steps.length - 1 ? '下一步' : '完成检查' }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';

const loading = ref(false);
const error = ref(null);
const currentStep = ref(0);
const steps = ref([
  { category: '消防设施', items: [
    { title: '灭火器配置', desc: '灭火器是否配置到位、压力正常', result: '' },
    { title: '消火栓状态', desc: '消火栓箱是否完好、水带水枪齐全', result: '' },
    { title: '报警器工作', desc: '火灾报警器是否正常工作', result: '' },
    { title: '应急照明', desc: '应急照明灯是否完好', result: '' }
  ]},
  { category: '疏散通道', items: [
    { title: '安全出口', desc: '安全出口是否畅通、未被锁闭', result: '' },
    { title: '疏散走道', desc: '疏散走道是否保持畅通', result: '' },
    { title: '防火门', desc: '常闭式防火门是否关闭', result: '' },
    { title: '消防车道', desc: '消防车道是否畅通', result: '' }
  ]},
  { category: '电气安全', items: [
    { title: '电气线路', desc: '线路是否穿管保护、无老化', result: '' },
    { title: '私拉乱接', desc: '是否存在私拉乱接现象', result: '' },
    { title: '配电箱', desc: '配电箱周围是否堆放可燃物', result: '' }
  ]},
  { category: '火源管理', items: [
    { title: '明火管理', desc: '是否存在违规明火或吸烟', result: '' },
    { title: '易燃物存放', desc: '易燃物品是否规范存放', result: '' },
    { title: '防火分隔', desc: '防火分隔是否完好', result: '' }
  ]},
  { category: '消防管理', items: [
    { title: '责任人', desc: '消防安全责任人是否明确', result: '' },
    { title: '巡查记录', desc: '消防巡查记录是否完整', result: '' },
    { title: '培训', desc: '员工是否经过消防培训', result: '' }
  ]}
]);

const currentItems = computed(() => steps.value[currentStep.value]?.items || []);
const progress = computed(() => Math.round((currentStep.value + 1) / steps.value.length * 100));

const nextStep = () => {
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++;
  } else {
    uni.navigateTo({ url: '/pages/check/result' });
  }
};
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; padding: $spacing-base; padding-bottom: 80px; }
.progress-bar { height: 6px; background: $border-light; border-radius: 3px; margin-bottom: 8px; }
.progress-fill { height: 100%; background: $brand-red-primary; border-radius: 3px; transition: width 0.3s; }
.step-label { font-size: $fs-caption; color: $text-secondary; }
.step-tabs { white-space: nowrap; margin: 12px 0; }
.step-tab { display: inline-block; padding: 6px 14px; border-radius: $radius-full; font-size: $fs-desc; color: $text-secondary; margin-right: 8px;
  &.active { background: $brand-red-primary; color: #fff; }
}
.check-list { display: flex; flex-direction: column; gap: 12px; }
.check-item { @include card-base; padding: $spacing-base; }
.check-title { font-size: $fs-h3; font-weight: 600; display: block; }
.check-desc { font-size: $fs-desc; color: $text-tertiary; margin-top: 4px; display: block; }
.check-options { display: flex; gap: 8px; margin-top: 10px; }
.opt { padding: 6px 12px; border-radius: $radius-md; font-size: $fs-caption; color: $text-secondary; background: $bg-page;
  &.active { background: $brand-red-light; color: $brand-red-primary; font-weight: 600; }
}
.nav-btns { display: flex; gap: 10px; margin-top: 20px; }
.btn-primary { flex: 1; @include btn-primary; }
.btn-secondary { flex: 1; @include btn-secondary; }
.skeleton { padding: $spacing-base; }
.sk-bar { height: 6px; @include skeleton-base; border-radius: 3px; margin-bottom: 20px; }
.sk-list { height: 100px; @include skeleton-base; border-radius: $radius-lg; margin-bottom: 10px; }
.error-card { @include card-base; padding: 24px; text-align: center; }
.error-msg { font-size: $fs-desc; color: $error-red; display: block; }
.retry-btn { @include btn-primary; margin-top: 12px; }
</style>
