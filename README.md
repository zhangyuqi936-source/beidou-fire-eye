# 北斗火眼·消防智查 v3.0

> AI 驱动的消防安全智能检查 H5 应用  
> 拍照识别隐患 · 自动匹配法规 · 一键生成整改报告

---

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式 (H5, 端口 8000)
npm run dev:h5

# 生产模式 (先构建再启动服务器)
npm run build:h5
node server.cjs

# 一键演示
demo.bat    # Windows
bash demo.sh  # macOS/Linux
```

浏览器打开 `http://localhost:8080`

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | uni-app 3.0 + Vue 3 Composition API |
| 构建工具 | Vite 5 + SCSS |
| 后端 | Node.js 原生 http (server.cjs) |
| AI 引擎 | BDHY-Hybrid Hazard Recognition v1 |
| AI 接口 | DeepSeek Vision + LLM |
| 法规匹配 | mxbai-embed 向量检索 + 规则兜底 |

## 核心能力

- **拍照检查**：6 步识别管线（场景分类→三层视觉检测→分类映射→风险量化→法规匹配→报告生成）
- **风险量化**：S×L×D 三维矩阵，64 种组合 → I/II/III/IV 四级风险
- **法规匹配**：GB 35181-2025 分类树 + 语义向量检索 + 规则关键词兜底
- **四级降级**：L0 全功能 → L1 规则增强 → L2 离线本地 → L3 手动辅助
- **PWA 离线**：Service Worker 缓存 + 离线降级提示
- **深色主题**：三态切换（跟随系统/浅色/深色）

## 项目结构

```
├── pages/           # 19 个页面组件
│   ├── index/       # 首页 + 新手引导
│   ├── inspect/     # 拍照/视频/分析/结果/工单
│   ├── check/       # 快速检查
│   ├── report/      # 报告详情/历史/统计
│   ├── knowledge/   # 法规库
│   ├── expert/      # AI 专家
│   ├── building/    # 场所管理
│   ├── settings/    # 设置
│   └── feedback/    # 反馈收集
├── utils/           # 30+ 工具模块 (含 7 个算法核心)
├── data/            # JSON 数据文件
├── static/          # 静态资源 + PWA
├── server.cjs       # Node.js 后端 (含完整算法引擎)
└── docs/            # 规范文档
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | 8080 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | (空=Demo模式) |
| `DEEPSEEK_BASE_URL` | API 地址 | https://api.deepseek.com |
| `PE_URL` | 人格底座地址 | http://localhost:3100 |

## Docker

```bash
docker-compose up -d
```

## 验证清单

- [x] 52 个核心文件全部生成
- [x] server.cjs 含 8 个算法函数
- [x] 6 步识别管线完整实现
- [x] law-db.json ≥8 条法规
- [x] 19 个页面四态处理
- [x] 风险等级四级色标
- [x] meta.chain 链路可视化
- [x] L0-L3 四级降级策略
