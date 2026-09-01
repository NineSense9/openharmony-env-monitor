# ADC5 按键诊断版本

这是 `lab02_key_lcd` 的独立硬件诊断版本，保留原来的 PC7 版本和历史固件，
用于确认 TX-SMART-R 实物上的 K3-K6 输入方式。

## 诊断依据

授课文档 4.3、4.6 写的是 `K3=GPIO0_PC7`，但当前板卡底板原理图显示：

- `K1` 是 `RESET`，不作为普通按键；
- `K2` 是 `MASKROM`，不作为普通按键；
- `K3`、`K4`、`K5`、`K6` 共用 `USER_KEY_ADC`；
- `USER_KEY_ADC` 接到 `GPIO0_PC5`，由不同电阻产生不同电压档位。

当前 PC7 诊断持续得到 `raw=0`，且 K3-K6 操作没有任何变化。UART1 调试口由
SDK `HalInit` 配置在 `GPIO0_PA6/PA7`，因此没有占用 PC7。ADC5 版本先只输出
原始值和电压，不猜测哪个电压档位对应哪个按键。

## 源码和构建

- `adc5_key_lcd.c`：`GPIO0_PC5`、ADC5 初始化和原始值采样；
- `BUILD.gn`：独立目标 `lab02_key_lcd_adc_diagnostic`；
- `../../src/lcd.c` 和 `../../include/`：沿用已验证的 LCD 驱动；
- 采样周期为 100 ms；
- ADC 初始化参考 SDK `vendor/lockzhiner/rk2206/samples/b1_adc/adc_example.c`。

集成 Ubuntu 工程时，只启用：

```text
./lab02_key_lcd/diagnostics/adc5_key_lcd:lab02_key_lcd_adc_diagnostic
```

最终链接库为 `-llab02_key_lcd_adc_diagnostic`，不再同时链接原来的
`-llab02_key_lcd` 或 `-llab01_lcd`。入口仍由 `APP_FEATURE_INIT` 提供，
`main.c` 不手动调用实验入口。

## UART 和 LCD 预期

串口为 `115200 8N1`，持续输出：

```text
lab02_key_lcd_adc: ADC5 raw=123 voltage=0.397V PC7 raw=1
```

LCD 显示 ADC5、原始值和电压。启动日志还应出现：

```text
lab02_key_lcd_adc: K3_GPIO=GPIO0_PC7 LzGpioInit ret=0
lab02_key_lcd_adc: K3_GPIO=GPIO0_PC7 LzGpioSetDir ret=0
```

烧录后先保持所有按键松开，再分别按住并松开 K3、K4、K5、K6，每个动作保持
约 2 秒，保存完整 UART。根据 `ADC5 raw` 和 `PC7 raw` 两路数据再固化 K3-K6
标签映射。

## 当前构建产物（2026-09-01）

Ubuntu 工程已重新全量构建并确认最终链接的是
`liblab02_key_lcd_adc_diagnostic.a`。当前唯一推荐烧录目录为：

```text
D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_input_matrix_20260901
```

| 文件 | 大小 | MD5 |
| --- | ---: | --- |
| `Firmware.img` | 2,097,152 bytes | `ab8ee95e8d116c0705a46409baba77b0` |
| `rk2206_db_loader.bin` | 35,093 bytes | `5f2ea974b0e1df5564a8e1ee910627bb` |

该 `Firmware.img` 已确认包含 `K3_GPIO=GPIO0_PC7`、`ADC5 raw=`、`PC7 raw=`，且不包含
旧 `key=KEY_UNKNOWN`。旧目录
`D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_diagnostic_20260831` 保留为错误同步对照，
不要继续烧录。
