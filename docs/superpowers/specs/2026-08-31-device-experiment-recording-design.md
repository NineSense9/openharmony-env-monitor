# 南向实验独立保存与协同记录设计

## 1. 目标

南向开发严格按照《授课文档.pdf》的章节和实验顺序推进。每个独立实验都保留自己的源码、修改说明、编译记录、烧录信息和串口验证结果，避免为了赶进度直接覆盖前一个实验。

仓库中的记录用于：

- 课堂检查时展示每个阶段的真实过程；
- 之后重新编译、重新烧录和复现实验；
- 让 Codex 与 Antigravity 能通过 Git commit 了解彼此完成了什么；
- 为校友邦日志、周志、总结报告和答辩准备过程素材。

## 2. 目录约定

```text
device/
└── labs/
    ├── README.md
    ├── 00_bringup/
    │   ├── README.md
    │   └── records/
    ├── 01_hello_world/
    │   ├── README.md
    │   ├── src/
    │   ├── patches/
    │   └── records/
    ├── 02_gpio/
    ├── 03_lcd/
    ├── 04_sensors/
    ├── 05_wifi/
    ├── 06_cloud_telemetry/
    └── 07_remote_control/
```

每个已开始的实验至少包含：

- `README.md`：目的、前置条件、源码位置、编译命令、烧录方式、预期现象和实际结果；
- `src/`：本实验新增或改写的源代码；
- `patches/`：对 OpenHarmony 基础源码的补丁或逐文件修改说明；
- `records/`：编译日志、串口日志、测试结果和截图索引。

实验生成的完整 OpenHarmony 源码树、Python 虚拟环境和大体积镜像不复制到主仓库。对应实验的 README 中记录源码版本、输出路径、文件大小和校验值；必要的小型源码和补丁进入实验目录。

## 3. 基线与实验边界

`00_bringup` 只记录环境和板卡验证，不代表最终业务固件：

- 3.4：克隆 Lockzhiner RK2206 OpenHarmony 3.0 LTS 源码；
- 3.5：在源码树内安装 `hb`；
- 3.6：使用 `hb` 成功编译基础固件；
- 3.8：使用 RKDevTool 成功烧录 `Firmware.img`；
- 3.9：通过 UART、115200 baud 验证 OpenHarmony 内核启动。

从 `01_hello_world` 开始，每个实验都必须从上一阶段的明确基线复制或应用补丁后单独编译。完成后才允许进入下一个实验。

## 4. 实验交付流程

1. 确认当前实验编号、目标和验收现象。
2. 在对应实验目录保存源码或补丁，不改写历史实验目录。
3. 编译并保存命令、版本、输出文件和失败信息。
4. 烧录前校验镜像，记录烧录文件的 MD5。
5. 烧录后通过串口、LCD、传感器或接口测试验证实际现象。
6. 更新实验 README、`device/labs/README.md`、进度记录和总流程文档。
7. 运行适用的自动化测试或静态检查。
8. 使用一个清晰的 commit 提交这一组可复现改动并推送到 GitHub。

涉及实体按键、USB 口切换或烧录确认时，由用户完成物理操作；其余可通过 Ubuntu SSH、Windows 工具和 Git 完成的步骤由代理自动推进。

## 5. Commit 约定

每个实验至少有一个阶段提交，提交信息包含实验编号和动作，例如：

```text
feat(device-lab01): add hello world task example
docs(device-lab00): record rk2206 build flash and uart verification
test(device-lab04): record sensor acquisition checks
```

提交正文或关联 README 必须说明：

- 做了什么；
- 修改了哪些目录；
- 如何编译和验证；
- 当前板子烧录的是什么；
- 下一步是什么；
- 是否有需要用户手动完成的物理操作。

禁止提交密码、SSH 密钥、Wi-Fi 密码、API 密钥、运行数据库、虚拟环境和未经确认的个人信息。

## 6. 阶段闸门

除非用户明确要求跳过，按以下顺序推进：

```text
00_bringup
  -> 01_hello_world
  -> 02_gpio
  -> 03_lcd
  -> 04_sensors
  -> 05_wifi
  -> 06_cloud_telemetry
  -> 07_remote_control
  -> full integration
```

每个阶段只有在“源码可追溯、编译可复现、设备现象已验证、Markdown 已更新、commit 已推送”后才算完成。即使最终系统已经提前跑通，也保留各阶段目录和记录，并可按实验顺序重新烧录展示。
