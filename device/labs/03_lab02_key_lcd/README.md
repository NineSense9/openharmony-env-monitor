# 4.6 实验 2：按键 + LCD（lab02_key_lcd）

## 状态

已完成源码、契约测试、Ubuntu 独立工程集成、Pin Sniffer 诊断和 PC7 正式版构建。
此前用户上板反馈 LCD 已正常显示 `LCD OK` 和 `K3: PRESSED`，但 K3-K6 操作没有变化；
旧 GPIO 诊断包持续得到 `K3 raw=0 pressed=1`。2026-09-01 使用 UART-only
Pin Sniffer 后，实物 K3 按下/松开确认 `GPIO0_PC7` 出现 `1->0` 和 `0->1`，
与授课文档 4.6 的 `K3=GPIO0_PC7`、低电平按下相符。

当前正式版已改为对 `GPIO0_PC7` 先尝试 `PinctrlSet(..., MUX_FUNC0, PULL_KEEP,
DRIVE_LEVEL0)`，但该返回值只作为 warning 记录，不再阻断后续 `LzGpioSetDir` 和
`LzGpioGetVal`。用户已上板确认 K3 能在 `RELEASED` 和 `PRESSED` 间切换；随后发现
状态刷新区域覆盖了 `LCD OK` 底部，已将状态行下移并生成新的布局修正版烧录包。

## 课程依据

本实验对应 `D:\实习\doc\授课文档.pdf` 第 4.6 节。老师的 `ohos-training`
只作为流程和 API 参考，K3 驱动和业务入口由本项目自行编写。

PDF 规定的核心流程：

1. 初始化 LCD；
2. 初始化 K3 输入；
3. 显示 4.5 的欢迎文字和初始按键状态；
4. 以 30 ms 周期读取 K3，仅在状态变化时刷新状态行和串口。

## 硬件边界

| 硬件 | 作用 | 本实验处理 |
| --- | --- | --- |
| `K1` | `RESET` | 只用于重启，不作为普通输入 |
| `K2` | `MASKROM` | 只用于进入烧录模式，不作为普通输入 |
| `K3` | 用户按键 | `GPIO0_PC7`，低电平表示按下 |
| LCD | SPI 显示 | 继承 4.5 的 SPI0 M1、PA4 DC 和方向配置 |
| 电机 | PWM6 | `GPIO0_PC6`，本实验禁止访问 |

本实验不初始化或控制 RGB 灯、报警灯、电机、MQ2、SHT30、光敏和其他传感器。

K4、K5、K6 虽然印在板上，但按 PDF 4.3 本课程例程不使用它们，因此本实验不会对
K4-K6 输出状态或更新 LCD。它们属于当前实验的硬件边界，不是本次 K3 诊断的失败证据。

## 源码结构

- `lab02_key_lcd.c`：LiteOS-M 任务、LCD 显示和 K3 状态变化处理；
- `include/board_pins.h`：`TX_KEY_K3` 引脚宏；
- `include/tx_key.h`：K3 驱动接口；
- `src/tx_key.c`：GPIO 初始化、输入读取和低电平按下判断；
- `include/lcd.h`、`include/lcd_font.h`、`src/lcd.c`：从 4.5 原样继承的 LCD 基线；
- `BUILD.gn`：`lab02_key_lcd` 独立静态库；
- `patches/README.md`：Ubuntu 工程复制、集成和构建说明；
- `tests/test_lab02_key_lcd_contract.py`：6 项自动化契约测试；
- `records/`：TDD、构建、烧录和 UART 记录。

## 业务行为

启动时显示：

```text
TX-SMART-R Lab01
LCD OK
OpenHarmony
K3: RELEASED
```

K3 按下时状态行变为 `K3: PRESSED`，松开后恢复 `K3: RELEASED`。UART 预期同步
输出：

```text
lab02_key_lcd: K3=RELEASED
lab02_key_lcd: K3=PRESSED
lab02_key_lcd: K3=RELEASED
```

程序每 30 ms 轮询一次，但只有状态变化才擦除 `(10,90)-(300,120)` 并重画状态行，
避免持续整屏刷新。GPIO 初始化或方向设置失败时打印错误并退出初始化；GPIO 读取
失败时显示 `K3: READ ERR`、打印错误并每 100 ms 重试，读取恢复后继续处理按键，
不会把读取失败误报成按下。诊断包每 500 ms 输出一次
`lab02_key_lcd: K3 raw=%u pressed=%u`，用于确认 PC7 的原始电平是否随实体按键变化。

## 自动化验证

在 Windows 仓库执行：

```powershell
cloud_ecs\.venv\Scripts\python.exe -m pytest device\labs\03_lab02_key_lcd\tests -q
```

当前源码契约测试覆盖正式 LCD+K3、ADC5+PC7 双通道诊断和 Pin Sniffer 诊断，结果为
`15 passed`。

## 构建记录

Ubuntu 独立工程：

```text
/home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
```

构建前固定执行：

```bash
cd /home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
export PATH="/home/lzdz/.local/bin:/usr/bin:$PATH"
command -v hb
hb --help | head
hb env
hb build
```

本次 `hb env` 已确认 root、product path 和 device path 均指向 4.6 独立工程；
构建完成 `852/852`，输出 `lockzhiner-rk2206 build success`，退出码为 0。
历史构建排错见
[2026-08-31-build-troubleshooting.md](records/2026-08-31-build-troubleshooting.md)，
当前 ADC5 构建和产物同步见 [2026-09-01-build.md](records/2026-09-01-build.md)，
历史校验值见 [2026-08-31-build.md5](records/2026-08-31-build.md5)，当前校验值见
[2026-09-01-build.md5](records/2026-09-01-build.md5)。

初始构建的镜像和 Loader 已复制到独立目录，作为历史基线保留：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_20260831
```

该初始包的 `Firmware.img` MD5 为
`5ed8e34a6069dee30ebd8bd83bf90919`，Loader MD5 为
`5f2ea974b0e1df5564a8e1ee910627bb`。

此前的 K3 读取失败重试包单独保存到：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_retry_20260831
```

该包使用了错误的 `PULL_KEEP` 配置；实物 UART 已确认
`K3 pinctrl failed ret=1`，因此标记为作废，仅保留用于故障记录。其
`Firmware.img` MD5 为 `df7f5e3fbb3926bcbc08e3d657453a59`，不能继续使用。

此前的 `PULL_UP` 作废包单独保存到：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_pullup_20260831
```

该包在实物上仍输出 `K3 pinctrl failed ret=1`，现标记为作废，仅保留用于排错记录。

此前的无额外 pinctrl 基线包单独保存到：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_no_pinctrl_20260831
```

该目录中的 `rk2206_db_loader.bin` 和 `Firmware.img` 仍保留用于回退对照，但当前
不要用它做 K3 诊断。该包的
`Firmware.img` MD5 为 `4bcd54b6926794a78620fd7c30f64abf`，Loader MD5 为
`5f2ea974b0e1df5564a8e1ee910627bb`。烧录前必须核对这两个值，不能使用初始包、
`retry` 包或 `pullup` 包。

该基线依据 PDF 4.6：`GPIO0_PC7` 只执行 `LzGpioInit` 和
`LzGpioSetDir(..., LZGPIO_DIR_IN)`，不对 K3 额外调用 `PinctrlSet`。新 ELF 和
`Firmware.img` 中均已确认不存在 `K3 pinctrl failed` 字符串。

## 诊断构建和实物结论

Ubuntu 工程：

```text
/home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
```

构建前执行：

```bash
cd /home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
export PATH="/home/lzdz/.local/bin:/usr/bin:$PATH"
command -v hb
hb --help | head
hb env
hb build
```

ADC5+PC7 输入矩阵诊断曾只启用 `lab02_key_lcd_adc_diagnostic`：

- samples 的 GN 特性加入
  `"./lab02_key_lcd/diagnostics/adc5_key_lcd:lab02_key_lcd_adc_diagnostic",`；
- 最终链接使用 `-llab02_key_lcd_adc_diagnostic`，移除旧的业务库；
- `main.c` 不手动调用任何实验入口，唯一入口是
  `APP_FEATURE_INIT(adc5_key_lcd_example)`。

初始烧录文件单独保存到：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_20260831
```

双通道输入矩阵诊断包保留在：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_input_matrix_20260901
```

- `Firmware.img` MD5：`ab8ee95e8d116c0705a46409baba77b0`；
- `rk2206_db_loader.bin` MD5：`5f2ea974b0e1df5564a8e1ee910627bb`。

该 `Firmware.img` 已在 Ubuntu 和 Windows 两侧确认包含
`K3_GPIO=GPIO0_PC7`、`ADC5 raw=`、`PC7 raw=`，且不包含旧
`key=KEY_UNKNOWN`。旧目录
`D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_diagnostic_20260831` 的
`Firmware.img` MD5 为 `35a412a1ef7e220efbf14bbc843994af`，只作为历史错误同步记录保留，
不要继续烧录。

Pin Sniffer UART-only 诊断包保留在：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_pin_sniffer_20260901
```

- `Firmware.img` MD5：`4824acbf9b81ae8b37cf6fcceb1e499a`；
- `rk2206_db_loader.bin` MD5：`5f2ea974b0e1df5564a8e1ee910627bb`。

实物 UART 已确认：不按键时 `ADC3` 有约 `410-458` raw 的持续噪声，不能作为按键依据；
K3 按下/松开时 `GPIO0_PC7` 出现 `1->0` 与 `0->1`，因此 K3 正式逻辑仍按 PDF 使用
`GPIO0_PC7`。K4、K5、K6 的截图中也出现过 `GPIO0_PA3` 或 `GPIO0_PC7` 边沿，但当前
4.6 实验只验收 K3，这些多按键线索先记录，不固化进正式业务。

## 当前正式构建和烧录

此前已验证 K3 可切换的正式包保留在：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_pc7_pinctrl_20260901
```

- `Firmware.img` MD5：`9e5424c182a0f2e5fa8d488587edc987`；
- `rk2206_db_loader.bin` MD5：`5f2ea974b0e1df5564a8e1ee910627bb`。

该 `Firmware.img` 已在 Ubuntu 和 Windows 两侧确认包含
`lab02_key_lcd: K3 raw=`、`lab02_key_lcd: K3=`、`lab02_key_lcd: K3 pinctrl warn`，
且不包含 `PIN_SNIFFER_READY`、`ADC5 raw` 和 `key=KEY_UNKNOWN`。构建和同步记录见
[2026-09-01-pc7-formal-build.md](records/2026-09-01-pc7-formal-build.md)。

当前唯一推荐烧录的是新的 LCD 布局修正版，只使用以下目录中的两个文件：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_pc7_layout_20260901
```

- `Firmware.img` MD5：`483bf670889e886a2ce373ccf0b3aa53`；
- `rk2206_db_loader.bin` MD5：`5f2ea974b0e1df5564a8e1ee910627bb`。

布局修正版将 `K3` 状态行下移到 `y=160`，擦除区改为 `y=152-184`，不再覆盖
`LCD OK` 和 `OpenHarmony`。该 `Firmware.img` 已确认包含正式 K3 字符串，且不包含
Pin Sniffer 或 ADC5 诊断签名。构建和同步记录见
[2026-09-01-pc7-layout-build.md](records/2026-09-01-pc7-layout-build.md)。

按 PDF 使用 `K2=MASKROM` 进入下载模式；完成后退出下载模式，再使用 `K1=RESET`
重启。UART 使用 `115200 8N1`。重启后先确保 K3 松开，观察 `K3: RELEASED` 与
`K3 raw=1 pressed=0`；随后按住 K3 约 2 秒，应变为 `K3: PRESSED` 与
`K3 raw=0 pressed=1`；松开后应恢复。不要用 K1 做按键测试，K1 是 RESET。

## 验收清单

- [ ] UART 出现 LCD 初始化成功和原始 `K3 raw=... pressed=...` 诊断输出；
- [ ] 按住 K3 后 UART 和 LCD 显示 `K3=PRESSED`；
- [ ] 松开 K3 后 UART 和 LCD 恢复 `K3=RELEASED`；
- [ ] 原始 PC7 电平随 K3 操作在 `1` 和 `0` 之间变化；
- [ ] 电机保持静止，没有重复启动或异常抖动；
- [ ] 实际 UART 输出保存到 `records/2026-09-01-pc7-formal-uart.txt` 后再提交验收记录。

当前已完成源码、自动化测试和布局修正版正式固件构建；最终布局仍待用户烧录
`lab03_lab02_key_lcd_pc7_layout_20260901` 后确认 `LCD OK` 不再被状态行影响。
本次 Pin Sniffer 复测记录见
[2026-09-01-pin-sniffer-build.md](records/2026-09-01-pin-sniffer-build.md)。
