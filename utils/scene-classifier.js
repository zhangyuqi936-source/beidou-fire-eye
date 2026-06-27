/* ═══════════════════════════════════════════════════════════════
   scene-classifier.js — 8类场所识别规则词典
   基于 GB 35181-2025 场所分类定义
   ═══════════════════════════════════════════════════════════════ */

/** 场景分类词典：8大类 + 办公/住宅补充 */
export const SCENE_DICT = [
  { code: 'A', type: '公共娱乐场所', keywords: ['影剧院', 'KTV', '夜总会', '游乐厅', '桑拿', '网吧', '歌舞厅', '游戏厅', '酒吧'], riskBase: 3 },
  { code: 'B', type: '公众聚集场所', keywords: ['宾馆', '饭店', '商场', '集贸市场', '体育场馆', '超市', '餐厅', '酒店', '会堂'], riskBase: 2 },
  { code: 'C', type: '人员密集场所', keywords: ['医院', '学校', '养老院', '托儿所', '展览馆', '图书馆', '博物馆', '车站', '机场', '候车室'], riskBase: 2 },
  { code: 'D', type: '儿童活动场所', keywords: ['幼儿园', '儿童乐园', '早教中心', '托育', '母婴', '游乐场'], riskBase: 3 },
  { code: 'E', type: '老年人照料设施', keywords: ['养老院', '日间照料', '老年公寓', '护理院', '敬老院', '福利院'], riskBase: 3 },
  { code: 'F', type: '劳动密集型企业', keywords: ['厂房', '仓库', '物流', '工厂', '车间', '仓储', '加工'], riskBase: 4 },
  { code: 'G', type: '易燃易爆场所', keywords: ['化工', '储罐', '加油站', '加气站', '油库', '爆炸', '危险品', '烟花爆竹'], riskBase: 4 },
  { code: 'H', type: '多业态混合场所', keywords: ['商业综合体', '综合楼', '分租', '写字楼', '大厦', '广场', '中心'], riskBase: 2 },
  { code: 'H1', type: '住宅建筑', keywords: ['住宅', '小区', '公寓', '居民楼', '宿舍', '民房'], riskBase: 1 },
  { code: 'H2', type: '办公建筑', keywords: ['办公', '写字楼', '商务', '会议', '公司'], riskBase: 1 }
];

/**
 * 基于关键词匹配的场景分类（纯规则，不依赖 LLM）
 * @param {string} description - 场景描述文字
 * @param {string} [hint] - 用户指定的场所类型提示
 * @returns {{ sceneType: string, sceneCode: string, riskBase: number, method: string, confidence: string }}
 */
export function classifyScene(description = '', hint = '') {
  const text = (description + ' ' + hint).toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const entry of SCENE_DICT) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (text.includes(kw.toLowerCase())) {
        score += kw.length; // 更长关键词匹配权重更高
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch) {
    return {
      sceneType: bestMatch.type,
      sceneCode: bestMatch.code,
      riskBase: bestMatch.riskBase,
      method: 'rule_dict',
      confidence: bestScore > 3 ? 'high' : 'medium'
    };
  }

  /* 默认兜底 */
  return {
    sceneType: '公众聚集场所',
    sceneCode: 'B',
    riskBase: 2,
    method: 'default',
    confidence: 'low'
  };
}

/**
 * 获取所有支持的场所类型列表
 * @returns {Array<{code, type, riskBase}>}
 */
export function getSceneTypes() {
  return SCENE_DICT.map(e => ({ code: e.code, type: e.type, riskBase: e.riskBase }));
}

/**
 * 获取场所的默认风险基数
 * @param {string} sceneCode
 * @returns {number}
 */
export function getRiskBase(sceneCode) {
  const entry = SCENE_DICT.find(e => e.code === sceneCode);
  return entry ? entry.riskBase : 2;
}
