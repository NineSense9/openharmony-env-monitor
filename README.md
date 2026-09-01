# 太空空间站内部环境监测端云一体化系统

沈阳航空航天大学生产实习项目(软通动力方向,2026.08.31 – 2026.09.11)。
基于 **OpenHarmony 南北向全栈**:RK2206 开发板采集舱内环境数据 → Wi-Fi/HTTP 上云 → 鸿蒙 APP 实时可视化与远程管控。

## 系统链路

```
感知层(传感器) → 鸿蒙终端层(RK2206) → 网络层(Wi-Fi)
  → 云端服务层(FastAPI/SQLite) → 鸿蒙APP应用层(ArkTS/ArkUI)
```

## 技术栈

| 层 | 技术 |
|---|---|
| 北向 APP | ArkTS / ArkUI(DevEco Studio)、环境数据可视化、HTTP API |
| 南向设备 | RK2206 + C 语言、GPIO/I2C/SPI、传感器驱动、Wi-Fi 上云、低功耗 |
| 云端 | FastAPI、SQLAlchemy、SQLite、历史数据和远程指令 |

## 目录结构

```
├── app/       # 北向:鸿蒙监测 APP(ArkTS/ArkUI,Day1–Day6)
├── device/    # 南向:RK2206 底层工程与驱动(Day7–Day9)
└── docs/      # 全套文档:实训方案梳理、需求、实验记录、测试报告等
```

## 核心功能

- 多传感器数据采集(滤波、误差校准)
- 本地自动控制(SPI 屏显、阈值调控、声光告警、低功耗休眠)
- Wi-Fi-MQTT 双向通信(数据上传、远程指令、断网缓存)
- 鸿蒙 APP 可视化(实时卡片、历史曲线、异常标红、告警弹窗)
- 远程管控(自定义阈值、远程启停、操作日志)

## 技术指标

| 指标 | 目标 |
|---|---|
| 传感器采集误差 | < 3% |
| 远程指令响应 | < 500 ms |
| 断网缓存 | ≥ 24 h 历史数据 |

## 进度(10 天计划)

- [ ] **北向阶段** Day1–6(8/31–9/7):环境搭建与需求 → 可视化界面 → MQTT 云端对接 → 远程控制与告警 → 优化与阶段验收
- [ ] **南向阶段** Day7–9(9/8–9/10):RK2206 环境 → 传感器驱动与校准 → 本地控制/上云/低功耗
- [ ] **整合答辩** Day10(9/11):全链路联调、文档、答辩

> 详细逐日计划见 [docs/生产实习流程梳理.md](docs/生产实习流程梳理.md)

## 当前实际进度 (2026-09-01)

- [x] 南向源码准备、`hb` 安装、基础固件编译
- [x] RKDevTool 烧录验证
- [x] UART 启动日志验证
- [x] `device/labs/01_hello_world` 独立实验
- [x] `device/labs/02_lab01_lcd`：LCD 实验 1（功能基线可运行，LCD 欢迎文字点亮）
- [x] `device/labs/03_lab02_key_lcd`：按键 + LCD 实验 2（K3=PC7 实物验收通过，LCD 布局修正完成）
- [x] `device/labs/04_lab03_light_key_lcd`：告警灯 + 按键 + LCD 实验 3（K3 翻转 PA5 告警灯与屏幕 Light: ON/OFF 状态同步实物验收通过）
- [x] `device/labs/05_lab04_mq2_key_lcd`：MQ2 气体传感器 + K3 校准 + LCD 实验 4（Gas PPM 采样与 K3 校准实物验收通过）
- [x] `device/labs/06_lab05_sht30_key_lcd`：SHT30 温湿度传感器 + K3 冻结 + LCD 实验 5（SHT30 温湿度采样与 K3 冻结实物验收通过）
- [ ] `device/labs/07_lab06_multitask_lcd`：多任务 + LCD 实验 6（源码、构建与烧录包已完成，待上板验收）
- [ ] `device/labs/08_lab07_cabin_station` 至 `09_lab08_wifi_ping`
- [ ] 云端和远程控制整合实验

南向实验按独立目录保存，完成一个实验后更新 Markdown、验证并单独提交。规则见
[南向实验独立保存与协同记录设计](docs/superpowers/specs/2026-08-31-device-experiment-recording-design.md)，
当前基线见 [00_bringup](device/labs/00_bringup/README.md)，当前最新完成实验见
[06_lab05_sht30_key_lcd](device/labs/06_lab05_sht30_key_lcd/README.md)。

## 团队分工

4–6 人分组,角色:项目经理 / 鸿蒙应用工程师(北向)/ 鸿蒙嵌入式工程师(南向)/ 物联网测试工程师 / 文档工程师。

> 成员名单与定岗确定后在此更新。
