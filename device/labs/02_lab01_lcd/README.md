# 4.5 实验 1：LCD（lab01_lcd）

## 状态

已完成本地契约测试、Ubuntu 独立源码编译和镜像核验，已修复重复启动问题。
用户已确认电机不再抖动，LCD 能显示三行文字，硬件 SPI 已完成切换。此前的
竖屏 `USE_HORIZONTAL=0/1` 尝试仍从右下角开始且方向不对；本次依据 PDF 和
原厂程序截图恢复横屏坐标。上一版方向 3 的 `MADCTL=0xA0` 在用户实物上仍从
右下角、从下往上加载；本次已改为正常横屏 `USE_HORIZONTAL=2`、`MADCTL=0x60`，
并保持 SDK 参考的 `SPI_MODE_3`。上一版镜像曾因最终 ELF 未重新链接而实际仍
带有旧配置，已强制重新链接并生成新的镜像。
用户已实际烧录重新链接版，确认 LCD 仍从右下角开始且文字倒置。按当前协作
决定，暂不继续消耗时间排查 LCD 物理方向，先接受该显示效果；本版本作为后续
实验的可运行基线。

## 课程依据

本实验对应 `D:\实习\doc\授课文档.pdf` 第 4.5 节，不直接复制老师的
`ohos-training` 实验主程序。实现遵循授课文档给出的四步：

1. `lcd_init()` 初始化 LCD；
2. `lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE)` 全屏刷白；
3. `lcd_show_string()` 显示三行英文；
4. `while (1) { LOS_Msleep(1000); }` 保持任务运行。

## 实验边界

| 按键/引脚 | 本实验用途 |
| --- | --- |
| `K1` | 仅作为 `RESET` 重启 |
| `K2` | 仅作为 `MASKROM` 烧录模式 |
| `K3-K6` | 本实验不读取，后续 `lab02_key_lcd` 使用 K3 |
| `GPIO0_PC7` | 本实验不启用，后续作为 K3 输入 |
| `GPIO0_PA5` | 本实验不启用，后续实验 3 作为告警灯 |

## 文件

- `lab01_lcd.c`：本项目自有的 LiteOS-M 任务和 LCD 显示逻辑；
- `src/lcd.c`：板厂 LCD SPI 适配驱动；
- `include/lcd.h`：LCD API、颜色和屏幕方向/尺寸定义；
- `BUILD.gn`：`lab01_lcd` 独立静态库；
- `patches/README.md`：源码复制、构建和启动入口修改说明；
- `tests/test_lab01_lcd_contract.py`：自动化契约测试；
- `records/`：TDD、编译、烧录和 UART 记录。

## 构建规则

一次只启用 `lab01_lcd`。应用补丁时必须删除上一个实验的业务库和自启动
任务，避免多个例程同时运行。独立源码副本首次构建前必须执行
`hb set -root .`、`hb set -p`，再用 `hb env` 检查路径；完整命令见
`patches/README.md`。

## 历史与当前编译产物

- 镜像目录：`D:\实习\tmp\rk2206_images\lab02_lab01_lcd`
- 历史单入口修复版 `Firmware.img`：2,097,152 bytes，MD5：
  `49841b650f05384a7a614e212c8dab21`
- `rk2206_db_loader.bin`：35,093 bytes，MD5：
  `5f2ea974b0e1df5564a8e1ee910627bb`
- 历史单入口完整日志：
  [2026-08-31-build-single-entry.log](records/2026-08-31-build-single-entry.log)
- 历史单入口校验记录：
  [2026-08-31-build-single-entry.md5](records/2026-08-31-build-single-entry.md5)
- 诊断版完整日志：
  [2026-08-31-build-diagnostic.log](records/2026-08-31-build-diagnostic.log)
- 诊断版校验记录：
  [2026-08-31-build-diagnostic.md5](records/2026-08-31-build-diagnostic.md5)
- 分段刷屏版镜像目录：
  `D:\实习\tmp\rk2206_images\lab02_lab01_lcd_yield_20260831`
- 分段刷屏版 `Firmware.img`：2,097,152 bytes，MD5：
  `1060f2209ccb3706c8e2736ff9b67a9a`
- 分段刷屏版 `rk2206_db_loader.bin`：35,093 bytes，MD5：
  `5f2ea974b0e1df5564a8e1ee910627bb`
- 分段刷屏版完整日志：
  [2026-08-31-build-yield.log](records/2026-08-31-build-yield.log)
- 分段刷屏版校验记录：
  [2026-08-31-build-yield.md5](records/2026-08-31-build-yield.md5)
- SMART-R A4 DC 修正版镜像目录：
  `D:\实习\tmp\rk2206_images\lab02_lab01_lcd_smart_r_a4_20260831`
- SMART-R A4 DC 修正版 `Firmware.img`：2,097,152 bytes，MD5：
  `3fad85ef9a94dc22a831c5b7659149d6`
- SMART-R A4 DC 修正版 `rk2206_db_loader.bin`：35,093 bytes，MD5：
  `5f2ea974b0e1df5564a8e1ee910627bb`
- SMART-R A4 DC 修正版构建日志：
  [2026-08-31-build-smart-r-a4.log](records/2026-08-31-build-smart-r-a4.log)
- SMART-R A4 DC 修正版构建与故障记录：
  [2026-08-31-build-smart-r-a4.md5](records/2026-08-31-build-smart-r-a4.md5)
- SMART-R 竖屏 + 硬件 SPI 修正版镜像目录：
  `D:\实习\tmp\rk2206_images\lab02_lab01_lcd_portrait_hwspi_20260831`
- SMART-R 竖屏 + 硬件 SPI 修正版 `Firmware.img`：2,097,152 bytes，MD5：
  `7dcff693bfe9fdfe61ba579a2377142d`
- SMART-R 竖屏 + 硬件 SPI 修正版 `rk2206_db_loader.bin`：35,093 bytes，MD5：
  `5f2ea974b0e1df5564a8e1ee910627bb`
- SMART-R 竖屏 + 硬件 SPI 修正版构建日志：
  [2026-08-31-build-portrait-hwspi.log](records/2026-08-31-build-portrait-hwspi.log)
- SMART-R 竖屏 + 硬件 SPI 修正版构建与反馈记录：
  [2026-08-31-build-portrait-hwspi.md5](records/2026-08-31-build-portrait-hwspi.md5)
- SMART-R 竖屏 180° + 硬件 SPI 修正版镜像目录：
  `D:\实习\tmp\rk2206_images\lab02_lab01_lcd_portrait_reverse_hwspi_20260831`
- SMART-R 竖屏 180° + 硬件 SPI 修正版 `Firmware.img`：2,097,152 bytes，MD5：
  `a0035dd02c5af006199a483883e7c5be`
- SMART-R 竖屏 180° + 硬件 SPI 修正版 `rk2206_db_loader.bin`：35,093 bytes，MD5：
  `5f2ea974b0e1df5564a8e1ee910627bb`
- SMART-R 竖屏 180° + 硬件 SPI 修正版构建日志：
  [2026-08-31-build-portrait-reverse.log](records/2026-08-31-build-portrait-reverse.log)
- SMART-R 竖屏 180° + 硬件 SPI 修正版构建与反馈记录：
  [2026-08-31-build-portrait-reverse.md5](records/2026-08-31-build-portrait-reverse.md5)
- SMART-R 横屏方向 3 + 硬件 SPI 修正版镜像目录：
  `D:\实习\tmp\rk2206_images\lab02_lab01_lcd_landscape_orientation3_hwspi_20260831`
- SMART-R 横屏方向 3 + 硬件 SPI 修正版 `Firmware.img`：2,097,152 bytes，MD5：
  `e658972f997d43bb16d056fc6eb329c1`
- SMART-R 横屏方向 3 + 硬件 SPI 修正版 `rk2206_db_loader.bin`：35,093 bytes，MD5：
  `5f2ea974b0e1df5564a8e1ee910627bb`
- SMART-R 横屏方向 3 + 硬件 SPI 修正版构建日志：
  [2026-08-31-build-landscape-orientation3.log](records/2026-08-31-build-landscape-orientation3.log)
- SMART-R 横屏方向 3 + 硬件 SPI 修正版构建与反馈记录：
  [2026-08-31-build-landscape-orientation3.md5](records/2026-08-31-build-landscape-orientation3.md5)
- SMART-R 横屏方向 3 + 硬件 SPI 模式 3 修正版镜像目录：
  `D:\实习\tmp\rk2206_images\lab02_lab01_lcd_landscape_orientation3_hwspi_mode3_20260831`
- SMART-R 横屏方向 3 + 硬件 SPI 模式 3 修正版 `Firmware.img`：2,097,152 bytes，MD5：
  `6d3cf42e42146864862b0e8fdb8d2f38`
- SMART-R 横屏方向 3 + 硬件 SPI 模式 3 修正版 `rk2206_db_loader.bin`：35,093 bytes，MD5：
  `5f2ea974b0e1df5564a8e1ee910627bb`
- SMART-R 横屏方向 3 + 硬件 SPI 模式 3 修正版构建日志：
  [2026-08-31-build-landscape-orientation3-mode3.log](records/2026-08-31-build-landscape-orientation3-mode3.log)
- SMART-R 横屏方向 3 + 硬件 SPI 模式 3 修正版构建与故障记录：
  [2026-08-31-build-landscape-orientation3-mode3.md5](records/2026-08-31-build-landscape-orientation3-mode3.md5)
- SMART-R 正常横屏 `0x60` + 硬件 SPI 模式 3 修正版镜像目录：
  `D:\实习\tmp\rk2206_images\lab02_lab01_lcd_landscape_normal_hwspi_mode3_20260831`
- SMART-R 正常横屏 `0x60` + 硬件 SPI 模式 3 修正版 `Firmware.img`：2,097,152 bytes，MD5：
  `bd8fc47885a8ce13a62d9d52ee548f17`
- SMART-R 正常横屏 `0x60` + 硬件 SPI 模式 3 修正版 `rk2206_db_loader.bin`：35,093 bytes，MD5：
  `5f2ea974b0e1df5564a8e1ee910627bb`
- SMART-R 正常横屏 `0x60` + 硬件 SPI 模式 3 重新链接版镜像目录：
  `D:\实习\tmp\rk2206_images\lab02_lab01_lcd_landscape_normal_hwspi_mode3_relinked_20260831`
- SMART-R 正常横屏 `0x60` + 硬件 SPI 模式 3 重新链接版 `Firmware.img`：2,097,152 bytes，MD5：
  `89fb0ba476d3cecb516dd7371c5e0bec`
- SMART-R 正常横屏 `0x60` + 硬件 SPI 模式 3 重新链接版 `rk2206_db_loader.bin`：35,093 bytes，MD5：
  `5f2ea974b0e1df5564a8e1ee910627bb`
- 重新链接版构建与故障记录：
  [2026-08-31-build-landscape-normal-relinked.md5](records/2026-08-31-build-landscape-normal-relinked.md5)
- 重新链接版构建摘要日志：
  [2026-08-31-build-landscape-normal-relinked.log](records/2026-08-31-build-landscape-normal-relinked.log)
- 旧版双重启动构建记录：
  [2026-08-31-build.md5](records/2026-08-31-build.md5)，已作废；
  对应文件保存在
  `D:\实习\tmp\rk2206_images\lab02_lab01_lcd_invalid_double_entry_20260831`

## 故障修复记录

旧版 `main.c` 手动调用了 `lab01_lcd_example()`，而
`lab01_lcd.c` 同时使用 `APP_FEATURE_INIT(lab01_lcd_example)`。
同一个 LCD 任务因此可能启动两次，两个任务并发执行 `lcd_init()` 和
SPI/LCD 刷新，表现为设备异常抖动、反复启动或 LCD 黑屏。

修复版保留 PDF 要求的 `APP_FEATURE_INIT` 唯一启动入口，删除 `main.c`
手动调用。修复版编译日志确认 `main.c has no manual lab startup call`，
并且 `liblab01_lcd.a` 仍参与最终链接。

本实验当前版本使用 LCD 的 `GPIO0_PC0`、`GPIO0_PC1`、`GPIO0_PC2`、
`GPIO0_PC3` 和 `GPIO0_PA4`，不初始化或控制电机、蜂鸣器、RGB 和报警灯。
SMART-R 的电机使用 `PWM6 = GPIO0_PC6`，因此 LCD 驱动禁止使用 `GPIO0_PC6`。
在修正版烧录前，旧镜像仍可能使电机持续抖动，应先断开 USB/电源。

## 方向与速度修复记录（含失败尝试）

用户已确认上一版 `SMART-R A4 DC` 镜像能正常显示三行文字且电机停止，但实物
画面方向反了、全屏刷屏速度较慢。上一版切换到 `USE_HORIZONTAL=0` 并启用硬件
SPI 后，用户再次确认文字仍从右下角开始；随后 `USE_HORIZONTAL=1` 的竖屏 180°
尝试仍未解决。

- PDF 第 4.4.2 节明确公共 LCD 坐标为横屏 `LCD_W=320`、`LCD_H=240`，第 4.5
  节要求 `lcd_show_string(10,40,...)` 从字左上角开始；用户提供的原厂程序截图
  也证明板上 LCD 的验收方向是横屏左上角。
- 因此前面把问题改成竖屏 `USE_HORIZONTAL=0/1` 属于方向判断错误。上一版恢复横屏
  尺寸并将 `USE_HORIZONTAL` 设为 `3`，方向分支发送 `MADCTL=0xA0`，但实物确认
  该值仍是反向横屏。
- 用户实际烧录 `SPI_MODE_3` + `MADCTL=0xA0` 版本后确认画面仍从右下角开始，
  并且全屏填充从下往上加载；这与 `0xA0` 的 `MY|MV` 反向横屏扫描一致。当前
  将默认方向恢复为 `USE_HORIZONTAL=2`，并把该分支的控制器值改为 `MADCTL=0x60`
  (`MX|MV`) 的正常横屏扫描，避免继续使用反向值 `0xA0`。
- 旧版 `LCD_ENABLE_SPI=0`，`lcd_fill()` 每个 RGB565 字节都通过 GPIO 模拟，
  全屏共发送约 153,600 个字节并产生大量 GPIO 调用；已切换到 SDK 的 SPI0 M1
  硬件接口，速度设置保持 50 MHz。上一版错误地将硬件 SPI 设置为
  `SPI_MODE_0`；对比 SDK 原始 `b4_lcd` 和 RK2206 SPI 适配文档后，本版恢复
  参考实现使用的 `SPI_MODE_3`，不再把软件 GPIO 的边沿直译为硬件 SPI 模式。
- `lcd_fill()` 现在每行批量发送 RGB565 缓冲区，局部区域仍按实际宽度发送，
  不改变后续实验需要的局部擦除行为。

本地契约测试为 `5 passed`，Ubuntu 构建输出 `lockzhiner-rk2206 build success`。
`USE_HORIZONTAL=2` + `MADCTL=0x60` + `SPI_MODE_3` 新镜像已由用户重新烧录确认；
实物方向仍异常，详见“当前基线”。

## 当前基线

优先使用 `D:\实习\tmp\rk2206_images\lab02_lab01_lcd_landscape_normal_hwspi_mode3_relinked_20260831`
中的 `rk2206_db_loader.bin` 和 `Firmware.img`。该目录对应当前已验证可运行的
4.5 基线：LCD 能显示实验文字，方向仍为右下角倒置，但暂不阻塞后续功能开发。
后续实验从该版本复制独立目录，并只在各自目录中增加新功能。
旧 LCD 镜像已集中移动到 `D:\实习\tmp\rk2206_images\archive\2026-08-31-lcd-trials`，
归档清单见 [2026-08-31-image-archive.md](records/2026-08-31-image-archive.md)。

## SMART-R 引脚修复记录

板子背面 LCD 排针丝印依次为 `A4 / MISO / MOSI / CLK / CS / GND / 5V`。
结合 SDK 的 SPI0 M1 映射，当前驱动使用：

| LCD 信号 | SMART-R 引脚 | 依据 |
| --- | --- | --- |
| `DC` | `GPIO0_PA4` | 板背丝印 `A4` |
| `RES` | `GPIO0_PC3` | SPI0 M1 的 `MISO` 排针 |
| `MOSI` | `GPIO0_PC2` | SPI0 M1 |
| `CLK` | `GPIO0_PC1` | SPI0 M1 |
| `CS` | `GPIO0_PC0` | SPI0 M1 |

此前沿用普通小凌派 `b4_lcd` 驱动，把 `DC` 错设为 `GPIO0_PC6`。SDK 明确
`GPIO0_PC6` 同时是 `PWM6`，而授课文档 4.11 将 PWM6 用于 SMART-R 电机，
所以 LCD 写数据时会直接让电机动作；`DC` 接错也会使 LCD 收不到正确的
指令/数据选择信号。修正版只将 `LCD_PIN_DC` 改为 `GPIO0_PA4`，并删除了
此前只能在绘图结束后拉低 PC6 的临时 `lcd_set_dc_idle()` 方案。

## 历史故障定位证据

用户已确认实际烧录的是单入口修复版目录中的新镜像：

```text
D:\实习\tmp\rk2206_images\lab02_lab01_lcd\Firmware.img
MD5 49841b650f05384a7a614e212c8dab21
```

UART 已输出 LCD GPIO 16、17、18、19、22 初始化成功，但没有输出
`lab01_lcd: LCD OK`。用户随后手动按下 `K1=RESET`，所以现有截图不能证明
设备自动复位；能确认的是程序已经进入 LCD GPIO 初始化和 LCD 初始化流程，
并停在全屏 `lcd_fill()` 之后的等待阶段。当前不能把问题归因于烧录错文件；
本次物理验收暂不记为通过。

为区分具体阶段，诊断版只增加串口标记，不改变授课文档要求的 LCD 流程：

```text
LCD_INIT_BEGIN
LCD_GPIO_DONE
LCD_RESET_DONE
LCD_INIT_DONE
LCD_FILL_BEGIN
LCD_FILL_DONE
```

### 诊断版烧录目录

```text
D:\实习\tmp\rk2206_images\lab02_lab01_lcd_diagnostic_20260831
```

- `Firmware.img`：2,097,152 bytes，MD5：
  `09e5af9c4920155384749bdd32cd5e7e`
- `rk2206_db_loader.bin`：35,093 bytes，MD5：
  `5f2ea974b0e1df5564a8e1ee910627bb`

## 历史分段刷屏版验收

历史版在保持 PDF 完整流程不变的前提下，对 `lcd_fill()` 增加了每 8 行一次的
进度输出和 `LOS_Msleep(1)`。烧录时使用：

```text
D:\实习\tmp\rk2206_images\lab02_lab01_lcd_yield_20260831\rk2206_db_loader.bin
D:\实习\tmp\rk2206_images\lab02_lab01_lcd_yield_20260831\Firmware.img
```

UART 使用 `115200 8N1`。预期依次观察：

```text
lab01_lcd: LCD_FILL_BEGIN
lab01_lcd: LCD_FILL_PROGRESS row=8/240
...
lab01_lcd: LCD_FILL_PROGRESS row=240/240
lab01_lcd: LCD_FILL_DONE
lab01_lcd: LCD OK
```

进入 MASKROM 使用 `K2`，烧录完成后恢复运行，再按 `K1=RESET`。
本次必须记录完整 UART 输出；不要把手动按下 `RESET` 记为自动复位。

最终验收要求仍是 UART 输出 `lab01_lcd: LCD OK`，LCD 显示：

```text
TX-SMART-R Lab01
LCD OK
OpenHarmony
```

本次修正版烧录文件：

```text
D:\实习\tmp\rk2206_images\lab02_lab01_lcd_smart_r_a4_20260831\rk2206_db_loader.bin
D:\实习\tmp\rk2206_images\lab02_lab01_lcd_smart_r_a4_20260831\Firmware.img
```

进入 MASKROM 使用 `K2`，烧录完成后退出烧录模式并按 `K1=RESET`；不要把
`K1` 误认为 K3。验收时重点观察：旧镜像导致的持续电机抖动应消失，UART
应出现 `LCD_FILL_DONE` 和 `lab01_lcd: LCD OK`，LCD 应显示上面的三行英文。
