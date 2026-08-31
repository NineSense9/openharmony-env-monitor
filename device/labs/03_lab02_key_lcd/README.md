# 4.6 实验 2：按键 + LCD（lab02_key_lcd）

## 状态

已完成源码、契约测试和独立构建，等待烧录后的 K3 实物验收。当前镜像会继承
4.5 的 LCD 方向：屏幕能够显示内容，但文字仍从右下角倒置显示；本实验不修改
LCD 初始化或方向寄存器，先验证 PDF 规定的 K3 按键状态链路。

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

## 源码结构

- `lab02_key_lcd.c`：LiteOS-M 任务、LCD 显示和 K3 状态变化处理；
- `include/board_pins.h`：`TX_KEY_K3` 引脚宏；
- `include/tx_key.h`：K3 驱动接口；
- `src/tx_key.c`：GPIO 初始化、输入读取和低电平按下判断；
- `include/lcd.h`、`include/lcd_font.h`、`src/lcd.c`：从 4.5 原样继承的 LCD 基线；
- `BUILD.gn`：`lab02_key_lcd` 独立静态库；
- `patches/README.md`：Ubuntu 工程复制、集成和构建说明；
- `tests/test_lab02_key_lcd_contract.py`：4 项自动化契约测试；
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
避免持续整屏刷新。GPIO 初始化、方向设置或读取失败时打印错误并停止错误路径，
不会把读取失败误报成按下。

## 自动化验证

在 Windows 仓库执行：

```powershell
cloud_ecs\.venv\Scripts\python.exe -m pytest device\labs\03_lab02_key_lcd\tests -q
```

当前源码契约测试结果：`4 passed`。

## 构建记录

Ubuntu 独立工程：

```text
/home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
```

构建前固定执行：

```bash
cd /home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
export PATH="/home/lzdz/.local/bin:$PATH"
command -v hb
hb --help | head
hb env
hb build
```

本次 `hb env` 已确认 root、product path 和 device path 均指向 4.6 独立工程；
构建完成 `853/853`，输出 `lockzhiner-rk2206 build success`，退出码为 0。
预检和最终增量构建输出见 [2026-08-31-build.log](records/2026-08-31-build.log)，
853 步全量构建输出见 [2026-08-31-build-full.log](records/2026-08-31-build-full.log)，
校验值见 [2026-08-31-build.md5](records/2026-08-31-build.md5)，构建排错见
[2026-08-31-build-troubleshooting.md](records/2026-08-31-build-troubleshooting.md)。

镜像和 Loader 已复制到独立目录：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_20260831
```

烧录前核对 `2026-08-31-build.md5`。本目录中的 `Firmware.img` MD5 为
`5ed8e34a6069dee30ebd8bd83bf90919`，Loader MD5 为
`5f2ea974b0e1df5564a8e1ee910627bb`。

## 独立构建和烧录

Ubuntu 工程：

```text
/home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
```

构建前执行：

```bash
cd /home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
export PATH="/home/lzdz/.local/bin:$PATH"
command -v hb
hb --help | head
hb env
hb build
```

只启用 `lab02_key_lcd`：

- samples 的 GN 特性加入 `"./lab02_key_lcd:lab02_key_lcd",`；
- 最终链接使用 `-llab02_key_lcd`，移除 `-llab01_lcd`；
- `main.c` 不手动调用任何实验入口，唯一入口是
  `APP_FEATURE_INIT(lab02_key_lcd_example)`。

烧录文件单独保存到：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_20260831
```

烧录时只使用该目录中的 `rk2206_db_loader.bin` 和 `Firmware.img`，按 PDF 使用
`K2=MASKROM` 进入下载模式；完成后退出下载模式，再使用 `K1=RESET` 重启。
UART 使用 `115200 8N1`。烧录前核对 `records/2026-08-31-build.md5` 中的 MD5。

## 验收清单

- [ ] UART 出现 LCD 初始化成功和初始 `K3=RELEASED`；
- [ ] 按住 K3 后 UART 和 LCD 显示 `K3=PRESSED`；
- [ ] 松开 K3 后 UART 和 LCD 恢复 `K3=RELEASED`；
- [ ] 电机保持静止，没有重复启动或异常抖动；
- [ ] 实际 UART 输出保存到 `records/2026-08-31-uart.txt` 后再提交验收记录。

当前仅完成源码、自动化测试和固件构建；上板验收仍待实际烧录后确认。
