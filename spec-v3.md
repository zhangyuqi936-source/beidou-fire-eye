# 北斗火眼·消防智查 v3.0 — 需求规格说明书 (spec-v3)

> **对标**: 暖守 spec.md | **版本**: v3.0 | **日期**: 2026-06-27  
> **项目路径**: `c:/Users/张珘/Desktop/CC/extracted_src/`

---

## 1. 产品定义

### 1.1 一句话描述
北斗火眼·消防智查是一款面向**基层巡检人员**的 AI 消防检查 H5 应用。拍照即识别隐患、自动匹配法规、一键生成整改报告。

### 1.2 核心能力矩阵

| 能力 | 描述 | 闭环 |
|------|------|:--:|
| 拍照检查 | 拍摄消防场景 → AI 视觉识别 → 隐患列表 + 法规匹配 | ✅ |
| 视频检查 | 上传巡查视频 → FFmpeg 抽帧 → 逐帧 AI 分析 → 去重汇总 | ✅ |
| AI 专家 | 消防法规问答，支持人格底座(localhost:3100)和 DeepSeek 双后端 | ✅ |
| 法规库 | 浏览/搜索/编辑消防国标法规，定时自动更新 | ✅ |
| 报告管理 | 历史报告列表、详情、统计看板、PDF/Excel 导出 | ✅ |
| 快速检查 | 分步引导式巡检，按检查大类逐项确认 | ✅ |
| 工单管理 | 巡检工单创建/分配/跟踪 | ✅ |
| 场所管理 | 多场所登记与切换 | ✅ |
| 深色主题 | 三态切换(跟随系统/浅色/深色)，适配夜间巡检 | ✅ |
| PWA 离线 | Service Worker 缓存策略，离线降级提示页 | ✅ |
| 反馈收集 | 多 AI + 真人评分系统，5 维度评分 | ✅ |

### 1.3 23 个术语定义

| 术语 | 定义 |
|------|------|
| 隐患(Hazard) | AI 识别出的消防风险点，含严重等级、描述、匹配法规 |
| 法规(Law) | 消防国标条款，含编号、类别、强制性等级、处罚标准 |
| 检查报告(Report) | 一次完整巡检的输出，含隐患列表、法规对照、整改建议 |
| 法规匹配(LawMatch) | AI 将隐患类型映射到具体法规条款的过程 |
| 人格底座(PersonalityEngine/PE) | localhost:3100 的知识记忆引擎，提供行业图谱和个性化上下文 |
| 抽帧(FrameExtraction) | FFmpeg 从视频中每秒提取 1 帧，最多 60 帧 |
| 三态主题 | theme-mode: auto(跟随系统) / light(浅色) / dark(深色) |
| 离线降级 | API Key 未配置时返回 demo 数据，PWA 缓存法规库 |
| 骨架屏(Skeleton) | 数据加载中的灰色脉冲占位动画 |
| 竹节分隔线(BambooDivider) | 消防红点状分隔线，品牌视觉元素 |
| Token | SCSS 变量，统一管理颜色/间距/圆角/阴影/字号 |
| uni-app | 跨平台框架，一套代码编译 H5/Android/iOS |
| Vite | 前端构建工具，开发服务器热更新 |
| DeepSeek | 默认 LLM 提供商，支持替换为其他 OpenAI 兼容 API |
| BOM | UTF-8 字节序标记(EF BB BF)，项目中必须为无 BOM |
| parse5 | uni-app 使用的 HTML 解析器 |
| ServerWorker(SW) | PWA 离线缓存服务线程 |
| 分包(SubPackage) | uni-app 代码分割机制 |
| Mixin | SCSS 可复用样式代码块 |
| 铁律 | 不可违反的开发规则，违反必崩 |

---

## 2. 数据模型 (JSON Schema)

### 2.1 law-db.json — 消防法规数据库

```json
{
  "version": "2026.06.0027",
  "updatedAt": "2026-06-27T00:00:00.000Z",
  "laws": [
    {
      "id": "GB50016-5.5.2",
      "code": "GB 50016-2014",
      "name": "建筑设计防火规范",
      "category": "疏散通道",
      "section": "national_standards",
      "clause": "第5.5.2条 安全出口",
      "content": "除本规范另有规定外，公共建筑内每个防火分区或一个防火分区的每个楼层，其安全出口的数量应经计算确定，且不应少于2个。",
      "level": "强制性",
      "penalty": "责令改正，处五千元以上五万元以下罚款",
      "keywords": ["安全出口", "防火分区", "疏散通道"]
    }
  ],
  "customLaws": [
    {
      "id": "LAWMQPFXXX",
      "createdAt": "2026-06-27T00:00:00.000Z",
      "code": "GB XXXXX-XXXX",
      "name": "法规名称",
      "category": "类别",
      "section": "national_standards",
      "content": "法规全文",
      "updatedAt": "2026-06-27T00:00:00.000Z"
    }
  ]
}
```

**字段约束**:
- `id`: 国标法规用 `GB+编号-条款` 格式；自定义法规用 `LAW+随机ID`
- `category`: 必须属于 [疏散通道, 消防设施, 电气安全, 易燃易爆, 建筑防火, 消防管理] 之一
- `level`: [强制性, 推荐性, 一般性] 之一
- `keywords[]`: 至少 2 个搜索关键词

### 2.2 demo-reports.json — 检查报告

```json
[
  {
    "id": "RPT-20260601-001",
    "title": "检查报告标题",
    "location": "检查地点",
    "inspector": "检查人",
    "inspectDate": "2026-06-01",
    "status": "已整改",
    "hazards": [
      {
        "id": "HZ-001",
        "title": "隐患标题",
        "category": "隐患类别",
        "severity": "严重",
        "description": "隐患详细描述",
        "photoNote": "现场拍摄说明",
        "matchedLaws": [
          {
            "lawId": "GB50016-5.5.2",
            "title": "GB 50016-2014 建筑设计防火规范",
            "clause": "第5.5.2条 安全出口",
            "level": "强制性",
            "penalty": "罚款金额/处罚说明"
          }
        ],
        "rectification": "整改建议"
      }
    ],
    "rectifications": [
      {
        "hazardId": "HZ-001",
        "action": "整改措施",
        "deadline": "2026-06-15",
        "status": "completed"
      }
    ]
  }
]
```

**状态枚举**: `status`: [待检查, 检查中, 待整改, 已整改, 已关闭]  
**严重等级**: `severity`: [严重, 一般, 轻微]

### 2.3 demo-statistics.json — 统计数据

```json
{
  "totalChecks": 127,
  "totalHazards": 342,
  "completedRectifications": 298,
  "hazardTypes": [
    { "name": "消防设施", "value": 98 },
    { "name": "疏散通道", "value": 76 },
    { "name": "电气安全", "value": 54 },
    { "name": "易燃易爆", "value": 48 },
    { "name": "建筑防火", "value": 38 },
    { "name": "消防管理", "value": 28 }
  ],
  "dailyTrend": [
    { "date": "2026-06-01", "inspections": 5, "hazards": 8 }
  ],
  "buildingStats": [
    { "name": "万达写字楼A座", "inspections": 28, "hazards": 45, "lastCheck": "2026-06-21" }
  ]
}
```

### 2.4 feedback.json — 反馈数据

```json
[
  {
    "id": "fb-1719283200000",
    "source": "真人专家",
    "timestamp": "2026-06-27T00:00:00.000Z",
    "ratings": {
      "ui": 4,
      "function": 5,
      "accuracy": 4,
      "practical": 5,
      "smooth": 4
    },
    "text": "文字反馈内容（至少50字）",
    "findings": ["feature"]
  }
]
```

**source 枚举**: [豆包, DeepSeek, Claude Code, 真人专家]  
**ratings 范围**: 1-5 整数  
**findings 枚举**: [bug, feature, ui, data, other]

### 2.5 隐患识别算法模型（核心算法层）

> **设计原则**：LLM 只做擅长的事（视觉理解+报告生成），速度与稳定性靠结构化知识库+本地规则。文献底座：GB 35181-2025·GB 50016·三维风险矩阵（MDPI Fire 2024）·监管RAG（MDPI Electronics 2025）。

#### 2.5.1 识别链路总览

```
拍照/上传 → [预处理] → [场景分类] → [三层视觉检测] → [分类映射] → [风险量化] → [法规匹配] → [报告生成]
   ↓           ↓           ↓              ↓               ↓            ↓            ↓            ↓
 图片归一化  DeepSeek    Layer1 消防设施   GB 35181      S×L×D       mxbai-embed   LLM结构化
 EXIF修正    Vision      Layer2 疏散通道   分类树索引    三维矩阵     语义检索      输出
 光照均衡    or 规则     Layer3 危险源                               规则兜底
```

#### 2.5.2 隐患分类树（基于 GB 35181-2025）

识别出的隐患必须映射到以下三层分类树节点：

| 大类 | 子类示例 | 末端节点数 | 视觉检测方式 |
|------|----------|:--:|------|
| 消防设施 | 灭火器缺失/过期/遮挡、消火栓箱封堵、报警器损坏、喷淋头被涂覆、应急灯不亮 | 18 | Layer1 视觉检测（V） |
| 疏散通道 | 安全出口锁闭/数量不足、走道被占用堵塞、防火门常开、消防车道堵塞 | 11 | Layer2 环境检测（VC） |
| 电气安全 | 电线私拉乱接、线路老化裸露、配电箱周围堆物、大功率违规使用 | 6 | Layer3 危险源检测（I） |
| 火源管理 | 违规明火、易燃物堆积、防火分区破坏、防火卷帘下方堆物 | 7 | Layer3 危险源检测（VC） |
| 管理缺失 | 消防责任人未明确、巡查记录缺失、员工未培训 | 4 | 非视觉（N），仅规则提示 |

**检测方式编码**: V=照片可直接判断 · VC=需场景上下文 · I=需LLM推理 · N=照片无法检测仅规则提示

#### 2.5.3 三层视觉识别规范

每张照片必须经过三层检测，不得跳过：

**Layer 1 — 消防设施状态检测**：识别灭火器（含压力表读数）、消火栓箱（完整/遮挡/封堵）、火灾报警器（指示灯状态）、自动喷淋头、应急照明灯、疏散指示标志。每项标注 `status: normal|missing|damaged|blocked|expired|unknown`。

**Layer 2 — 疏散通道与环境检测**：识别安全出口（数量/锁闭/宽度）、疏散走道（占用/堵塞/宽度不足）、常闭防火门（是否关闭）、疏散楼梯间（是否被占用）、消防车道（是否堵塞）。

**Layer 3 — 危险源检测**：电气线路（私拉乱接/老化裸露/未穿管）、配电设施（周围堆物/箱门损坏）、易燃物堆积、明火源/吸烟、防火卷帘下方堆物、防火封堵是否严密。

**输出要求**：每层检测结果必须包含 `confidence: high|medium|low`，不允许推测看不到的内容；全局标记 `smokeDetected` / `flameDetected` 走独立的火焰/烟雾快速通道（本地 YOLO 模型，<2秒响应）。

#### 2.5.4 三维风险量化（S×L×D）

每个隐患的风险等级由三个维度计算，各 1-4 分，共 64 种组合：

| 维度 | 说明 | 评分依据 |
|------|------|----------|
| **严重性 S** | 隐患对人员安全的威胁程度 | S1轻微→S4极严重（触发 GB 35181 直接判定要素自动标记 S4） |
| **可能性 L** | 导致火灾或事故的可能性 | L1极低→L4较高（场所类型+隐患数量+历史数据综合判定） |
| **可检测性 D** | 隐患被发现的难易程度 | D1极易发现→D4极难发现（D值越高越危险，因隐患可能长期存在） |

**综合风险等级**: I级(≤8,蓝,可接受) · II级(9-18,黄,限期30天) · III级(19-36,橙,限期7天) · IV级(37-64,红,立即整改)

**简化公式（v1）**: `riskScore = S × L × D`（v2 升级为 ANP 二级权重精算）

#### 2.5.5 法规语义匹配引擎

基于 mxbai-embed-large（1024维）向量检索 + 规则关键词兜底：

```
隐患描述 + 场所类型 + 分类编码
  → mxbai-embed → 1024维查询向量
  → 向量库 Top-5 语义检索（余弦相似度≥0.75）
  → 规则关键词精确匹配（兜底）
  → 元数据过滤（场所类型标签）
  → 合并去重 → Top-3 法规条款（编号+原文+相关性得分）
```

**法规库覆盖**: GB 35181-2025·GB 50016·GB 55037·GB 55036·GB 50140·《消防法》·公安部令第61号。文本按条款边界分割，每条标注适用场所类型和隐患类别标签。

**降级策略**: 向量库不可用时，降级为内置规则关键词匹配表，不白屏。

#### 2.5.6 四级降级策略

| 层级 | 触发条件 | 视觉识别 | 法规匹配 | 响应速度 |
|:--:|------|------|------|:--:|
| L0 全功能 | API Key 正常 | DeepSeek Vision | 语义向量+LLM重排 | 3-8秒 |
| L1 规则增强 | 向量库不可用 | DeepSeek Vision | 规则关键词 | 3-6秒 |
| L2 离线本地 | Vision API 不可用 | 本地 YOLO（特定目标） | 规则关键词 | <2秒 |
| L3 手动辅助 | 全部 AI 不可用 | 无 | 静态检查清单 | 即时 |

**前端感知**: 返回 `meta.mode` 标明当前运行层级（`hybrid_ai|hybrid_fallback_vec|hybrid_fallback_vision|rules_only`），`meta.chain` 展示识别全链路。

#### 2.5.7 闭环学习（v2 规划）

人工复核反馈（误报/漏报/分类纠错）写入 `inspection_records` → 聚合后触发 Prompt 优化或分类权重调整。v1 阶段仅实现反馈数据模型和写入接口，v2 实现自动调整。

#### 2.5.8 返回结构增强

`/api/image/recognize` 响应在现有基础上增加以下字段：

```json
{
  "meta": {
    "agentVersion": 1,
    "algorithmVersion": "v1",
    "mode": "hybrid_ai",
    "degradationLevel": "L0",
    "cacheHit": false,
    "sceneType": "公众聚集场所",
    "detectionLayers": ["facilities", "passages", "hazards"],
    "chain": [
      "场景识别: 商场(B2)",
      "Layer1 消防设施检测: 发现2处异常",
      "Layer2 通道环境检测: 发现1处异常",
      "Layer3 危险源检测: 发现0处异常",
      "风险量化: 最高III级",
      "法规匹配: 匹配5条",
      "报告生成: 完成"
    ]
  },
  "hazards": [
    {
      "taxonomyCode": "1.3.1",
      "confidence": "high",
      "riskLevel": "III",
      "riskScore": 24
    }
  ]
}
```

### 2.6 memory-graph-default.json — 行业知识图谱

```json
{
  "domain": "fire-safety-inspection",
  "version": "1.0",
  "nodes": [
    {
      "id": "fire-facility",
      "label": "消防设施",
      "category": "检查大类",
      "children": ["extinguisher", "hydrant", "alarm", "sprinkler"]
    }
  ],
  "edges": [
    { "from": "extinguisher", "to": "GB50140", "relation": "governed_by" }
  ],
  "inspectionFlow": {
    "steps": ["外观检查", "功能测试", "环境评估", "法规对照", "报告生成"],
    "estimatedMinutes": 15,
    "requiredTools": ["手电筒", "测距仪", "温度计", "照相机"]
  }
}
```

---

## 3. API 接口契约（16 个端点）

### 3.1 GET /api/health — 健康检查

**请求**: 无  
**响应成功** (200):
```json
{
  "status": "ok",
  "service": "少翁智能·消防智查",
  "version": "2.0.0",
  "mode": "local",
  "uptime": 3600,
  "services": {
    "llm": { "status": "configured", "provider": "deepseek" },
    "personalityEngine": { "status": "unreachable", "url": "localhost:3100" }
  }
}
```

### 3.2 POST /api/image/recognize — 图片隐患识别

**请求方式 A** (multipart/form-data): `image: File` (jpg/png, ≤10MB)  
**请求方式 B** (application/json): `{ "image": "base64字符串", "mimeType": "image/jpeg" }`  
**响应成功** (200):
```json
{
  "success": true,
  "hazards": [
    {
      "title": "灭火器压力不足",
      "category": "消防设施",
      "severity": "一般",
      "description": "灭火器压力表指针位于红色区域，表明压力不足",
      "matchedLaws": [
        { "lawId": "GB50140-6.1", "title": "GB 50140-2005", "clause": "第6.1条", "level": "强制性", "penalty": "处五千元以上五万元以下罚款" }
      ]
    }
  ],
  "hazardCount": 1,
  "overallRisk": "medium",
  "summary": "发现1处隐患：消防设施类 1处",
  "processedAt": "2026-06-27T00:00:00.000Z"
}
```
**错误码**: 503 (LLM_API_KEY_NOT_CONFIGURED), 400 (INVALID_FILE_TYPE), 500 (AI_CALL_FAILED), 429 (RATE_LIMITED)

### 3.3 POST /api/video/frames — 视频抽帧分析

**请求**: multipart/form-data `video: File` (mp4/mov/avi, ≤100MB)  
**响应成功** (200):
```json
{
  "success": true,
  "totalFrames": 30,
  "analyzedFrames": 28,
  "hazards": [ /* 同 image/recognize 的 hazards 结构，已去重 */ ],
  "hazardCount": 5,
  "frameResults": [
    { "frameIndex": 0, "timestamp": "0.0s", "hasHazard": true, "hazards": [...] },
    { "frameIndex": 1, "timestamp": "1.0s", "hasHazard": false }
  ],
  "processedAt": "2026-06-27T00:00:00.000Z"
}
```
**错误码**: 503, 400 (INVALID_VIDEO_FORMAT / VIDEO_TOO_LARGE), 500 (FFMPEG_FAILED / AI_CALL_FAILED)

### 3.4 GET /api/laws — 获取法规列表

**查询参数**: `?q=灭火器` (可选搜索关键词)  
**响应成功** (200):
```json
{
  "success": true,
  "version": "2026.06.0027",
  "laws": [ /* Law 对象数组 */ ],
  "total": 8
}
```

### 3.5 POST /api/laws — 新增自定义法规

**请求 Body**:
```json
{ "code": "GB XXXXX", "name": "法规名称", "category": "消防设施", "content": "条款内容" }
```
**响应成功** (200):
```json
{ "success": true, "id": "LAWMQPFXXX" }
```
**错误码**: 400 (MISSING_FIELDS / DUPLICATE_CODE)

### 3.6 DELETE /api/laws/:id/delete — 删除法规

**响应成功** (200):
```json
{ "success": true, "deleted": "LAWMQPFXXX" }
```

### 3.7 POST /api/laws/import — 批量导入法规

**请求 Body**: `{ "laws": [ /* Law 对象数组 */ ] }`  
**响应成功** (200):
```json
{ "success": true, "imported": 5, "skipped": 0 }
```

### 3.8 GET /api/reports/list — 报告列表

**离线模式**: API Key 未配置时返回 `data/demo-reports.json` + `"source": "demo"`  
**响应成功** (200):
```json
{ "success": true, "reports": [ /* Report 对象数组 */ ], "source": "live" }
```

### 3.9 GET /api/reports/statistics — 统计数据

**离线模式**: API Key 未配置时返回 `data/demo-statistics.json`  
**响应成功** (200):
```json
{
  "success": true,
  "totalChecks": 127,
  "totalHazards": 342,
  "completedRectifications": 298,
  "hazardTypes": [ /* 饼图数据 */ ],
  "dailyTrend": [ /* 折线图数据 */ ],
  "buildingStats": [ /* 场所统计 */ ]
}
```

### 3.10 POST /api/reports/export — 导出报告

**请求 Body**: `{ "reportId": "RPT-001", "format": "excel" }` (excel / pdf)  
**响应成功** (200): 文件流 (Content-Disposition: attachment)  
**错误码**: 400 (MISSING_REPORT_ID / UNSUPPORTED_FORMAT), 404 (REPORT_NOT_FOUND)

### 3.11 POST /api/expert/ask — AI 单次问答

**请求 Body**: `{ "question": "灭火器过期怎么办？" }`  
**响应成功** (200):
```json
{
  "success": true,
  "answer": "根据 GB 50140-2005...",
  "source": "deepseek",
  "model": "deepseek-chat"
}
```
**错误码**: 503 (LLM_API_KEY_NOT_CONFIGURED), 502 (ALL_BACKENDS_FAILED), 429 (RATE_LIMITED)

### 3.12 POST /api/expert/chat — AI 多轮对话

**请求 Body**: `{ "messages": [{ "role": "user", "content": "..." }] }`  
**响应同 /api/expert/ask**

### 3.13 GET /api/scheduler/status — 法规更新任务状态

**响应成功** (200):
```json
{
  "schedulerActive": true,
  "nextUpdate": "2026-06-28T00:00:00.000Z",
  "updateIntervalHours": 24,
  "lastUpdate": { "timestamp": "2026-06-27T00:00:00.000Z", "count": 0 }
}
```

### 3.14 POST /api/scheduler/update-now — 手动触发法规更新

**响应成功** (200):
```json
{ "success": true, "message": "法规更新已触发" }
```

### 3.15 反馈系统（2 个端点）

**POST /api/feedback/submit**  
请求 Body: `{ "source": "真人专家", "ratings": { "ui": 5, "function": 5, "accuracy": 4, "practical": 5, "smooth": 4 }, "text": "至少50字的反馈...", "findings": ["feature"] }`  
响应成功 (200): `{ "success": true, "id": "fb-1719283200000" }`

**GET /api/feedback/summary**  
响应成功 (200):
```json
{
  "success": true,
  "total": 3,
  "sources": { "真人专家": 1, "Claude Code": 1, "DeepSeek": 1 },
  "avgRatings": { "ui": 4.3, "function": 4.7, "accuracy": 4.3, "practical": 4.7, "smooth": 4.0 },
  "findings": { "feature": 2, "ui": 1 },
  "latest": [ /* 最近 10 条反馈 */ ]
}
```

### 3.16 人格底座代理（3 个端点）

**GET /api/personality/memory-graph?userId=xxx**  
响应: PE 可达时透传 PE 响应；不可达时返回 `data/memory-graph-default.json` + `"source": "local-cache"`

**POST /api/personality/inspect-context**  
请求 Body: `{ "type": "fire-facility", "location": "...", "hazards": [...] }`  
响应: PE 可达时透传 PE 响应；不可达时 503

**GET /api/personality/user-profile?userId=xxx**  
响应: PE 不可达时返回本地默认偏好 `{ preferences: { commonTypes: ["fire-facility","evacuation"], frequentHazards: ["灭火器过期","疏散通道堵塞"] } }`

---

## 4. 页面 UI 规格（19 个页面）

### 4.1 pages/index/index — 首页

**布局（从上到下）**:
1. **品牌区**: 消防红(#D92121)背景，圆角下边，"消防智查" 标题(22px 衬线体) + "消防安全智能检查" 副标题(10px)
2. **Hero 推广位**: 消防红渐变背景，圆角卡片，"拍一下，自动发现消防隐患" 标题(36px 衬线体) + 副标题(14px)
3. **拍照检查卡片**: 白底圆角卡片，左红边框，左侧 📳 emoji + 标题"拍照检查"(18px) + 描述(10px) + 右侧红色箭头
4. **视频检查卡片**: 同上布局，📴 emoji，标题"视频检查"，红底浅红左边框
5. **开始巡检按钮**: 全宽消防红圆角按钮，48px高，白色文字
6. **竹节分隔线**: 红色点状线装饰
7. **快捷工具网格**: 2×2 网格 (消防AI专家🎪 / 历史报告📫 / 法规库📎 / AI设置⚙️)，每格含 emoji + 标题(衬线) + 描述(10px)
8. **底部安全提示**: 黄色背景卡片，⚠️ "AI识别仅作辅助，重大隐患请委托具备资质的专业机构复核。"

### 4.2 pages/inspect/capture — 拍照检查

1. **页面上半区**: 图片预览区域，灰色背景 + 相机占位图标（无图片时）
2. **底部操作区**: 2 个按钮 — "拍照"(全宽主按钮) + "从相册选择"(全宽次要按钮)
3. **图片预览态**: 显示已选图片 + "重新选择"按钮 + "开始识别"(消防红，触发跳转至 analyzing 页)

### 4.3 pages/inspect/analyzing — AI 分析中

1. **居中动画区**: 旋转脉冲加载动画(spinner)
2. **说明文字**: "AI正在识别消防隐患" (18px 标题) + "正在分析现场画面..." (描述)
3. **状态文字**: 动态变化的状态提示（"正在上传图片..." → "AI正在识别..." → "正在匹配法规..."）
4. **失败态**: 红色错误卡片 + 错误信息 + "重试"按钮

### 4.4 pages/inspect/result — 识别结果

1. **顶部摘要**: 隐患总数 + 整体风险等级(颜色区分)
2. **隐患列表**: 每个隐患含标题、分类标签、严重等级徽标(红/黄/绿)、描述文字、匹配法规条目(法规名称 + 条款 + 处罚)
3. **底部操作**: "生成报告"按钮 + "重新检查"按钮

### 4.5 pages/inspect/video — 视频检查

1. **视频选择区**: 上传按钮 + 已选视频文件名显示
2. **抽帧设置**: fps选择器(1/2/5帧每秒)，最大帧数显示
3. **分析进度**: 进度条 + "正在分析第 X/30 帧..."
4. **结果展示**: 同 result 页面的隐患列表

### 4.6 pages/inspect/workorder — 巡检工单

1. **顶部栏**: "巡检工单" 标题 + "新建工单" 按钮
2. **Tab 标签**: 横向滚动标签(全部/待检查/检查中/已完成)
3. **工单列表**: 每个工单含标题、场所、状态标签、日期
4. **空状态**: 无工单时的占位图标 + 引导文字
5. **表单弹窗**: 新建工单表单（场所选择、检查类型、备注）

### 4.7 pages/expert/chat — 消防 AI 专家

1. **模式切换栏**: 🧠人格底座 / ⚡直连DeepSeek 双模式切换
2. **上下文记忆**: 记忆轮数徽章 + "清除"按钮
3. **聊天区**: 用户消息(右对齐白底气泡) + AI回复(左对齐浅红背景气泡)
4. **输入区**: 多行输入框 + 发送按钮

### 4.8 pages/check/check — 快速检查

1. **进度条**: 顶部线性进度条 + "步骤 X/N"
2. **步骤指示器**: 横向滚动步骤标签(检查大类)
3. **问题列表**: 每个检查项含标题、描述、"合格/不合格/不适用"三态按钮
4. **导航按钮**: "上一步" + "下一步"
5. **完成态**: 触发跳转至 check/result

### 4.9 pages/check/result — 快速检查结果

1. **评分头部**: 渐变背景(红/黄/绿按分数) + 综合评级字母 + "综合得分 XX%"
2. **分类得分**: 各类别得分网格
3. **详细结果**: 分类展开列表，每项含状态图标(✅/❌/➖)
4. **导出按钮**: "导出报告" + "返回首页"

### 4.10 pages/report/detail — 报告详情

1. **报告头部**: 报告标题 + 报告编号 + 生成时间
2. **基本信息卡片**: 场所名称、地址、检查日期、检查人员
3. **隐患详情卡片**: 每个隐患含标题、严重等级、描述、匹配法规、整改建议
4. **整改追踪**: 整改措施列表 + 完成状态

### 4.11 pages/report/history — 历史报告

1. **顶部栏**: "历史检查报告" 标题 + 批次操作切换按钮
2. **搜索栏**: 搜索输入框
3. **报告列表**: 每个报告卡片含标题、地点、日期、状态标签（已整改/待整改/检查中）
4. **空状态**: 无报告时的占位图标 + "暂无检查报告"
5. **批次模式**: 勾选框 + "批量导出"/"批量删除" 操作栏

### 4.12 pages/report/statistics — 统计看板

1. **概览卡片行**: 4个统计卡片（总检查数、隐患总数、整改完成数、整改率），消防红阴影
2. **隐患类型饼图区**: CSS 绘制的简易饼图 + 图例
3. **近30天趋势图区**: CSS 绘制的简易折线图 + X轴日期/Y轴数量
4. **场所统计表**: 各场所检查次数、隐患数、最近检查时间

### 4.13 pages/knowledge/index — 法规库

1. **头部**: "消防知识库" 标题 + "自动/手动" 更新切换按钮
2. **搜索栏**: 搜索输入框 + 分类下拉筛选
3. **法规列表**: 每个法规卡片含编号、名称、类别标签
4. **浮动按钮**: "+"新增法规按钮
5. **导入弹窗**: 批量导入 JSON 界面

### 4.14 pages/knowledge/detail — 法规详情

1. **头部**: 法规编号(代码字体) + 法规名称 + 分类标签
2. **概述卡片**: 法规概述文字
3. **关键条款**: 条款列表
4. **处罚标准**: 处罚说明

### 4.15 pages/knowledge/editor — 法规编辑

1. **头部**: "法规编辑器" 标题 + 说明
2. **更新通知**: 有更新时显示更新卡片(🔔图标)
3. **表单**: 编号、名称、类别(下拉)、内容(textarea)
4. **操作按钮**: "保存" + "取消"（编辑模式）/"删除"（红色按钮）

### 4.16 pages/building/index — 场所管理

1. **头部**: "🏢 场所管理" 标题 + 说明
2. **当前场所卡片**: 📍图标 + 场所名称 + 地址 + 统计(检查次数/隐患数)
3. **场所列表**: 每个场所含名称、地址、"设为当前"按钮
4. **新增按钮**: 底部浮动 "+" 按钮
5. **表单弹窗**: 新增/编辑场所表单

### 4.17 pages/settings/index — 设置

1. **头部**: "AI服务设置" 标题 + 说明
2. **AI 开关**: 一键开启/关闭 AI 功能的 toggle 卡片
3. **API 配置区**: API Key 输入框、Base URL 输入框、Model 选择、连接测试按钮
4. **深色主题区**: 三态切换(🌞跟随系统 / ☀️浅色 / 🌙深色)
5. **反馈入口**: "📝 反馈收集" 导航按钮
6. **版本信息**: 版本号 + 构建时间

### 4.18 pages/feedback/index — 反馈收集

1. **头部**: "📝 产品反馈" 标题 + 说明
2. **来源选择**: 横向标签(豆包/DeepSeek/Claude Code/真人专家)
3. **评分卡片**: 5 个维度(UI美观度/功能完整度/AI准确度/实用价值/操作流畅度)，每个含 1-5 星
4. **关键发现**: 多选标签(Bug/功能建议/UI问题/数据错误/其他)
5. **文字反馈**: textarea 输入框(至少 50 字)
6. **提交按钮**: 全宽消防红按钮

### 4.19 pages/index/onboarding — 新手引导

1. **全屏覆盖层**: 半透明深色遮罩
2. **跳过按钮**: 右上角 "跳过" 文字按钮
3. **步骤轮播**: 4 步引导页，每页含大图标 + 标题 + 描述，不同渐变色背景
4. **步骤指示器**: 底部圆点
5. **滑动**: 左右滑动切换步骤

---

## 5. 异常场景覆盖

### 5.1 API 级异常

| 场景 | HTTP 状态 | error 字段 | 前端处理 |
|------|-----------|-----------|---------|
| API Key 未配置 | 503 | LLM_API_KEY_NOT_CONFIGURED | 显示配置引导卡片 |
| AI 调用超时 | 408 | AI_TIMEOUT | "AI服务繁忙，请稍后重试" + 重试按钮 |
| AI 调用失败 | 500 | AI_CALL_FAILED | "识别失败，请检查网络" + 重试按钮 |
| 人格底座不可达 | 503 | PE_UNAVAILABLE | 降级为本地缓存/默认数据 |
| 双后端均失败 | 502 | ALL_BACKENDS_FAILED | "服务暂不可用，请检查配置" |
| 文件格式不支持 | 400 | INVALID_FILE_TYPE | "请上传 JPG/PNG 格式图片" |
| 文件过大 | 400 | FILE_TOO_LARGE | "文件超过限制，请压缩后上传" |
| 请求频率限制 | 429 | RATE_LIMITED | "请求过于频繁，请稍后重试" |
| 法规查询无结果 | 200 | laws:[] | "未找到相关法规" 空状态 |
| JSON 解析失败 | 500 | PARSE_ERROR | 返回默认空数据 |

### 5.2 页面级异常

| 页面 | 加载中 | 空数据 | 失败 | 断网 |
|------|:--:|:--:|:--:|:--:|
| 首页 | 骨架屏 | N/A (静态内容) | Toast提示 | 顶部红色离线Banner |
| 拍照检查 | 按钮Loading | N/A | 上传失败提示 | 本地缓存图片 |
| 分析中 | spinner动画 | N/A | 错误卡片+重试 | 提示"需要网络" |
| 识别结果 | 骨架屏 | N/A | 错误卡片+重试 | 本地暂存结果 |
| 视频检查 | 进度条 | N/A | 错误卡片+重试 | 提示"需要网络" |
| AI专家 | 气泡脉冲动画 | "开始提问吧" | 502降级提示 | Toast"网络不可用" |
| 快速检查 | 骨架屏 | "暂无可用的检查模板" | 重试按钮 | 本地执行 |
| 法规库 | 骨架屏列表 | "未找到相关法规" | Toast提示 | 离线可用(PWA缓存) |
| 历史报告 | 骨架屏列表 | "暂无检查报告" | Toast提示 | 本地缓存数据 |
| 统计看板 | 骨架屏卡片 | "暂无统计数据" | Toast提示 | 本地缓存数据 |
| 场所管理 | 骨架屏 | "暂无场所，点击添加" | Toast提示 | 本地缓存 |
| 设置 | N/A | N/A | 保存失败Toast | 本地存储 |
| 反馈 | N/A | 占位文字 | 提交失败+保留内容 | 本地队列暂存 |
| 新手引导 | N/A | N/A | N/A | N/A |

---

## 6. 构建与部署

| 目标 | 命令 | 输出 |
|------|------|------|
| 预构建检查 | `node scripts/prebuild-check.js` | 5/5 项通过 |
| H5 构建 | `npm run build:h5` | dist/build/h5/ |
| Android 构建 | `npm run build:app-android` | APK |
| iOS 构建 | `npm run build:app-ios` | IPA |
| 演示模式 | `demo.bat` / `bash demo.sh` | 端口 8080 |
| 开发服务器 | `npm run dev:h5` | 端口 8000 |
| Docker | `docker-compose up -d` | 端口 8080 |