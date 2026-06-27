/* ═══════════════════════════════════════════════════════════════
   risk-engine.js — S×L×D 三维风险量化引擎
   依赖 hazard-taxonomy.js
   ═══════════════════════════════════════════════════════════════ */

import { resolveTaxonomy, CATEGORY_NAMES } from './hazard-taxonomy.js';

/** GB 35181-2025 直接判定要素关键词 — 触及自动标记 S=4 */
const GB35181_DIRECT_TRIGGERS = [
  '火灾自动报警系统瘫痪', '自动灭火系统瘫痪', '消火栓系统瘫痪',
  '疏散通道封堵', '安全出口锁闭', '消防车道堵塞',
  '防火分区破坏', '消防控制室无人值守'
];

/**
 * 评估严重性 Severity (1-4)
 * @param {object} hazard - { taxonomyCode, description, category }
 * @returns {number} 1-4
 */
export function assessSeverity(hazard) {
  const desc = (hazard.description || '').toLowerCase();
  const title = (hazard.title || hazard.type || '').toLowerCase();
  const combined = desc + ' ' + title;

  /* GB 35181 direct triggers → S4 */
  for (const trigger of GB35181_DIRECT_TRIGGERS) {
    if (combined.includes(trigger)) return 4;
  }

  /* Heuristic scoring */
  const s4Keywords = ['瘫痪', '完全失效', '严重堵塞', '锁闭', '生命危险', '必然导致火灾'];
  const s3Keywords = ['严重', '大量', '堵塞', '损坏严重', '影响疏散', '火势蔓延'];
  const s2Keywords = ['损坏', '破损', '过期', '部分', '遮挡', '不足'];
  const s1Keywords = ['轻微', '美观', '灯罩', '标识不清'];

  if (s4Keywords.some(k => combined.includes(k))) return 4;
  if (s3Keywords.some(k => combined.includes(k))) return 3;
  if (s2Keywords.some(k => combined.includes(k))) return 2;
  if (s1Keywords.some(k => combined.includes(k))) return 1;

  /* Default: moderate */
  return 2;
}

/**
 * 评估可能性 Likelihood (1-4)
 * @param {object} hazard
 * @param {number} sceneRiskBase - 场所风险基数 (1-4)
 * @returns {number} 1-4
 */
export function assessLikelihood(hazard, sceneRiskBase = 2) {
  let L = sceneRiskBase;
  const desc = (hazard.description || '').toLowerCase();
  const cat = hazard.category || '';

  /* Modifiers */
  if (cat === '电气安全' && (desc.includes('老化') || desc.includes('裸露'))) L += 1;
  if (cat === '火源管理') L += 1;
  if (desc.includes('易燃') || desc.includes('可燃')) L += 1;
  if (desc.includes('私拉') || desc.includes('乱接')) L += 1;

  return Math.min(4, Math.max(1, L));
}

/**
 * 评估可检测性 Detectability (1-4)
 * D值越高 = 越难发现 = 越危险
 * @param {object} hazard - { confidence, description }
 * @returns {number} 1-4
 */
export function assessDetectability(hazard) {
  const desc = (hazard.description || '').toLowerCase();
  const confidence = hazard.confidence || 'medium';

  /* Hard-to-detect indicators */
  if (desc.includes('天花板') || desc.includes('隐蔽') || desc.includes('内部') || desc.includes('夹层')) return 4;
  if (desc.includes('高处') || desc.includes('角落') || desc.includes('背面')) return 3;

  /* Confidence-based */
  if (confidence === 'low') return 4;
  if (confidence === 'medium') return 2;

  /* Easy to spot */
  return 1;
}

/**
 * 主入口：三维风险量化
 * @param {object} hazard - { title, taxonomyCode, category, description, confidence }
 * @param {number} sceneRiskBase - 场所风险基数
 * @returns {object} { riskScore, riskLevel, riskColor, rectificationDeadline, S, L, D }
 */
export function quantifyRisk(hazard, sceneRiskBase = 2) {
  const S = assessSeverity(hazard);
  const L = assessLikelihood(hazard, sceneRiskBase);
  const D = assessDetectability(hazard);
  const riskScore = S * L * D;

  let riskLevel, riskColor, rectificationDeadline;
  if (riskScore <= 8) {
    riskLevel = 'I';
    riskColor = '#3B82F6';
    rectificationDeadline = '下次巡检复查';
  } else if (riskScore <= 18) {
    riskLevel = 'II';
    riskColor = '#EAB308';
    rectificationDeadline = '限期30天整改';
  } else if (riskScore <= 36) {
    riskLevel = 'III';
    riskColor = '#F97316';
    rectificationDeadline = '限期7天整改';
  } else {
    riskLevel = 'IV';
    riskColor = '#D92121';
    rectificationDeadline = '立即整改';
  }

  return { riskScore, riskLevel, riskColor, rectificationDeadline, S, L, D };
}

/**
 * 批量风险量化
 * @param {Array} hazards
 * @param {number} sceneRiskBase
 * @returns {Array} hazards with risk fields added
 */
export function quantifyAllRisks(hazards, sceneRiskBase = 2) {
  return hazards.map(h => {
    const risk = quantifyRisk(h, sceneRiskBase);
    return { ...h, ...risk };
  });
}

/**
 * 获取最高风险等级
 * @param {Array} hazards
 * @returns {string} 'I' | 'II' | 'III' | 'IV'
 */
export function getHighestRiskLevel(hazards) {
  const order = { 'I': 0, 'II': 1, 'III': 2, 'IV': 3 };
  return hazards.reduce((max, h) => {
    const level = h.riskLevel || 'I';
    return order[level] > order[max] ? level : max;
  }, 'I');
}

/**
 * 统计各风险等级数量
 * @param {Array} hazards
 * @returns {object} { I: n, II: n, III: n, IV: n }
 */
export function countRiskLevels(hazards) {
  const counts = { I: 0, II: 0, III: 0, IV: 0 };
  hazards.forEach(h => {
    const level = h.riskLevel || 'I';
    counts[level] = (counts[level] || 0) + 1;
  });
  return counts;
}
