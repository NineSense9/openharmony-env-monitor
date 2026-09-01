# 4.6 Pin Sniffer 诊断构建与实物记录（2026-09-01）

## 背景

ADC5+PC7 输入矩阵诊断包已经确认不是旧固件，UART 签名为：

```text
lab02_key_lcd_adc: K3_GPIO=GPIO0_PC7 LzGpioInit ret=0
lab02_key_lcd_adc: K3_GPIO=GPIO0_PC7 LzGpioSetDir ret=0
lab02_key_lcd_adc: ADC5 raw=0 voltage=0.000V PC7 raw=0
```

但用户按 K3 时 ADC5 和 PC7 都没有变化。为避免继续猜单个管脚，新增 UART-only
Pin Sniffer，扫描安全 GPIO0 候选和 ADC0-ADC7，不初始化 LCD，不访问电机 PWM6。

## 构建链路

Ubuntu 工程：

```text
/home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
```

关键集成：

- `vendor/lockzhiner/rk2206/samples/BUILD.gn` 启用
  `./lab02_key_lcd/diagnostics/pin_sniffer:lab02_key_pin_sniffer`；
- `device/rockchip/rk2206/sdk_liteos/Makefile` 使用
  `-llab02_key_pin_sniffer`；
- 构建日志出现 `liblab02_key_pin_sniffer.pin_sniffer.o` 和
  `liblab02_key_pin_sniffer.a`。

执行：

```bash
cd /home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
export PATH="/home/lzdz/.local/bin:/usr/bin:$PATH"
hb build -f
```

结果：

```text
[851/851]
lockzhiner-rk2206 build success
cost time: 0:00:17
```

## 烧录目录

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_pin_sniffer_20260901
```

| 文件 | 大小 | MD5 |
| --- | ---: | --- |
| `Firmware.img` | 2,097,152 bytes | `4824acbf9b81ae8b37cf6fcceb1e499a` |
| `rk2206_db_loader.bin` | 35,093 bytes | `5f2ea974b0e1df5564a8e1ee910627bb` |
| Ubuntu `liteos.bin` | 538,696 bytes | `8cf0ddf9ba8c512d7d53cc06c6cb805c` |
| Ubuntu `liteos.elf` | 1,426,116 bytes | `2942e371d0903d5ea3999a8902c1fabd` |

Windows 端确认 `Firmware.img` 包含 `PIN_SNIFFER_READY`、`GPIO_CHANGE`、
`ADC_CHANGE`，且不包含旧 `K3_GPIO=GPIO0_PC7`、`ADC5 raw` 和 `key=KEY_UNKNOWN`。

## 实物观察

不按任何按键时，UART 持续出现：

```text
pin_sniffer: ADC_CHANGE ch=3 raw=424->448 mv=1443 tick=677
pin_sniffer: ADC_CHANGE ch=3 raw=448->426 mv=1372 tick=678
```

ADC3 在约 `410-458` raw 之间持续抖动，判定为浮动/噪声，不作为按键映射依据。

K3 按下和抬起时，UART 捕捉到：

```text
pin_sniffer: GPIO_CHANGE name=GPIO0_PC7 id=23 1->0 tick=5770
pin_sniffer: GPIO_CHANGE name=GPIO0_PC7 id=23 0->1 tick=5776
```

结论：当前实物 K3 与授课文档一致，使用 `GPIO0_PC7`，低电平表示按下。后续正式版
继续使用 PC7；不再把 ADC3 噪声或无同步关系的 ADC 跳变当作按键证据。

K4、K5、K6 截图中也出现过 `GPIO0_PA3` 或 `GPIO0_PC7` 边沿，但 4.6 实验只要求 K3，
多按键线索先记录，后续需要时再单独验证。
