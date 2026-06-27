/* ═══════════════════════════════════════════════════════════════
   regulation-matcher.js — 法规语义匹配引擎
   主: mxbai-embed 向量检索 (v1 为规则关键词实现)
   兜底: 内置关键词→法规映射表
   依赖 law-db.json
   ═══════════════════════════════════════════════════════════════ */

/** 内置关键词→法规ID 映射表 (向量库不可用时的兜底) */
const KEYWORD_RULE_MAP = [
  {
    pattern: /灭火器.*(缺失|数量|不足|过期|压力|遮挡|不易取用|类型)/i,
    laws: ['GB50140-6.1', 'GB50140-6.2'],
    explanation: '灭火器配置与维护要求'
  },
  {
    pattern: /消火栓.*(遮挡|封堵|缺失|损坏|无水|水压|水带|水枪)/i,
    laws: ['FIRELAW-28', 'FIRELAW-16'],
    explanation: '消火栓设施保护与管理'
  },
  {
    pattern: /(疏散|安全出口|走道|通道).*(堵塞|占用|锁闭|封堵|宽度|不足|不畅)/i,
    laws: ['GB50016-5.5.2', 'GB50016-5.5.18', 'FIRELAW-28', 'GB35181-2025-A2'],
    explanation: '疏散通道与安全出口要求'
  },
  {
    pattern: /(电气|电线|线路|电缆).*(私拉|乱接|老化|裸露|未穿管|超负荷|破损)/i,
    laws: ['GB50016-10.2'],
    explanation: '电气线路防火保护'
  },
  {
    pattern: /(防火门).*(未关|常开|损坏|缺失)/i,
    laws: ['GB50016-5.5.2', 'FIRELAW-28'],
    explanation: '防火门管理要求'
  },
  {
    pattern: /(防火分区|防火分隔|防火卷帘).*(破坏|堆物|封堵|不严密|下方)/i,
    laws: ['GB55037-2.2.1'],
    explanation: '防火分区与分隔要求'
  },
  {
    pattern: /(应急灯|应急照明|疏散标志|疏散指示).*(缺失|损坏|不亮|位置)/i,
    laws: ['FIRELAW-16'],
    explanation: '应急照明与疏散指示标志'
  },
  {
    pattern: /(报警器|报警系统|自动报警).*(故障|损坏|停用|瘫痪|遮挡)/i,
    laws: ['GB35181-2025-A1'],
    explanation: '火灾自动报警系统'
  },
  {
    pattern: /(喷淋|自动灭火|自动喷水).*(遮挡|涂覆|无水|未设|未安装)/i,
    laws: ['GB35181-2025-A1'],
    explanation: '自动灭火系统要求'
  },
  {
    pattern: /(易燃|可燃|危险品|化学品).*(堆积|存放|违规|储存)/i,
    laws: ['FIRELAW-28'],
    explanation: '易燃易爆物品管理'
  },
  {
    pattern: /(明火|吸烟|动火).*(违规|未审批|管理)/i,
    laws: ['FIRELAW-28'],
    explanation: '明火与动火作业管理'
  },
  {
    pattern: /(消防车通道|消防车道).*(占用|堵塞)/i,
    laws: ['FIRELAW-28'],
    explanation: '消防车道管理'
  },
  {
    pattern: /(配电箱|配电间|配电室).*(堆物|未关|挪用|可燃物)/i,
    laws: ['GB50016-10.2'],
    explanation: '配电设施防火要求'
  },
  {
    pattern: /(巡查|检查).*(记录|缺失|未开展|不完整)/i,
    laws: ['FIRELAW-16'],
    explanation: '消防巡查制度'
  },
  {
    pattern: /(培训|演练).*(未开展|缺失|不足|未定期)/i,
    laws: ['FIRELAW-16'],
    explanation: '消防培训与演练'
  }
];

/**
 * 关键词规则匹配 (始终可用的兜底方案)
 * @param {string} text - 隐患描述文本
 * @param {Array} lawDb - 完整法规数据库 (laws + customLaws)
 * @returns {Array} 匹配的法规列表
 */
function matchByKeywords(text, lawDb) {
  const results = [];
  const seenIds = new Set();

  for (const rule of KEYWORD_RULE_MAP) {
    if (rule.pattern.test(text)) {
      for (const lawId of rule.laws) {
        if (seenIds.has(lawId)) continue;
        const law = lawDb.find(l => l.id === lawId);
        if (law) {
          seenIds.add(lawId);
          results.push({
            ...law,
            matchMethod: 'keyword',
            relevanceScore: 0.9,
            matchExplanation: rule.explanation
          });
        }
      }
    }
  }

  return results;
}

/**
 * 分类匹配 — 按隐患类别筛选法规
 * @param {string} category - 隐患类别
 * @param {Array} lawDb
 * @returns {Array}
 */
function matchByCategory(category, lawDb) {
  return lawDb
    .filter(l => l.category === category)
    .slice(0, 3)
    .map(l => ({
      ...l,
      matchMethod: 'category',
      relevanceScore: 0.7
    }));
}

/**
 * 关键词重叠匹配
 * @param {string} text
 * @param {Array} lawDb
 * @returns {Array}
 */
function matchByKeywordOverlap(text, lawDb) {
  const words = text.toLowerCase().split(/[\s,，。、]+/).filter(w => w.length > 1);
  const results = [];

  for (const law of lawDb) {
    const keywords = law.keywords || [];
    const overlap = keywords.filter(k => words.some(w => w.includes(k) || k.includes(w))).length;
    if (overlap > 0) {
      results.push({
        ...law,
        matchMethod: 'keyword_overlap',
        relevanceScore: Math.min(0.6 + overlap * 0.1, 0.85)
      });
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * 主入口：法规语义匹配
 * @param {object} hazard - { title, taxonomyCode, category, description }
 * @param {Array} lawDb - 法规数据库 (laws + customLaws)
 * @param {object} [options]
 * @param {number} [options.topN=5] - 返回Top-N结果
 * @param {boolean} [options.useVector=true] - 是否尝试向量检索 (v1始终false)
 * @returns {Array} 排序去重后的法规列表
 */
export function matchRegulation(hazard, lawDb, options = {}) {
  const { topN = 5 } = options;
  const text = `${hazard.title || hazard.type || ''} ${hazard.description || ''} ${hazard.category || ''}`;

  /* Multi-strategy matching */
  const keywordResults = matchByKeywords(text, lawDb);
  const categoryResults = matchByCategory(hazard.category, lawDb);
  const overlapResults = matchByKeywordOverlap(text, lawDb);

  /* Merge & deduplicate */
  const allResults = [...keywordResults, ...categoryResults, ...overlapResults];
  const seen = new Set();
  const unique = [];

  for (const r of allResults) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      unique.push({
        lawId: r.id,
        title: `${r.code} ${r.name}`,
        code: r.code,
        name: r.name,
        clause: r.clause,
        content: r.content,
        level: r.level,
        penalty: r.penalty,
        category: r.category,
        matchMethod: r.matchMethod,
        relevanceScore: r.relevanceScore
      });
    }
  }

  /* Sort by relevance */
  unique.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  return unique.slice(0, topN);
}

/**
 * 批量匹配
 * @param {Array} hazards
 * @param {Array} lawDb
 * @returns {Array} hazards with matchedLaws field
 */
export function matchAllRegulations(hazards, lawDb) {
  return hazards.map(h => ({
    ...h,
    matchedLaws: matchRegulation(h, lawDb)
  }));
}
