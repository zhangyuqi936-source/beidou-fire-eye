# 北斗火眼·消防智查 v3.0 — 实现设计文档 (design-v3)

> **对标**: 暖守 design.md | **版本**: v3.0 | **日期**: 2026-06-27

---

## 1. 系统架构图 (ASCII)

```
                          ┌─────────────────────┐
                          │    用户 (浏览器)      │
                          │  H5 / Android / iOS   │
                          └──────────┬──────────┘
                                     │
                    HTTP (端口8000 dev / 8080 prod)
                                     │
┌────────────────────────────────────┼────────────────────────────────────┐
│                           uni-app 3.0 前端层                             │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                        pages/ (19 .vue)                            │ │
│  │  index/    inspect/    check/    expert/    knowledge/             │ │
│  │  report/   building/   settings/ feedback/                         │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                    │                                    │
│  ┌─────────────────────────────────┴───────────────────────────────┐   │
│  │                      utils/ (30 .js)                              │   │
│  │  api-client  ai-service  hazard-law-matcher  report-generator    │   │
│  │  risk-engine  regulation-matcher  hazard-taxonomy  scene-classifier│  │
│  │  degradation-manager  feedback-loop  theme-manager  storage ...   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌─────────────────────────────────┴───────────────────────────────┐   │
│  │                      static/ (资源层)                             │   │
│  │  theme.scss  sw.js  offline.html  manifest.json  critical.css    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  App.vue ← main.js ← index.html ← pages.json ← manifest.json          │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                          HTTP API ( /api/* )
                                     │
┌────────────────────────────────────┼────────────────────────────────────┐
│                          server.cjs (Node.js)                            │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  HTTP Router (if/else 分支)                                        │ │
│  │  /api/health  /api/image/recognize  /api/video/frames              │ │
│  │  /api/laws    /api/reports/*    /api/expert/*                      │ │
│  │  /api/feedback/*  /api/personality/*  /api/scheduler/*             │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                    │                                    │
│  ┌─────────────────────────────────┴───────────────────────────────┐   │
│  │  内部模块                                                         │   │
│  │  recognizeImage()  sceneClassify()  runDetectionPipeline()       │   │
│  │  mapToTaxonomy()  quantifyRisk()  matchRegulation()              │   │
│  │  generateReport()  extractFrames()  getLawDb()  searchLaws()     │   │
│  │  proxyPE()  logInspection()  doLawUpdate()                       │   │
│  │  applyDegradation()  shouldCache()                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌─────────────────────────────────┴───────────────────────────────┐   │
│  │  静态文件服务                                                      │   │
│  │  从 dist/build/h5/ 提供编译后的 H5 文件                            │   │
│  │  SPA fallback: 未匹配路径 → index.html                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────┴─────┐  ┌──────┴──────┐  ┌─────┴─────┐
              │ DeepSeek  │  │   人格底座    │  │  本地磁盘  │
              │   API     │  │  (3100端口)   │  │  (data/)  │
              └───────────┘  └─────────────┘  └───────────┘
```

---

## 2. 五层架构伪代码

### 2.1 资源层 (static/)

```
static/
├── theme.scss          # 150+ SCSS 变量 + 30+ Mixin + 深色主题覆盖
├── sw.js               # PWA Service Worker: Cache First / Network First 策略
├── offline.html        # 离线降级提示页 (品牌色导航 + 可用功能清单)
├── manifest.json       # PWA 清单 (name/icon/theme_color)
├── critical.css        # 首屏关键样式内联到 <head>
├── dark-mode.css       # 深色主题独立样式文件
├── logo.svg            # 品牌 Logo SVG
└── icons/              # 25+ SVG 图标
```

### 2.2 数据层 (data/)

```
data/
├── law-db.json              # { version, laws[], customLaws[] }
├── demo-reports.json        # [ { id, title, location, hazards[], rectifications[] } ]
├── demo-statistics.json     # { totalChecks, totalHazards, hazardTypes[], dailyTrend[] }
├── feedback.json            # [ { id, source, ratings{}, text, findings[] } ]
├── memory-graph-default.json # { nodes[], edges[], inspectionFlow{} }
├── law-updates.json         # [ { timestamp, message } ]
├── reports.json             # (运行时) 线上报告数据
└── statistics.json          # (运行时) 线上统计数据
```

### 2.3 工具层 (utils/ + src/utils/)

共 25 个 JS 模块，核心模块伪代码：

```
// api-client.js — API 调用客户端
CONFIG = { mode: 'local', baseUrl: 'http://localhost:8080' }
export function request(method, path, body) {
  try {
    const res = await fetch(CONFIG.baseUrl + path, { method, body })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    return data
  } catch(e) {
    if (mode === 'local') return getFromLocalCache(path)
    throw e
  }
}
export function flushOfflineQueue() { /* 网络恢复时发送缓存请求 */ }

// ai-service.js — AI 调用服务
export async function recognizeImage(imageBase64, mimeType) {
  return apiClient.request('POST', '/api/image/recognize', { image: imageBase64, mimeType })
}
export async function analyzeVideo(videoPath) {
  return apiClient.request('POST', '/api/video/frames', { path: videoPath })
}
export async function askExpert(question) {
  return apiClient.request('POST', '/api/expert/ask', { question })
}

// hazard-law-matcher.js — 隐患-法规匹配引擎
export function matchHazardToLaws(hazardCategory, laws) {
  return laws.filter(law => law.category === hazardCategory || law.keywords.some(k => hazardCategory.includes(k)))
}

// theme-manager.js — 主题管理器
export function getCurrentTheme() {
  const stored = uni.getStorageSync('theme-mode') || 'auto'
  if (stored === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return stored
}
export function setTheme(mode) {
  uni.setStorageSync('theme-mode', mode)
  applyTheme(getCurrentTheme())
}
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}
```

### 2.4 页面层 (pages/) — 19 个 Vue SFC

所有页面遵循统一模板结构：
```vue
<template>
  <view class="page">
    <!-- 头部/导航区 -->
    <view class="header">...</view>
    <!-- 内容区（数据状态分支） -->
    <view v-if="loading" class="skeleton"><!-- 骨架屏 --></view>
    <view v-else-if="error" class="error-card"><!-- 错误提示 + 重试 --></view>
    <view v-else-if="isEmpty" class="empty-state"><!-- 空状态占位 --></view>
    <view v-else><!-- 正常内容 --></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showLoading, hideLoading } from '@/utils/loading-service.js'

const loading = ref(true)
const error = ref(null)
const isEmpty = ref(false)

onMounted(async () => {
  try {
    showLoading()
    // fetch data...
    if (data.length === 0) isEmpty.value = true
  } catch(e) {
    error.value = e.message
  } finally {
    loading.value = false
    hideLoading()
  }
})
</script>

<style scoped lang="scss">
@import '~@/static/theme.scss';

.page {
  min-height: 100vh;
  background: $bg-page;
  overflow-x: hidden;
  max-width: 100vw;
  box-sizing: border-box;
}
// ... 页面特定样式
</style>
```

### 2.5 服务层 (server.cjs) — 路由处理伪代码

```
// server.cjs 主函数结构
const server = http.createServer(async (req, res) => {
  const pn = url.parse(req.url).pathname
  const method = req.method

  // === 系统 ===
  if (pn === '/api/health')
    return json(res, { status:'ok', version, mode, services:{llm,pe} })

  // === 图片识别 ===
  if (pn === '/api/image/recognize' && method === 'POST') {
    if (!apiKey) return json(res, { error:'LLM_API_KEY_NOT_CONFIGURED' }, 503)
    const buf = parseImageFromRequest(req)
    const result = await callDeepSeekVision(buf)
    const hazards = parseHazards(result)
    return json(res, { success:true, hazards, hazardCount, overallRisk })
  }

  // === 视频抽帧 ===
  if (pn === '/api/video/frames' && method === 'POST') {
    const vp = await saveUploadedVideo(req)
    const { frames, tmpDir } = await extractFrames(vp, fps=1, maxFrames=60)
    const results = []
    for (const f of frames) {
      const r = await recognizeImage(f)
      results.push({ frameIndex, hasHazard: r.hazardCount > 0, hazards: r.hazards })
    }
    const deduped = deduplicateHazards(results.flatMap(r => r.hazards))
    cleanup(tmpDir)
    return json(res, { success:true, totalFrames, analyzedFrames, hazards:deduped })
  }

  // === 法规 CRUD ===
  if (pn === '/api/laws' && method === 'GET') {
    const db = getLawDb()
    const all = [...db.laws, ...db.customLaws]
    const q = url.parse(req.url, true).query.q
    const filtered = q ? searchLaws(q, all) : all
    return json(res, { success:true, version:db.version, laws:filtered })
  }
  if (pn === '/api/laws' && method === 'POST') { /* 新增自定义法规 */ }
  if (pn === '/api/laws/:id/delete' && method === 'DELETE') { /* 删除 */ }
  if (pn === '/api/laws/import' && method === 'POST') { /* 批量导入 */ }

  // === 报告 ===
  if (pn === '/api/reports/list') {
    const hasKey = hasValidApiKey()
    const data = hasKey ? readJson('reports.json') : readJson('demo-reports.json')
    return json(res, { success:true, reports:data, source: hasKey?'live':'demo' })
  }

  // === AI 专家 ===
  if (pn === '/api/expert/ask' && method === 'POST') {
    const { question } = await getBody(req)
    try {
      const answer = await callDeepSeekChat(question)
      return json(res, { success:true, answer, source:'deepseek' })
    } catch(e) {
      return json(res, { success:false, error:'AI_CALL_FAILED' }, 500)
    }
  }

  // === 反馈 ===
  if (pn === '/api/feedback/submit' && method === 'POST') { /* 追加到 feedback.json */ }
  if (pn === '/api/feedback/summary') { /* 计算汇总统计 */ }

  // === 人格底座代理 ===
  if (pn === '/api/personality/memory-graph') {
    try {
      const data = await fetch(PE_URL + '/api/memory-graph').then(r=>r.json())
      return json(res, { success:true, source:'personality-engine', ...data })
    } catch(e) {
      const local = readJson('memory-graph-default.json')
      return json(res, { success:true, source:'local-cache', ...local })
    }
  }

  // === 静态文件 ===
  let fp = pn === '/' ? '/index.html' : pn
  let full = path.join(CONFIG.h5Dir, fp)
  if (!fs.existsSync(full)) full = path.join(CONFIG.h5Dir, 'index.html') // SPA fallback
  serveStaticFile(res, full)
})
```

---

## 3. 算法层架构（BDHY-Hybrid Hazard Recognition v1）

> 对应 spec-v3 §2.5，是北斗火眼的核心识别引擎。以下所有流程在 server.cjs 的 `recognizeImage()` 中编排执行。

### 3.1 三层视觉管线架构

```
                        ┌───────────────────────┐
                        │  输入图像 (1280×720)    │
                        └───────────┬───────────┘
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
              [场景分类]        [火焰快速通道]      [预处理]
            DeepSeek Vision    YOLOv8s-Nano    归一化+EXIF
           or 规则词典         本地模型          +光照均衡
                   │                │                │
                   ├──────┬─────────┴──────┬─────────┤
                   ▼      ▼                ▼         ▼
               ┌──────┐ ┌──────┐      ┌──────┐  ┌──────┐
               │Layer1│ │Layer2│      │Layer3│  │Global│
               │消防   │ │疏散   │      │危险源 │  │标记  │
               │设施   │ │通道   │      │检测   │  │烟雾  │
               │检测   │ │检测   │      │电气   │  │火焰  │
               └──┬───┘ └──┬───┘      │火源   │  └──┬───┘
                  │        │          └──┬───┘      │
                  └────────┼─────────────┘          │
                           ▼                        │
               ┌───────────────────┐                │
               │  结构化输出 JSON   │◄───────────────┘
               │  facilities[]     │
               │  passages[]       │
               │  hazards[]        │
               │  globalFlags      │
               │  confidence[]     │
               └────────┬──────────┘
                        │
                        ▼
               [隐患分类映射 → 风险量化 → 法规匹配 → 报告生成]
```

**各层检测内容**（Prompt 工程见 spec-v3 §2.5.3）：
- **Layer1**: 灭火器/消火栓/报警器/喷淋/应急灯/疏散标志 — `status: normal|missing|damaged|blocked|expired|unknown`
- **Layer2**: 安全出口/疏散走道/常闭防火门/疏散楼梯/消防车道 — 识别占用/堵塞/锁闭/宽度不足
- **Layer3**: 电气线路/配电设施/易燃物/明火源/防火分隔 — 推理+规则辅助

### 3.2 法规语义匹配流程

```
隐患结果(taxonomyCode + sceneType + description)
        │
        ▼
┌──────────────────────┐
│  查询向量构建         │
│  "{sceneType}         │
│   {categoryName}      │
│   {description}"      │
│  → mxbai-embed-large  │
│  → 1024维向量         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐          ┌──────────────────────┐
│  向量检索 (主)        │          │  规则关键词检索 (兜底) │
│  ChromaDB/LanceDB    │          │  内置 keyword→lawId   │
│  Top-5, cos≥0.75     │          │  映射表                │
└──────────┬───────────┘          └──────────┬───────────┘
           │                                 │
           └────────────┬────────────────────┘
                        ▼
              ┌─────────────────────┐
              │  合并去重 + 元数据过滤 │
              │  (场所类型标签匹配)    │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │  LLM 重排序 (可选)    │
              │  Top-3 最相关条款    │
              │  含适用性解释         │
              └─────────────────────┘
```

**降级**: 向量库不可用 → 跳过向量检索，仅用规则关键词表，不阻塞主流程。

### 3.3 降级决策树

```
function decideLevel():
    if (!API_KEY_AVAILABLE):
        if (LOCAL_YOLO_AVAILABLE): return L2  // 离线本地
        else: return L3                       // 手动辅助
    
    if (VECTOR_DB_HEALTH_CHECK_FAILS): return L1  // 规则增强
    
    return L0  // 全功能

L0 全功能:      Vision+向量检索+LLM全部命中，3-8秒
L1 规则增强:    Vision+LLM正常，法规匹配降为规则关键词，3-6秒
L2 离线本地:    本地YOLO检测+规则引擎，<2秒，无网络可用
L3 手动辅助:    输出静态消防检查清单供人工逐项打钩
```

### 3.4 闭环学习数据流（v1 数据模型，v2 自动调整）

```
[巡检] → [隐患报告] → [人工复核] → [反馈聚合]
   ▲                                      │
   │                                      ▼
   │                           ┌──────────────────┐
   │                           │ 反馈统计           │
   │                           │ 误报率/漏报/分类   │
   │                           │ 准确性/法规匹配    │
   │                           └────────┬─────────┘
   │                                    │
   │                    ┌───────────────┼───────────────┐
   │                    ▼               ▼               ▼
   │              [Prompt优化]   [分类权重调整]   [向量库增量]
   │                    │               │               │
   └────────────────────┴───────────────┴───────────────┘
```

---

## 4. CSS Token 引用关系图

```
                    uni.scss
                    (导入 theme.scss)
                         │
              ┌──────────┼──────────┐
              │          │          │
         App.vue    pages/*.vue   static/*.css
         (全局样式)   (@import)    (独立加载)
              │          │
              └──────────┴────→ static/theme.scss
                                    │
                        ┌───────────┼───────────────┐
                        │           │               │
                   品牌色系(4)   语义色(6)       中性色(6)
                   $brand-red-*   $safe-green    $bg-page
                                  $warn-yellow   $bg-card
                        │           │               │
                        ├───────────┼───────────────┤
                        │      间距体系(6) 圆角体系(6) │
                        │    $spacing-xs→xxl  $radius-sm→full
                        │           │               │
                        ├─── 字体(2) + 字号(10) ────┤
                        │    $font-serif/$font-sans │
                        │    $fs-stat→$fs-tag       │
                        │           │               │
                        ├────── 阴影体系(7) ────────┤
                        │    $shadow-card-sm→$shadow-modal
                        │           │               │
                        ├────── 响应式断点(5) ──────┤
                        │    $breakpoint-xs→xl
                        │    @mixin screen-xs→xl
                        │    @mixin no-overflow
                        │    @mixin tablet-grid
                        │           │               │
                        └────── 暗色主题 ──────────┘
                             [data-theme="dark"]
                             @media (prefers-color-scheme: dark)
                             覆盖所有颜色变量 + 阴影 + 图片滤镜
```

---

## 5. 页面跳转流程图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          首页 (index/index)                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  拍照检查卡片  │  │  视频检查卡片  │  │  开始巡检按钮  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
│         ▼                 ▼                 ▼                        │
│  inspect/capture    inspect/video    inspect/capture                 │
│  (拍照/上传图片)     (上传视频)        (同拍照入口)                    │
│         │                 │                 │                        │
│         ▼                 ▼                 │                        │
│  inspect/analyzing  inspect/video           │                        │
│  (AI分析中·进度)    (抽帧+逐帧分析)          │                        │
│         │                 │                 │                        │
│         ▼                 ▼                 │                        │
│  inspect/result     inspect/result          │                        │
│  (隐患列表·法规匹配)  (同左)                 │                        │
│         │                 │                 │                        │
│         └─────────┬───────┘                 │                        │
│                   ▼                         │                        │
│            report/detail                    │                        │
│            (报告详情·导出)                    │                        │
│                                             │                        │
├─────────────────────────────────────────────┼────────────────────────┤
│                  TabBar 导航 (底部5个Tab)     │                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │ 首页    │ │ 报告    │ │ 法规    │ │ 场所    │ │ 设置    │            │
│  │ index  │ │history │ │knowledge│ │building│ │settings│            │
│  └────────┘ └───┬────┘ └───┬────┘ └────────┘ └───┬────┘            │
│                 │          │                      │                  │
│                 ▼          ▼                      ▼                  │
│          report/detail  knowledge/detail    feedback/index           │
│          report/stat    knowledge/editor                             │
│                                                                     │
│  ┌─────────────────────────────────────────────┐                    │
│  │          快捷入口 (首页 2×2 网格)             │                    │
│  │  消防AI专家 → expert/chat                    │                    │
│  │  历史报告   → report/history                 │                    │
│  │  法规库     → knowledge/index                │                    │
│  │  AI设置     → settings/index                 │                    │
│  └─────────────────────────────────────────────┘                    │
│                                                                     │
│  ┌─────────────────────────────────────────────┐                    │
│  │          其他入口                             │                    │
│  │  快速检查 → check/check → check/result       │                    │
│  │  工单管理 → inspect/workorder                 │                    │
│  │  新手引导 → index/onboarding (首次启动)        │                    │
│  └─────────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. 数据流图 — 核心识别流程（含算法层）

```
用户拍照
  │
  ▼
[native camera / 相册选择]
  │ 返回 base64 或 tempFilePath
  ▼
pages/inspect/capture.vue
  │ 调用 aiService.recognizeImage(base64, mimeType)
  ▼
utils/ai-service.js
  │ 调用 apiClient.request('POST', '/api/image/recognize', body)
  ▼
utils/api-client.js
  │ fetch('http://localhost:8080/api/image/recognize', { method:'POST', ... })
  ▼
server.cjs → POST /api/image/recognize
  │
  ├─[检查 API Key]─→ 未配置 → 降级决策 → L2/L3 模式 → 规则报告
  │
  ├─[检查缓存] 同一图片 5min 内 → 命中则直接返回
  │
  ├─[Step 1: 场景分类] sceneClassify()
  │  DeepSeek Vision 识别场所类型（8大类32子类）→ 失败则规则兜底
  │
  ├─[Step 2: 三层视觉检测] runDetectionPipeline()
  │  ├─ Layer 1: 消防设施状态（灭火器/消火栓/报警器/喷淋/应急灯/疏散标志）
  │  ├─ Layer 2: 疏散通道环境（安全出口/走道/防火门/楼梯/消防车道）
  │  └─ Layer 3: 危险源（电气线路/配电设施/易燃物/明火/防火分隔）
  │  每层独立调用 DeepSeek Vision，按 spec §2.5.3 Prompt 规范执行
  │  火焰/烟雾走独立快速通道（YOLOv8s-Nano 本地模型）
  │
  ├─[Step 3: 隐患分类映射] mapToTaxonomy()
  │  视觉发现 → GB 35181-2025 分类树节点（taxonomyCode）
  │
  ├─[Step 4: 三维风险量化] quantifyRisk()
  │  每个隐患计算 S×L×D → 风险等级 I/II/III/IV + 颜色 蓝/黄/橙/红
  │  GB 35181 直接判定要素触及 → 自动 S4
  │
  ├─[Step 5: 法规语义匹配] matchRegulation()
  │  主: mxbai-embed-large 向量检索 Top-5（cos≥0.75）
  │  兜底: 规则关键词精确匹配表（内置，不依赖外部服务）
  │  可选: LLM 重排序 Top-3
  │
  ├─[Step 6: 报告生成] generateReport()
  │  LLM 结构化输出：隐患描述 + 风险等级 + 法规依据 + 整改建议
  │
  ├─[后处理] logInspection() → inspection_records
  │          setCachedResult() → inspection_cache (5min TTL)
  │
  └─[返回] { success, hazards[{taxonomyCode,confidence,riskLevel,...}], 
              meta: { mode, degradationLevel, sceneType, chain, ... } }
  │
  ├─[各环节降级]
  │  ├─[超时/失败] → 记录 chain，降级至下一可用层级
  │  ├─[向量库不可用] → 自动切换规则关键词，不阻塞
  │  └─[全部不可用] → L2 离线本地（YOLO+规则）或 L3 手动辅助
  │
  ▼
前端接收响应
  │
  ├─[success] → 跳转 pages/inspect/result.vue
  │   渲染隐患列表 + meta.chain 链路可视化 + 法规匹配 + 整改建议
  │   风险 IV 级（红色）隐患高亮显示 + "立即整改"标识
  │
  └─[error] → 显示错误卡片 + 降级提示 + 重试按钮
```

---

## 7. 文件生成路径清单（52 个文件）

### 必须生成的核心文件（按依赖顺序）

| 序号 | 文件 | 类型 | 大小估计 | 依赖 |
|:--:|------|------|:--:|------|
| 1 | static/theme.scss | SCSS | ~18KB | 无 |
| 2 | uni.scss | SCSS | ~2KB | theme.scss |
| 3 | static/critical.css | CSS | ~2KB | theme.scss |
| 4 | static/dark-mode.css | CSS | ~5KB | theme.scss |
| 5 | static/manifest.json | JSON | ~1KB | 无 |
| 6 | static/sw.js | JS | ~8KB | 无 |
| 7 | static/offline.html | HTML | ~3KB | 无 |
| 8 | static/logo.svg | SVG | ~1KB | 无 |
| 9 | index.html | HTML | ~2KB | 无 |
| 10 | main.js | JS | ~1KB | App.vue |
| 11 | App.vue | Vue | ~5KB | theme.scss, error-handler.js |
| 12 | pages.json | JSON | ~3KB | 无(路由声明) |
| 13 | manifest.json | JSON | ~1KB | 无 |
| 14 | vite.config.js | JS | ~1KB | 无 |
| 15 | package.json | JSON | ~2KB | 无 |
| 16 | data/law-db.json | JSON | ~4KB | 无 |
| 17 | data/demo-reports.json | JSON | ~8KB | 无 |
| 18 | data/demo-statistics.json | JSON | ~5KB | 无 |
| 19 | data/feedback.json | JSON | ~3KB | 无 |
| 20 | data/memory-graph-default.json | JSON | ~3KB | 无 |
| 21 | server.cjs | JS | ~35KB | data/*.json, algorithm modules |
| 22 | pages/index/index.vue | Vue | ~4KB | theme.scss |
| 23 | pages/index/onboarding.vue | Vue | ~5KB | theme.scss |
| 24 | pages/inspect/capture.vue | Vue | ~6KB | theme.scss, ai-service.js |
| 25 | pages/inspect/analyzing.vue | Vue | ~5KB | theme.scss, chain visualization |
| 26 | pages/inspect/result.vue | Vue | ~10KB | theme.scss, hazard-law-matcher.js, chain visualization |
| 27 | pages/inspect/video.vue | Vue | ~8KB | theme.scss, ai-service.js |
| 28 | pages/inspect/workorder.vue | Vue | ~6KB | theme.scss |
| 29 | pages/expert/chat.vue | Vue | ~8KB | theme.scss, ai-service.js |
| 30 | pages/check/check.vue | Vue | ~6KB | theme.scss, rule-engine.js |
| 31 | pages/check/result.vue | Vue | ~5KB | theme.scss |
| 32 | pages/report/detail.vue | Vue | ~7KB | theme.scss, risk visualization |
| 33 | pages/report/history.vue | Vue | ~6KB | theme.scss |
| 34 | pages/report/statistics.vue | Vue | ~8KB | theme.scss |
| 35 | pages/knowledge/index.vue | Vue | ~6KB | theme.scss |
| 36 | pages/knowledge/detail.vue | Vue | ~4KB | theme.scss |
| 37 | pages/knowledge/editor.vue | Vue | ~5KB | theme.scss |
| 38 | pages/building/index.vue | Vue | ~5KB | theme.scss |
| 39 | pages/settings/index.vue | Vue | ~6KB | theme.scss, theme-manager.js |
| 40 | pages/feedback/index.vue | Vue | ~6KB | theme.scss |
| 41 | utils/api-client.js | JS | ~4KB | 无 |
| 42 | utils/ai-service.js | JS | ~4KB | api-client.js |
| 43 | utils/hazard-law-matcher.js | JS | ~3KB | 无 |
| 44 | utils/hazard-taxonomy.js | JS | ~4KB | GB 35181 分类树 |
| 45 | utils/risk-engine.js | JS | ~5KB | hazard-taxonomy.js |
| 46 | utils/regulation-matcher.js | JS | ~6KB | mxbai-embed, law-db.json |
| 47 | utils/scene-classifier.js | JS | ~3KB | 无 |
| 48 | utils/degradation-manager.js | JS | ~3KB | 无 |
| 49 | utils/theme-manager.js | JS | ~3KB | 无 |
| 50 | utils/error-handler.js + loading-service.js + storage.js + report-generator.js | JS | ~2KB each | 无 |