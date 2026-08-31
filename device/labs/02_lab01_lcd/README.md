# 4.5 实验 1：LCD（lab01_lcd）

## 状态

已完成本地契约测试、Ubuntu 独立源码编译和镜像核验，已修复重复启动问题。
单入口修复版已实际烧录，但 UART 在 LCD 初始化阶段停止，LCD 尚未通过物理验收；
当前使用诊断版继续定位卡点。

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
- `include/lcd.h`：LCD API、颜色和横屏尺寸定义；
- `BUILD.gn`：`lab01_lcd` 独立静态库；
- `patches/README.md`：源码复制、构建和启动入口修改说明；
- `tests/test_lab01_lcd_contract.py`：自动化契约测试；
- `records/`：TDD、编译、烧录和 UART 记录。

## 构建规则

一次只启用 `lab01_lcd`。应用补丁时必须删除上一个实验的业务库和自启动
任务，避免多个例程同时运行。独立源码副本首次构建前必须执行
`hb set -root .`、`hb set -p`，再用 `hb env` 检查路径；完整命令见
`patches/README.md`。

## 已编译产物

- 镜像目录：`D:\实习\tmp\rk2206_images\lab02_lab01_lcd`
- 当前修复版 `Firmware.img`：2,097,152 bytes，MD5：
  `49841b650f05384a7a614e212c8dab21`
- `rk2206_db_loader.bin`：35,093 bytes，MD5：
  `5f2ea974b0e1df5564a8e1ee910627bb`
- 当前完整日志：
  [2026-08-31-build-single-entry.log](records/2026-08-31-build-single-entry.log)
- 当前校验记录：
  [2026-08-31-build-single-entry.md5](records/2026-08-31-build-single-entry.md5)
- 诊断版完整日志：
  [2026-08-31-build-diagnostic.log](records/2026-08-31-build-diagnostic.log)
- 诊断版校验记录：
  [2026-08-31-build-diagnostic.md5](records/2026-08-31-build-diagnostic.md5)
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

## 当前故障定位

用户已确认实际烧录的是单入口修复版目录中的新镜像：

```text
D:\实习\tmp\rk2206_images\lab02_lab01_lcd\Firmware.img
MD5 49841b650f05384a7a614e212c8dab21
```

UART 已输出 LCD GPIO 16、17、18、19、22 初始化成功，但没有输出
`lab01_lcd: LCD OK`。因此当前不能把问题归因于烧录错文件；故障点位于
LCD GPIO 初始化之后、`lcd_init()` 完成之前，或实际刷屏阶段。

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

## 待验收

诊断阶段烧录诊断目录中的 `Firmware.img`，Loader 仍使用同目录中的
`rk2206_db_loader.bin`。进入 MASKROM 使用 `K2`，烧录完成后按 `K1=RESET`
重启；UART 使用 `115200 8N1`。把从启动开始到停止位置的完整日志截图发回：

- 停在 `LCD_GPIO_DONE`：检查 LCD 复位延时或复位引脚；
- 出现 `LCD_INIT_DONE` 但停在 `LCD_FILL_BEGIN`：检查全屏软件 SPI 刷屏；
- 出现 `LCD_FILL_DONE` 仍无 `LCD OK`：检查文字绘制阶段；
- 出现 `lab01_lcd: LCD OK`：再确认屏幕三行文字。

最终验收要求仍是 UART 输出 `lab01_lcd: LCD OK`，LCD 显示：

```text
TX-SMART-R Lab01
LCD OK
OpenHarmony
```
