/* ═══════════════════════════════════════════════════════════════
   feedback-loop.js — 人工复核反馈聚合 (v1 数据模型)
   v1: 数据收集 + 统计展示
   v2: 自动触发 Prompt 优化 + 分类权重调整
   ═══════════════════════════════════════════════════════════════ */

/** 反馈来源枚举 */
export const FEEDBACK_SOURCES = ['豆包', 'DeepSeek', 'Claude Code', '真人专家'];

/** 评分维度 */
export const RATING_DIMENSIONS = ['ui', 'function', 'accuracy', 'practical', 'smooth'];

/** 发现类型枚举 */
export const FINDING_TYPES = ['bug', 'feature', 'ui', 'data', 'other'];

/**
 * 验证反馈数据完整性
 * @param {object} feedback
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateFeedback(feedback) {
  const errors = [];

  if (!feedback.source || !FEEDBACK_SOURCES.includes(feedback.source)) {
    errors.push('source 必须为: ' + FEEDBACK_SOURCES.join(', '));
  }

  if (!feedback.ratings || typeof feedback.ratings !== 'object') {
    errors.push('ratings 为必填的评分对象');
  } else {
    for (const dim of RATING_DIMENSIONS) {
      const v = feedback.ratings[dim];
      if (typeof v !== 'number' || v < 1 || v > 5) {
        errors.push(`ratings.${dim} 必须为 1-5 的整数`);
      }
    }
  }

  if (!feedback.text || feedback.text.length < 50) {
    errors.push('text 至少需要 50 字');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 聚合反馈统计
 * @param {Array} feedbackList
 * @returns {object} summary
 */
export function aggregateFeedback(feedbackList) {
  if (!feedbackList || feedbackList.length === 0) {
    return {
      total: 0,
      sources: {},
      avgRatings: {},
      findings: {},
      latest: []
    };
  }

  const sources = {};
  const totalRatings = {};
  const findings = {};

  feedbackList.forEach(f => {
    sources[f.source] = (sources[f.source] || 0) + 1;

    Object.entries(f.ratings || {}).forEach(([k, v]) => {
      if (!totalRatings[k]) totalRatings[k] = { sum: 0, count: 0 };
      totalRatings[k].sum += v;
      totalRatings[k].count += 1;
    });

    (f.findings || []).forEach(ft => {
      findings[ft] = (findings[ft] || 0) + 1;
    });
  });

  const avgRatings = {};
  Object.entries(totalRatings).forEach(([k, v]) => {
    avgRatings[k] = Math.round((v.sum / v.count) * 10) / 10;
  });

  return {
    total: feedbackList.length,
    sources,
    avgRatings,
    findings,
    latest: feedbackList.slice(-10).reverse()
  };
}

/**
 * 计算误报率 (需结合 inspection_records)
 * @param {Array} inspectionRecords
 * @returns {{ falsePositiveRate: number, missRate: number, accuracy: number }}
 */
export function calculateAccuracy(inspectionRecords = []) {
  if (inspectionRecords.length === 0) {
    return { falsePositiveRate: 0, missRate: 0, accuracy: 0 };
  }

  let totalFindings = 0;
  let falsePositives = 0;
  let misses = 0;

  inspectionRecords.forEach(record => {
    const findings = record.originalFindings || [];
    totalFindings += findings.length;
    findings.forEach(f => {
      if (f.humanReview && !f.humanReview.isCorrect) falsePositives++;
    });
    misses += (record.missedFindings || []).length;
  });

  const falsePositiveRate = totalFindings > 0 ? Math.round((falsePositives / totalFindings) * 100) : 0;
  const missRate = totalFindings > 0 ? Math.round((misses / (totalFindings + misses)) * 100) : 0;
  const accuracy = 100 - falsePositiveRate - missRate;

  return {
    falsePositiveRate: Math.max(0, falsePositiveRate),
    missRate: Math.max(0, missRate),
    accuracy: Math.max(0, accuracy)
  };
}

/**
 * 判断是否需要触发改进 (v2 自动调整阈值)
 * @param {object} accuracyStats
 * @returns {Array} 建议的改进动作
 */
export function suggestImprovements(accuracyStats) {
  const actions = [];
  const { falsePositiveRate, missRate } = accuracyStats;

  if (falsePositiveRate > 15) {
    actions.push({ type: 'prompt_optimize', reason: `误报率 ${falsePositiveRate}% > 15%`, action: '优化 Prompt 负向约束 + 调整置信度阈值' });
  }
  if (missRate > 10) {
    actions.push({ type: 'expand_detection', reason: `漏报率 ${missRate}% > 10%`, action: '扩充检测清单 + 增加检测层' });
  }

  return actions;
}

/**
 * 创建反馈记录模板
 * @param {string} source
 * @returns {object}
 */
export function createFeedbackTemplate(source = '真人专家') {
  return {
    id: 'fb-' + Date.now(),
    source,
    timestamp: new Date().toISOString(),
    ratings: { ui: 5, function: 5, accuracy: 5, practical: 5, smooth: 5 },
    text: '',
    findings: []
  };
}
