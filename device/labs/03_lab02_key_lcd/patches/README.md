# 4.6 lab02_key_lcd 接入说明

本实验严格对应 `D:\实习\doc\授课文档.pdf` 第 4.6 节。老师的
`ohos-training` 只作为流程和 API 参考；本目录中的 K3 驱动和业务代码由项目
自行编写。

## 硬件边界

- `K1` 是 `RESET`，不作为普通按键读取；
- `K2` 是 `MASKROM`，不作为普通按键读取；
- `K3` 使用 `GPIO0_PC7`，按下时 GPIO 为低电平；
- LCD 沿用 4.5 的 SPI0 M1、PA4 DC、PC0/PC1/PC2/PC3、`SPI_MODE_3`；
- 不访问电机使用的 `GPIO0_PC6`/PWM6，不初始化 RGB、报警灯或传感器。

## 独立源码接入

将本目录的生产源码复制到独立 Ubuntu 工程：

```text
/home/lzdz/rk2206/lab03-lab02-key-lcd-20260831/vendor/lockzhiner/rk2206/samples/lab02_key_lcd/
```

只复制 `BUILD.gn`、`lab02_key_lcd.c`、`include/` 和 `src/`；不要复制测试、记录
或仓库文档到 OpenHarmony 源码树。

## 构建集成

1. 在 `vendor/lockzhiner/rk2206/samples/BUILD.gn` 的 `features` 列表加入：

   ```gn
   "./lab02_key_lcd:lab02_key_lcd",
   ```

2. 删除上一实验的 `"./lab01_lcd:lab01_lcd",`，确保只启用本实验；
3. 在 `device/rockchip/rk2206/sdk_liteos/Makefile` 中将业务库设置为：

   ```make
   hardware_LIBS = -lhal_iothardware -lhardware -lshellcmd -llab02_key_lcd
   ```

   这一步同时移除旧的 `-llab01_lcd`，最终链接行只能保留
   `-llab02_key_lcd`。

4. 删除 `main.c` 中残留的 `lab01_lcd_example()` 或
   `lab02_key_lcd_example()` 手动调用。入口只保留源码中的
   `APP_FEATURE_INIT(lab02_key_lcd_example)`，避免重复启动。

## 编译和验收

```bash
cd /home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
export PATH="/home/lzdz/.local/bin:$PATH"
command -v hb
hb --help | head
hb env
hb build
```

当前 `PULL_UP` 版本的镜像和 Loader 单独保存到：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_pullup_20260831
```

UART 使用 `115200 8N1`。启动后预期显示 `K3: RELEASED`；按住 K3 显示并输出
`K3: PRESSED`，松开后恢复 `K3: RELEASED`。程序每 30 ms 轮询，但仅在状态变化
时擦除并重画状态区域。LCD 方向继承 4.5 的已知倒置现象，本实验不修改方向配置。
此前的 `lab03_lab02_key_lcd_retry_20260831` 使用 `PULL_KEEP`，实物会在 pinctrl
初始化阶段失败，已作废，不能继续烧录。
