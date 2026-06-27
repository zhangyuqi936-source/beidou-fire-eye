/* ═══════════════════════════════════════════════════════════════
   hazard-taxonomy.js — GB 35181-2025 隐患分类树
   无外部依赖，纯数据结构 + 查询方法
   ═══════════════════════════════════════════════════════════════ */

/** 5大类隐患分类树，约60个末端节点 */
export const TAXONOMY = {
  '1': {
    name: '消防设施类',
    children: {
      '1.1': { name: '火灾自动报警系统', children: {
        '1.1.1': '系统未安装或未启用', '1.1.2': '探测器被遮挡/损坏',
        '1.1.3': '手动报警按钮缺失', '1.1.4': '系统处于故障/停用状态'
      }},
      '1.2': { name: '自动灭火系统', children: {
        '1.2.1': '喷淋头被遮挡/涂覆', '1.2.2': '系统未按标准设置',
        '1.2.3': '管网无水/压力不足'
      }},
      '1.3': { name: '灭火器', children: {
        '1.3.1': '灭火器缺失/数量不足', '1.3.2': '灭火器过期/压力不足',
        '1.3.3': '灭火器被遮挡/不易取用', '1.3.4': '灭火器类型不匹配'
      }},
      '1.4': { name: '消火栓系统', children: {
        '1.4.1': '消火栓箱被遮挡/封堵', '1.4.2': '水带/水枪缺失或损坏',
        '1.4.3': '消火栓无水/水压不足'
      }},
      '1.5': { name: '应急照明与疏散指示', children: {
        '1.5.1': '应急照明灯缺失/损坏', '1.5.2': '疏散指示标志缺失/不亮',
        '1.5.3': '标志设置位置不符合规范'
      }}
    }
  },
  '2': {
    name: '疏散通道类',
    children: {
      '2.1': { name: '安全出口', children: {
        '2.1.1': '安全出口数量不足', '2.1.2': '安全出口被锁闭/封堵',
        '2.1.3': '安全出口宽度不足'
      }},
      '2.2': { name: '疏散走道', children: {
        '2.2.1': '疏散走道被占用/堆放杂物', '2.2.2': '疏散走道宽度不足',
        '2.2.3': '疏散走道未保持畅通'
      }},
      '2.3': { name: '疏散楼梯', children: {
        '2.3.1': '疏散楼梯间被占用', '2.3.2': '常闭式防火门未关闭',
        '2.3.3': '前室被挪用'
      }},
      '2.4': { name: '消防车道', children: {
        '2.4.1': '消防车道被占用/堵塞', '2.4.2': '消防车道转弯半径不足'
      }}
    }
  },
  '3': {
    name: '电气安全类',
    children: {
      '3.1': { name: '电气线路', children: {
        '3.1.1': '电线私拉乱接', '3.1.2': '线路老化/破损裸露',
        '3.1.3': '线缆未穿管保护', '3.1.4': '电气线路超负荷'
      }},
      '3.2': { name: '配电设施', children: {
        '3.2.1': '配电箱周围堆放可燃物', '3.2.2': '配电箱门未关闭/损坏',
        '3.2.3': '配电间被挪作他用'
      }},
      '3.3': { name: '用电设备', children: {
        '3.3.1': '大功率电器违规使用', '3.3.2': '电器设备靠近可燃物'
      }}
    }
  },
  '4': {
    name: '火源管理类',
    children: {
      '4.1': { name: '明火管理', children: {
        '4.1.1': '违规使用明火', '4.1.2': '吸烟管理缺失',
        '4.1.3': '动火作业未审批'
      }},
      '4.2': { name: '易燃物管理', children: {
        '4.2.1': '易燃物品违规存放', '4.2.2': '可燃垃圾堆积',
        '4.2.3': '易燃装修材料使用'
      }},
      '4.3': { name: '防火分隔', children: {
        '4.3.1': '防火分区被破坏', '4.3.2': '防火卷帘下方堆物',
        '4.3.3': '防火封堵不严密'
      }}
    }
  },
  '5': {
    name: '管理缺失类',
    children: {
      '5.1': { name: '消防管理', children: {
        '5.1.1': '消防安全责任人未明确', '5.1.2': '消防巡查记录缺失'
      }},
      '5.2': { name: '人员能力', children: {
        '5.2.1': '员工未经消防培训', '5.2.2': '消防演练未定期开展'
      }}
    }
  }
};

/** 大类名称映射 */
export const CATEGORY_NAMES = {
  '1': '消防设施', '2': '疏散通道', '3': '电气安全', '4': '火源管理', '5': '管理缺失'
};

/** 视觉可检测性矩阵 */
export const VISUAL_DETECTABILITY = {
  '1.1': 'visual-context', '1.2': 'visual-context', '1.3': 'visual',
  '1.4': 'visual', '1.5': 'visual',
  '2.1': 'visual-context', '2.2': 'visual', '2.3': 'visual-context',
  '2.4': 'visual',
  '3.1': 'infer', '3.2': 'visual-context', '3.3': 'visual',
  '4.1': 'visual', '4.2': 'visual', '4.3': 'visual-context',
  '5.1': 'non-visual', '5.2': 'non-visual'
};

/**
 * 通过分类编码获取完整路径
 * @param {string} code - 如 '1.3.1'
 * @returns {object} { majorCategory, subCategory, leafName, fullPath, detectability }
 */
export function resolveTaxonomy(code) {
  const parts = code.split('.');
  const majorKey = parts[0];
  const subKey = parts.slice(0, 2).join('.');
  const major = TAXONOMY[majorKey];
  if (!major) return null;
  const sub = major.children[subKey];
  if (!sub) return null;
  const leafName = sub.children ? sub.children[code] : null;
  return {
    code,
    majorCategory: CATEGORY_NAMES[majorKey] || '未知',
    subCategory: sub.name,
    leafName: leafName || code,
    fullPath: `${major.name} > ${sub.name} > ${leafName || code}`,
    detectability: VISUAL_DETECTABILITY[subKey] || 'visual'
  };
}

/**
 * 获取所有末端节点列表
 * @returns {Array<{code, name, category, detectability}>}
 */
export function getAllLeafNodes() {
  const nodes = [];
  for (const [majorKey, major] of Object.entries(TAXONOMY)) {
    for (const [subKey, sub] of Object.entries(major.children)) {
      for (const [leafCode, leafName] of Object.entries(sub.children)) {
        nodes.push({
          code: leafCode,
          name: leafName,
          category: CATEGORY_NAMES[majorKey],
          subCategory: sub.name,
          detectability: VISUAL_DETECTABILITY[subKey] || 'visual'
        });
      }
    }
  }
  return nodes;
}

/**
 * 搜索分类节点
 * @param {string} keyword
 * @returns {Array}
 */
export function searchNodes(keyword) {
  return getAllLeafNodes().filter(n =>
    n.name.includes(keyword) || n.category.includes(keyword) || n.subCategory.includes(keyword)
  );
}
