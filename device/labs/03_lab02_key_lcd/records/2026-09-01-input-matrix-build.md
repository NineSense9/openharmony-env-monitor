# 4.6 ADC5+PC7 输入矩阵诊断构建记录（2026-09-01）

## 背景

用户反馈烧录 `lab03_lab02_key_lcd_diagnostic_20260831` 后 UART 仍显示旧日志：

```text
lab02_key_lcd_adc: USER_KEY_ADC=GPIO0_PC5 raw=0 voltage=0.000V key=KEY_UNKNOWN
```

复核 Windows 旧目录的 `Firmware.img` 后确认，它只包含旧 `key=KEY_UNKNOWN` 字符串，
缺少新诊断应有的 `K3_GPIO=GPIO0_PC7`、`ADC5 raw=` 和 `PC7 raw=`。因此此前实物现象
不能用于判断 K3 硬件映射。

## 环境恢复

进入 Ubuntu VM 时一度出现 `.bashrc`、`df`、`scp`、`mount` 的 `输入/输出错误` 或段错误。
已通过 VirtualBox 关机并重新启动恢复，随后 `df -h . / /home` 正常显示 `/dev/sda5`
容量 252G、已用 18G、可用 224G。

## 构建链路

Ubuntu 工程：

```text
/home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
```

关键配置：

- `vendor/lockzhiner/rk2206/samples/BUILD.gn` 启用
  `./lab02_key_lcd/diagnostics/adc5_key_lcd:lab02_key_lcd_adc_diagnostic`；
- `device/rockchip/rk2206/sdk_liteos/Makefile` 使用
  `-llab02_key_lcd_adc_diagnostic`；
- 旧 `-llab02_key_lcd` 和 `-llab01_lcd` 没有进入最终 `hardware_LIBS`。

执行：

```bash
cd /home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
export PATH="/home/lzdz/.local/bin:/usr/bin:$PATH"
command -v hb
hb env
hb build -f
```

结果：

```text
[852/852]
lockzhiner-rk2206 build success
cost time: 0:00:33
```

构建日志中可见：

```text
[836/852] ... liblab02_key_lcd_adc_diagnostic.adc5_key_lcd.o
[845/852] ... liblab02_key_lcd_adc_diagnostic.lcd.o
[846/852] AR libs/liblab02_key_lcd_adc_diagnostic.a
```

## 字符串和校验

Ubuntu 端 `Firmware.img`、`liteos.bin`、`liteos.elf` 均检索到：

```text
lab02_key_lcd_adc: K3_GPIO=GPIO0_PC7 LzGpioInit ret=%u
lab02_key_lcd_adc: K3_GPIO=GPIO0_PC7 LzGpioSetDir ret=%u
lab02_key_lcd_adc: ADC5 raw=%u voltage=%.3fV PC7 raw=%u
```

`Firmware.img` 未检索到旧字符串 `key=KEY_UNKNOWN`。

新烧录目录：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_input_matrix_20260901
```

| 文件 | 大小 | MD5 |
| --- | ---: | --- |
| `Firmware.img` | 2,097,152 bytes | `ab8ee95e8d116c0705a46409baba77b0` |
| `rk2206_db_loader.bin` | 35,093 bytes | `5f2ea974b0e1df5564a8e1ee910627bb` |
| Ubuntu `liteos.bin` | 562,084 bytes | `75ff078c795ec482a95ee6ae8c03c732` |
| Ubuntu `liteos.elf` | 1,499,272 bytes | `4d567d48e0b3a7c67220d148a687198b` |

Windows 端逐项检索结果：

```text
K3_GPIO=GPIO0_PC7  True
ADC5 raw=          True
PC7 raw=           True
key=KEY_UNKNOWN   False
```

## 上板要求

下一次只烧录 `lab03_lab02_key_lcd_input_matrix_20260901` 目录中的 Loader 和 Firmware。
烧录后先让 K3-K6 全部松开并复位，观察至少 2 秒；再依次按住、松开 K3、K4、K5、K6，
每个动作保持约 2 秒并保存完整 UART。只有看到新版 UART 签名后，才能继续判断实际按键
映射或固化业务逻辑。
