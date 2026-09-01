# Pin Sniffer 诊断设计

目标是在 4.6 `lab02_key_lcd` 卡住时，用一版 UART-only 固件快速确认 K3 的真实输入来源。
该诊断不替代课程代码，只用于定位实物按键映射。

## 范围

- 不启用 LCD，避免 LCD 刷屏速度、方向和 SPI 引脚干扰判断。
- 不触碰已知高风险引脚：UART 调试口、LCD SPI/DC/RES、PWM6 电机、RESET、MASKROM。
- 扫描 GPIO0 的安全候选输入：`PA0-PA3`、`PA5`、`PB0-PB7`、`PC4`、`PC5`、`PC7`、`PD0-PD7`。
- 扫描 SARADC `0-7` 通道；`GPIO0_PC5` 保留 ADC5 初始化，同时也记录其数字读数。
- UART 只在初始化、GPIO 电平变化、ADC 原始值变化超过阈值时打印。

## 输出

启动后打印 `PIN_SNIFFER_READY`、每个候选 GPIO 的 `GPIO_INIT`、ADC 初始化状态和各通道基线。
按键动作触发时打印：

```text
pin_sniffer: GPIO_CHANGE name=GPIO0_PB3 id=11 1->0 tick=123
pin_sniffer: ADC_CHANGE ch=5 raw=0->380 mv=1224 tick=123
```

若按 K3 后没有任何 `GPIO_CHANGE` 或 `ADC_CHANGE`，说明当前扫描范围没有捕捉到实体 K3，
应向老师索要 TX-SMART-R 底板原理图、`ohos-training` 的 key 驱动源码、K3-K6 真实引脚
或 USER_KEY_ADC 阈值表。

## 验收

本地契约测试必须确认 Pin Sniffer 是独立构建目标、UART-only、不引用 LCD 驱动、不包含已知忙脚、
包含候选 GPIO、ADC0-7 和事件字符串。Ubuntu 构建后必须检查 `Firmware.img` 中包含
`PIN_SNIFFER_READY`、`GPIO_CHANGE`、`ADC_CHANGE`。
