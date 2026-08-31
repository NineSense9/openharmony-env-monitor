# 02 GPIO 按键与 LED 实验设计

## 1. 目标

在不覆盖 `01_hello_world` 的前提下，新增一个独立的 RK2206 GPIO
实验，验证：

- 读取板载 K1 按键；
- 按下 K1 点亮板载 LED1，松开 K1 熄灭 LED1；
- 通过 UART 打印按键和 LED 状态；
- 使用消抖逻辑，减少机械按键抖动造成的重复状态变化。

本实验不包含 LCD、传感器、Wi-Fi 或云端功能。

## 2. 已确认的硬件映射

板级源码和老师提供的示例已经确认：

| 功能 | GPIO | 电平约定 | 依据 |
| --- | --- | --- | --- |
| K1 按键 | `GPIO0_PC5` | 按下为低电平 | `b19_iot_gpio_int` 注释说明按下约为 0.06V |
| LED1 | `GPIO0_PA5` | 低电平点亮 | `c2_e53_smart_covers` 的 LED1 控制代码 |

## 3. 实现方案

### 3.1 GPIO API

源码使用仓库中已有的 IoT 标准 GPIO 接口：

```c
#include "iot_gpio.h"
#include "iot_errno.h"
```

初始化后：

- `IoTGpioSetDir(GPIO_KEY, IOT_GPIO_DIR_IN)` 配置 K1 为输入；
- `IoTGpioSetDir(GPIO_LED, IOT_GPIO_DIR_OUT)` 配置 LED1 为输出；
- `IoTGpioGetInputVal()` 读取按键；
- `IoTGpioSetOutputVal()` 控制 LED。

### 3.2 消抖与状态机

任务每 20 ms 读取一次按键。只有连续 3 次读到相同电平，才接受为新的
稳定状态，相当于约 60 ms 的软件消抖。

稳定状态变化时：

1. 低电平按下：设置 LED1 为低电平并打印 `K1 PRESSED, LED1 ON`；
2. 高电平松开：设置 LED1 为高电平并打印 `K1 RELEASED, LED1 OFF`。

启动时先将 LED1 设置为高电平，确保实验开始时 LED 默认熄灭。

### 3.3 任务接入

使用 `APP_FEATURE_INIT(gpio_example)` 注册自启动任务。构建集成只修改：

- `vendor/lockzhiner/rk2206/samples/BUILD.gn`：加入本实验静态库目标；
- `device/rockchip/rk2206/sdk_liteos/Makefile`：将 `-lgpio_example` 加入最终链接。

不修改 `01_hello_world` 目录，不把两个实验同时接入同一份待烧录固件。

## 4. 错误处理

- 任一 GPIO 初始化、方向配置或读写操作返回失败时，打印明确的 GPIO
  和错误码，并停止本实验任务；
- LED 控制失败时不伪造成功日志；
- 按键输入只接受 `0` 和 `1`，其他异常值记录为错误；
- 不在仓库保存完整 OpenHarmony 源码树、镜像、密码或其他运行凭据。

## 5. 测试与验收

### 5.1 自动化测试

在 Windows 仓库中运行 `tests/test_gpio_contract.py`，检查：

- GPIO 映射和低电平有效约定；
- 消抖参数和轮询间隔；
- 必需 IoT GPIO API；
- LED 初始熄灭和按键状态分支；
- BUILD 目标和链接补丁内容。

### 5.2 编译验收

Ubuntu 非交互 SSH 编译前固定执行：

```bash
export PATH="/home/lzdz/.local/bin:$PATH"
command -v hb
hb --help | head
hb build -f
```

记录完整构建日志、失败原因、产物路径和 `Firmware.img` MD5。

### 5.3 板上验收

烧录后通过 UART `115200 8N1` 观察：

```text
GPIO experiment started
K1 RELEASED, LED1 OFF
```

按下并松开 K1，各出现一次对应状态日志，同时观察 LED1：

```text
K1 PRESSED, LED1 ON
K1 RELEASED, LED1 OFF
```

板上验收完成后，将实际串口日志和用户提供的现象写入
`device/labs/02_gpio/records/`，再更新总流程和进度文档并提交。
