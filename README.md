# 太空空间站内部环境监测端云一体化系统

沈阳航空航天大学生产实习项目（软通动力方向，2026.08.31 – 2026.09.11）。
基于 **OpenHarmony 南北向全栈**：RK2206 开发板采集舱内环境数据 → Wi-Fi/HTTP 上云 → 鸿蒙原生 ArkTS APP & 数字孪生大屏实时可视化与远程双向管控。

---

## 🚀 系统全链路架构

```
[感知层 / 传感器]
   ├── SHT30 温湿度传感器 (I2C0 @ 0x44)
   ├── BH1750 环境光照传感器 (I2C0 @ 0x23)
   └── MQ-2 烟雾气体传感器 (SARADC @ CH4)
         │
         ▼
[鸿蒙终端层 / 南向设备]
   └── 小凌派 RK2206 (OpenHarmony 3.0 LTS / LiteOS-M)
         ├── 2.4寸 SPI TFT-LCD 高清屏 (180° 正向对齐 / 60 汉字防残影字库)
         ├── 硬件级按键防抖与边沿检测 (K3 最高中断优先级)
         ├── 声光联动 (PWM 无源蜂鸣器 + PA5 告警灯) 与执行机构 (排风电机)
         └── 500ms 极速遥测上报与 200ms 远程指令轮询
         │
         ▼ (Wi-Fi 局域网 / TCP Socket)
[云端服务层 / 百度云 BCC]
   └── 180.76.137.117:8000 (FastAPI + SQLAlchemy + SQLite + Mosquitto MQTT)
         ├── /api/telemetry (最新遥测获取 / 历史时序查询 / 硬件心跳失锁检测)
         └── /api/command (指令下发 / 待执行查询 / ACK 闭环应答)
         │
         ├──► [Web 北向 / 数字孪生大屏] (React 18 + TS + ECharts 5 + Tailwind)
         │       └── http://180.76.137.117:8000/dashboard/
         │
         └──► [鸿蒙北向 / 掌上测控终端 APP] (ArkTS Stage 模型 / DevEco Studio 6.1)
                 └── 纯矢量航天工程 HUD、360° 旋转涡轮风扇、示波走势、PIN 免密授权
```

---

## 🛠️ 技术栈与工程结构

| 层次 | 核心技术 | 成果与运行环境 |
|---|---|---|
| **鸿蒙北向 APP** | ArkTS、ArkUI (Stage 模型)、`@ohos.net.http`、Canvas 示波器、纯矢量 SVG 资产 | DevEco Studio 6.1 (Release HAP 打包完毕，支持模拟器/真机) |
| **Web 孪生大屏** | React 18、TypeScript、Vite、Tailwind CSS、ECharts 5、Framer Motion | 百度云 BCC 线上部署 (`/dashboard/`)，<240ms 极速双向响应 |
| **云端微服务** | Python 3.10、FastAPI、Pydantic、SQLAlchemy、SQLite3、Mosquitto | 百度云 BCC (180.76.137.117:8000) 高并发服务 |
| **南向嵌入式** | C 语言、LiteOS-M、GPIO、I2C、SPI、SARADC、PWM、lwIP、Wi-Fi | RK2206 (`Firmware.img` 2MB，支持停止电机自动恢复监测) |

### 📂 仓库目录

```
├── app/                  # 北向: 鸿蒙 ArkTS 空间站掌上测控 APP (Stage 模型)
│   ├── AppScope/         # 全局应用配置与图标
│   ├── entry/            # 核心业务模块 (Components / Pages / ViewModel / Resources)
│   │   └── src/main/
│   │       ├── ets/
│   │       │   ├── common/      # 常量配置 (Constants.ets) 与 HTTP 工具 (HttpUtil.ets)
│   │       │   ├── components/  # 航天 HUD 组件 (Header, SensorCard, Control, Chart, Splash)
│   │       │   ├── model/       # 数据模型 (TelemetryData, CommandPayload, EventLogItem)
│   │       │   ├── pages/       # 主页面 (Index.ets)
│   │       │   └── viewmodel/   # 状态管理机 (StationViewModel.ets)
│   │       └── resources/       # 11 组纯矢量 SVG 图标与主题配置
│   └── build-profile.json5
├── cloud_ecs/            # 云端: FastAPI 遥测微服务与 SQLite 数据库
├── frontend_react/       # Web: 太空空间站数字孪生可视化大屏
├── device/               # 南向: RK2206 底层工程与独立实验 (Lab01 ~ Lab09)
│   ├── images/           # 编译生成的最终烧录镜像 (Firmware.img)
│   └── labs/             # 10 组逐步递进的南向实验源码与独立 README
└── docs/                 # 全套文档: 实习方案梳理、架构设计、技术方案与每日校友邦日志
```

---

## 🌟 核心系统特性与创新亮点

1. **纯矢量航天工程 HUD（Zero Emoji）**：
   - 彻底告别廉价 Emoji 符号，自研 11 组高精度纯矢量 SVG 图标（卫星、高精水银温标、湿度水滴、光学聚焦光照度、气体流场微粒、6叶涡轮风机等）；
   - 360° 激光雷达同心扫描自检开屏画面（`SplashScreen`），展现太空站航电系统冷启动仪式感。
2. **60fps 动态旋转涡轮风机动画**：
   - 手机端与 Web 端风机动画与开发板电机物理转速 100% 孪生映射；
   - 启动时风扇飞速旋转并散发赛博青色高光，待机时平滑减速降频。
3. **Canvas 示波器级温湿度时序走势**：
   - 细密经纬网格线、双色平滑面积渐变阴影（Area Gradient Fill）、最新数据点发光雷达圆环。
4. **会话级 PIN 码（123456）免密授权记忆**：
   - 首次点击控制输入一次 PIN 码即锁定授权，后续启动/停止电机或一键消警免密毫秒级直发。
5. **南向嵌入式状态自动恢复机制**：
   - 手机停止电机时，板端自动解除远程强制覆盖模式（`g_remote_override = false`），屏幕秒级自动恢复为“正常监测”，无需手动点按 K3 按键。
6. **失锁快照容错与超低时延链路**：
   - 硬件掉电 6 秒后自动打标 `[CACHED]` 快照并记录失锁时间；端云双向物理控制响应延迟 `< 240ms`。

---

## 📊 生产实习实训进度全览 (2026.08.31 – 2026.09.01)

- [x] **南向基础环境**：Ubuntu 编译环境搭建、`hb` 工具链、RKDevTool 烧录与 UART 日志调通
- [x] **Lab01 ~ Lab03**：SPI TFT-LCD 屏幕驱动、180° 正向对齐、60 汉字字库、K3 按键硬件边沿检测与 PA5 告警灯联动
- [x] **Lab04 ~ Lab06**：MQ-2 气体传感器采样与 K3 校准、SHT30 I2C 温湿度采样与数据冻结、LiteOS-M 多任务并发调度
- [x] **Lab07 ~ Lab08**：四路传感声光电机舱内联动控制站、Wi-Fi 驱动移植与公网 IP Ping 连通
- [x] **Lab09 综合实验**：端云遥测上报、K3 锁存消警与双向远程控制闭环
- [x] **云端微服务**：FastAPI 遥测中枢与 SQLite 历史存储部署至百度云 BCC (180.76.137.117:8000)
- [x] **Web 北向孪生**：React 18 + TS + ECharts 5 航天数字孪生大屏开发上线 (`/dashboard/`)
- [x] **鸿蒙北向 APP**：ArkTS Stage 原生 APP 全量研发，通过 DevEco Studio 6.1 编译验证并完成 HAP 打包

---

## 📝 实习日志归档

- 📄 [2026-08-31 校友邦实习日志（第1篇：南向环境与基础外设实验）](docs/logs/2026-08-31-校友邦实习日志.md)
- 📄 [2026-09-01 校友邦实习日志（第2篇：多传感器调度与Wi-Fi端云通信）](docs/logs/2026-09-01-校友邦实习日志-第2篇.md)
- 📄 [2026-09-01 校友邦实习日志（第3篇：太空空间站数字孪生大屏与极速低延迟优化）](docs/logs/2026-09-01-校友邦实习日志-第3篇.md)
- 📄 [2026-09-01 校友邦实习日志（第4篇：OpenHarmony 原生 ArkTS 掌上终端研发与全栈闭环）](docs/logs/2026-09-01-校友邦实习日志-第4篇.md)
