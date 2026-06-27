/* ═══════════════════════════════════════════════════════════════
   北斗火眼·消防智查 v3.0 — Node.js 后端服务 (server.cjs)
   BDHY-Hybrid Hazard Recognition v1 算法引擎
   ═══════════════════════════════════════════════════════════════ */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const { execSync } = require('child_process');

/* ═══════════════════════════════════════════════════════════════
   Configuration
   ═══════════════════════════════════════════════════════════════ */
const CONFIG = {
  port: process.env.PORT || 8080,
  h5Dir: path.join(__dirname, 'dist', 'build', 'h5'),
  dataDir: path.join(__dirname, 'data'),
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  apiBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  visionModel: 'deepseek-chat',
  peUrl: process.env.PE_URL || 'http://localhost:3100',
  cacheTTL: 5 * 60 * 1000, // 5 min
  maxImageSize: 10 * 1024 * 1024, // 10MB
  maxVideoSize: 100 * 1024 * 1024, // 100MB
  version: '3.0.0',
  algorithmVersion: 'v1',
  agentVersion: 1
};

/* ═══════════════════════════════════════════════════════════════
   In-Memory Cache
   ═══════════════════════════════════════════════════════════════ */
const imageCache = new Map(); // key: sha256 → { result, timestamp }

/* ═══════════════════════════════════════════════════════════════
   GB 35181-2025 Hazard Taxonomy Constant
   ═══════════════════════════════════════════════════════════════ */
const HAZARD_TAXONOMY = {
  '1': { name: '消防设施类', children: {
    '1.1': { name: '火灾自动报警系统', children: {
      '1.1.1': '系统未安装或未启用', '1.1.2': '探测器被遮挡/损坏',
      '1.1.3': '手动报警按钮缺失', '1.1.4': '系统处于故障/停用状态' }},
    '1.2': { name: '自动灭火系统', children: {
      '1.2.1': '喷淋头被遮挡/涂覆', '1.2.2': '系统未按标准设置', '1.2.3': '管网无水/压力不足' }},
    '1.3': { name: '灭火器', children: {
      '1.3.1': '灭火器缺失/数量不足', '1.3.2': '灭火器过期/压力不足',
      '1.3.3': '灭火器被遮挡/不易取用', '1.3.4': '灭火器类型不匹配' }},
    '1.4': { name: '消火栓系统', children: {
      '1.4.1': '消火栓箱被遮挡/封堵', '1.4.2': '水带/水枪缺失或损坏', '1.4.3': '消火栓无水/水压不足' }},
    '1.5': { name: '应急照明与疏散指示', children: {
      '1.5.1': '应急照明灯缺失/损坏', '1.5.2': '疏散指示标志缺失/不亮', '1.5.3': '标志设置位置不符合规范' }}
  }},
  '2': { name: '疏散通道类', children: {
    '2.1': { name: '安全出口', children: {
      '2.1.1': '安全出口数量不足', '2.1.2': '安全出口被锁闭/封堵', '2.1.3': '安全出口宽度不足' }},
    '2.2': { name: '疏散走道', children: {
      '2.2.1': '疏散走道被占用/堆放杂物', '2.2.2': '疏散走道宽度不足', '2.2.3': '疏散走道未保持畅通' }},
    '2.3': { name: '疏散楼梯', children: {
      '2.3.1': '疏散楼梯间被占用', '2.3.2': '常闭式防火门未关闭', '2.3.3': '前室被挪用' }},
    '2.4': { name: '消防车道', children: {
      '2.4.1': '消防车道被占用/堵塞', '2.4.2': '消防车道转弯半径不足' }}
  }},
  '3': { name: '电气安全类', children: {
    '3.1': { name: '电气线路', children: {
      '3.1.1': '电线私拉乱接', '3.1.2': '线路老化/破损裸露', '3.1.3': '线缆未穿管保护', '3.1.4': '电气线路超负荷' }},
    '3.2': { name: '配电设施', children: {
      '3.2.1': '配电箱周围堆放可燃物', '3.2.2': '配电箱门未关闭/损坏', '3.2.3': '配电间被挪作他用' }},
    '3.3': { name: '用电设备', children: {
      '3.3.1': '大功率电器违规使用', '3.3.2': '电器设备靠近可燃物' }}
  }},
  '4': { name: '火源管理类', children: {
    '4.1': { name: '明火管理', children: {
      '4.1.1': '违规使用明火', '4.1.2': '吸烟管理缺失', '4.1.3': '动火作业未审批' }},
    '4.2': { name: '易燃物管理', children: {
      '4.2.1': '易燃物品违规存放', '4.2.2': '可燃垃圾堆积', '4.2.3': '易燃装修材料使用' }},
    '4.3': { name: '防火分隔', children: {
      '4.3.1': '防火分区被破坏', '4.3.2': '防火卷帘下方堆物', '4.3.3': '防火封堵不严密' }}
  }},
  '5': { name: '管理缺失类', children: {
    '5.1': { name: '消防管理', children: {
      '5.1.1': '消防安全责任人未明确', '5.1.2': '消防巡查记录缺失' }},
    '5.2': { name: '人员能力', children: {
      '5.2.1': '员工未经消防培训', '5.2.2': '消防演练未定期开展' }}
  }}
};

/* ═══════════════════════════════════════════════════════════════
   Scene Classification Dictionary
   ═══════════════════════════════════════════════════════════════ */
const SCENE_DICT = [
  { code: 'A', type: '公共娱乐场所', keywords: ['影剧院','KTV','夜总会','游乐厅','桑拿','网吧','歌舞厅','游戏厅'], riskBase: 3 },
  { code: 'B', type: '公众聚集场所', keywords: ['宾馆','饭店','商场','集贸市场','体育场馆','超市','餐厅','酒店'], riskBase: 2 },
  { code: 'C', type: '人员密集场所', keywords: ['医院','学校','养老院','托儿所','展览馆','图书馆','博物馆','车站'], riskBase: 2 },
  { code: 'D', type: '儿童活动场所', keywords: ['幼儿园','儿童乐园','早教中心','托育','母婴'], riskBase: 3 },
  { code: 'E', type: '老年人照料设施', keywords: ['养老院','日间照料','老年公寓','护理院','敬老院'], riskBase: 3 },
  { code: 'F', type: '劳动密集型企业', keywords: ['厂房','仓库','物流','工厂','车间','仓储'], riskBase: 4 },
  { code: 'G', type: '易燃易爆场所', keywords: ['化工','储罐','加油站','加气站','油库','爆炸','危险品'], riskBase: 4 },
  { code: 'H', type: '多业态混合场所', keywords: ['商业综合体','综合楼','分租','写字楼','大厦','广场','中心'], riskBase: 2 },
  { code: 'H1', type: '住宅建筑', keywords: ['住宅','小区','公寓','居民楼','宿舍'], riskBase: 1 },
  { code: 'H2', type: '办公建筑', keywords: ['办公','写字楼','商务','会议'], riskBase: 1 }
];

/* ═══════════════════════════════════════════════════════════════
   Keyword → Law Mapping Table (Degradation Fallback)
   ═══════════════════════════════════════════════════════════════ */
const KEYWORD_LAW_MAP = [
  { pattern: /灭火器.*(缺失|数量|不足|过期|压力|遮挡)/i, laws: ['GB50140-6.1','GB50140-6.2'] },
  { pattern: /消火栓.*(遮挡|封堵|缺失|损坏|无水)/i, laws: ['FIRELAW-28','FIRELAW-16'] },
  { pattern: /(疏散|安全出口|走道).*(堵塞|占用|锁闭|封堵|宽度)/i, laws: ['GB50016-5.5.2','GB50016-5.5.18','FIRELAW-28'] },
  { pattern: /(电气|电线|线路).*(私拉|乱接|老化|裸露|未穿管|超负荷)/i, laws: ['GB50016-10.2'] },
  { pattern: /(防火门).*(未关|常开|损坏)/i, laws: ['GB50016-5.5.2','FIRELAW-28'] },
  { pattern: /(防火分区|防火分隔|防火卷帘).*(破坏|堆物|封堵)/i, laws: ['GB55037-2.2.1'] },
  { pattern: /(应急灯|疏散标志).*(缺失|损坏|不亮)/i, laws: ['FIRELAW-16'] },
  { pattern: /(报警器|报警系统).*(故障|损坏|停用|瘫痪)/i, laws: ['GB35181-2025-A1'] },
  { pattern: /(喷淋|自动灭火).*(遮挡|涂覆|无水|未设)/i, laws: ['GB35181-2025-A1'] },
  { pattern: /(易燃|可燃|危险品).*(堆积|存放|违规)/i, laws: ['FIRELAW-28'] },
  { pattern: /(明火|吸烟|动火).*(违规|未审批)/i, laws: ['FIRELAW-28'] },
  { pattern: /(消防车通道|消防车道).*(占用|堵塞)/i, laws: ['FIRELAW-28'] },
  { pattern: /(配电箱|配电间).*(堆物|未关|挪用)/i, laws: ['GB50016-10.2'] },
  { pattern: /(巡查|记录|培训|演练).*(缺失|未开展)/i, laws: ['FIRELAW-16'] },
  { pattern: /(责任人|消防制度).*(未明确|缺失)/i, laws: ['FIRELAW-16'] }
];

/* ═══════════════════════════════════════════════════════════════
   Helper Functions
   ═══════════════════════════════════════════════════════════════ */
function json(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function readJson(filename) {
  try {
    const filePath = path.join(CONFIG.dataDir, filename);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) { return null; }
}

function writeJson(filename, data) {
  fs.writeFileSync(path.join(CONFIG.dataDir, filename), JSON.stringify(data, null, 2), 'utf-8');
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(new Error('INVALID_JSON')); }
    });
    req.on('error', reject);
  });
}

function parseMultipart(req, boundary) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const parts = {};
      const str = buffer.toString('binary');
      const sections = str.split('--' + boundary);
      for (const section of sections) {
        const headerMatch = section.match(/name="(\w+)"/);
        if (!headerMatch) continue;
        const name = headerMatch[1];
        const filenameMatch = section.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          const bodyStart = section.indexOf('\r\n\r\n') + 4;
          const bodyEnd = section.lastIndexOf('\r\n');
          parts[name] = Buffer.from(section.slice(bodyStart, bodyEnd), 'binary');
          parts[name + '_filename'] = filenameMatch[1];
        } else {
          const bodyStart = section.indexOf('\r\n\r\n') + 4;
          parts[name] = section.slice(bodyStart).trim();
        }
      }
      resolve(parts);
    });
    req.on('error', reject);
  });
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff'
  };
  return map[ext] || 'application/octet-stream';
}

function serveStaticFile(res, filePath) {
  try {
    if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not Found'); return; }
    const content = fs.readFileSync(filePath);
    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 'Content-Type': mimeType, 'Cache-Control': 'public, max-age=3600' });
    res.end(content);
  } catch (e) { res.writeHead(500); res.end('Server Error'); }
}

/* ═══════════════════════════════════════════════════════════════
   Algorithm Layer: Step 1 — Scene Classification
   ═══════════════════════════════════════════════════════════════ */
function sceneClassify(imageDescription = '') {
  /* Rule-based: match keywords in description or default to office */
  for (const entry of SCENE_DICT) {
    for (const kw of entry.keywords) {
      if (imageDescription.includes(kw)) {
        return { sceneType: entry.type, sceneCode: entry.code, riskBase: entry.riskBase, method: 'rule' };
      }
    }
  }
  /* Default fallback */
  return { sceneType: '公众聚集场所', sceneCode: 'B', riskBase: 2, method: 'default' };
}

/* ═══════════════════════════════════════════════════════════════
   Algorithm Layer: Step 2 — Three-Layer Visual Detection Pipeline
   ═══════════════════════════════════════════════════════════════ */
async function runDetectionPipeline(imageBase64) {
  const layers = { facilities: [], passages: [], hazards: [], globalFlags: { smokeDetected: false, flameDetected: false } };

  if (!CONFIG.apiKey) {
    return { layers, method: 'rule_fallback' };
  }

  try {
    const response = await callDeepSeekAPI('/v1/chat/completions', {
      model: CONFIG.visionModel,
      messages: [{
        role: 'system',
        content: `你是一个消防隐患智能识别系统。从照片中识别消防安全隐患，按三层检测输出JSON。

**Layer1 消防设施**：灭火器(存在/缺失/过期/遮挡)、消火栓(完整/遮挡/封堵)、火灾报警器(指示灯状态)、自动喷淋头、应急照明灯、疏散指示标志。每项标注 status: normal|missing|damaged|blocked|expired|unknown, confidence: high|medium|low。

**Layer2 疏散通道**：安全出口(锁闭/数量)、疏散走道(占用/堵塞/宽度)、常闭防火门(是否关闭)、疏散楼梯间(占用)、消防车道(堵塞)。

**Layer3 危险源**：电气线路(私拉乱接/老化裸露/未穿管)、配电设施(周围堆物)、易燃物堆积、明火/吸烟、防火卷帘下方堆物。

输出格式: {"facilities":[{"type":"...","status":"...","confidence":"...","locationHint":"...","taxonomyCode":"..."}],"passages":[{"type":"...","issue":"...","severity":"...","confidence":"...","description":"..."}],"hazards":[{"type":"...","confidence":"...","description":"...","taxonomyCode":"..."}],"globalFlags":{"smokeDetected":false,"flameDetected":false,"overallRiskImpression":"..."}}`
      }, {
        role: 'user',
        content: [
          { type: 'text', text: '请按三层检测规范分析这张照片中的消防隐患。' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      }],
      temperature: 0.2,
      max_tokens: 3000
    });

    const text = response.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      layers.facilities = parsed.facilities || [];
      layers.passages = parsed.passages || [];
      layers.hazards = parsed.hazards || [];
      layers.globalFlags = parsed.globalFlags || { smokeDetected: false, flameDetected: false };
    }
    return { layers, method: 'deepseek_vision' };
  } catch (e) {
    console.error('[DetectionPipeline] Vision API error:', e.message);
    return { layers, method: 'rule_fallback', error: e.message };
  }
}

/* ═══════════════════════════════════════════════════════════════
   Algorithm Layer: Step 3 — Map to GB 35181 Taxonomy
   ═══════════════════════════════════════════════════════════════ */
function mapToTaxonomy(detections) {
  const results = [];
  const allDetections = [
    ...(detections.facilities || []).map(d => ({ ...d, layer: 'facilities' })),
    ...(detections.passages || []).map(d => ({ ...d, layer: 'passages' })),
    ...(detections.hazards || []).map(d => ({ ...d, layer: 'hazards' }))
  ];

  for (const det of allDetections) {
    if (det.status === 'normal' || det.status === 'ok') continue;

    const tc = det.taxonomyCode || inferTaxonomyCode(det);
    const category = getCategoryFromCode(tc);

    results.push({
      type: det.type || det.issue || 'unknown',
      taxonomyCode: tc,
      category: category,
      confidence: det.confidence || 'medium',
      description: det.description || det.locationHint || '',
      severity: det.severity || '一般',
      layer: det.layer
    });
  }

  return results;
}

function inferTaxonomyCode(det) {
  const text = (det.type + ' ' + (det.description || '') + ' ' + (det.issue || '')).toLowerCase();
  if (text.includes('灭火器')) return text.includes('缺失') ? '1.3.1' : text.includes('过期') || text.includes('压力') ? '1.3.2' : text.includes('遮挡') ? '1.3.3' : '1.3.1';
  if (text.includes('消火栓')) return text.includes('遮挡') || text.includes('封堵') ? '1.4.1' : text.includes('缺失') || text.includes('损坏') ? '1.4.2' : '1.4.1';
  if (text.includes('报警器') || text.includes('报警')) return '1.1.2';
  if (text.includes('喷淋')) return '1.2.1';
  if (text.includes('应急灯') || text.includes('照明')) return '1.5.1';
  if (text.includes('疏散标志') || text.includes('指示标志')) return '1.5.2';
  if (text.includes('安全出口') && (text.includes('锁闭') || text.includes('封堵'))) return '2.1.2';
  if (text.includes('安全出口') && text.includes('数量')) return '2.1.1';
  if (text.includes('疏散走道') || text.includes('堵塞') || text.includes('占用')) return '2.2.1';
  if (text.includes('防火门') && (text.includes('未关') || text.includes('常开'))) return '2.3.2';
  if (text.includes('楼梯') && text.includes('占用')) return '2.3.1';
  if (text.includes('消防车道') || text.includes('消防车通道')) return '2.4.1';
  if (text.includes('电线') || text.includes('私拉') || text.includes('乱接')) return '3.1.1';
  if (text.includes('老化') || text.includes('裸露')) return '3.1.2';
  if (text.includes('未穿管')) return '3.1.3';
  if (text.includes('配电箱') || text.includes('配电间')) return text.includes('堆物') ? '3.2.1' : '3.2.2';
  if (text.includes('明火') || text.includes('吸烟')) return '4.1.1';
  if (text.includes('易燃') || text.includes('可燃')) return '4.2.1';
  if (text.includes('防火分区') || text.includes('防火分隔')) return '4.3.1';
  if (text.includes('防火卷帘')) return '4.3.2';
  return '1.3.1'; // default
}

function getCategoryFromCode(code) {
  if (!code) return '消防设施';
  const major = code.split('.')[0];
  const map = { '1': '消防设施', '2': '疏散通道', '3': '电气安全', '4': '火源管理', '5': '管理缺失' };
  return map[major] || '消防设施';
}

/* ═══════════════════════════════════════════════════════════════
   Algorithm Layer: Step 4 — 3D Risk Quantification (S×L×D)
   ═══════════════════════════════════════════════════════════════ */
function quantifyRisk(hazard, sceneInfo) {
  /* Severity (1-4) */
  let S = 2;
  const desc = hazard.description.toLowerCase();
  if (desc.includes('瘫痪') || desc.includes('完全') || desc.includes('严重堵塞') || desc.includes('锁闭')) S = 4;
  else if (desc.includes('严重') || desc.includes('大量') || desc.includes('堵塞')) S = 3;
  else if (desc.includes('损坏') || desc.includes('破损') || desc.includes('过期')) S = 2;
  else S = 1;

  /* GB 35181 direct determination → S4 */
  const gb35181Keywords = ['报警系统瘫痪', '自动灭火瘫痪', '疏散通道封堵', '安全出口锁闭'];
  if (gb35181Keywords.some(k => desc.includes(k))) S = 4;

  /* Likelihood (1-4) based on scene type */
  let L = sceneInfo.riskBase || 2;
  if (hazard.category === '电气安全' && desc.includes('老化')) L = Math.min(4, L + 1);
  if (hazard.category === '火源管理') L = Math.min(4, L + 1);

  /* Detectability (1-4) — harder to detect = more dangerous */
  let D = 1;
  if (desc.includes('天花板') || desc.includes('隐蔽') || desc.includes('内部')) D = 4;
  else if (desc.includes('高处') || desc.includes('角落')) D = 3;
  else if (hazard.confidence === 'low') D = 3;
  else if (hazard.confidence === 'medium') D = 2;
  else D = 1;

  const riskScore = S * L * D;

  let riskLevel, riskColor, rectificationDeadline;
  if (riskScore <= 8) {
    riskLevel = 'I'; riskColor = '#3B82F6'; rectificationDeadline = '下次巡检复查';
  } else if (riskScore <= 18) {
    riskLevel = 'II'; riskColor = '#EAB308'; rectificationDeadline = '限期30天整改';
  } else if (riskScore <= 36) {
    riskLevel = 'III'; riskColor = '#F97316'; rectificationDeadline = '限期7天整改';
  } else {
    riskLevel = 'IV'; riskColor = '#D92121'; rectificationDeadline = '立即整改';
  }

  return { riskScore, riskLevel, riskColor, rectificationDeadline, S, L, D };
}

/* ═══════════════════════════════════════════════════════════════
   Algorithm Layer: Step 5 — Regulation Semantic Matching
   ═══════════════════════════════════════════════════════════════ */
function matchRegulation(hazard, lawDb) {
  const allLaws = [...(lawDb.laws || []), ...(lawDb.customLaws || [])];
  const results = [];

  /* Strategy 1: Category match */
  const categoryMatches = allLaws.filter(l => l.category === hazard.category);
  results.push(...categoryMatches.slice(0, 2).map(l => ({ ...l, matchMethod: 'category' })));

  /* Strategy 2: Keyword rule-based (always available as fallback) */
  const text = `${hazard.type} ${hazard.description}`;
  for (const rule of KEYWORD_LAW_MAP) {
    if (rule.pattern.test(text)) {
      for (const lawId of rule.laws) {
        const law = allLaws.find(l => l.id === lawId);
        if (law && !results.find(r => r.id === lawId)) {
          results.push({ ...law, matchMethod: 'keyword' });
        }
      }
    }
  }

  /* Strategy 3: Keyword overlap */
  const words = text.toLowerCase().split(/\s+/);
  for (const law of allLaws) {
    if (results.find(r => r.id === law.id)) continue;
    const keywordOverlap = (law.keywords || []).filter(k => words.some(w => w.includes(k))).length;
    if (keywordOverlap > 0) {
      results.push({ ...law, matchMethod: 'keyword_overlap', relevance: keywordOverlap });
    }
  }

  /* Sort: keyword matches first, then category, then overlap */
  results.sort((a, b) => {
    const order = { 'keyword': 0, 'category': 1, 'keyword_overlap': 2 };
    return (order[a.matchMethod] || 9) - (order[b.matchMethod] || 9);
  });

  /* Deduplicate and take top 5 */
  const seen = new Set();
  const unique = [];
  for (const r of results) {
    if (!seen.has(r.id)) { seen.add(r.id); unique.push(r); }
  }
  return unique.slice(0, 5);
}

/* ═══════════════════════════════════════════════════════════════
   Algorithm Layer: Step 6 — Report Generation
   ═══════════════════════════════════════════════════════════════ */
function generateReport(hazards, sceneInfo, chain, degradationLevel) {
  const riskLevels = hazards.map(h => h.riskLevel);
  const highestRisk = riskLevels.includes('IV') ? 'IV' :
    riskLevels.includes('III') ? 'III' :
    riskLevels.includes('II') ? 'II' : 'I';

  const riskCounts = { I: 0, II: 0, III: 0, IV: 0 };
  riskLevels.forEach(l => { riskCounts[l] = (riskCounts[l] || 0) + 1; });

  const summary = `发现${hazards.length}处隐患：` +
    Object.entries(riskCounts).filter(([,v]) => v > 0)
      .map(([k, v]) => `${k}级${v}处`).join('，');

  return {
    success: true,
    hazards: hazards.map(h => ({
      id: 'HZ-' + crypto.randomUUID().slice(0, 8),
      title: h.type || '未知隐患',
      category: h.category,
      severity: h.riskLevel === 'IV' ? '严重' : h.riskLevel === 'III' ? '严重' : h.riskLevel === 'II' ? '一般' : '轻微',
      description: h.description,
      taxonomyCode: h.taxonomyCode,
      riskLevel: h.riskLevel,
      riskScore: h.riskScore,
      confidence: h.confidence,
      matchedLaws: (h.matchedLaws || []).map(l => ({
        lawId: l.id,
        title: `${l.code} ${l.name}`,
        clause: l.clause,
        level: l.level,
        penalty: l.penalty
      })),
      rectification: h.rectificationDeadline ? `建议${h.rectificationDeadline}` : '请专业人员评估'
    })),
    hazardCount: hazards.length,
    overallRisk: highestRisk === 'IV' ? 'critical' : highestRisk === 'III' ? 'high' : highestRisk === 'II' ? 'medium' : 'low',
    summary,
    processedAt: new Date().toISOString(),
    meta: {
      agentVersion: CONFIG.agentVersion,
      algorithmVersion: CONFIG.algorithmVersion,
      mode: degradationLevel === 'L0' ? 'hybrid_ai' :
        degradationLevel === 'L1' ? 'hybrid_fallback_vec' :
        degradationLevel === 'L2' ? 'hybrid_fallback_vision' : 'rules_only',
      degradationLevel,
      cacheHit: false,
      sceneType: sceneInfo.sceneType,
      sceneCode: sceneInfo.sceneCode,
      detectionLayers: ['facilities', 'passages', 'hazards'],
      chain: chain
    }
  };
}

/* ═══════════════════════════════════════════════════════════════
   Degradation Decision Engine
   ═══════════════════════════════════════════════════════════════ */
function applyDegradation() {
  if (!CONFIG.apiKey) return 'L3';  // No API key → manual checklist
  return 'L0';  // Full AI mode (L1/L2 would require additional health checks)
}

/* ═══════════════════════════════════════════════════════════════
   Main Recognition Orchestrator — 6-Step Pipeline
   ═══════════════════════════════════════════════════════════════ */
async function recognizeImage(imageBase64, imageDescription = '') {
  const chain = [];
  const degradationLevel = applyDegradation();

  /* Step 1: Scene Classification */
  const sceneInfo = sceneClassify(imageDescription);
  chain.push(`场景识别: ${sceneInfo.sceneType}(${sceneInfo.sceneCode})`);

  /* Step 2: Three-Layer Visual Detection */
  if (degradationLevel === 'L0' || degradationLevel === 'L1') {
    const { layers, method } = await runDetectionPipeline(imageBase64);
    const facCount = layers.facilities.filter(f => f.status !== 'normal').length;
    const passCount = layers.passages.filter(p => p.issue).length;
    const hazCount = layers.hazards.filter(h => h.type).length;
    chain.push(`Layer1 消防设施检测: ${facCount > 0 ? `发现${facCount}处异常` : '正常'}`);
    chain.push(`Layer2 通道环境检测: ${passCount > 0 ? `发现${passCount}处异常` : '正常'}`);
    chain.push(`Layer3 危险源检测: ${hazCount > 0 ? `发现${hazCount}处异常` : '正常'}`);

    /* Step 3: Map to Taxonomy */
    const taxonomyResults = mapToTaxonomy(layers);
    chain.push(`隐患分类映射: ${taxonomyResults.length}项`);

    /* Step 4: Risk Quantification */
    const lawDb = getLawDb();
    for (const h of taxonomyResults) {
      const risk = quantifyRisk(h, sceneInfo);
      Object.assign(h, risk);
      /* Step 5: Regulation Matching */
      h.matchedLaws = matchRegulation(h, lawDb);
    }
    const maxRisk = taxonomyResults.reduce((max, h) => {
      const order = { 'I': 0, 'II': 1, 'III': 2, 'IV': 3 };
      return order[h.riskLevel] > order[max] ? h.riskLevel : max;
    }, 'I');
    chain.push(`风险量化: 最高${maxRisk}级`);
    chain.push(`法规匹配: 匹配${taxonomyResults.reduce((s, h) => s + (h.matchedLaws || []).length, 0)}条条款`);

    /* Step 6: Report Generation */
    chain.push('报告生成: 完成');
    return generateReport(taxonomyResults, sceneInfo, chain, degradationLevel);
  }

  /* L3 Manual — return static checklist */
  chain.push('降级模式: 手动辅助检查');
  return generateReport([], sceneInfo, chain, 'L3');
}

/* ═══════════════════════════════════════════════════════════════
   DeepSeek API Client
   ═══════════════════════════════════════════════════════════════ */
async function callDeepSeekAPI(endpoint, body) {
  const apiUrl = CONFIG.apiBaseUrl + endpoint;
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('API_PARSE_ERROR: ' + data.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('API_TIMEOUT')); });
    req.write(payload);
    req.end();
  });
}

async function callDeepSeekChat(question) {
  if (!CONFIG.apiKey) throw new Error('LLM_API_KEY_NOT_CONFIGURED');
  const response = await callDeepSeekAPI('/v1/chat/completions', {
    model: CONFIG.visionModel,
    messages: [
      { role: 'system', content: '你是消防法规专家，基于中国消防法律法规和国标回答用户问题。回答应引用具体的法规编号和条款。' },
      { role: 'user', content: question }
    ],
    temperature: 0.5,
    max_tokens: 2000
  });
  return response.choices?.[0]?.message?.content || '无法获取回答';
}

/* ═══════════════════════════════════════════════════════════════
   Data Access Helpers
   ═══════════════════════════════════════════════════════════════ */
function getLawDb() {
  return readJson('law-db.json') || { version: '0', laws: [], customLaws: [] };
}

function searchLaws(q, laws) {
  const ql = q.toLowerCase();
  return laws.filter(l =>
    (l.code && l.code.toLowerCase().includes(ql)) ||
    (l.name && l.name.toLowerCase().includes(ql)) ||
    (l.clause && l.clause.toLowerCase().includes(ql)) ||
    (l.content && l.content.toLowerCase().includes(ql)) ||
    (l.keywords || []).some(k => k.toLowerCase().includes(ql))
  );
}

function hasValidApiKey() {
  return CONFIG.apiKey && CONFIG.apiKey.length > 10;
}

/* ═══════════════════════════════════════════════════════════════
   HTTP Server — Router
   ═══════════════════════════════════════════════════════════════ */
const server = http.createServer(async (req, res) => {
  /* CORS preflight */
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pn = parsedUrl.pathname;
  const method = req.method;
  const startTime = Date.now();

  /* ─── Health Check ─── */
  if (pn === '/api/health' && method === 'GET') {
    return json(res, {
      status: 'ok',
      service: '北斗火眼·消防智查',
      version: CONFIG.version,
      algorithmVersion: CONFIG.algorithmVersion,
      agentVersion: CONFIG.agentVersion,
      mode: hasValidApiKey() ? 'live' : 'demo',
      degradationLevel: applyDegradation(),
      uptime: process.uptime(),
      services: {
        llm: { status: hasValidApiKey() ? 'configured' : 'not_configured', provider: 'deepseek' },
        personalityEngine: { status: 'unreachable', url: CONFIG.peUrl }
      }
    });
  }

  /* ─── Image Recognition (Core Algorithm Pipeline) ─── */
  if (pn === '/api/image/recognize' && method === 'POST') {
    if (!hasValidApiKey()) {
      /* Demo mode: return demo data */
      const demo = readJson('demo-reports.json');
      return json(res, {
        success: true,
        hazards: (demo?.[0]?.hazards || []).map(h => ({
          id: h.id, title: h.title, category: h.category,
          severity: h.severity, description: h.description,
          taxonomyCode: h.taxonomyCode || '1.3.1',
          riskLevel: h.riskLevel || 'II', riskScore: h.riskScore || 12,
          confidence: h.confidence || 'medium',
          matchedLaws: h.matchedLaws || []
        })),
        hazardCount: demo?.[0]?.hazards?.length || 0,
        overallRisk: 'medium',
        summary: '演示模式：返回预置检查结果',
        processedAt: new Date().toISOString(),
        meta: {
          agentVersion: CONFIG.agentVersion,
          algorithmVersion: CONFIG.algorithmVersion,
          mode: 'rules_only',
          degradationLevel: 'L3',
          cacheHit: false,
          sceneType: '公众聚集场所',
          detectionLayers: ['facilities', 'passages', 'hazards'],
          chain: ['降级模式: 演示数据']
        }
      });
    }

    try {
      let imageBase64, imageDescription = '';

      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data')) {
        const boundary = contentType.split('boundary=')[1];
        const parts = await parseMultipart(req, boundary);
        if (parts.image) {
          imageBase64 = Buffer.isBuffer(parts.image) ? parts.image.toString('base64') : parts.image;
          imageDescription = parts.description || '';
        } else {
          return json(res, { success: false, error: 'INVALID_FILE_TYPE', message: '请上传图片文件' }, 400);
        }
      } else {
        const body = await getBody(req);
        imageBase64 = body.image || '';
        imageDescription = body.description || '';
        if (!imageBase64) {
          return json(res, { success: false, error: 'INVALID_FILE_TYPE', message: '请提供图片数据' }, 400);
        }
      }

      /* Cache check */
      const imgHash = sha256(imageBase64);
      const cached = imageCache.get(imgHash);
      if (cached && (Date.now() - cached.timestamp < CONFIG.cacheTTL)) {
        return json(res, { ...cached.result, meta: { ...cached.result.meta, cacheHit: true } });
      }

      /* Run 6-step recognition pipeline */
      const result = await recognizeImage(imageBase64, imageDescription);

      /* Cache result */
      imageCache.set(imgHash, { result, timestamp: Date.now() });
      /* Clean old cache entries */
      if (imageCache.size > 100) {
        const now = Date.now();
        for (const [k, v] of imageCache) {
          if (now - v.timestamp > CONFIG.cacheTTL * 2) imageCache.delete(k);
        }
      }

      return json(res, result);
    } catch (e) {
      console.error('[ImageRecognize] Error:', e.message);
      if (e.message === 'LLM_API_KEY_NOT_CONFIGURED') {
        return json(res, { success: false, error: 'LLM_API_KEY_NOT_CONFIGURED', message: '请配置 DeepSeek API Key' }, 503);
      }
      return json(res, { success: false, error: 'AI_CALL_FAILED', message: 'AI识别失败: ' + e.message }, 500);
    }
  }

  /* ─── Video Frame Extraction ─── */
  if (pn === '/api/video/frames' && method === 'POST') {
    if (!hasValidApiKey()) {
      return json(res, { success: false, error: 'LLM_API_KEY_NOT_CONFIGURED', message: '请配置API Key' }, 503);
    }
    try {
      const contentType = req.headers['content-type'] || '';
      let videoBuffer;
      if (contentType.includes('multipart/form-data')) {
        const boundary = contentType.split('boundary=')[1];
        const parts = await parseMultipart(req, boundary);
        videoBuffer = parts.video;
      }
      if (!videoBuffer) {
        return json(res, { success: false, error: 'INVALID_VIDEO_FORMAT', message: '请上传视频文件' }, 400);
      }

      /* Save temp video */
      const tmpDir = path.join(__dirname, 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const tmpVideo = path.join(tmpDir, `video_${Date.now()}.mp4`);
      fs.writeFileSync(tmpVideo, videoBuffer);

      /* Extract frames using ffmpeg (if available) */
      let frames = [];
      try {
        const framesDir = path.join(tmpDir, `frames_${Date.now()}`);
        fs.mkdirSync(framesDir, { recursive: true });
        execSync(`ffmpeg -i "${tmpVideo}" -vf "fps=1" -frames:v 30 "${framesDir}/frame_%03d.jpg" 2>/dev/null`, { timeout: 30000 });
        frames = fs.readdirSync(framesDir).filter(f => f.endsWith('.jpg')).map(f => path.join(framesDir, f));
      } catch (ffmpegErr) {
        /* FFmpeg not available — return error */
        try { fs.unlinkSync(tmpVideo); } catch (_) {}
        return json(res, { success: false, error: 'FFMPEG_FAILED', message: '视频处理服务暂不可用' }, 500);
      }

      /* Analyze frames */
      const frameResults = [];
      for (let i = 0; i < frames.length; i++) {
        const frameData = fs.readFileSync(frames[i]).toString('base64');
        const result = await recognizeImage(frameData);
        frameResults.push({
          frameIndex: i,
          timestamp: `${i}.0s`,
          hasHazard: result.hazardCount > 0,
          hazards: result.hazards
        });
      }

      /* Cleanup */
      try { fs.unlinkSync(tmpVideo); fs.rmSync(path.dirname(frames[0]), { recursive: true, force: true }); } catch (_) {}

      /* Deduplicate hazards */
      const allHazards = frameResults.flatMap(f => f.hazards);
      const seen = new Set();
      const deduped = allHazards.filter(h => {
        const key = h.title + h.taxonomyCode;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return json(res, {
        success: true,
        totalFrames: frames.length,
        analyzedFrames: frameResults.length,
        hazards: deduped,
        hazardCount: deduped.length,
        frameResults,
        processedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('[VideoFrames] Error:', e.message);
      return json(res, { success: false, error: 'AI_CALL_FAILED', message: '视频分析失败' }, 500);
    }
  }

  /* ─── Laws CRUD ─── */
  if (pn === '/api/laws' && method === 'GET') {
    const db = getLawDb();
    const all = [...db.laws, ...db.customLaws];
    const q = parsedUrl.query.q;
    const filtered = q ? searchLaws(q, all) : all;
    return json(res, { success: true, version: db.version, laws: filtered, total: filtered.length });
  }

  if (pn === '/api/laws' && method === 'POST') {
    try {
      const body = await getBody(req);
      if (!body.code || !body.name || !body.content) {
        return json(res, { success: false, error: 'MISSING_FIELDS', message: '缺少必填字段' }, 400);
      }
      const db = getLawDb();
      const id = 'LAW' + crypto.randomUUID().slice(0, 8).toUpperCase();
      const newLaw = {
        id, code: body.code, name: body.name,
        category: body.category || '消防设施',
        section: 'custom',
        content: body.content,
        keywords: body.keywords || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.customLaws.push(newLaw);
      writeJson('law-db.json', db);
      return json(res, { success: true, id });
    } catch (e) {
      return json(res, { success: false, error: 'PARSE_ERROR', message: e.message }, 500);
    }
  }

  if (pn.startsWith('/api/laws/') && pn.endsWith('/delete') && method === 'DELETE') {
    const lawId = pn.split('/')[3];
    const db = getLawDb();
    const idx = db.customLaws.findIndex(l => l.id === lawId);
    if (idx === -1) {
      return json(res, { success: false, error: 'NOT_FOUND', message: '法规不存在' }, 404);
    }
    db.customLaws.splice(idx, 1);
    writeJson('law-db.json', db);
    return json(res, { success: true, deleted: lawId });
  }

  if (pn === '/api/laws/import' && method === 'POST') {
    try {
      const body = await getBody(req);
      const imported = body.laws || [];
      const db = getLawDb();
      let importedCount = 0;
      for (const law of imported) {
        const id = 'LAW' + crypto.randomUUID().slice(0, 8).toUpperCase();
        db.customLaws.push({ id, ...law, section: 'imported', createdAt: new Date().toISOString() });
        importedCount++;
      }
      writeJson('law-db.json', db);
      return json(res, { success: true, imported: importedCount, skipped: 0 });
    } catch (e) {
      return json(res, { success: false, error: 'PARSE_ERROR', message: e.message }, 500);
    }
  }

  /* ─── Reports ─── */
  if (pn === '/api/reports/list') {
    const hasKey = hasValidApiKey();
    const data = hasKey ? (readJson('reports.json') || []) : (readJson('demo-reports.json') || []);
    return json(res, { success: true, reports: data, source: hasKey ? 'live' : 'demo' });
  }

  if (pn === '/api/reports/statistics') {
    const data = readJson('demo-statistics.json') || { totalChecks: 0, totalHazards: 0 };
    return json(res, { success: true, ...data });
  }

  if (pn === '/api/reports/export' && method === 'POST') {
    try {
      const body = await getBody(req);
      if (!body.reportId) {
        return json(res, { success: false, error: 'MISSING_REPORT_ID' }, 400);
      }
      /* Simplified: return JSON report as download */
      const reports = readJson('demo-reports.json') || [];
      const report = reports.find(r => r.id === body.reportId);
      if (!report) {
        return json(res, { success: false, error: 'REPORT_NOT_FOUND' }, 404);
      }
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="report_${body.reportId}.json"`
      });
      return res.end(JSON.stringify(report, null, 2));
    } catch (e) {
      return json(res, { success: false, error: 'PARSE_ERROR' }, 500);
    }
  }

  /* ─── AI Expert ─── */
  if (pn === '/api/expert/ask' && method === 'POST') {
    if (!hasValidApiKey()) {
      return json(res, { success: false, error: 'LLM_API_KEY_NOT_CONFIGURED' }, 503);
    }
    try {
      const body = await getBody(req);
      const answer = await callDeepSeekChat(body.question || '');
      return json(res, { success: true, answer, source: 'deepseek', model: CONFIG.visionModel });
    } catch (e) {
      return json(res, { success: false, error: 'ALL_BACKENDS_FAILED', message: 'AI服务暂不可用' }, 502);
    }
  }

  if (pn === '/api/expert/chat' && method === 'POST') {
    if (!hasValidApiKey()) {
      return json(res, { success: false, error: 'LLM_API_KEY_NOT_CONFIGURED' }, 503);
    }
    try {
      const body = await getBody(req);
      const messages = body.messages || [];
      const lastMsg = messages[messages.length - 1]?.content || '';
      const answer = await callDeepSeekChat(lastMsg);
      return json(res, { success: true, answer, source: 'deepseek', model: CONFIG.visionModel });
    } catch (e) {
      return json(res, { success: false, error: 'ALL_BACKENDS_FAILED' }, 502);
    }
  }

  /* ─── Scheduler ─── */
  if (pn === '/api/scheduler/status') {
    return json(res, {
      schedulerActive: false,
      nextUpdate: null,
      updateIntervalHours: 24,
      lastUpdate: null
    });
  }

  if (pn === '/api/scheduler/update-now' && method === 'POST') {
    return json(res, { success: true, message: '法规更新已触发（模拟）' });
  }

  /* ─── Feedback ─── */
  if (pn === '/api/feedback/submit' && method === 'POST') {
    try {
      const body = await getBody(req);
      const feedback = readJson('feedback.json') || [];
      const entry = {
        id: 'fb-' + Date.now(),
        source: body.source || '未知',
        timestamp: new Date().toISOString(),
        ratings: body.ratings || {},
        text: body.text || '',
        findings: body.findings || []
      };
      feedback.push(entry);
      writeJson('feedback.json', feedback);
      return json(res, { success: true, id: entry.id });
    } catch (e) {
      return json(res, { success: false, error: 'PARSE_ERROR' }, 500);
    }
  }

  if (pn === '/api/feedback/summary') {
    const feedback = readJson('feedback.json') || [];
    const sources = {};
    const totalRatings = { ui: 0, function: 0, accuracy: 0, practical: 0, smooth: 0 };
    const findings = {};
    feedback.forEach(f => {
      sources[f.source] = (sources[f.source] || 0) + 1;
      Object.entries(f.ratings || {}).forEach(([k, v]) => {
        totalRatings[k] = (totalRatings[k] || 0) + v;
      });
      (f.findings || []).forEach(ft => {
        findings[ft] = (findings[ft] || 0) + 1;
      });
    });
    const avgRatings = {};
    const n = feedback.length || 1;
    Object.keys(totalRatings).forEach(k => {
      avgRatings[k] = Math.round((totalRatings[k] / n) * 10) / 10;
    });
    return json(res, {
      success: true,
      total: feedback.length,
      sources,
      avgRatings,
      findings,
      latest: feedback.slice(-10).reverse()
    });
  }

  /* ─── Personality Engine Proxy ─── */
  if (pn === '/api/personality/memory-graph') {
    try {
      const peData = await fetchFromPE('/api/memory-graph');
      return json(res, { success: true, source: 'personality-engine', ...peData });
    } catch (e) {
      const local = readJson('memory-graph-default.json') || { nodes: [], edges: [] };
      return json(res, { success: true, source: 'local-cache', ...local });
    }
  }

  if (pn === '/api/personality/inspect-context' && method === 'POST') {
    return json(res, { success: false, error: 'PE_UNAVAILABLE', message: '人格底座暂不可用' }, 503);
  }

  if (pn === '/api/personality/user-profile') {
    return json(res, {
      success: true,
      source: 'local-cache',
      preferences: {
        commonTypes: ['fire-facility', 'evacuation'],
        frequentHazards: ['灭火器过期', '疏散通道堵塞']
      }
    });
  }

  /* ─── Static File Serving ─── */
  let filePath = pn === '/' ? '/index.html' : pn;
  let fullPath = path.join(CONFIG.h5Dir, filePath);

  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(CONFIG.h5Dir, 'index.html');
  }

  serveStaticFile(res, fullPath);
});

/* ═══════════════════════════════════════════════════════════════
   Personality Engine HTTP Helper
   ═══════════════════════════════════════════════════════════════ */
function fetchFromPE(endpoint) {
  return new Promise((resolve, reject) => {
    const req = http.get(CONFIG.peUrl + endpoint, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('PE_PARSE_ERROR')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('PE_TIMEOUT')); });
  });
}

/* ═══════════════════════════════════════════════════════════════
   Start Server
   ═══════════════════════════════════════════════════════════════ */
server.listen(CONFIG.port, '0.0.0.0', () => {
  console.log('═════════════════════════════════════════════════════');
  console.log('  北斗火眼·消防智查 v' + CONFIG.version);
  console.log('  BDHY-Hybrid Hazard Recognition ' + CONFIG.algorithmVersion);
  console.log('═════════════════════════════════════════════════════');
  console.log('  Server:  http://0.0.0.0:' + CONFIG.port);
  console.log('  API Key: ' + (hasValidApiKey() ? 'Configured' : 'NOT configured (Demo mode)'));
  console.log('  PE URL:  ' + CONFIG.peUrl);
  console.log('═════════════════════════════════════════════════════');
});
