# 北斗火眼·消防智查 v3.0 — AI 开发施工指令 (input-v3)

> **对标**: 暖守 input.md | **版本**: v3.0 | **日期**: 2026-06-27  
> **目标**: 基于 spec-v3.md + design-v3.md，一次性生成完整项目，一遍跑通

---

## 0. 给 AI 的总体说明

**你是 Codex，正在执行北斗火眼·消防智查 v3.0 的完整项目生成。**

### 0.1 项目技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | uni-app | 3.0.0-alpha |
| UI 框架 | Vue 3 (Composition API) | 3.4.21 |
| 构建工具 | Vite | 5.x |
| CSS 预处理 | SCSS (Sass) | 1.70 |
| 后端运行时 | Node.js 原生 http | ≥18 |
| AI 接口 | DeepSeek API (OpenAI 兼容) | - |

### 0.2 项目路径

```
c:/Users/张珘/Desktop/CC/extracted_src/
```

### 0.3 参考文档（生成前必须阅读）

| 文档 | 路径 | 说明 |
|------|------|------|
| 需求规格 | docs/spec-v3.md | 数据模型 + 算法模型(§2.5, 必读) + API 契约 + UI 规格 + 异常场景 |
| 实现设计 | docs/design-v3.md | 架构图 + 算法层架构(§3, 必读) + 完整数据流(§6) + 跳转流程 |
| 算法白皮书 | docs/北斗火眼·隐患识别混合算法框架_v1.md | 算法设计全文（文献支撑、Prompt工程、三维矩阵、法规库、验证清单） |
| 开发规范 | DEVELOPMENT.md | 铁律 + 编码规范 + 故障排查 |

---

## 1. 文件生成顺序（必须严格遵守）

> **算法层约束（最高优先级）**：生成 `server.cjs` 和 `utils/` 下的核心模块时，必须以 spec-v3 §2.5 的算法模型为强制规格，以 design-v3 §3 的算法层架构为实现蓝图。不得将识别链路简化为「拍照→调DeepSeek→吐JSON」的薄封装。

```
第一步：基础设施 (6 个文件)
  ├── static/theme.scss          ← 全局 SCSS Token + Mixin (~18KB)
  ├── uni.scss                   ← uni-app 全局样式入口
  ├── static/critical.css        ← 首屏关键 CSS
  ├── static/dark-mode.css       ← 深色主题独立样式
  ├── static/manifest.json       ← PWA 清单
  └── static/sw.js               ← Service Worker

第二步：骨架文件 (7 个文件)
  ├── index.html                 ← H5 入口 HTML
  ├── main.js                    ← uni-app 入口 JS
  ├── App.vue                    ← 根组件
  ├── pages.json                 ← 路由 + TabBar 配置
  ├── manifest.json              ← uni-app 应用清单
  ├── vite.config.js             ← Vite 构建配置
  └── package.json               ← 依赖 + 脚本

第三步：数据文件 (5 个文件)
  ├── data/law-db.json           ← ≥8 条预置消防法规
  ├── data/demo-reports.json     ← 3 份模拟检查报告
  ├── data/demo-statistics.json  ← 模拟统计数据
  ├── data/feedback.json         ← 3 条预置反馈
  └── data/memory-graph-default.json ← 行业知识图谱

第四步：服务端 (1 个文件)
  └── server.cjs                 ← Node.js 后端（含完整6步识别编排 + 降级决策）

第五步：算法核心模块 (7 个文件，严格按依赖顺序)
  ├── utils/hazard-taxonomy.js   ← GB 35181-2025 分类树（无外部依赖）
  ├── utils/scene-classifier.js  ← 8类场所识别规则词典
  ├── utils/risk-engine.js       ← S×L×D 三维风险量化（依赖 hazard-taxonomy）
  ├── utils/regulation-matcher.js ← mxbai-embed 语义检索 + 规则关键词兜底（依赖 law-db.json）
  ├── utils/degradation-manager.js ← L0→L3 四级降级决策引擎
  ├── utils/hazard-law-matcher.js ← 隐患-法规匹配封装（依赖 regulation-matcher）
  └── utils/feedback-loop.js     ← 人工复核反馈聚合（v1 数据模型）

第六步：通用工具模块 (8 个文件)
  ├── utils/api-client.js        ← API 调用客户端
  ├── utils/ai-service.js        ← AI 服务封装
  ├── utils/theme-manager.js     ← 主题管理器
  ├── utils/error-handler.js     ← 全局错误处理
  ├── utils/loading-service.js   ← 加载状态管理
  ├── utils/storage.js           ← 本地存储封装
  ├── utils/report-generator.js  ← 报告生成器
  └── utils/chain-visualizer.js  ← meta.chain 链路可视化工具

第七步：页面组件 (19 个 .vue 文件，按 TAB 页优先→核心路径→功能页顺序)
  ├── pages/index/index.vue      ← 首页 (TAB)
  ├── pages/report/history.vue   ← 历史报告 (TAB)
  ├── pages/knowledge/index.vue  ← 法规库 (TAB)
  ├── pages/building/index.vue   ← 场所管理 (TAB)
  ├── pages/settings/index.vue   ← 设置 (TAB)
  ├── pages/inspect/capture.vue  ← 拍照检查 (核心路径1)
  ├── pages/inspect/analyzing.vue ← AI分析中 (核心路径1，含chain动画)
  ├── pages/inspect/result.vue   ← 识别结果 (核心路径1，含meta.chain + 风险可视化)
  ├── pages/inspect/video.vue    ← 视频检查 (核心路径2)
  ├── pages/inspect/workorder.vue ← 巡检工单
  ├── pages/expert/chat.vue      ← 消防AI专家
  ├── pages/check/check.vue      ← 快速检查
  ├── pages/check/result.vue     ← 快速检查结果
  ├── pages/report/detail.vue    ← 报告详情（含风险等级色标）
  ├── pages/report/statistics.vue ← 统计看板
  ├── pages/knowledge/detail.vue ← 法规详情
  ├── pages/knowledge/editor.vue ← 法规编辑
  ├── pages/feedback/index.vue   ← 反馈收集（含人工复核接口）
  └── pages/index/onboarding.vue ← 新手引导

第八步：辅助文件
  ├── docs/*.md                  ← 文档
  ├── scripts/*.js               ← 脚本
  ├── Dockerfile                 ← Docker 构建
  ├── docker-compose.yml         ← Docker 编排
  ├── demo.bat / demo.sh         ← 一键演示
  └── README.md                  ← 项目说明
```

---

## 2. 每步验收标准

### 第一步验收 — 基础设施

```bash
# 验收命令
node -e "const sass=require('sass');sass.compile('static/theme.scss');console.log('SCSS OK')"
node -e "require('./static/manifest.json'); console.log('manifest OK')"
node -e "const fs=require('fs');const s=fs.readFileSync('static/sw.js','utf-8');if(s.includes('CACHE_VERSION'))console.log('SW OK')"
```

**通过标准**: 以上 3 条全部输出 OK，无报错

### 第二步验收 — 骨架文件

```bash
node -e "require('./pages.json'); console.log('pages.json OK')"
node -e "require('./manifest.json'); console.log('manifest.json OK')"
node -e "require('./package.json'); console.log('package.json OK')"
```

**通过标准**: 3 个 OK

### 第三步验收 — 数据文件

```bash
node -e "const d=require('./data/law-db.json');console.log('laws:',(d.laws||[]).length+(d.customLaws||[]).length)"
node -e "const d=require('./data/demo-reports.json');console.log('reports:',d.length)"
node -e "const d=require('./data/demo-statistics.json');console.log('stats: checks=',d.totalChecks)"
node -e "const d=require('./data/feedback.json');console.log('feedback:',d.length)"
node -e "const d=require('./data/memory-graph-default.json');console.log('nodes:',d.nodes.length)"
```

**通过标准**: laws≥8, reports=3, checks>0, feedback=3, nodes>0

### 第四步验收 — 服务端 + 算法编排

```bash
node -c server.cjs && echo "Syntax OK"
# 额外验证：server.cjs 中必须包含以下函数名
node -e "const s=require('fs').readFileSync('server.cjs','utf-8');const f=['recognizeImage','sceneClassify','runDetectionPipeline','mapToTaxonomy','quantifyRisk','matchRegulation','generateReport','applyDegradation'];const m=f.filter(n=>s.includes(n));console.log('算法函数覆盖:',m.length+'/'+f.length);if(m.length<f.length)console.log('缺失:',f.filter(n=>!s.includes(n)))"
```

**通过标准**: 语法通过 + 算法函数覆盖 8/8

### 第五步验收 — 算法核心模块

```bash
node -c utils/hazard-taxonomy.js && echo "taxonomy OK"
node -c utils/scene-classifier.js && echo "scene OK"
node -c utils/risk-engine.js && echo "risk OK"
node -c utils/regulation-matcher.js && echo "matcher OK"
node -c utils/degradation-manager.js && echo "degradation OK"
node -c utils/hazard-law-matcher.js && echo "law-match OK"
node -c utils/feedback-loop.js && echo "feedback OK"
```

**通过标准**: 7 个全部 OK

### 第六步验收 — 通用工具

```bash
node -c utils/api-client.js && echo "OK"
node -c utils/ai-service.js && echo "OK"
node -c utils/chain-visualizer.js && echo "OK"
```

**通过标准**: 每个模块语法检查通过

### 第七步验收 — 页面组件

```bash
# 构建测试
npm run build:h5
```

**通过标准**: `DONE Build complete.` 无报错

### 第八步验收 — 完整验证

```bash
# 1. 预构建检查
node scripts/prebuild-check.js
# 必须输出: 全部检查通过

# 2. 启动服务
npm run dev:h5
# 浏览器打开 http://localhost:8000
# 确认: 首页完整渲染，中文正常

# 3. 遍历页面
# 确认 19 个页面全部可访问，无白屏/报错
```

---

## 3. 特别警告 — 5 条不可违反的铁律

### ⚠️ 铁律 1: 修改前先清缓存

```
每次构建或启动前必须执行:
  删除 node_modules/.vite/
  删除 dist/
  删除 unpackage/
```

**违反后果**: 白屏 / 旧代码被执行 / 修改无效

### ⚠️ 铁律 2: 禁止 HTML 注释中包含 `<script>` 标签

```html
<!-- ❌ 绝对禁止 -->
<!-- <script>...</script> -->

<!-- ✅ 正确的注释 -->
<!-- 这是普通文字注释 -->
```

**违反后果**: uni-app parse5 解析器崩溃 → 白屏 ("eof-in-comment" 错误)

### ⚠️ 铁律 3: 所有文件 UTF-8 无 BOM

```
文件头 3 字节 ≠ EF BB BF
```

**检测方法**:
```bash
node -e "const fs=require('fs');const b=fs.readFileSync('target.vue');if(b[0]===0xEF&&b[1]===0xBB&&b[2]===0xBF)console.log('HAS BOM!')"
```

**违反后果**: 中文乱码/问号方块

### ⚠️ 铁律 4: SCSS 属性间必须加分号

```scss
/* ❌ 禁止 */
padding-bottom:80px overflow-x: hidden;

/* ✅ 正确 */
padding-bottom:80px;
overflow-x: hidden;
```

**违反后果**: SCSS 编译失败 → 样式缺失 → 页面崩坏

### ⚠️ 铁律 5: JSON 语法完整，禁止多余逗号/括号

```json
/* ❌ 禁止 */
},},},

/* ✅ 正确 */
},
```

**违反后果**: pages.json 解析失败 → uni-app 路由系统崩溃 → 所有页面无法渲染

---

## 4. 编码规范速查

### 4.1 文件编码
- **所有** `.vue` `.json` `.js` `.cjs` `.scss` `.css` `.html` `.md`: UTF-8 without BOM
- 中文直接书写，不使用 `\uXXXX` 转义

### 4.2 SCSS 规范
- 属性间必须有分号
- 引用路径: `@import '~@/static/theme.scss';`
- 页面样式: `<style scoped lang="scss">`
- 变量命名: 小写 + 连字符 (`$brand-red-primary`)
- Mixin 命名: 小写 + 连字符 (`@mixin card-base`)

### 4.3 Vue 模板规范
- uni-app 使用 `<view>` `<text>` 而非 `<div>` `<span>`
- 事件绑定: `@click` (非 `@tap`)
- 条件渲染: `v-if` `v-else-if` `v-else`
- 列表渲染: `v-for="(item, index) in list" :key="item.id"`

### 4.4 JavaScript 规范
- 模块导入: `import { ref } from 'vue'`
- uni-app API: `uni.navigateTo({ url: '/pages/...' })`
- 工具引用: `import { showLoading } from '@/utils/loading-service.js'`
- 页面脚本: `<script setup>` (Composition API)

### 4.5 页面根容器规范 (每个 .vue 必须)

```scss
.page {
  min-height: 100vh;
  background: $bg-page;
  overflow-x: hidden;
  max-width: 100vw;
  box-sizing: border-box;
}
```

### 4.6 页面四态规范 (每个 .vue 必须处理)

```vue
<view v-if="loading" class="skeleton"><!-- 骨架屏 --></view>
<view v-else-if="error" class="error-card"><!-- 错误提示 --></view>
<view v-else-if="isEmpty" class="empty-state"><!-- 空状态 --></view>
<view v-else><!-- 正常内容 --></view>
```

---

## 5. 生成策略

### 5.1 一次性生成 vs 分批生成

**本指令要求一次性生成全部 52 个文件。**

原因：
- Spec 和 Design 已完整定义所有细节（含算法层 spec-v3 §2.5 + design-v3 §3）
- 每个文件的输入/输出/依赖已明确
- 避免增量修改引入语法错误
- **关键**：server.cjs 的识别管线必须按 spec-v3 §2.5 的6步编排执行，不得简化为薄封装

### 5.2 如果某个文件生成失败

1. 不要跳过，修复后继续
2. 修复后重新验证该步骤的所有验收标准
3. 修复完成后清除 Vite 缓存和 dist 目录

### 5.3 验收闭环

```
生成文件 → 验证语法 → 清除缓存 → 构建 → 启动服务 → 浏览器确认
   ↑                                                        │
   └──────────────── 失败则修复 ←────────────────────────────┘
```

---

## 6. 本地验证命令速查

```bash
# 安装依赖
npm install

# 清除缓存
rm -rf node_modules/.vite dist unpackage

# 预构建检查 (5项)
node scripts/prebuild-check.js

# 语法检查
node -c server.cjs

# H5 构建
npm run build:h5

# 开发服务器
npm run dev:h5

# 生产服务器 (需先 build)
node server.cjs

# BOM 扫描
node -e "const fs=require('fs');function scan(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=d+'/'+f.name;if(f.isDirectory()&&!f.name.startsWith('.')&&f.name!=='node_modules'&&f.name!=='dist')scan(p);else if(f.name.match(/\.(vue|json|js|cjs|scss|css|html|md)$/)){const b=fs.readFileSync(p);if(b[0]===0xEF&&b[1]===0xBB&&b[2]===0xBF)console.log('BOM:',p)}}}scan('.')"
```