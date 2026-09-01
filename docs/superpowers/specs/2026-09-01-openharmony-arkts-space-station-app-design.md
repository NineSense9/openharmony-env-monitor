# OpenHarmony ArkTS 太空空间站掌上测控终端 APP 设计规格

## 1. 概述与背景

本项目为沈阳航空航天大学 2026 年生产实习（软通动力 OpenHarmony 方向）北向核心成果——**太空空间站舱内环境监测掌上测控终端（HarmonyOS 原生 ArkTS 移动端 APP）**。

APP 基于 OpenHarmony 官方推荐的 **ArkTS + ArkUI（Stage 模型，兼容 API 9/10/11/12）** 架构，与已上线的百度云 BCC 遥测微服务（`180.76.137.117:8000`）及南向 RK2206 硬件开发板实现全链路毫秒级（< 500ms）端云一体化双向协同。

---

## 2. 核心技术选型与规范

| 维度 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **开发语言与范式** | ArkTS（TypeScript 超集） + 声明式 ArkUI | OpenHarmony / HarmonyOS 官方标准现代范式 |
| **应用应用模型** | Stage 模型（EntryAbility） | 华为/开放原子开源基金会标准架构 |
| **网络通信** | `@ohos.net.http` (HTTP/REST) | 300ms 极速遥测流与指令下发通道 |
| **可视化图表** | 原生 `<Canvas>` 2D 上下文渲染引擎 | 极简、高性能、零第三方依赖多维时序图 |
| **构建系统** | Hvigor + Ohpm | DevEco Studio 内置构建引擎 |
| **目标运行设备** | Phone（1080x2340 / 360x780 逻辑像素）/ 模拟器 / 折叠屏 | 针对 DevEco Studio 模拟器与实时 Previewer 优化 |

---

## 3. 目录与代码工程结构

```text
app/
├── AppScope/
│   ├── app.json5                  # 应用包名、版本、图标全局声明 (Bundle: com.spacestation.monitor)
│   └── resources/                 # 全局基础资源 (base, element, media, app_icon.png)
├── entry/
│   ├── build-profile.json5        # 模块构建配置
│   ├── hvigorfile.ts              # 模块级构建脚本
│   ├── src/main/
│   │   ├── module.json5           # Ability 声明与 ohos.permission.INTERNET 权限声明
│   │   ├── resources/             # 颜色、字符串、图标、主题配置
│   │   │   ├── base/
│   │   │   │   ├── element/
│   │   │   │   │   ├── color.json
│   │   │   │   │   └── string.json
│   │   │   │   └── media/
│   │   │   │       ├── icon.png
│   │   │   │       ├── icon_temp.png
│   │   │   │       ├── icon_humi.png
│   │   │   │       ├── icon_lux.png
│   │   │   │       └── icon_gas.png
│   │   │   └── zh_CN/
│   │   └── ets/
│   │       ├── entryability/
│   │       │   └── EntryAbility.ets   # 应用生命周期
│   │       ├── common/
│   │       │   ├── Constants.ets      # 云端 URL、阈值、全局色彩定义
│   │       │   └── HttpUtil.ets       # @ohos.net.http 异步网络工具类
│   │       ├── model/
│   │       │   └── TelemetryModel.ets # 遥测实体类、命令实体类、日志实体类
│   │       ├── viewmodel/
│   │       │   └── StationViewModel.ets # 响应式状态管理、心跳与失锁快照判定
│   │       ├── components/
│   │       │   ├── StationHeader.ets  # 航天 HUD 状态顶栏
│   │       │   ├── SensorCard.ets     # 2x2 拟态毛玻璃环境数据卡片
│   │       │   ├── ControlSection.ets # 极速双向控制台（排风/消警/状态反馈）
│   │       │   ├── PinVerifyDialog.ets# 6 位安全 PIN 码（123456）授权弹窗
│   │       │   ├── TrendChart.ets     # Canvas 原生时序走势图
│   │       │   └── EventLogView.ets   # 实时事件流水列表
│   │       └── pages/
│   │           └── Index.ets          # 主界面容器
├── build-profile.json5            # 工程级构建配置
├── hvigorfile.ts                  # 工程级构建脚本
└── oh-package.json5               # Ohpm 依赖声明
```

---

## 4. UI 界面与交互设计

### 4.1 配色与视觉风格
- **深空航天基底**：`#0A0E1A`（渐变至 `#111827`）
- **拟态毛玻璃卡片**：`#161F30`（85% 透明度 + 1px `#1E293B` 精密边框）
- **航天青高亮**：`#00F0FF`（正常指标、呼吸指示灯）
- **警示高亮**：`#FF3B30`（超标告警、断开连接）
- **安全绿**：`#00E676`（在线徽章、消警完成）

### 4.2 核心组件与布局
1. **StationHeader**：
   - 顶部呈现空间站标识 `CSS-CABIN-01` 与天宫徽章；
   - 显示 `[LIVE LINK]` 动态呼吸圆点、实时 IP `192.168.9.51` 与 BJT 实时时钟；
2. **SensorGrid (2×2 环境感知矩阵)**：
   - 包含温度（`℃`）、湿度（`%`）、光照（`lx`）、烟雾（`ppm`）四路拟态卡片；
   - 数据超出阈值（温 >35℃、湿 >80%、光 <10lx、烟 >30ppm）卡片产生红光呼吸律动；
   - 硬件断电超时（> 6s）自动转入 `[CACHED]` 快照容错模式；
3. **ControlSection (极速控制台)**：
   - **排风电机控制卡片**：展示 `高速运转 (6000RPM)` 或 `待机停转 (STANDBY)` 真实物理状态，点击弹出 PIN 码校验框；
   - **应急消警静音按钮**：一键消警静音并复位告警声光；
4. **PinVerifyDialog (6 位安全 PIN 码)**：
   - 默认密码 `123456`，输入框显示暗文 `••••••`，防止误触与非法控制；
5. **TrendChart (Canvas 时序走势图)**：
   - 采用 ArkUI 原生 `<Canvas>` 绘制多维时序走势折线图，包含双 Y 轴刻度、平滑贝塞尔曲线与渐变区域填充；
6. **EventLogView (事件流水)**：
   - 实时记录遥测刷新、控制下发与 ACK 回执事件。

---

## 5. 端云通信与极速控制协议

1. **遥测拉取 (`GET /api/telemetry/latest?device_id=rk2206-station-01`)**：
   - 300ms 周期异步拉取；
   - 响应包含：`temperature`, `humidity`, `lux`, `gas_ppm`, `motor_on`, `alarm_on`, `created_at`。
2. **指令下发 (`POST /api/command`)**：
   - 报文：`{"device_id": "rk2206-station-01", "target": "motor|alarm", "action": "on|off|ack"}`；
   - 板端 200ms 轮询拉取并在 50ms 内驱动硬件与返回 ACK，APP 界面在 ~240ms 内完成状态闭环。

---

## 6. 验证与交付计划

1. **Hvigor 命令行本地构建验证**：
   - 使用 DevEco Studio 内置 `ohpm` 和 `hvigorw` 完成依赖安装与构建检查；
2. **DevEco Studio 模拟器 / Previewer 运行验证**：
   - 打开 DevEco Studio，加载 `app/` 工程，在 Previewer 和模拟器中查看 100% 还原的航天 HUD 界面与实时数据刷新；
3. **四端联动闭环验收**：
   - 在 APP 模拟器上输入 PIN `123456` 启动电机 -> 百度云下发 -> 桌上 RK2206 板端电机旋转 -> Web 大屏风机起转 -> APP 仪表显示 `(6000RPM)`，全链路端到端闭环通过。
