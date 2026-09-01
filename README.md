# 🛰️ 太空空间站内部环境监测端云一体化系统 (CSS-Cabin-Monitor)

> **沈阳航空航天大学 · 2026年生产实习项目（软通动力方向，2026.08.31 – 2026.09.11）**  
> 基于 **OpenHarmony 南北向全栈** 的中国空间站（CSS 天宫）内部核心舱生命保障与环境健康监测系统。

---

## 📌 项目全景概览

本项目面向载人航天空间站内部核心舱（Tianhe Core Cabin）密闭微重力环境下的生命保障与环境监控需求，构建了一套**感知层（南向嵌入式） $ightarrow$ 网络层（Wi-Fi 局域网） $ightarrow$ 云端中枢层（百度云 BCC） $ightarrow$ 双北向呈现层（Web 数字孪生大屏 + 鸿蒙原生 ArkTS 掌上测控 APP）** 的端云一体化全栈物联网系统。

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CSS-CABIN-01 空间站端云一体化测控网络                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
    ┌─────────────────────────┐          ┌─────────────────────────┐
    │  Web 航天数字孪生大屏    │          │  鸿蒙原生 ArkTS 掌上 APP  │
    │  (React 18 + ECharts 5) │          │  (DevEco Studio 6.1)    │
    └────────────▲────────────┘          └────────────▲────────────┘
                 │ 300ms 轮询                         │ 300ms 极速遥测 / <240ms 指令
                 └────────────────────┬────────────────┘
                                      │ HTTP / RESTful API
                                      ▼
                        ┌───────────────────────────┐
                        │   百度云 BCC 遥测中枢服务   │
                        │   (FastAPI + SQLite DB)   │
                        │   IP: 180.76.137.117:8000 │
                        └─────────────▲─────────────┘
                                      │ 500ms 遥测上报 / 200ms 指令轮询
                                      │ Wi-Fi (802.11 b/g/n)
                        ┌─────────────┴─────────────┐
                        │   小凌派 RK2206 主控开发板 │
                        │ (OpenHarmony 3.0 / LiteOS)│
                        └─────────────▲─────────────┘
                                      │ GPIO / I2C / SPI / SARADC / PWM
        ┌───────────────────┬─────────┴─────────┬───────────────────┐
        ▼                   ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ SHT30 温湿度 │    │ BH1750 光照  │    │  MQ-2 烟雾   │    │ 2.4寸 SPI LCD│
│ (I2C0@0x44)  │    │ (I2C0@0x23)  │    │ (SARADC CH4) │    │ (ST7789V2)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

---

## 🌟 核心创新与系统特性

### 1. 🎨 纯矢量航电工程 HUD（Zero Emoji）
* **拒绝 AI 廉价感**：彻底剔除所有 Emoji 符号，自研全套 **11 组工业级高精度纯矢量 SVG 图标**（天基测控卫星、高精水银温标、同心流线湿度水滴、8向光学聚焦度、气体流场微粒、6叶涡轮风机等）；
* **冷启动自检画面（`SplashScreen`）**：纯矢量几何同心测控环 + 360° 动态激光雷达扫描线 + 航电初始化自检流（驱动加载 $ightarrow$ 云端握手 $ightarrow$ 鉴权就绪）；
* **自适应防溢出布局**：控制台采用自适应 Flexbox 架构，以等宽字体芯片 `RTT<240ms` 呈现链路时延，彻底消除窄屏文本截断。

### 2. 🌀 60fps 动态旋转涡轮风机动力学动画
* **物理孪生同步**：手机 APP 与 Web 大屏的风扇动画与开发板直流排风电机物理转速 100% 孪生映射；
* **高帧率动效**：启动时风机以 60fps 极速旋转并散发赛博青色辉光粒子；停机时平滑减速待机。

### 3. 📈 示波器级温湿度时序走势（Canvas 硬件加速）
* **航电示波器质感**：绘制细密经纬辅助网格线与双轴刻度；
* **双色面积渐变（Area Gradient Fill）**：青色温度流光 + 绿色湿度流光渐变投影；
* **动态雷达拐点**：最新采样点绘制白芯高亮圆环与发光脉冲光晕。

### 4. 🔒 会话级 6 位 PIN 码（123456）免密授权记忆
* **安全与便捷平衡**：首次点击控制输入安全 PIN 码验证通过后，自动锁定当前会话授权（`isAuthorized = true`）；
* **毫秒级免密直发**：后续任意次启停电机或一键消警均免密直发，同时提供一键重新加锁功能。

### 5. ⚡ 南向嵌入式状态自动恢复机制
* **解除强制覆盖**：移动端/Web 端下发停止电机（`motor off`）指令后，开发板底层自动清零 `g_remote_override = false`；
* **秒级自动复位**：开发板 LCD 屏幕从“远程控制”**秒级自动恢复为“正常监测”**，完全无需手动点按开发板 K3 按键；
* **字模防残影补齐**：点阵字库注入“制”字，补齐 60 汉字字模库，LCD 屏幕完整呈现 4 字“远程控制”。

### 6. 🛡️ 失锁快照容错与超低时延链路
* **失锁心跳检测**：开发板断电或断网超过 6 秒，云端与双端自动切换为 `[CACHED]` 模式并打标失锁时间戳；
* **<240ms 极速响应**：端到端（开发板 $\leftrightarrow$ 百度云 $\leftrightarrow$ 手机/Web）双向物理联动响应延迟压测实测 `< 240ms`。

---

## 🛠️ 全栈技术架构与工具链

| 层次 | 模块名称 | 核心技术选型 | 运行/部署环境 | 核心职责 |
|---|---|---|---|---|
| **北向移动端** | `app` | ArkTS、ArkUI (Stage 模型)、`@ohos.net.http`、Canvas | DevEco Studio 6.1 (Release HAP) | 空间站掌上测控终端，纯矢量 HUD，免密控制，示波走势 |
| **北向 Web 端** | `frontend_react` | React 18、TypeScript、Vite、Tailwind CSS、ECharts 5 | 百度云 BCC (`/dashboard/`) | 太空数字孪生大屏，气流流体仿真，全屏遥测大看板 |
| **云端微服务** | `cloud_ecs` | Python 3.10、FastAPI、Pydantic、SQLAlchemy、SQLite3 | 百度云 BCC (180.76.137.117:8000) | 高并发遥测存储、时序查询、指令分发队列、失锁心跳判定 |
| **南向嵌入式** | `device` | C 语言、OpenHarmony 3.0 LTS、LiteOS-M、lwIP | 小凌派 RK2206 (Cortex-M33) | 多传感器驱动、SPI 屏幕渲染、K3 中断检测、Wi-Fi 上云 |

---

## 🔌 硬件引脚分配与外设映射表

开发板采用 **小凌派-RK2206 (OpenHarmony 3.0 LTS)**，外设接口映射如下：

| 外设模块 | 传感器/执行器型号 | 接口总线 | RK2206 物理引脚 | 作用与技术参数 |
|---|---|---|---|---|
| **温湿度传感器** | SHT30-DIS | I2C0 | SCL: `GPIO0_PB6` / SDA: `GPIO0_PB7` | 舱内温湿度监测（温度精度 ±0.2℃，湿度 ±2%RH） |
| **环境光照传感器** | BH1750FVI | I2C0 | SCL: `GPIO0_PB6` / SDA: `GPIO0_PB7` | 舱内光照度监测（1 ~ 65535 lx，I2C 地址 0x23） |
| **烟雾气体传感器** | MQ-2 | SARADC | Analog In: `SARADC_CH4` | 气态烟雾/可燃气体浓度采样（0 ~ 100 ppm） |
| **彩色液晶屏** | 2.4寸 SPI TFT-LCD | SPI0 / GPIO | SCK: `PB0`, MOSI: `PB1`, CS: `PB2`, DC: `PB3`, RES: `PB4`, BLK: `PB5` | 240×320 分辨率，ST7789V2 驱动，180° 正向对齐 |
| **应急交互按键** | K3 轻触按键 | GPIO 中断 | Pin: `GPIO0_PC7` | 硬件级边沿检测，最高中断优先级（Prio 3），一键消警/复位 |
| **声光告警器** | PA5 LED / 无源蜂鸣器 | GPIO / PWM | LED: `GPIO0_PA5` / BEEP: `PWM_CH0` | 超标声光同步告警（烟雾>15ppm、温度>32℃/湿度>70%） |
| **排风执行机构** | 直流无刷风机电机 | GPIO / 电机驱动 | Motor Ctrl: `GPIO0_PA6` | 舱内强排通风执行机构，支持本地自动/远程强制双模驱动 |

---

## 🧪 南向嵌入式实验全景矩阵 (Labs 01 ~ 09)

南向实验均按**独立工程与独立说明文档**归档于 `device/labs/`：

| 实验编号 | 实验目录 | 核心内容 | 验证与验收状态 |
|---|---|---|---|
| **Lab 00** | [`00_bringup`](device/labs/00_bringup/) | Ubuntu 编译环境搭建、`hb` 工具链部署、RKDevTool 烧录与串口 Log 调通 | ✅ 验收通过 (UART 115200 正常启动) |
| **Lab 01** | [`02_lab01_lcd`](device/labs/02_lab01_lcd/) | SPI0 驱动移植、ST7789V2 初始化、清屏刷新与英文字符渲染 | ✅ 验收通过 (LCD 欢迎文字点亮) |
| **Lab 02** | [`03_lab02_key_lcd`](device/labs/03_lab02_key_lcd/) | K3 按键 GPIO 输入、软件消抖与 LCD 状态同步切换 | ✅ 验收通过 (按键响应并刷新屏幕) |
| **Lab 03** | [`04_lab03_light_key_lcd`](device/labs/04_lab03_light_key_lcd/) | PA5 告警灯 GPIO 输出控制、K3 翻转灯状态与 LCD 状态联动 | ✅ 验收通过 (按键翻转灯与屏幕同步) |
| **Lab 04** | [`05_lab04_mq2_key_lcd`](device/labs/05_lab04_mq2_key_lcd/) | SARADC 通道 4 电压采样、MQ-2 阻值转换与 K3 基准校准 | ✅ 验收通过 (Gas PPM 采样校准通过) |
| **Lab 05** | [`06_lab05_sht30_key_lcd`](device/labs/06_lab05_sht30_key_lcd/) | I2C0 时序封装、SHT30 周期测量模式与温湿度数据冻结 | ✅ 验收通过 (温湿度连续采集通过) |
| **Lab 06** | [`07_lab06_multitask_lcd`](device/labs/07_lab06_multitask_lcd/) | LiteOS-M 多任务并发调度（3s 传感采样任务 + 200ms UI 刷新任务） | ✅ 验收通过 (多任务协同调度正常) |
| **Lab 07** | [`08_lab07_cabin_station`](device/labs/08_lab07_cabin_station/) | 空间站环境监测站单机版（四路传感融合、声光电机联动、K3 应急消警） | ✅ 验收通过 (本地自动环控闭环) |
| **Lab 08** | [`09_lab08_wifi_ping`](device/labs/09_lab08_wifi_ping/) | Wi-Fi Station 模式驱动、DHCP 获取 IP 与百度外网 Ping 测试 | ✅ 验收通过 (Ping 4/4 成功 0% 丢包) |
| **Lab 09** | [`10_lab09_cloud_station`](device/labs/10_lab09_cloud_station/) | **端云一体化综合实验**：500ms 遥测上云、200ms 远程指令轮询、停机自恢复 | ✅ 验收通过 (全链路双向毫秒级闭环) |

---

## 📡 通信协议与 RESTful API 规范

云端部署于百度云 BCC：`http://180.76.137.117:8000`

### 1. 遥测数据上报 (`POST /api/telemetry`)
开发板周期性向云端推送当前传感器读数与执行器状态：
```json
{
  "device_id": "rk2206-station-01",
  "temperature": 28.5,
  "humidity": 50.2,
  "lux": 320.0,
  "gas_ppm": 7.8,
  "motor_on": false,
  "alarm_on": false
}
```

### 2. 最新遥测查询 (`GET /api/telemetry/latest`)
Web 大屏与鸿蒙 APP 轮询最新遥测，附带云端时间戳：
```json
{
  "id": 1024,
  "device_id": "rk2206-station-01",
  "temperature": 28.5,
  "humidity": 50.2,
  "lux": 320.0,
  "gas_ppm": 7.8,
  "motor_on": false,
  "alarm_on": false,
  "created_at": "2026-09-01T22:50:12.345Z"
}
```

### 3. 远程指令下发 (`POST /api/command`)
手机 APP / Web 大屏下发控制指令（需在客户端校验 PIN 码）：
```json
{
  "device_id": "rk2206-station-01",
  "target": "motor",
  "action": "on"
}
```
* `target`: `"motor"` (排风电机) / `"alarm"` (消警复位) / `"led"` (告警灯)
* `action`: `"on"` (开启) / `"off"` (停止) / `"ack"` (消警复位)

### 4. 指令执行与 ACK 闭环 (`GET /api/command/pending` & `POST /api/command/ack`)
开发板轮询拉取待执行指令，执行硬件动作后上报 ACK，完成闭环应答。

---

## 💻 快速开始与编译部署指南

### 1. 南向嵌入式固件编译与烧录
1. **编译**（在 Linux/Ubuntu 环境）：
   ```bash
   cd ~/openharmony
   hb set -p rk2206
   hb build -f
   ```
   编译生成的镜像位于：`out/rk2206/lockzhiner-rk2206/Firmware.img`。
2. **烧录**（在 Windows 下使用 RKDevTool）：
   - 打开 `D:\实习 烧写工具\RKDevTool\RKDevTool.exe`；
   - 按住板载 Maskrom 按键连接 Type-C 数据线，工具识别到 `发现一个MASKROM设备`；
   - 固件路径选择 `workspace/device/images/10_lab09_cloud_station/Firmware.img`（或根目录 `Firmware.img`）；
   - 点击 **【执行】** 开始刷写。

---

### 2. 鸿蒙原生 ArkTS 移动端 APP 构建运行
1. **打开工程**：启动 **DevEco Studio 6.1**，打开工程目录 `D:\openharmony_app`（纯英文路径）；
2. **依赖同步**：点击 `Sync Now`，Hvigor 自动完成 SDK 索引与构建环境就绪；
3. **一键构建打包**：
   - 菜单栏选择 `Build` $ightarrow$ `Assemble Hap(s)`；
   - 或在终端执行：
     ```powershell
     & "D:\DevEco Studio	ools
ode
ode.exe" "D:\DevEco Studio	ools\hvigorin\hvigorw.js" assembleHap
     ```
   - 编译产物位于：`entry/build/default/outputs/default/entry-default-unsigned.hap`；
4. **运行与预览**：
   - 在 DevEco Studio 右侧点击 **Previewer（预览器）** 实时查看 UI 与动效；
   - 或启动本地模拟器直接部署运行。

---

### 3. Web 航天数字孪生大屏本地调试
```bash
cd workspace/frontend_react
npm install
npm run dev
```
本地访问 `http://localhost:5173/dashboard/` 即可进入数字孪生大屏。

---

## 📁 完整代码工程结构

```
├── app/                  # 鸿蒙 ArkTS 空间站掌上测控 APP 工程
│   ├── AppScope/         # 全局应用配置与图标
│   ├── entry/            # 核心业务模块
│   │   ├── build-profile.json5
│   │   ├── hvigorfile.ts
│   │   └── src/main/
│   │       ├── module.json5
│   │       ├── ets/
│   │       │   ├── common/      # 常量配置 (Constants.ets) 与 HTTP 客户端 (HttpUtil.ets)
│   │       │   ├── components/  # 航天 HUD 组件库
│   │       │   │   ├── SplashScreen.ets   # 360° 动态雷达自检开屏组件
│   │       │   │   ├── StationHeader.ets  # 航天状态抬头与时钟
│   │       │   │   ├── SensorCard.ets     # 拟态毛玻璃传感器卡片 (内嵌量程微刻度)
│   │       │   │   ├── ControlSection.ets # 极速控制台 (360° 旋转涡轮风机 + PIN 免密)
│   │       │   │   ├── TrendChart.ets     # Canvas 示波器温湿度时序走势 (面积渐变)
│   │       │   │   ├── EventLogView.ets   # 测控事件实时流水组件
│   │       │   │   └── PinVerifyDialog.ets# 6 位安全 PIN 码鉴权弹窗
│   │       │   ├── model/       # 数据实体 (TelemetryData, CommandPayload, EventLogItem)
│   │       │   ├── pages/       # 主页面 (Index.ets)
│   │       │   └── viewmodel/   # 状态管理机 (StationViewModel.ets)
│   │       └── resources/       # 11 组纯矢量 SVG 图标资产与布局资源
│   ├── build-profile.json5
│   ├── hvigor/
│   └── oh-package.json5
├── cloud_ecs/            # 百度云微服务工程 (FastAPI + SQLite + MQTT Broker)
│   ├── main.py           # 核心 RESTful API 与指令队列
│   ├── models.py         # SQLAlchemy 数据库映射
│   ├── requirements.txt  # Python 依赖清单
│   └── station.db        # 遥测历史数据库
├── frontend_react/       # Web 航天数字孪生大屏工程 (React 18 + TS + ECharts 5)
│   ├── src/              # 大屏页面、气流粒子流体引擎、ECharts 配置
│   └── package.json
├── device/               # 南向嵌入式工程与独立实验
│   ├── images/           # 最终固件烧录镜像 (Firmware.img)
│   └── labs/             # 10 组逐步递进的独立实验源码与实验报告
│       ├── 00_bringup/
│       ├── 01_hello_world/
│       ├── 02_lab01_lcd/
│       ├── 03_lab02_key_lcd/
│       ├── 04_lab03_light_key_lcd/
│       ├── 05_lab04_mq2_key_lcd/
│       ├── 06_lab05_sht30_key_lcd/
│       ├── 07_lab06_multitask_lcd/
│       ├── 08_lab07_cabin_station/
│       ├── 09_lab08_wifi_ping/
│       └── 10_lab09_cloud_station/
└── docs/                 # 全套工程文档与校友邦实习日志
    ├── logs/             # 每日一篇校友邦实习日志
    │   ├── 2026-08-31-校友邦实习日志.md
    │   └── 2026-09-01-校友邦实习日志.md
    └── superpowers/      # 系统架构设计规范与实施计划
```

---

## 📈 实测技术指标与性能基准

| 性能指标 | 设计目标 | 实测数据 | 达成状态 |
|---|---|---|---|
| **传感器数据采样周期** | $\le 1000	ext{ ms}$ | **$500	ext{ ms}$** (多任务并发) | 🎯 远超预期 |
| **端云双向指令响应时延** | $< 500	ext{ ms}$ | **$< 240	ext{ ms}$** (实测真机旋转) | 🎯 工业级极速响应 |
| **LCD 屏幕无残影刷新** | 稳定无频闪 | **$200	ext{ ms}$ 定时刷新 + 180° 正向** | 🎯 稳定流畅 |
| **设备失锁快照容错窗口** | $\le 10	ext{ s}$ | **$6.0	ext{ s}$** (自动标记 `[CACHED]`) | 🎯 容错精准 |
| **ArkTS 编译构建通过率** | 100% | **100% 通过** (`> hvigor BUILD SUCCESSFUL`) | 🎯 零 Warning/Error |
| **UI 矢量资产覆盖率** | 100% 无 Emoji | **11 组高精度纯矢量 SVG 全覆盖** | 🎯 工业级航电 HUD |

---

## 👥 团队分工与组织架构

* **项目名称**：太空空间站内部环境监测端云一体化系统
* **所属高校**：沈阳航空航天大学 · 2026年生产实习（软通动力方向）
* **项目角色**：
  * **南向嵌入式工程师**：负责 RK2206 外设驱动、LiteOS-M 多任务调度、Wi-Fi 上云与停机自恢复逻辑；
  * **云端与微服务工程师**：负责百度云 BCC FastAPI 架构、SQLite 历史时序与指令队列；
  * **Web 前端工程师**：负责 React 18 空间站数字孪生大屏、ECharts 走势与流体粒子动画；
  * **鸿蒙应用工程师**：负责 DevEco Studio 6.1 ArkTS Stage 模型 APP、纯矢量 HUD、360° 风机与 PIN 免密设计；
  * **测试与文档工程师**：负责端云时延基准测试、硬件消抖调优与全套校友邦实习日志归档。

---

## 📝 校友邦实习日志索引

- 📄 [2026-08-31 校友邦实习日志（Day 1：南向编译环境搭建与基础外设驱动实验）](docs/logs/2026-08-31-校友邦实习日志.md)
- 📄 [2026-09-01 校友邦实习日志（Day 2：多传感器调度、端云通信、Web数字孪生大屏与鸿蒙ArkTS掌上APP全栈闭环）](docs/logs/2026-09-01-校友邦实习日志.md)
