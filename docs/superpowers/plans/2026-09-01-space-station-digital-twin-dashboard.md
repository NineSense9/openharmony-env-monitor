# 太空空间站舱内环境监测数字孪生大屏实施计划 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 React 18 + TypeScript + Vite + Tailwind CSS + ECharts 5 + Framer Motion 构建工业级、去 AI 通用塑料感、具备断连容错与双向硬件联动的太空空间站环境数字孪生可视化大屏。

**Architecture:** 采用原子化组件分层，数据层通过 `useTelemetry` 封装 1.5s 周期性轮询与快照容错状态机，表现层由 HUD Header、四路传感指标、2D/3D 核心舱蓝图风机联动、ECharts 双轴趋势与双向控制台组成。

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v4, ECharts 5, Framer Motion, Lucide React, Web Audio API.

---

### Task 1: 初始化 React 18 + TypeScript + Vite 工程结构与依赖配置

**Files:**
- Create: `workspace/frontend_react/package.json`
- Create: `workspace/frontend_react/vite.config.ts`
- Create: `workspace/frontend_react/tsconfig.json`
- Create: `workspace/frontend_react/index.html`
- Create: `workspace/frontend_react/src/main.tsx`
- Create: `workspace/frontend_react/src/index.css`

- [ ] **Step 1: 创建 package.json 与依赖列表**
- [ ] **Step 2: 创建 vite.config.ts 与 Tailwind / PostCSS 配置**
- [ ] **Step 3: 安装依赖并验证 `npm run build` 通过**
- [ ] **Step 4: Commit**

---

### Task 2: 建立核心类型定义与通信引擎 (Telemetry & Snapshot Engine)

**Files:**
- Create: `workspace/frontend_react/src/types/telemetry.ts`
- Create: `workspace/frontend_react/src/services/api.ts`
- Create: `workspace/frontend_react/src/hooks/useTelemetry.ts`
- Create: `workspace/frontend_react/src/hooks/useAudioFeedback.ts`

- [ ] **Step 1: 定义 `TelemetryData`, `TelemetryHistoryItem`, `RemoteCommand`, `AlarmState` TypeScript 强类型接口**
- [ ] **Step 2: 实现 `api.ts` 封装 Axios/Fetch 请求（支持超时设置与错误捕获）**
- [ ] **Step 3: 实现 `useTelemetry.ts`：1.5s 实时轮询、3.5s 历史拉取、失锁快照状态机与静默重连**
- [ ] **Step 4: 实现 `useAudioFeedback.ts`：基于 Web Audio API 实现专业克制的点击音与告警音**
- [ ] **Step 5: Commit**

---

### Task 3: 研发 HUD 顶部航天信息栏 (HudHeader) 与四路传感指标卡片 (SensorGrid)

**Files:**
- Create: `workspace/frontend_react/src/components/HudHeader.tsx`
- Create: `workspace/frontend_react/src/components/SensorCard.tsx`
- Create: `workspace/frontend_react/src/components/SensorGrid.tsx`

- [ ] **Step 1: 构建 `HudHeader.tsx`：BJT/UTC 毫秒对齐时钟、板端 IP `192.168.9.51`、`[LIVE LINK]` / `[LINK LOST]` 状态徽章**
- [ ] **Step 2: 构建 `SensorCard.tsx`：等宽数据排版（`tabular-nums`）、1px 细线标尺刻度、物理通道标注（`I2C0@0x44` / `ADC_CH2`）、失锁 `[CACHED]` 标记**
- [ ] **Step 3: 构建 `SensorGrid.tsx` 整合温度、湿度、光照、烟雾四路卡片**
- [ ] **Step 4: Commit**

---

### Task 4: 研发核心舱 2D 数字孪生蓝图与风机物理动效 (CabinTwin)

**Files:**
- Create: `workspace/frontend_react/src/components/CabinTwin.tsx`
- Create: `workspace/frontend_react/src/components/AirflowCanvas.tsx`

- [ ] **Step 1: 构建 `CabinTwin.tsx` 矢量空间站剖面（睡眠区、实验区、环控生保区）与传感器安装点状态光晕**
- [ ] **Step 2: 构建 `AirflowCanvas.tsx`：Canvas 空气流动粒子模拟，与电机启停状态同步加减速**
- [ ] **Step 3: 实现电机扇叶 60fps 动态旋转与转速指示**
- [ ] **Step 4: Commit**

---

### Task 5: 研发 ECharts 多维时序走势图表 (TelemetryChart)

**Files:**
- Create: `workspace/frontend_react/src/components/TelemetryChart.tsx`

- [ ] **Step 1: 构建 `TelemetryChart.tsx` 支持温湿度双 Y 轴趋势与烟雾/光照时序切换**
- [ ] **Step 2: 配置去 AI 化的深空暗色网格与平滑渐变面积填充**
- [ ] **Step 3: 接入动态 Resize 监听与数据实时平滑流更新**
- [ ] **Step 4: Commit**

---

### Task 6: 研发远程执行器控制台 (ControlPanel) 与实时事件日志流水 (EventFeed)

**Files:**
- Create: `workspace/frontend_react/src/components/ControlPanel.tsx`
- Create: `workspace/frontend_react/src/components/EventFeed.tsx`

- [ ] **Step 1: 构建 `ControlPanel.tsx`：排风电机机械质感开关（`POST /api/command`）、应急消警静音按钮（`action: ack`）、防重放 Loading 状态**
- [ ] **Step 2: 构建 `EventFeed.tsx`：滚动展示报文入库、控制台下发记录与越限告警**
- [ ] **Step 3: Commit**

---

### Task 7: 组装 App 主视口与构建云端自动化挂载

**Files:**
- Create: `workspace/frontend_react/src/App.tsx`
- Modify: `cloud_ecs/app/main.py`
- Test: 全链路端云联调（点击大屏电机开关 -> 观察真机电机旋转与 ACK 回执）

- [ ] **Step 1: 在 `App.tsx` 中组装完整大屏布局，配置全局背景网格与告警呼吸边框**
- [ ] **Step 2: 执行 `npm run build` 生成生产级静态资源 `dist/`**
- [ ] **Step 3: 部署静态资源至百度云 BCC `180.76.137.117:8000` 并通过公网访问验证**
- [ ] **Step 4: Commit & Push**
