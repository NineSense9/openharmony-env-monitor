# 4.5 实验 1：LCD（lab01_lcd）接入说明

本实验严格按 `D:\实习\doc\授课文档.pdf` 第 4.5 节实现。老师的
`ohos-training/ch04/lab01_lcd` 只作为流程和 API 参考，主程序
`lab01_lcd.c` 由本项目自行编写。

## 实验边界

- `K1` 是 `RESET`，本实验不读取；
- `K2` 是 `MASKROM`，本实验不读取；
- `K3-K6` 本实验不读取，按键功能留给后续 `lab02_key_lcd`；
- `GPIO0_PC7` 和 `GPIO0_PA5` 不在本实验中启用；
- 本实验只验证 LCD 初始化、清屏、英文显示和任务驻留。

## 独立源码

将本目录内容复制到 Ubuntu 独立源码副本：

```text
/home/lzdz/rk2206/lab02-lab01-lcd-20260831/vendor/lockzhiner/rk2206/samples/lab01_lcd/
```

其中：

- `lab01_lcd.c` 是本项目自有的任务和显示逻辑；
- `src/lcd.c` 是板厂 LCD SPI 适配驱动；
- `include/lcd.h` 是对应驱动接口，横屏配置为 `LCD_W=320`、
  `LCD_H=240`，与授课文档第 4.4 节一致；
- `BUILD.gn` 只生成 `lab01_lcd` 静态库。

## 工程接入

1. 在 `vendor/lockzhiner/rk2206/samples/BUILD.gn` 的 `features` 列表加入：

   ```gn
   "./lab01_lcd:lab01_lcd",
   ```

2. 在 `device/rockchip/rk2206/sdk_liteos/Makefile` 的
   `hardware_LIBS` 中删除上一个实验的业务库，并保留系统库：

   ```make
   hardware_LIBS = -lhal_iothardware -lhardware -lshellcmd -llab01_lcd
   ```

3. 在 `device/rockchip/rk2206/sdk_liteos/board/main.c` 中删除
   上一个实验的任务声明和调用，增加 `lab01_lcd_example()` 声明，并在
   `shell_cmd_init()` 后调用 `lab01_lcd_example()`。

4. 不同时启用 `lab02_key_lcd` 或其他 `lab0x` 库。

可直接应用的补丁：

- `samples_BUILD.gn.patch`：启用 `lab01_lcd` 静态库；
- `Makefile.patch`：把 `lab01_lcd` 加入最终链接；
- `main.c.patch`：在系统启动后调用 `lab01_lcd_example()`。

## 编译和验收

```bash
cd /home/lzdz/rk2206/lab02-lab01-lcd-20260831
export PATH="$HOME/.local/bin:$PATH"
command -v hb
hb --help | head
hb build -f
```

烧录本实验生成的 `Firmware.img` 后，UART 使用 `115200 8N1`，按
`K1=RESET` 重启，预期串口出现：

```text
lab01_lcd: LCD OK
```

屏幕预期显示：

```text
TX-SMART-R Lab01
LCD OK
OpenHarmony
```
