/* ═══════════════════════════════════════════════════════════════
   report-generator.js — 报告生成器 (前端侧)
   组装检查报告、格式化输出、导出支持
   ═══════════════════════════════════════════════════════════════ */

/**
 * 从识别结果生成检查报告
 * @param {object} recognitionResult — server.cjs recognizeImage 返回结果
 * @param {object} meta — { location, inspector, buildingName }
 * @returns {object} report
 */
export function generateReport(recognitionResult, meta = {}) {
  const { hazards = [], meta: algoMeta = {} } = recognitionResult;

  const report = {
    id: 'RPT-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' +
      String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
    title: `${meta.buildingName || '消防巡检'}报告`,
    location: meta.location || '',
    inspector: meta.inspector || '',
    inspectDate: new Date().toISOString().slice(0, 10),
    status: '待整改',
    hazards: hazards.map(h => ({
      id: h.id || 'HZ-' + Math.random().toString(36).slice(2, 8),
      title: h.title,
      category: h.category,
      severity: h.severity,
      description: h.description,
      taxonomyCode: h.taxonomyCode,
      riskLevel: h.riskLevel,
      riskScore: h.riskScore,
      confidence: h.confidence,
      matchedLaws: (h.matchedLaws || []).map(l => ({
        lawId: l.lawId,
        title: l.title,
        clause: l.clause,
        level: l.level,
        penalty: l.penalty
      })),
      rectification: h.rectification || ''
    })),
    rectifications: hazards.map(h => ({
      hazardId: h.id,
      action: h.rectification || '待制定整改措施',
      deadline: '',
      status: 'pending'
    })),
    meta: algoMeta
  };

  return report;
}

/**
 * 导出报告为 JSON
 * @param {object} report
 * @returns {string} JSON string
 */
export function exportToJSON(report) {
  return JSON.stringify(report, null, 2);
}

/**
 * 导出报告为纯文本
 * @param {object} report
 * @returns {string}
 */
export function exportToText(report) {
  let text = `检查报告: ${report.title}\n`;
  text += `报告编号: ${report.id}\n`;
  text += `检查地点: ${report.location}\n`;
  text += `检查人员: ${report.inspector}\n`;
  text += `检查日期: ${report.inspectDate}\n`;
  text += `${'='.repeat(50)}\n\n`;

  report.hazards.forEach((h, i) => {
    text += `隐患 ${i + 1}: ${h.title}\n`;
    text += `  类别: ${h.category} (${h.taxonomyCode})\n`;
    text += `  风险等级: ${h.riskLevel}级 (${h.riskScore}分)\n`;
    text += `  描述: ${h.description}\n`;
    if (h.matchedLaws && h.matchedLaws.length > 0) {
      text += `  法规依据:\n`;
      h.matchedLaws.forEach(l => {
        text += `    - ${l.title} ${l.clause}\n`;
      });
    }
    text += `  整改建议: ${h.rectification}\n\n`;
  });

  return text;
}

/**
 * 计算整改率
 * @param {Array} rectifications
 * @returns {{ total, completed, rate }}
 */
export function calcRectificationRate(rectifications) {
  const total = rectifications.length;
  const completed = rectifications.filter(r => r.status === 'completed').length;
  return {
    total,
    completed,
    rate: total > 0 ? Math.round((completed / total) * 100) : 0
  };
}
