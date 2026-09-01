# 4.6 K3=PC7 正式版构建记录（2026-09-01）

## 根因结论

Pin Sniffer 已在实物上捕捉到 K3 按下/抬起对应 `GPIO0_PC7` 的 `1->0` 和 `0->1`，
证明授课文档 4.6 的 `K3=GPIO0_PC7`、低电平按下是当前板卡可用路径。

此前正式 LCD+K3 版本没有响应的关键差异是：Pin Sniffer 对 PC7 先尝试
`PinctrlSet(GPIO0_PC7, MUX_FUNC0, PULL_KEEP, DRIVE_LEVEL0)`，随后继续
`LzGpioSetDir` 和 `LzGpioGetVal`；而正式版无额外 pinctrl 时 PC7 启动读到低电平后
没有随 K3 操作变化。早期 `PULL_KEEP` / `PULL_UP` 版本把 `PinctrlSet` 返回值当成致命
错误提前退出，也被实物 UART 证明不可用。

本次正式修复采用最小改动：

- `src/tx_key.c` 在 `LzGpioInit(TX_KEY_K3)` 后尝试
  `PinctrlSet(TX_KEY_K3, MUX_FUNC0, PULL_KEEP, DRIVE_LEVEL0)`；
- 若 `PinctrlSet` 返回非 0，只输出 `lab02_key_lcd: K3 pinctrl warn ret=%u`；
- 不返回 `pinctrl_ret`，继续设置输入方向并读取 PC7；
- 业务仍只处理 K3，不把 K4-K6 或 ADC 噪声固化进 4.6 正式逻辑。

## 本地测试

先更新契约测试，要求正式 K3 驱动保留 PC7、低电平按下、不访问电机或 ADC，并新增
非致命 pinctrl 签名。实现前单测红灯：

```text
FAILED test_key_driver_uses_pdf_k3_gpio_contract
assert 'PinctrlSet' in driver
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

第一次从 Pin Sniffer 切回正式库后构建失败，原因为远端正式实验目录缺少
`vendor/lockzhiner/rk2206/samples/lab02_key_lcd/lab02_key_lcd.c`：

```text
ninja: error: '../../../vendor/lockzhiner/rk2206/samples/lab02_key_lcd/lab02_key_lcd.c',
needed by 'obj/vendor/lockzhiner/rk2206/samples/lab02_key_lcd/liblab02_key_lcd.lab02_key_lcd.o',
missing and no known rule to make it
```

补齐正式入口文件后重新构建。

关键集成：

- `vendor/lockzhiner/rk2206/samples/BUILD.gn` 启用 `./lab02_key_lcd:lab02_key_lcd`；
- `device/rockchip/rk2206/sdk_liteos/Makefile` 使用 `-llab02_key_lcd`；
- 构建日志出现 `liblab02_key_lcd.tx_key.o`、`liblab02_key_lcd.lab02_key_lcd.o`、
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
cost time: 0:00:20
```

## 烧录目录

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_pc7_pinctrl_20260901
```

| 文件 | 大小 | MD5 |
| --- | ---: | --- |
| `Firmware.img` | 2,097,152 bytes | `9e5424c182a0f2e5fa8d488587edc987` |
| `rk2206_db_loader.bin` | 35,093 bytes | `5f2ea974b0e1df5564a8e1ee910627bb` |
| Ubuntu `liteos.bin` | 560,408 bytes | `0ba885789f018d7932087b3fd1781215` |
| Ubuntu `liteos.elf` | 1,498,200 bytes | `cd20a69dda1e4aaa914f8db83f9e9412` |

Windows 端确认：

```text
lab02_key_lcd: K3 raw          True
lab02_key_lcd: K3=             True
lab02_key_lcd: K3 pinctrl warn True
PIN_SNIFFER_READY              False
ADC5 raw                       False
key=KEY_UNKNOWN                False
```

## 上板验收

当前只烧录 `lab03_lab02_key_lcd_pc7_pinctrl_20260901` 目录中的 Loader 和 Firmware。
烧录后使用 K1 RESET 重启，UART 为 `115200 8N1`。松开 K3 时应看到
`K3 raw=1 pressed=0` 和 `K3=RELEASED`；按住 K3 时应看到
`K3 raw=0 pressed=1` 和 `K3=PRESSED`；松开后恢复。若 LCD 与 UART 同步切换，则
4.6 K3 正式实验可验收。

用户后续照片已确认该版本 LCD 能在 `K3: RELEASED` 与 `K3: PRESSED` 间切换，K3
主功能可用。但该版本的状态刷新区域会影响上方 `LCD OK` 显示，已在
[2026-09-01-pc7-layout-build.md](2026-09-01-pc7-layout-build.md) 中生成布局修正版。
