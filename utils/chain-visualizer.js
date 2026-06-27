/* ═══════════════════════════════════════════════════════════════
   chain-visualizer.js — meta.chain 链路可视化工具
   将算法识别链路渲染为前端可视化组件数据
   ═══════════════════════════════════════════════════════════════ */

/** 链路步骤状态图标 */
const STEP_ICONS = {
  done: '✅',
  warn: '⚠️',
  error: '❌',
  skip: '⏭️',
  pending: '⏳'
};

/** 降级层级 → mode 字符串 */
const DEGRADATION_MODES = {
  'L0': 'hybrid_ai',
  'L1': 'hybrid_fallback_vec',
  'L2': 'hybrid_fallback_vision',
  'L3': 'rules_only'
};

/**
 * 解析 chain 数组为可视化步骤数据
 * @param {Array} chain — meta.chain 字符串数组
 * @returns {Array<{icon, text, status, time}>}
 */
export function parseChainSteps(chain = []) {
  return chain.map((step, index) => {
    let status = 'done';
    if (step.includes('失败') || step.includes('异常')) status = 'error';
    else if (step.includes('降级') || step.includes('跳过')) status = 'warn';

    return {
      icon: STEP_ICONS[status],
      text: step,
      status,
      index,
      time: null
    };
  });
}

/**
 * 获取降级层级对应的标签样式
 * @param {string} level — 'L0' | 'L1' | 'L2' | 'L3'
 * @returns {{ text, color, bgColor }}
 */
export function getDegradationTag(level = 'L0') {
  const tags = {
    'L0': { text: 'L0 全功能', color: '#166534', bgColor: '#DCFCE7' },
    'L1': { text: 'L1 规则增强', color: '#854D0E', bgColor: '#FEF3C7' },
    'L2': { text: 'L2 离线本地', color: '#9A3412', bgColor: '#FFEDD5' },
    'L3': { text: 'L3 手动辅助', color: '#6B7280', bgColor: '#F3F4F6' }
  };
  return tags[level] || tags['L0'];
}

/**
 * 获取 mode 的友好展示文本
 * @param {string} mode
 * @returns {{ text, color }}
 */
export function getModeLabel(mode = 'hybrid_ai') {
  const labels = {
    'hybrid_ai': { text: '全功能 AI', color: '#16A34A' },
    'hybrid_fallback_vec': { text: '规则增强', color: '#EAB308' },
    'hybrid_fallback_vision': { text: '离线本地', color: '#F97316' },
    'rules_only': { text: '手动辅助', color: '#9CA3AF' }
  };
  return labels[mode] || labels['rules_only'];
}

/**
 * 生成 meta 标签列表（用于结果页展示）
 * @param {object} meta
 * @returns {Array<{text, color, bgColor}>}
 */
export function generateMetaTags(meta = {}) {
  const tags = [];
  const modeLabel = getModeLabel(meta.mode);

  tags.push({ text: '🤖 ' + modeLabel.text, color: modeLabel.color, bgColor: modeLabel.color + '15' });

  if (meta.degradationLevel) {
    const dTag = getDegradationTag(meta.degradationLevel);
    tags.push({ text: dTag.text, color: dTag.color, bgColor: dTag.bgColor });
  }

  if (meta.sceneType) {
    tags.push({ text: '📍 ' + meta.sceneType, color: '#666', bgColor: '#F3F4F6' });
  }

  if (meta.agentVersion) {
    tags.push({ text: 'v' + meta.agentVersion, color: '#999', bgColor: '#F9FAFB' });
  }

  return tags;
}

/**
 * 获取风险等级的 UI 配置
 * @param {string} level — 'I' | 'II' | 'III' | 'IV'
 * @returns {{ label, color, bgColor, deadline }}
 */
export function getRiskUIConfig(level) {
  const configs = {
    'I': { label: 'I 级·可接受', color: '#1D4ED8', bgColor: '#DBEAFE', deadline: '下次巡检复查' },
    'II': { label: 'II 级·限期30天', color: '#854D0E', bgColor: '#FEF3C7', deadline: '限期30天整改' },
    'III': { label: 'III 级·限期7天', color: '#9A3412', bgColor: '#FFEDD5', deadline: '限期7天整改' },
    'IV': { label: 'IV 级·立即整改', color: '#991B1B', bgColor: '#FEE2E2', deadline: '立即整改' }
  };
  return configs[level] || configs['I'];
}

/**
 * 计算总耗时（基于 chain 步骤数估算）
 * @param {Array} chain
 * @returns {string}
 */
export function estimateDuration(chain = []) {
  const perStep = 0.5; // 每步约 0.5 秒
  const total = chain.length * perStep;
  return total.toFixed(1) + '秒';
}

/**
 * 获取风险等级统计条的配置
 * @param {object} counts — { I: n, II: n, III: n, IV: n }
 * @returns {Array<{level, count, color, flex}>}
 */
export function getRiskBarConfig(counts = { I: 0, II: 0, III: 0, IV: 0 }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return [
    { level: 'I', count: counts.I || 0, color: '#3B82F6', flex: (counts.I || 0) / total * 4 + 0.3 },
    { level: 'II', count: counts.II || 0, color: '#EAB308', flex: (counts.II || 0) / total * 4 + 0.3 },
    { level: 'III', count: counts.III || 0, color: '#F97316', flex: (counts.III || 0) / total * 4 + 0.3 },
    { level: 'IV', count: counts.IV || 0, color: '#D92121', flex: (counts.IV || 0) / total * 4 + 0.3 }
  ];
}
