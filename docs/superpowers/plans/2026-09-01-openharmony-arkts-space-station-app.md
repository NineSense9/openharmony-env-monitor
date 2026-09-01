# OpenHarmony ArkTS 太空空间站掌上测控终端 APP 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建标准 OpenHarmony ArkTS Stage 模型太空空间站移动端 APP，实现 300ms 极速遥测流渲染、2x2 毛玻璃环境感知矩阵、双向控制闭环（<240ms）与 6 位安全 PIN 码验证，支持 DevEco Studio 模拟器 / Previewer 一键运行。

**Architecture:** 基于 OpenHarmony 标准 Stage 模型，使用声明式 ArkUI 构建航天 HUD 界面，通过 `@ohos.net.http` 直连百度云 BCC 遥测微服务，使用原生 Canvas 渲染多维时序走势，支持 Hvigor 命令行与 DevEco Studio 双向构建。

**Tech Stack:** OpenHarmony ArkTS (API 9/10/11/12), ArkUI (Stage Model), @ohos.net.http, Canvas 2D, DevEco Studio 5.0+/6.1, Hvigor, Ohpm.

---

### Task 1: 脚手架工程结构与配置文件初始化
- [ ] 创建 `app/AppScope/app.json5` 与全局应用资源；
- [ ] 创建 `app/build-profile.json5` 与 `app/hvigorfile.ts`；
- [ ] 创建 `app/oh-package.json5` 与 `app/entry/build-profile.json5`；
- [ ] 创建 `app/entry/src/main/module.json5` 并声明网络访问权限 `ohos.permission.INTERNET`；
- [ ] 生成应用图标与基础色彩资源（`color.json`、`string.json`）。

### Task 2: 基础通用模块与数据模型层开发
- [ ] 编写 `app/entry/src/main/ets/common/Constants.ets`（云端接口常量、告警阈值、调色板）；
- [ ] 编写 `app/entry/src/main/ets/model/TelemetryModel.ets`（`TelemetryData`、`CommandPayload`、`EventItem` 实体类）；
- [ ] 编写 `app/entry/src/main/ets/common/HttpUtil.ets`（基于 `@ohos.net.http` 封装 GET/POST 请求与网络容错）；
- [ ] 编写 `app/entry/src/main/ets/viewmodel/StationViewModel.ets`（响应式数据流、300ms 轮询、心跳超时与失锁快照判定）。

### Task 3: 核心 UI 组件开发
- [ ] 编写 `app/entry/src/main/ets/components/StationHeader.ets`（航天 HUD 顶栏、空间站代号、UTC/BJT 动态时钟、`[LIVE LINK]` 呼吸灯）；
- [ ] 编写 `app/entry/src/main/ets/components/SensorCard.ets`（拟态毛玻璃卡片、等宽数值排版、超标呼吸光晕、`[CACHED]` 快照提示）；
- [ ] 编写 `app/entry/src/main/ets/components/PinVerifyDialog.ets`（6 位安全 PIN 码 `123456` 验证弹窗与暗文保护）；
- [ ] 编写 `app/entry/src/main/ets/components/ControlSection.ets`（排风电机物理状态卡片、应急消警静音按钮）；
- [ ] 编写 `app/entry/src/main/ets/components/TrendChart.ets`（Canvas 2D 原生多维时序走势折线图与标尺）；
- [ ] 编写 `app/entry/src/main/ets/components/EventLogView.ets`（实时系统事件动态流）。

### Task 4: 主页面集成与 EntryAbility 生命周期组装
- [ ] 编写 `app/entry/src/main/ets/pages/Index.ets`（整合全套组件、下拉手动刷新、自适应滚动容器）；
- [ ] 编写 `app/entry/src/main/ets/entryability/EntryAbility.ets`（应用生命周期加载与全屏沉浸式状态栏配置）。

### Task 5: 自动化构建、验证与交付
- [ ] 使用 `D:\DevEco Studio\tools\node\node.exe` 与 `ohpm` 进行依赖检查与代码校验；
- [ ] 验证端云极速通信与安全 PIN 码闭环；
- [ ] 输出 DevEco Studio 导入与模拟器/Previewer 运行指导文档；
- [ ] 全量提交与推送至 GitHub。
