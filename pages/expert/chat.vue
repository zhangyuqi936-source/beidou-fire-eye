<template>
  <view class="page">
    <view class="mode-bar">
      <text class="mode-tab" :class="{ active: mode === 'deepseek' }" @click="mode = 'deepseek'">⚡ 直连DeepSeek</text>
      <text class="mode-tab" :class="{ active: mode === 'pe' }" @click="mode = 'pe'">🧠 人格底座</text>
    </view>
    <scroll-view scroll-y class="chat-area" :scroll-top="scrollTop">
      <view v-if="messages.length === 0" class="empty-chat">
        <text class="empty-icon">🧠</text>
        <text class="empty-text">开始提问吧</text>
        <text class="empty-hint">关于消防法规的任何问题都可以问我</text>
      </view>
      <view class="msg-item" v-for="(m, i) in messages" :key="i" :class="m.role">
        <view class="msg-bubble" :class="m.role">{{ m.content }}</view>
      </view>
      <view class="msg-item assistant" v-if="loading">
        <view class="msg-bubble assistant pulse">思考中...</view>
      </view>
    </scroll-view>
    <view class="input-bar">
      <input class="input-field" v-model="inputText" placeholder="输入消防法规问题..." @confirm="send" />
      <text class="send-btn" @click="send">发送</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { askExpert } from '@/utils/ai-service.js';

const mode = ref('deepseek');
const messages = ref([]);
const inputText = ref('');
const loading = ref(false);
const scrollTop = ref(0);

const send = async () => {
  if (!inputText.value.trim() || loading.value) return;
  const question = inputText.value.trim();
  messages.value.push({ role: 'user', content: question });
  inputText.value = '';
  loading.value = true;
  try {
    const res = await askExpert(question);
    messages.value.push({ role: 'assistant', content: res.answer || '无法获取回答' });
  } catch (e) {
    messages.value.push({ role: 'assistant', content: 'AI服务暂不可用: ' + e.message });
  }
  loading.value = false;
};
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';
.page { @include page-base; display: flex; flex-direction: column; }
.mode-bar { @include flex-center; gap: 8px; padding: 12px; }
.mode-tab { padding: 6px 16px; border-radius: $radius-full; font-size: $fs-desc; color: $text-secondary; background: $bg-card;
  &.active { background: $brand-red-light; color: $brand-red-primary; font-weight: 600; }
}
.chat-area { flex: 1; padding: $spacing-base; }
.empty-chat { @include flex-center; flex-direction: column; padding-top: 80px; }
.empty-icon { font-size: 48px; opacity: 0.4; }
.empty-text { font-size: $fs-h3; color: $text-tertiary; margin-top: 12px; }
.empty-hint { font-size: $fs-desc; color: $text-placeholder; margin-top: 6px; }
.msg-item { margin-bottom: 16px; display: flex;
  &.user { justify-content: flex-end; }
}
.msg-bubble { max-width: 80%; padding: 10px 14px; border-radius: $radius-lg; font-size: $fs-body; line-height: 1.5;
  &.user { background: $brand-red-primary; color: #fff; border-bottom-right-radius: 4px; }
  &.assistant { background: $brand-red-light; color: $text-primary; border-bottom-left-radius: 4px; }
  &.pulse { opacity: 0.6; }
}
.input-bar { display: flex; gap: 10px; padding: 12px $spacing-base; background: $bg-card; border-top: 1px solid $border-light; @include safe-bottom(0); }
.input-field { flex: 1; padding: 10px 14px; border-radius: $radius-full; background: $bg-input; font-size: $fs-body; border: 1px solid $border-color; }
.send-btn { padding: 10px 20px; background: $brand-red-primary; color: #fff; border-radius: $radius-full; font-size: $fs-body; font-weight: 600; }
</style>
