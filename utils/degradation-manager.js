/* ═══════════════════════════════════════════════════════════════
   degradation-manager.js — L0→L3 四级降级决策引擎
   根据可用资源自动降级，确保不白屏
   ═══════════════════════════════════════════════════════════════ */

/** 降级层级定义 */
export const DEGRADATION_LEVELS = {
  L0: {
    name: '全功能',
    description: 'DeepSeek Vision + 向量检索 + LLM 生成全部可用',
    visionMethod: 'deepseek_vision',
    regulationMethod: 'vector_semantic',
    reportMethod: 'llm_generation',
    responseTime: '3-8秒',
    offlineAvailable: false,
    color: '#16A34A'
  },
  L1: {
    name: '规则增强',
    description: 'Vision API 正常，向量库不可用，法规匹配降为规则关键词',
    visionMethod: 'deepseek_vision',
    regulationMethod: 'rule_keyword',
    reportMethod: 'llm_generation',
    responseTime: '3-6秒',
    offlineAvailable: false,
    color: '#EAB308'
  },
  L2: {
    name: '离线本地',
    description: 'Vision API 不可用，使用本地 YOLO + 规则引擎',
    visionMethod: 'local_yolo',
    regulationMethod: 'rule_keyword',
    reportMethod: 'template',
    responseTime: '<2秒',
    offlineAvailable: true,
    color: '#F97316'
  },
  L3: {
    name: '手动辅助',
    description: '全部 AI 能力不可用，输出静态消防检查清单',
    visionMethod: 'none',
    regulationMethod: 'static_checklist',
    reportMethod: 'none',
    responseTime: '即时',
    offlineAvailable: true,
    color: '#9CA3AF'
  }
};

/**
 * 降级决策主函数
 * @param {object} capabilities - 可用能力状态
 * @param {boolean} capabilities.apiKeyAvailable
 * @param {boolean} capabilities.vectorDbAvailable
 * @param {boolean} capabilities.localModelAvailable
 * @returns {string} 'L0' | 'L1' | 'L2' | 'L3'
 */
export function decideLevel(capabilities = {}) {
  const {
    apiKeyAvailable = false,
    vectorDbAvailable = false,
    localModelAvailable = false
  } = capabilities;

  /* No API key at all → check local model */
  if (!apiKeyAvailable) {
    if (localModelAvailable) return 'L2';
    return 'L3';
  }

  /* API key available but vector DB down → L1 */
  if (!vectorDbAvailable) return 'L1';

  /* Everything available → L0 */
  return 'L0';
}

/**
 * 获取当前降级层级详情
 * @param {string} level
 * @returns {object}
 */
export function getLevelInfo(level) {
  return DEGRADATION_LEVELS[level] || DEGRADATION_LEVELS.L3;
}

/**
 * 获取 mode 字符串（用于 API 返回的 meta.mode）
 * @param {string} level
 * @returns {string}
 */
export function getModeString(level) {
  const modeMap = {
    'L0': 'hybrid_ai',
    'L1': 'hybrid_fallback_vec',
    'L2': 'hybrid_fallback_vision',
    'L3': 'rules_only'
  };
  return modeMap[level] || 'rules_only';
}

/**
 * 判断当前层级是否支持某个能力
 * @param {string} level
 * @param {string} capability - 'vision' | 'semantic' | 'llm_report' | 'offline'
 * @returns {boolean}
 */
export function hasCapability(level, capability) {
  const info = DEGRADATION_LEVELS[level];
  if (!info) return false;

  switch (capability) {
    case 'vision':
      return info.visionMethod !== 'none';
    case 'semantic':
      return info.regulationMethod === 'vector_semantic';
    case 'llm_report':
      return info.reportMethod === 'llm_generation';
    case 'offline':
      return info.offlineAvailable;
    default:
      return false;
  }
}

/**
 * 生成 L3 手动辅助模式的静态检查清单
 * @param {string} sceneType - 场所类型
 * @returns {Array}
 */
export function generateChecklist(sceneType = '公众聚集场所') {
  return [
    { category: '消防设施', items: [
      '灭火器是否配置到位、压力正常、未过期',
      '消火栓箱是否完好、水带水枪齐全',
      '火灾报警器是否正常工作',
      '应急照明灯和疏散指示标志是否完好'
    ]},
    { category: '疏散通道', items: [
      '安全出口是否畅通、未被锁闭',
      '疏散走道是否保持畅通、宽度达标',
      '常闭式防火门是否处于关闭状态',
      '消防车道是否畅通'
    ]},
    { category: '电气安全', items: [
      '电气线路是否穿管保护',
      '是否存在私拉乱接现象',
      '配电箱周围是否堆放可燃物'
    ]},
    { category: '火源管理', items: [
      '是否存在违规明火或吸烟',
      '易燃物品是否规范存放',
      '防火分隔是否完好'
    ]},
    { category: '消防管理', items: [
      '消防安全责任人是否明确',
      '消防巡查记录是否完整',
      '员工是否经过消防培训'
    ]}
  ];
}
