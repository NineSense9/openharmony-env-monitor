# 4.6 K3=PC7 LCD 布局修正版构建记录（2026-09-01）

## 实物反馈

用户烧录 `lab03_lab02_key_lcd_pc7_pinctrl_20260901` 后，LCD 已能在 K3 松开/按下时切换：

```text
K3: RELEASED
K3: PRESSED
```

这确认了 K3 调用方式可用：`GPIO0_PC7`，低电平为按下。该调用方式保存在
`include/board_pins.h`、`include/tx_key.h` 和 `src/tx_key.c`，后续实验继续复用。

同时照片显示 `K3` 状态行位于 `LCD OK` 和 `OpenHarmony` 之间，刷新擦除区会影响
`LCD OK` 底部。旧坐标为：

```text
LCD OK: y=80
K3:    y=96
擦除区: y=90-120
```

旧擦除区和状态行与 `LCD OK` 有重叠。

## 修复

新增 LCD 文字坐标常量：

```c
#define LCD_TEXT_X 10
#define LCD_TITLE_TEXT_Y 40
#define LCD_OK_TEXT_Y 80
#define LCD_OPENHARMONY_TEXT_Y 120
#define LCD_K3_STATUS_TEXT_Y 160
#define LCD_STATUS_CLEAR_Y0 152
#define LCD_STATUS_CLEAR_Y1 184
```

状态行下移到 `y=160`，只擦除 `y=152-184`，不再覆盖 `LCD OK` 或 `OpenHarmony`。
业务逻辑、K3 管脚和 UART 诊断不变。

## 本地测试

先更新契约测试，禁止旧擦除区 `(10,90)-(300,120)`，并要求 K3 状态行使用独立坐标。
实现前单测红灯：

```text
FAILED test_key_lcd_task_reports_only_changed_k3_state
assert '#define LCD_OK_TEXT_Y 80' in source
1 failed, 5 passed
```

实现后单测：

```text
6 passed in 0.02s
```

## 构建链路

Ubuntu 工程：

```text
/home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
```

关键集成保持正式版：

- `vendor/lockzhiner/rk2206/samples/BUILD.gn` 启用 `./lab02_key_lcd:lab02_key_lcd`；
- `device/rockchip/rk2206/sdk_liteos/Makefile` 使用 `-llab02_key_lcd`；
- 构建日志出现 `liblab02_key_lcd.lab02_key_lcd.o`、`liblab02_key_lcd.tx_key.o`、
  `liblab02_key_lcd.lcd.o` 和 `liblab02_key_lcd.a`。

执行：

```bash
cd /home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
export PATH="/home/lzdz/.local/bin:/usr/bin:$PATH"
hb build -f
```

结果：

```text
[853/853]
lockzhiner-rk2206 build success
cost time: 0:00:19
```

## 烧录目录

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_pc7_layout_20260901
```

| 文件 | 大小 | MD5 |
| --- | ---: | --- |
| `Firmware.img` | 2,097,152 bytes | `483bf670889e886a2ce373ccf0b3aa53` |
| `rk2206_db_loader.bin` | 35,093 bytes | `5f2ea974b0e1df5564a8e1ee910627bb` |
| Ubuntu `liteos.bin` | 560,408 bytes | `60942082ccc3072e373b06d604d61300` |
| Ubuntu `liteos.elf` | 1,498,200 bytes | `d9ae34272edef5eb1246744a0caf6edd` |

Windows 端确认：

```text
lab02_key_lcd: K3 raw          True
lab02_key_lcd: K3=             True
lab02_key_lcd: K3 pinctrl warn True
PIN_SNIFFER_READY              False
ADC5 raw                       False
key=KEY_UNKNOWN                False
```

## 遗留问题

- LCD 物理方向仍继承 4.5 的已知倒置基线，本实验不继续消耗时间处理；
- `PinctrlSet(GPIO0_PC7, MUX_FUNC0, PULL_KEEP, DRIVE_LEVEL0)` 返回值只作为 warning，
  不能作为失败退出条件，原因是早期实物已证明把它当致命错误会阻塞实验；
- Pin Sniffer 中 ADC3 会持续抖动，后续不要把该噪声当按键；
- K4-K6 映射尚未作为正式需求固化，后续若用到多按键，需要用安静版探针重新采集。

## 上板验收

当前只烧录 `lab03_lab02_key_lcd_pc7_layout_20260901` 目录中的 Loader 和 Firmware。
验收点：

- `LCD OK`、`OpenHarmony`、`K3` 三行互不覆盖；
- 松开 K3 时显示 `K3: RELEASED`；
- 按住 K3 时显示 `K3: PRESSED`；
- UART 同步输出 `K3 raw=1 pressed=0`、`K3 raw=0 pressed=1`；
- 电机不振动，RGB/蜂鸣器不作为本实验输出。
