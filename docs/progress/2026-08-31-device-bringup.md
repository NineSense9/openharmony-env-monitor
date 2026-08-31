# 2026-08-31 南向开发进度记录

## 目标

完成授课文档 3.4 至 3.9 的环境准备、基础固件编译、烧录和串口启动验证，为后续独立实验建立可复现基线。

## 完成情况

### 3.4 准备源码

在 Ubuntu 中克隆：

```text
https://gitee.com/Lockzhiner-Electronics/lockzhiner-rk2206-openharmony3.0lts.git
```

源码目录：

```text
/home/lzdz/rk2206/lockzhiner-rk2206-openharmony3.0lts
```

设置 `OHOS_ROOT` 后完成源码完整性检查，确认存在 `build`、`device`、`vendor`、`kernel`、`applications` 以及 RK2206 示例目录。

### 3.5 安装 `hb`

在源码根目录执行 `pip3 install --user build/lite`，安装成功：

```text
ohos-build==0.4.3
hb -> /home/lzdz/.local/bin/hb
```

### 3.6 编译

执行 `hb set` 选择 `lockzhiner` 和 `lockzhiner-rk2206`，再执行 `hb build -f`。编译结果：

```text
lockzhiner-rk2206 build success
cost time: 0:00:45
```

生成文件：

```text
Firmware.img
Firmware.md5
rk2206_db_loader.bin
```

### 3.8 烧录

Windows 使用 RKDevTool v2.63，Loader 和 Firmware 分别加载：

```text
D:\实习\tmp\rk2206_images\images\rk2206_db_loader.bin
D:\实习\tmp\rk2206_images\images\Firmware.img
```

工具日志显示：

```text
正在下载 Firmware... (100%)
正在校验 Firmware... (100%)
下载完成
```

烧录前后 `Firmware.img` 的 MD5 均为：

```text
8b4f88c7c3bf8dbbc63241a5eda00944
```

### 3.9 串口调试

烧录完成后板子退出 MASKROM，恢复为 `USB-SERIAL CH340 (COM5)`。UART 使用 `115200 8N1`、无流控，串口观察到：

```text
entering kernel init...
hiview will init.
[MAIN:D]Main: LOS_Start ...
Entering scheduler
OHOS # hiview init success.
```

## 结论

本日已完成南向基础环境、基础固件编译、烧录和 OpenHarmony 内核启动验证。当前固件只作为启动基线，尚未接入本项目的传感器、云端和远程控制业务。

## 下一步

进入 `device/labs/01_hello_world/`，已保留独立源码和补丁并完成编译、烧录
和 UART 验收。根据《授课文档.pdf》第四章，下一步改为
`02_lab01_lcd`（4.5 实验 1：LCD），不能按旧的 ADC/GPIO 推断方案推进。

## 01_hello_world 编译检查点

- 独立 worktree：`/home/lzdz/rk2206/lab01-hello-world-20260831`
- 补丁检查通过；
- `libtask_helloworld.a` 已生成并参与链接；
- `lockzhiner-rk2206 build success`；
- `Firmware.img` MD5：`5561e5deaf9c36a34fc9860c5cb5f52b`；
- 实验镜像已烧录；
- UART 已确认 `Hello World` 约每 1 秒输出、`Hello OpenHarmony` 约每 2 秒输出；
- 板载显示屏无输出，确认是因为本实验没有 LCD 初始化和绘图代码。
- 已按授课文档 4.5 创建 `device/labs/02_lab01_lcd/`，完成自有
  `lab01_lcd.c`、LCD 驱动副本、构建说明和 2 个契约测试；
- 本地 LCD 契约测试结果：`2 passed`；
- 已在独立副本 `/home/lzdz/rk2206/lab02-lab01-lcd-20260831` 完成 LCD
  接入和编译，`852/852`，`lockzhiner-rk2206 build success`；
- `liblab01_lcd.a` 已生成并参与链接，镜像字符串已核验包含三行 LCD 文本；
- 初版镜像 MD5：`897213e0d5736f26557ae79566aed371`，因双重启动配置已作废；
- 已删除 `main.c` 手动调用，只保留 PDF 要求的
  `APP_FEATURE_INIT(lab01_lcd_example)`；
- 修复版镜像 MD5：`49841b650f05384a7a614e212c8dab21`；
- 当前待用户使用修复版镜像进行 RKDevTool 烧录和 UART/LCD 实物验收。

详细串口验收记录：
`device/labs/01_hello_world/records/2026-08-31-uart.txt`

### 编译问题记录

第一次构建在最终 `mkimage.sh` 打包阶段失败，错误为
`hb：未找到命令`。检查完整日志后确认，静态库已经编译并参与最终
链接，根因是非交互 SSH 会话的 `PATH` 没有包含
`/home/lzdz/.local/bin`。执行
`export PATH="/home/lzdz/.local/bin:$PATH"` 后重新构建成功。

后续每个实验编译前固定执行：

```bash
export PATH="/home/lzdz/.local/bin:$PATH"
command -v hb
hb --help | head
hb build -f
```

### 4.5 lab01_lcd 初版编译检查点（已作废）

- 独立源码副本：`/home/lzdz/rk2206/lab02-lab01-lcd-20260831`
- 构建日志：`device/labs/02_lab01_lcd/records/2026-08-31-build.log`
- 校验记录：`device/labs/02_lab01_lcd/records/2026-08-31-build.md5`
- Windows 烧录目录：`D:\实习\tmp\rk2206_images\lab02_lab01_lcd`
- Loader：`rk2206_db_loader.bin`，35,093 bytes，
  MD5 `5f2ea974b0e1df5564a8e1ee910627bb`
- 固件：`Firmware.img`，2,097,152 bytes，
  MD5 `897213e0d5736f26557ae79566aed371`（已作废）
- 目标证据：`liblab01_lcd.lab01_lcd.o`、`liblab01_lcd.lcd.o`、
  `liblab01_lcd.a`、`lockzhiner-rk2206 build success`

本实验之前曾出现一次无效构建：独立目录的 `hb` product/device 配置仍指向
原始源码，导致编译成功但没有 `lab01_lcd` 目标。已通过
`hb set -root .`、`hb set -p` 修正，并以 `hb env` 全路径核验后重新编译。
该次无效镜像不得烧录。随后又发现初版 LCD 镜像在 `main.c` 中手动调用
`lab01_lcd_example()`，同时源码使用 `APP_FEATURE_INIT`，因此同一任务有
两个启动入口。该版本与设备异常抖动、LCD 无显示现象对应，已作废。

补丁接入期间还发现手写 unified diff 的 hunk 行数和上下文空格错误。以后
应用补丁前固定执行：

```bash
patch --dry-run --fuzz=0 --forward --batch -p1 < patches/samples_BUILD.gn.patch
patch --dry-run --fuzz=0 --forward --batch -p1 < patches/Makefile.patch
patch --dry-run --fuzz=0 --forward --batch -p1 < patches/main.c.patch
```

三份补丁全部严格通过后才正式应用。

### 4.5 lab01_lcd 单入口修复版

- 修复日志：`device/labs/02_lab01_lcd/records/2026-08-31-build-single-entry.log`
- 修复校验：`device/labs/02_lab01_lcd/records/2026-08-31-build-single-entry.md5`
- 固件：`Firmware.img`，2,097,152 bytes，
  MD5 `49841b650f05384a7a614e212c8dab21`
- Loader：`rk2206_db_loader.bin`，35,093 bytes，
  MD5 `5f2ea974b0e1df5564a8e1ee910627bb`
- 启动入口：`main.c` 无 `lab01_lcd_example()` 手动调用，
  `lab01_lcd.c` 保留 `APP_FEATURE_INIT(lab01_lcd_example)`
- 镜像目录：`D:\实习\tmp\rk2206_images\lab02_lab01_lcd`
- 对应旧镜像已归档到：
  `D:\实习\tmp\rk2206_images\lab02_lab01_lcd_invalid_double_entry_20260831`

### 4.5 lab01_lcd 物理烧录结果与诊断版

用户已确认实际烧录的是上面的单入口修复版镜像，文件和 MD5 均与记录一致，
不是烧录错文件。UART 实际输出：

```text
[GPIO:D]LzGpioInit: id 16 is initialized successfully
[GPIO:D]LzGpioInit: id 17 is initialized successfully
[GPIO:D]LzGpioInit: id 18 is initialized successfully
[GPIO:D]LzGpioInit: id 19 is initialized successfully
[GPIO:D]LzGpioInit: id 22 is initialized successfully
```

随后没有出现 `lab01_lcd: LCD OK`，LCD 也没有变化。由此确认设备已经进入
LCD GPIO 初始化路径，但还没有完成 LCD 初始化和显示流程；本次物理验收暂不记为
通过。板子抖动、RGB 常亮和 LCD 无显示仍需结合下一版日志继续定位。

为采集边界证据，已在同一独立源码副本中增加诊断标记：

```text
LCD_INIT_BEGIN
LCD_GPIO_DONE
LCD_RESET_DONE
LCD_INIT_DONE
LCD_FILL_BEGIN
LCD_FILL_DONE
```

诊断版构建记录：

- 日志：`device/labs/02_lab01_lcd/records/2026-08-31-build-diagnostic.log`
- 校验：`device/labs/02_lab01_lcd/records/2026-08-31-build-diagnostic.md5`
- 镜像目录：`D:\实习\tmp\rk2206_images\lab02_lab01_lcd_diagnostic_20260831`
- `Firmware.img`：2,097,152 bytes，MD5
  `09e5af9c4920155384749bdd32cd5e7e`
- `rk2206_db_loader.bin`：35,093 bytes，MD5
  `5f2ea974b0e1df5564a8e1ee910627bb`
- `hb env` 已确认 root、product path、device path 均指向
  `/home/lzdz/rk2206/lab02-lab01-lcd-20260831`
- 构建结果：`852/852`，`liblab01_lcd.a` 参与链接，
  `lockzhiner-rk2206 build success`

此前下一步曾计划烧录分段刷屏版，实际 UART 已完成全屏进度输出；随后根据
SMART-R 板背面引脚证据定位到 LCD DC/PWM6 冲突，并由下面的修正版替代。

### 4.5 lab01_lcd 分段刷屏版（历史版本）

用户已澄清：诊断版日志停止后，是用户自己按下 `K1=RESET`，并非设备自动
复位。因此当前证据只表示程序在输出 `LCD_FILL_BEGIN` 后仍未完成
`lcd_fill()`，不能把串口断开解释为看门狗或自动重启。

为降低软件模拟 SPI 全屏刷屏时的连续 CPU 占用，历史版在 `src/lcd.c` 的
`lcd_fill()` 行循环中加入：

- 每完成 8 行输出一次 `LCD_FILL_PROGRESS row=.../...`；
- 每完成 8 行调用 `LOS_Msleep(1)`，主动让出 CPU；
- 不改变授课文档 4.5 的 `lcd_init()` → 全屏 `lcd_fill()` →
  `lcd_show_string()` → `LOS_Msleep(1000)` 流程；
- `lab01_lcd` 仍不初始化或控制电机、蜂鸣器、RGB、报警灯。

历史版构建与校验：

- 本地契约测试：`3 passed`；
- 构建日志：`device/labs/02_lab01_lcd/records/2026-08-31-build-yield.log`；
- 构建校验：`device/labs/02_lab01_lcd/records/2026-08-31-build-yield.md5`；
- 烧录目录：`D:\实习\tmp\rk2206_images\lab02_lab01_lcd_yield_20260831`；
- `Firmware.img` MD5：`1060f2209ccb3706c8e2736ff9b67a9a`；
- `rk2206_db_loader.bin` MD5：`5f2ea974b0e1df5564a8e1ee910627bb`；
- 构建结果：`852/852`、`liblab01_lcd.a` 参与链接、
  `lockzhiner-rk2206 build success`。

该目录中的镜像曾用于记录 `LCD_FILL_PROGRESS` 的最后行号、
`LCD_FILL_DONE`、`lab01_lcd: LCD OK` 和 LCD 实际画面，再决定是否需要继续
处理屏幕硬件连线或其他执行器噪声，现已由下面的 SMART-R 引脚修正版替代。

### 4.5 lab01_lcd SMART-R DC 引脚修正版

根据 SMART-R 板背面 LCD 排针丝印和 RK2206 SDK 复用表完成根因修复：

- LCD 排针丝印：`A4 / MISO / MOSI / CLK / CS / GND / 5V`；
- `DC` 改为 `GPIO0_PA4`；`RES/MOSI/CLK/CS` 为 `GPIO0_PC3/PC2/PC1/PC0`；
- SDK 明确 `GPIO0_PC6` 是 `PWM6`，授课文档 4.11 又规定 PWM6 控制 SMART-R
  电机；旧版把 PC6 当 LCD DC，会导致电机持续抖动并让 LCD DC 信号错误；
- 删除只能在刷屏结束后拉低 PC6 的临时 `lcd_set_dc_idle()` 方案；
- 新增回归约束：LCD 驱动必须使用 `GPIO0_PA4`，且不得出现 `GPIO0_PC6`。

本地测试结果：`4 passed`。

Ubuntu 独立工程 `/home/lzdz/rk2206/lab02-lab01-lcd-20260831` 增量构建
结果：`BUILD_RC=0`、`lockzhiner-rk2206 build success`，完成 `20/20`；
`liblab01_lcd.a` 和 `liteos.elf` 均重新生成，ELF 中没有临时函数符号。

修正版产物：

- 烧录目录：`D:\实习\tmp\rk2206_images\lab02_lab01_lcd_smart_r_a4_20260831`；
- `Firmware.img` MD5：`3fad85ef9a94dc22a831c5b7659149d6`；
- `rk2206_db_loader.bin` MD5：`5f2ea974b0e1df5564a8e1ee910627bb`；
- 记录：`device/labs/02_lab01_lcd/records/2026-08-31-build-smart-r-a4.md5`；
- 状态：等待重新烧录，尚未完成 LCD 和电机的物理验收。

本次构建问题：全量 `hb build -f` 曾在 VirtualBox/Hyper-V 环境触发 Ubuntu
soft lockup；后续采用已生成构建树的增量 `hb build`。此外，远端入口曾残留
已删除的 `lcd_set_dc_idle()` 调用，导致链接 `undefined reference`；已经通过
分别同步 `lab01_lcd.c`、`include/lcd.h` 和 `src/lcd.c` 并做符号 grep 检查修复。

### 4.5 lab01_lcd 竖屏 + 硬件 SPI 修正版（2026-08-31）

用户已完成上一版 `SMART-R A4 DC` 镜像的实物确认：电机已经停止抖动，LCD
已经显示三行正常信息，但画面方向反了且刷屏速度较慢。根因分别是旧版
`USE_HORIZONTAL=2` 的横屏 `MADCTL=0x70` 与 LCD 安装方向不一致，以及旧版
`LCD_ENABLE_SPI=0` 使用逐位 GPIO 模拟 SPI。

本次修改：

- `include/lcd.h` 设置 `USE_HORIZONTAL=0`，LCD 尺寸恢复为 `240x320` 竖屏；
- `src/lcd.c` 启用 SDK SPI0 M1 硬件接口，保持 `PC0/PC1/PC2/PC3` 的
  `CS/CLK/MOSI/RES` 映射和已验证的 `PA4` DC；
- 硬件 SPI 使用 `SPI_MODE_0`，与原软件模拟 SPI 的上升沿采样时序一致；
- `lcd_fill()` 每行批量发送 RGB565 数据，局部填充按实际矩形宽度发送，兼容后续
  实验局部擦除文字；
- 保持不使用 `GPIO0_PC6`，防止重新占用 SMART-R 电机 PWM6。

验证结果：本地契约测试 `5 passed`；Ubuntu 独立工程
`/home/lzdz/rk2206/lab02-lab01-lcd-20260831` 构建成功，输出
`lockzhiner-rk2206 build success`，`liblab01_lcd.a` 参与链接。

新镜像单独保存，不覆盖历史版本：

- 目录：`D:\实习\tmp\rk2206_images\lab02_lab01_lcd_portrait_hwspi_20260831`；
- `Firmware.img`：2,097,152 bytes，MD5：`7dcff693bfe9fdfe61ba579a2377142d`；
- `rk2206_db_loader.bin`：35,093 bytes，MD5：`5f2ea974b0e1df5564a8e1ee910627bb`；
- 构建日志：`device/labs/02_lab01_lcd/records/2026-08-31-build-portrait-hwspi.log`；
- 详细记录：`device/labs/02_lab01_lcd/records/2026-08-31-build-portrait-hwspi.md5`。

该版本尚未完成物理验收。烧录后应记录 UART 的 `lab01_lcd: LCD OK`，确认文字
方向正常、全屏刷屏速度提升且电机保持静止。烧录仍按 PDF：`K2=MASKROM`，烧录
完成退出下载模式后用 `K1=RESET` 重启。

### 4.5 lab01_lcd 竖屏 180° 方向修正版（2026-08-31）

用户反馈上一版 `USE_HORIZONTAL=0` 镜像已实际烧录，显示内容与硬件 SPI 运行
正常，电机也没有重新抖动，但文字起始位置仍在 LCD 右下角。该反馈排除了
“没有切换到硬件 SPI”的可能，说明 LCD 控制器的物理原点相对普通竖屏方向反向。

本次只调整方向参数：

- `USE_HORIZONTAL` 从 `0` 改为 `1`；
- 现有方向分支由此发送 `MADCTL=0xC0`，即竖屏 180° 旋转；
- 硬件 SPI、`SPI_MODE_0`、PA4 DC、SPI0 M1 和逐行批量刷屏保持不变。

本地方向契约测试先在旧值 `0` 上失败，改为 `1` 后 `5 passed`。Ubuntu 独立工程
预检确认使用 `USE_HORIZONTAL=1` 后构建成功，输出
`lockzhiner-rk2206 build success`，`liblab01_lcd.a` 参与链接。

新镜像独立保存：

- 目录：`D:\实习\tmp\rk2206_images\lab02_lab01_lcd_portrait_reverse_hwspi_20260831`；
- `Firmware.img`：2,097,152 bytes，MD5：`a0035dd02c5af006199a483883e7c5be`；
- `rk2206_db_loader.bin`：35,093 bytes，MD5：`5f2ea974b0e1df5564a8e1ee910627bb`；
- 构建日志：`device/labs/02_lab01_lcd/records/2026-08-31-build-portrait-reverse.log`；
- 详细记录：`device/labs/02_lab01_lcd/records/2026-08-31-build-portrait-reverse.md5`。

当前等待该版本的实物验收，重点确认文字是否从 LCD 左上角开始、方向是否正常，
同时确认刷屏速度和电机状态保持正确。烧录仍按 PDF 使用 `K2=MASKROM`，完成后
退出下载模式并用 `K1=RESET` 重启。

### 4.5 lab01_lcd 横屏方向 3 修正版（2026-08-31）

用户实际烧录 `USE_HORIZONTAL=1` 的镜像后反馈显示仍在屏幕右下角且方向反了，
并提供了板上原厂程序截图作为正确显示位置参照。重新对照授课 PDF 第 4.4.2、
4.5 节后确认：SMART-R 这块 LCD 的课程公共坐标是横屏 `320x240`，前面将问题
误判为竖屏 180°，因此 `USE_HORIZONTAL=0/1` 均不是正确的适配方向。

本次修复：

- `include/lcd.h` 恢复横屏 `LCD_W=320`、`LCD_H=240`，设置 `USE_HORIZONTAL=3`；
- 现有 `lcd_init()` 方向分支因此发送横屏 `MADCTL=0xA0`，与此前方向 2 的
  `MADCTL=0x70` 成对切换；
- DC=`GPIO0_PA4`、SPI0 M1、`SPI_MODE_0`、逐行批量刷屏和不触碰电机 PWM6 的
  修复全部保持不变。

本地契约测试结果：`5 passed`。Ubuntu 独立工程
`/home/lzdz/rk2206/lab02-lab01-lcd-20260831` 增量构建成功，输出
`lockzhiner-rk2206 build success`，并确认 `liblab01_lcd.a` 重新参与链接。

新镜像单独保存：

- 目录：`D:\实习\tmp\rk2206_images\lab02_lab01_lcd_landscape_orientation3_hwspi_20260831`；
- `Firmware.img`：2,097,152 bytes，MD5：`e658972f997d43bb16d056fc6eb329c1`；
- `rk2206_db_loader.bin`：35,093 bytes，MD5：`5f2ea974b0e1df5564a8e1ee910627bb`；
- 构建日志：`device/labs/02_lab01_lcd/records/2026-08-31-build-landscape-orientation3.log`；
- 详细记录：`device/labs/02_lab01_lcd/records/2026-08-31-build-landscape-orientation3.md5`。

当前仍待实物验收，不能在用户烧录确认前标记 LCD 方向已修复。验收时按 PDF 使用
`K2=MASKROM`，烧录结束退出下载模式后用 `K1=RESET` 重启，并按板子正常正向摆放
确认文字是否从 LCD 左上角开始。

### 4.5 lab01_lcd 横屏方向 3 硬件 SPI 模式 3 修正版（2026-08-31）

用户烧录上一版横屏方向 3 镜像后再次确认 LCD 从右下角开始。前面只调整
`MADCTL` 的方向值没有解决问题，因此继续对比底层实现。SDK 原始 `b4_lcd`
的硬件 SPI 配置明确使用 `SPI_MODE_3`，项目上一版却依据 GPIO 模拟 SPI 的边沿
直觉使用了 `SPI_MODE_0`。在 RK2206 硬件 SPI 抽象层中这两个配置不能直接等同，
模式 0 可能造成初始化命令中的方向配置没有被 LCD 可靠接收。

本次只恢复硬件 SPI 模式：

- `src/lcd.c` 的 `m_spiConf.mode` 从 `SPI_MODE_0` 改为 SDK 参考的 `SPI_MODE_3`；
- `USE_HORIZONTAL=3`、`LCD_W=320`、`LCD_H=240`、PA4 DC、SPI0 M1、50 MHz、
  批量逐行刷屏和唯一启动入口均保持不变。

本地 TDD 契约先在旧模式上失败（`1 failed, 4 passed`），恢复模式 3 后为
`5 passed`。Ubuntu 独立工程重新构建成功，输出
`lockzhiner-rk2206 build success`，退出码 0。

新镜像单独保存：

- 目录：`D:\实习\tmp\rk2206_images\lab02_lab01_lcd_landscape_orientation3_hwspi_mode3_20260831`；
- `Firmware.img` MD5：`6d3cf42e42146864862b0e8fdb8d2f38`；
- `rk2206_db_loader.bin` MD5：`5f2ea974b0e1df5564a8e1ee910627bb`；
- 构建日志：[2026-08-31-build-landscape-orientation3-mode3.log](../../device/labs/02_lab01_lcd/records/2026-08-31-build-landscape-orientation3-mode3.log)；
- 详细记录：[2026-08-31-build-landscape-orientation3-mode3.md5](../../device/labs/02_lab01_lcd/records/2026-08-31-build-landscape-orientation3-mode3.md5)。

当前仍待用户物理验收，不能提前标记方向已修复。烧录仍按 PDF 使用 `K2=MASKROM`，
完成后退出下载模式并按 `K1=RESET`，记录 UART、LCD 方向和电机状态。

### 4.5 lab01_lcd 正常横屏 `MADCTL=0x60` 修正版（2026-08-31）

用户烧录 `SPI_MODE_3` + `MADCTL=0xA0` 版本后确认画面仍从右下角开始，并从下往上
加载。该现象与 `0xA0` 的反向横屏扫描一致。本次将默认配置改为
`USE_HORIZONTAL=2`，发送正常横屏 `MADCTL=0x60`，其他引脚、SPI 模式和刷屏逻辑不变。

本地契约测试为 `5 passed`，Ubuntu 独立工程构建成功。当前待用户烧录确认。
