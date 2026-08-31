# 4.5 实验 1：LCD（lab01_lcd）

## 状态

已完成本地契约测试和自有 LCD 入口代码，待在 Ubuntu 独立源码副本中编译、
烧录并验收屏幕显示。

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

一次只启用 `lab01_lcd`。应用补丁时必须删除上一个实验的
`task_example()`/`-ltask_helloworld`，避免多个自启动例程同时运行。
完整路径和命令见 `patches/README.md`。

## 预期验收

烧录 `lab01_lcd` 独立构建生成的镜像后，UART 使用 `115200 8N1`，按
`K1=RESET` 重启。串口应输出 `lab01_lcd: LCD OK`，LCD 应显示：

```text
TX-SMART-R Lab01
LCD OK
OpenHarmony
```
