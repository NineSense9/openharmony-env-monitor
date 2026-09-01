# Pin Sniffer 按键引脚诊断

这是 `lab02_key_lcd` 的一次性 UART-only 诊断固件，用来确认 TX-SMART-R 实物上 K3
到底接在哪一路输入。它不替代授课文档 4.6 的最终实验代码，定位完成后再回到正常
`lab02_key_lcd`。

## 为什么要做

PDF 4.3 / 4.6 写明 `TX_KEY_K3 = GPIO0_PC7`，按下时引脚为低电平；用户截图中的
授课文档也明确写了“读 K3（`GPIO0_PC7`），按下/松开刷新屏与串口”。但实物烧录新版
ADC5+PC7 诊断包后，UART 显示：

```text
lab02_key_lcd_adc: ADC5 raw=0 voltage=0.000V PC7 raw=0
```

按 K3 时两路都没有变化。现在的问题不再是烧录包错误，而是需要确认实物按键的真实接线。

2026-09-01 上板 Pin Sniffer 复测后，K3 按下/抬起时捕捉到：

```text
pin_sniffer: GPIO_CHANGE name=GPIO0_PC7 id=23 1->0 tick=5770
pin_sniffer: GPIO_CHANGE name=GPIO0_PC7 id=23 0->1 tick=5776
```

这证明当前实物 K3 与 PDF 的 `GPIO0_PC7`、低电平按下结论一致。此前正式版没有响应，
原因更可能是 PC7 复用配置未按探针版执行，或把 `PinctrlSet` 返回值当成致命错误提前退出。
定位完成后，当前推荐烧录包已切回正式 LCD+K3 版本；本诊断包只保留作排错记录。

## 扫描范围

本版本只走 UART，不启用 LCD。为避免破坏调试口、LCD 或电机，源码不扫描这些已知忙脚：

- UART 调试口；
- LCD SPI、DC、RES；
- 电机 PWM6，也就是 `GPIO0_PC6`；
- K1 RESET 和 K2 MASKROM。

扫描候选：

- GPIO0 安全候选输入：`PA0-PA3`、`PA5`、`PB0-PB7`、`PC4`、`PC5`、`PC7`、`PD0-PD7`；
- ADC 通道：`ADC0` 到 `ADC7`；
- `USER_KEY_ADC` 仍重点关注 `GPIO0_PC5` / `ADC5`。

## 预期 UART

启动后先看初始化：

```text
pin_sniffer: PIN_SNIFFER_READY poll=20ms adc_threshold=20
pin_sniffer: GPIO_INIT name=GPIO0_PB3 id=11 init=0 mux=0 dir=0 read=0 val=1
pin_sniffer: ADC_BASE ch=5 ret=0 raw=0 mv=0
pin_sniffer: PRESS_K3_NOW
```

按下或松开 K3 时，若某个 GPIO 捕捉到边沿，会出现：

```text
pin_sniffer: GPIO_CHANGE name=GPIO0_PB3 id=11 1->0 tick=123
```

若某个 ADC 通道发生明显跳变，会出现：

```text
pin_sniffer: ADC_CHANGE ch=5 raw=0->380 mv=1224 tick=123
```

如果按 K3、K4、K5、K6 都没有任何 `GPIO_CHANGE` 或 `ADC_CHANGE ch=`，就说明当前安全扫描范围
没有捕捉到按键输入，应停止继续猜测，向老师索要板级资料。

本次实物记录中，不按键时 `ADC3` 会持续在约 `410-458` raw 之间抖动并刷屏输出；
这是浮动/噪声，不作为按键映射依据。判断实体按键时只采用与按下、松开动作同步出现的
`GPIO_CHANGE` 或大幅 ADC 档位变化。

K4、K5、K6 截图中出现过 `GPIO0_PA3` 或 `GPIO0_PC7` 边沿，但当前 4.6 实验只要求 K3。
这些线索先保留，后续若进入多按键实验再用更安静的阈值版单独确认。

## 需要问老师的信息

可直接问：

```text
老师，TX-SMART-R 底板 K3/K4/K5/K6 是分别接独立 GPIO，还是共用 USER_KEY_ADC？
如果共用 ADC，请问对应 SARADC 通道和各按键 raw/电压阈值是多少？
如果有 ohos-training 的 key 驱动源码或底板原理图，能发一下吗？
```

最有价值的资料：

- TX-SMART-R 底板原理图或 K3-K6 接线表；
- `ohos-training` 中 `key_light` / `lab02_key_lcd` 的 `board_pins.h`、`tx_key.c`；
- `USER_KEY_ADC` 对应 SARADC 通道；
- K3-K6 每个按键的 ADC raw 或电压阈值。
