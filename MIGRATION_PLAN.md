# Automa React+TypeScript 迁移 + Agent API 改造方案

## 一、项目现状分析

### 代码规模
- 总代码: ~109K LOC, 759 源文件
- Vue 组件: 215 个 (.vue, 35K LOC) — **当前生产代码**
- React TSX: 189 个 (.tsx, 15K LOC) — **已开始但未接入构建**
- JS: 217 个 (.js, 26K LOC) — 核心引擎 + 工具
- TS: 138 个 (.ts, 18K LOC) — 部分迁移

### 技术栈
- 构建: Webpack 5 (自定义配置)
- 前端框架: Vue 3 (Options + Composition API) → 目标 React 18 + TypeScript
- 状态管理: Pinia (Vue) → Zustand (React)
- 路由: vue-router → react-router-dom
- 国际化: vue-i18n → react-i18next
- UI: Tailwind CSS 3
- 数据库: Dexie (IndexedDB)
- 浏览器 API: webextension-polyfill

### 迁移状态评估
TSX 文件现状:
- UI 组件 (25个): 质量最高，基本可用，需要小调整
- Block 组件: 有大量 TODO，Handle/Position 未接入 react-flow
- Page 组件: 框架搭好但 store/router 未替换
- Content 组件: import 全部注释掉了
- **结论: ~30% 完成度，核心逻辑(workflow engine)未触碰**

## 二、改造策略: 渐进式 + Agent-First

### 核心原则
1. **workflow engine 不动** — 它是纯 JS 逻辑，不依赖 Vue/React，保持 .js
2. **UI 层 Vue→React** — 组件层面迁移
3. **新增 Agent API 层** — 这是本次最关键的新增能力
4. **Webpack 配置适配** — 让 .tsx 和 .vue 共存，逐步替换入口

### 分层架构
```
┌─────────────────────────────────────────────┐
│  Agent API Layer (NEW)                       │
│  - WebSocket Server (Native Messaging)       │
│  - REST API (localhost:8528)                 │
│  - Hermes ↔ Automa 双向通信                  │
├─────────────────────────────────────────────┤
│  Background Service Worker                   │
│  - MessageListener (现有)                    │
│  - AgentBridge (NEW: 外部命令接入)           │
│  - BackgroundWorkflowUtils (现有)            │
├─────────────────────────────────────────────┤
│  Workflow Engine (不变)                       │
│  - WorkflowEngine.js                         │
│  - WorkflowWorker.js                         │
│  - 40+ blocksHandler                         │
│  - WorkflowManager                           │
├─────────────────────────────────────────────┤
│  UI Layer (Vue → React)                      │
│  - Dashboard (newtab)                        │
│  - Popup                                     │
│  - Workflow Editor                           │
│  - Element Selector                          │
├─────────────────────────────────────────────┤
│  Content Scripts (保持 JS)                    │
│  - blocksHandler (页面操作)                   │
│  - recordWorkflow                            │
│  - elementSelector                           │
└─────────────────────────────────────────────┘
```

## 三、Agent API 设计 (核心新增)

### 3.1 通信方式: Chrome Extension External Messaging + WebSocket

#### 方式1: Native Messaging (推荐)
Hermes Agent → Native Messaging Host → Chrome Extension Background

```json
// native-messaging-host.json (注册到 Chrome)
{
  "name": "com.hermes.automa_agent",
  "description": "Hermes RPA Agent Bridge",
  "path": "/path/to/automa-agent-bridge",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://EXTENSION_ID/"]
}
```

#### 方式2: WebSocket Bridge (更灵活)
Hermes Agent → WebSocket → Bridge Server → Chrome Extension

```
Hermes (Python/CLI)
    ↓ HTTP/WebSocket
AutomaAgentServer (localhost:8528)
    ↓ chrome.runtime.sendMessage
Extension Background
    ↓ WorkflowManager
Workflow Execution
    ↓ results
Hermes (回传)
```

### 3.2 Agent API 接口定义

```typescript
// Agent → Automa 命令
interface AgentCommand {
  id: string;              // 请求 ID
  action: string;          // 命令类型
  payload: any;            // 命令参数
  timeout?: number;        // 超时 (ms)
}

// 支持的命令:
// workflow:list        — 列出所有工作流
// workflow:execute     — 执行指定工作流 {workflowId, variables?}
// workflow:stop        — 停止执行 {stateId}
// workflow:status      — 查询执行状态 {stateId}
// workflow:create      — 创建新工作流 {name, drawflow, settings}
// workflow:import      — 导入工作流 JSON
// workflow:export      — 导出工作流 JSON {workflowId}
// recording:start      — 开始录制
// recording:stop       — 停止录制
// tab:open             — 打开新标签 {url}
// tab:list             — 列出所有标签
// data:get             — 获取抓取的数据 {logId}
// storage:query        — 查询存储数据
// health               — 健康检查

// Automa → Agent 响应/事件
interface AgentResponse {
  id: string;              // 对应请求 ID
  success: boolean;
  data?: any;
  error?: string;
}

interface AgentEvent {
  event: string;           // 事件类型
  data: any;
  timestamp: string;
}

// 事件类型:
// workflow:started      — 工作流开始执行
// workflow:completed    — 工作流执行完成 (含数据)
// workflow:error        — 工作流执行出错
// workflow:log          — 工作流日志
// data:extracted        — 数据抓取完成
```

## 四、实施计划 (分4个Phase)

### Phase 1: Agent API 基础设施 (优先级最高)
1. 创建 `src/agent/` 模块
   - `AgentBridge.ts` — 核心桥接类
   - `AgentWebSocketServer.ts` — WebSocket 服务端
   - `AgentNativeMessaging.ts` — Native Messaging 处理
   - `AgentCommandHandler.ts` — 命令路由和执行
   - `types.ts` — TypeScript 类型定义
2. 修改 `background/index.js` 注册 Agent 消息处理
3. 创建 `automa-agent-bridge` Node.js CLI (Native Messaging Host)
4. 修改 manifest 添加权限

### Phase 2: Webpack + 构建系统适配
1. webpack.config.js 添加 .tsx 入口支持
2. 配置 babel-loader 处理 JSX/TSX
3. 让 React 和 Vue 组件在同一构建中共存
4. tsconfig.json 启用 jsx: "react-jsx"

### Phase 3: UI 迁移 (渐进式)
1. 先迁移 Popup (最小表面积)
2. 再迁移 Newtab Dashboard
3. 最后迁移 Workflow Editor (最复杂)
4. Content Scripts 最后处理

### Phase 4: Hermes Skill 集成
1. 创建 `rpa-automa-agent` Hermes Skill
2. 实现 Hermes → Automa 调用链
3. 录制流程 → 记忆 → 自动回放
4. 定时任务 (cronjob) 驱动 RPA

## 五、关键文件改造清单

### 新增文件
```
src/agent/                          # Agent API 模块 (NEW)
  ├── types.ts                      # 类型定义
  ├── AgentBridge.ts                # 核心桥接
  ├── AgentWebSocketServer.ts       # WS 服务
  ├── AgentCommandHandler.ts        # 命令处理
  └── AgentEventEmitter.ts          # 事件推送

src/agent-bridge/                   # Native Messaging Host (NEW)
  ├── index.ts                      # CLI 入口
  ├── server.ts                     # HTTP/WS 服务
  └── protocol.ts                   # 协议处理

scripts/
  └── register-native-host.sh       # 注册脚本
```

### 修改文件
```
src/background/index.js             # 添加 agent 消息路由
src/manifest.chrome.json            # 添加 nativeMessaging 权限
webpack.config.js                   # 添加 .tsx 构建支持
tsconfig.json                       # 启用 JSX
package.json                        # 添加新依赖
```

## 六、Hermes RPA 调用流程

```
用户说: "帮我从领星抓取最近7天的订单数据"
    ↓
Hermes Agent (理解意图)
    ↓
加载 rpa-automa-agent skill
    ↓
检查 Automa 是否有 "领星-订单抓取" 工作流
    ↓ 有
调用 AgentBridge.executeWorkflow({
  workflowId: "lingxing-orders",
  variables: { dateRange: "7d" }
})
    ↓
Automa 执行录制好的工作流
    ↓
  1. 打开领星 ERP
  2. 登录 (使用保存的 cookies)
  3. 导航到订单页面
  4. 设置日期筛选
  5. 遍历分页抓取数据
    ↓
数据回传给 Hermes
    ↓
Hermes 处理/分析/存储数据
    ↓
返回结果给用户
```
