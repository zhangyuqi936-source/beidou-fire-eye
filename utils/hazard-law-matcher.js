/* ═══════════════════════════════════════════════════════════════
   hazard-law-matcher.js — 隐患-法规匹配封装层
   依赖 regulation-matcher.js
   ═══════════════════════════════════════════════════════════════ */

import { matchRegulation, matchAllRegulations } from './regulation-matcher.js';

/**
 * 为单个隐患匹配法规
 * @param {object} hazard - { title, taxonomyCode, category, description, riskLevel }
 * @param {Array} lawDb - 法规数据库
 * @param {object} [options]
 * @returns {object} hazard with matchedLaws
 */
export function matchHazardToLaws(hazard, lawDb, options = {}) {
  const matchedLaws = matchRegulation(hazard, lawDb, options);
  return {
    ...hazard,
    matchedLaws: matchedLaws.map(l => ({
      lawId: l.lawId,
      title: l.title,
      code: l.code,
      clause: l.clause,
      content: l.content,
      level: l.level,
      penalty: l.penalty,
      matchMethod: l.matchMethod,
      relevanceScore: l.relevanceScore
    }))
  };
}

/**
 * 批量匹配
 * @param {Array} hazards
 * @param {Array} lawDb
 * @returns {Array}
 */
export function matchAllHazards(hazards, lawDb) {
  return matchAllRegulations(hazards, lawDb);
}

/**
 * 生成隐患整改建议
 * @param {object} hazard - with riskLevel, category, description, matchedLaws
 * @returns {string}
 */
export function generateRectificationAdvice(hazard) {
  const { riskLevel, category, description, matchedLaws } = hazard;
  const laws = matchedLaws || [];

  let advice = '';

  switch (riskLevel) {
    case 'IV':
      advice = '【立即整改】';
      break;
    case 'III':
      advice = '【限期7天整改】';
      break;
    case 'II':
      advice = '【限期30天整改】';
      break;
    default:
      advice = '【建议整改】';
  }

  /* Category-specific advice */
  const categoryAdvice = {
    '消防设施': '联系消防维保单位进行检修或更换。',
    '疏散通道': '立即清理障碍物，确保通道畅通。',
    '电气安全': '委托持证电工进行线路整改。',
    '火源管理': '加强火源管控，清理易燃物。',
    '管理缺失': '完善消防安全管理制度和记录。'
  };

  advice += ' ' + (categoryAdvice[category] || '请专业人员评估处理。');

  /* Add law references */
  if (laws.length > 0) {
    advice += ` 依据：${laws.map(l => l.code || l.lawId).join('、')}。`;
  }

  return advice;
}

/**
 * 格式化法规条款为展示文本
 * @param {Array} matchedLaws
 * @returns {string}
 */
export function formatLawsForDisplay(matchedLaws) {
  if (!matchedLaws || matchedLaws.length === 0) return '暂无匹配法规';

  return matchedLaws.map((l, i) =>
    `${i + 1}. ${l.code} ${l.name || ''} ${l.clause || ''} — ${l.content || ''}`
  ).join('\n');
}

/**
 * 获取处罚信息摘要
 * @param {Array} matchedLaws
 * @returns {string}
 */
export function getPenaltySummary(matchedLaws) {
  const penalties = (matchedLaws || [])
    .filter(l => l.penalty)
    .map(l => l.penalty);
  return penalties.length > 0
    ? '处罚依据：' + penalties.join('；')
    : '请查阅相关法规了解处罚标准。';
}
