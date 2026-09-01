# 05_lab04_mq2_key_lcd 实验

## 1. 实验目标
- 授课文档 4.8 节：MQ2 气体 + 按键 + LCD
- 通过 SARADC 通道 4 采集板载 MQ2 烟雾/可燃气体模拟量并换算 PPM
- LCD 屏幕实时显示 `Gas: xxx ppm`
- K3 (`GPIO0_PC7`) 短按单次边沿触发 `mq2_ppm_calibration()` 重新校准基准值

## 2. 引脚与外设映射
- K3 按键: `GPIO0_PC7` (低电平按下，`tx_key_click` 边沿检测)
- MQ2 ADC: `SARADC_CH4` (引脚 `GPIO0_PC4`，复用 `MUX_FUNC1`)
- LCD 屏: 2.4 寸 SPI LCD，分辨率 320x240

## 3. 驱动模块
- `src/lcd.c`: 液晶屏底层驱动与字符绘制
- `src/tx_key.c`: K3 按键初始化与 `tx_key_click` 单击边沿判定
- `src/mq2.c`: MQ2 模拟量读取、电压换算、PPM 计算与基准校准
