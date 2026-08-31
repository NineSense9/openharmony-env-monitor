# 02_gpio 方案纠错记录（已作废）

> 本文件保留早期错误判断的修正轨迹，不作为当前实施依据。2026-08-31
> 根据《授课文档.pdf》第 4.5-4.7 节确认，当前正确顺序是先做
> `lab01_lcd`，再做只使用 `K3=GPIO0_PC7` 的 `lab02_key_lcd`；K1 是
> RESET，K2 是 MASKROM。旧版 ADC5 四键方案不属于当前授课流程。

## 1. 目标

在不覆盖 `01_hello_world` 的前提下，新增一个独立的 RK2206 按键输入
实验，验证板载四个用户按键的 ADC 电阻梯识别：

- `K3`、`K4`、`K5`、`K6` 是本实验的用户按键；
- `K1` 是 `RESET`，不作为普通输入按键；
- `K2` 是 `MASKROM`，不作为普通输入按键；
- 四个用户按键共用 `USER_KEY_ADC`，通过不同电阻产生不同电压；
- 通过 UART 打印 ADC 原始值、电压和识别结果。

本实验暂不包含 LCD、温湿度、光照、Wi-Fi 或云端功能。RGB 灯的控制
引脚和有效电平在底板原理图完全核对前不写入本实验，不把未确认的
`GPIO0_PA5` 作为板载 LED 映射。

## 2. 已确认的硬件映射

| 功能 | 硬件标识 | 接口 | 已确认事实 |
| --- | --- | --- | --- |
| 复位 | `K1` | 硬件复位键 | 按下会复位开发板，不参与 ADC 实验 |
| 烧录模式 | `K2` | `MASKROM` 键 | 进入烧录模式，不参与 ADC 实验 |
| 用户按键 | `K3`、`K4`、`K5`、`K6` | `USER_KEY_ADC` / `GPIO0_PC5` / ADC 通道 `5` | 四键共用一条 ADC 输入，通过电阻梯区分 |

老师示例 `b1_adc` 使用以下读取方式，作为 API 依据：

```c
#define ADC_CHANNEL 5
LzSaradcReadValue(ADC_CHANNEL, &data);
voltage = data * 3.3 / 1024.0;
```

原理图给出的四个按键电压档位约为：

```text
0.01 V, 0.55 V, 1.00 V, 1.65 V
```

当前文档不臆测这四个电压档位与 `K3-K6` 标签的顺序；首次上板时
先记录每个实体按键的 ADC 原始值和电压，再固化对应关系。

## 3. 实现方案

### 3.1 ADC 读取

源码使用板级 SAR ADC API，不使用 `IoTGpioGetInputVal()` 读取四个用户
按键，因为它们不是四路独立数字 GPIO：

- 配置/使用 `GPIO0_PC5` 对应的 `USER_KEY_ADC`；
- 通过 `LzSaradcReadValue(5, &data)` 读取 ADC 原始值；
- 按 `data * 3.3 / 1024.0` 换算电压；
- 输出原始值、电压和当前识别状态，便于首次标定。

程序先提供稳定的电压档位识别和 `UNKNOWN/RELEASED` 分支。四个电压
档位与 `K3-K6` 的实际标签对应关系由板上采样记录确认后写入配置和
README，不把猜测当成硬件事实。

### 3.2 软件消抖

任务每 20 ms 读取一次 ADC。只有连续 3 次读数落入同一档位，才接受为
新的稳定状态，相当于约 60 ms 的软件消抖。电压处于两个档位之间、
超出范围或 ADC 读取失败时进入 `UNKNOWN`，并打印原始值与错误信息。

### 3.3 任务接入

使用 `APP_FEATURE_INIT(gpio_example)` 注册自启动任务。构建集成只修改：

- `vendor/lockzhiner/rk2206/samples/BUILD.gn`：加入本实验静态库目标；
- `device/rockchip/rk2206/sdk_liteos/Makefile`：将 `-lgpio_example` 加入最终链接。

不修改 `01_hello_world` 目录，不把两个实验同时接入同一份待烧录固件。

## 4. 错误处理

- 任一 GPIO 初始化、方向配置或读写操作返回失败时，打印明确的 GPIO
  和错误码，并停止本实验任务；
- ADC 原始值无法归入有效档位时记录 `UNKNOWN`；
- 复位键和 `MASKROM` 键不纳入用户按键统计；
- 不在仓库保存完整 OpenHarmony 源码树、镜像、密码或其他运行凭据。

## 5. 测试与验收

### 5.1 自动化测试

在 Windows 仓库中运行 `tests/test_gpio_contract.py`，检查：

- `K1=RESET`、`K2=MASKROM` 不被声明为普通用户按键；
- `K3-K6` 使用 ADC 通道 `5` 和 `GPIO0_PC5`；
- 源码使用 `LzSaradcReadValue()`，不使用数字 GPIO 输入 API 读取电阻梯；
- 电压换算、档位阈值、消抖参数和 `UNKNOWN` 分支存在；
- BUILD 目标和链接补丁内容正确。

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

烧录后通过 UART `115200 8N1` 观察启动和周期采样日志。依次只按
`K3`、`K4`、`K5`、`K6`，记录每个按键稳定后的 ADC 原始值、电压和
程序识别结果；按 `K1` 只用于复位，按 `K2` 只用于进入烧录模式。

板上验收完成后，将实际串口日志、按键电压标定表和用户提供的现象写入
`device/labs/02_gpio/records/`，再更新总流程和进度文档并提交。
