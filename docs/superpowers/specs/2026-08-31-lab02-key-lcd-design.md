# 4.6 lab02_key_lcd Design

> This specification is for the PDF-defined 4.6 experiment. The earlier
> `gpio-design` ADC proposal is explicitly obsolete and is not an input to this
> experiment.

**Goal:** 在独立实验目录中完成授课文档第 4.6 节的 K3 按键 + LCD 实验，验证
`GPIO0_PC7` 按下/松开状态能够同步显示到 LCD 和 UART。

**Architecture:** 以 4.5 的 LCD 可运行基线为基础，复制独立的 LCD API、驱动和
字体文件；新增只负责 K3 输入的 `tx_key` 驱动。业务任务先初始化 LCD 和 K3，
显示 4.5 的欢迎文字，然后以 30 ms 周期读取 K3，仅在稳定状态变化时擦除并重画
状态行，避免重复整屏刷新。K1 只作为 RESET、K2 只作为 MASKROM，不声明为普通
按键；本实验不初始化电机、RGB、报警灯或任何传感器。

**Tech Stack:** C、OpenHarmony LiteOS-M、RK2206 GPIO、LCD SPI 驱动、GN、
Makefile、Python `pytest`、UART 115200 8N1。

## 1. PDF 依据与硬件边界

- 授课文档：`D:\实习\doc\授课文档.pdf` 第 4.6 节；
- K3：`GPIO0_PC7`，按下时为低电平；
- K1：`RESET`，不参与普通按键读取；
- K2：`MASKROM`，不参与普通按键读取；
- LCD：沿用 4.5 的 SPI0 M1、PA4 DC、PC0/PC1/PC2/PC3 和当前可运行方向配置；
- 电机 PWM6：`GPIO0_PC6`，本实验禁止访问；
- 轮询周期：30 ms；
- 验收状态：松开显示 `K3: RELEASED`，按下显示 `K3: PRESSED`，UART 同步打印。

## 2. 文件边界

实验目录为 `device/labs/03_lab02_key_lcd/`：

- `lab02_key_lcd.c`：LiteOS-M 任务、自启动入口和按键状态显示逻辑；
- `include/board_pins.h`：K3 引脚宏；
- `include/tx_key.h`：K3 驱动接口；
- `src/tx_key.c`：GPIO 初始化、输入读取和低电平按下判断；
- `include/lcd.h`、`include/lcd_font.h`、`src/lcd.c`：4.5 LCD 基线副本；
- `BUILD.gn`：独立静态库目标；
- `patches/README.md`：Ubuntu 独立工程复制、集成和清理规则；
- `tests/test_lab02_key_lcd_contract.py`：源码和构建契约测试；
- `records/`：TDD、构建、镜像校验和 UART/物理验收记录。

## 3. 数据流与错误处理

1. `lab02_key_lcd_example` 由 `APP_FEATURE_INIT` 自动启动唯一任务；
2. 任务调用 `lcd_init()`，失败时打印错误并退出，不继续访问 LCD；
3. 任务调用 `tx_key_init(GPIO0_PC7)`，GPIO 初始化或输入方向设置失败时打印
   错误码并退出；
4. 任务绘制欢迎文字和初始 `RELEASED` 状态；
5. 循环调用 `tx_key_is_pressed()`，读取失败时返回错误状态并打印一次诊断信息，
   不把读取失败误报成按下；
6. 只有当前状态与上次状态不同才执行 `lcd_fill(10, 90, 300, 120, LCD_WHITE)`、
   `lcd_show_string()` 和 UART 状态输出；
7. 每次循环调用 `LOS_Msleep(30)`，不使用忙等，不访问 PWM6。

## 4. 测试与验收

自动化契约测试必须覆盖：

- `GPIO0_PC7`、`LzGpioInit`、`LzGpioSetDir(..., LZGPIO_DIR_IN)`、
  `LzGpioGetVal` 和低电平按下判断；
- 主任务包含 LCD 初始化、K3 初始化、状态变化条件、30 ms 延时和唯一自启动；
- 源码不使用 ADC 读取 K3，不访问 `GPIO0_PC6`，不声明 K1/K2 为普通按键；
- GN 目标、LCD 驱动和 `tx_key.c` 均在独立库中；
- 集成说明只启用 `-llab02_key_lcd`，清除 4.5 的 `-llab01_lcd`，不同时运行两个实验。

Ubuntu 构建必须在独立工程中执行，并记录 `hb env`、`hb build` 输出、产物大小、
MD5 和镜像目录。物理验收时按 PDF 使用 K2 进入烧录模式，完成后退出下载模式并
按 K1 重启；UART 使用 115200 8N1，依次松开、按下、松开 K3，确认屏幕和串口均
出现对应状态，且电机保持静止。

## 5. 继承与后续

当前 LCD 方向倒置是 4.5 已知且暂不阻塞的问题；4.6 不再修改方向寄存器或 LCD
初始化流程。后续 4.7 以本实验的 K3 驱动为基础新增报警灯，不回写或覆盖 4.5、
4.6 的独立目录。
