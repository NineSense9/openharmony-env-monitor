# 08_lab07_cabin_station 实验

## 1. 实验目标
- 授课文档 4.11 节：舱内环境监测站
- 传感器融合：SHT30（温湿度）、BH1750（光照）、MQ2（可燃气体）四路采集
- 多执行器告警：
  - 环境告警 (Lux < 50 或 Gas > 100ppm)：PA5 报警灯闪烁 + 电机转动
  - 热湿告警 (Temp > 35C 或 Humi > 80%)：RGB 白灯常亮 + 电机转动
- K3 (`GPIO0_PC7`) 短按消警，全部传感器回到正常范围后自动重新 Armed

## 2. 引脚与外设映射
- K3 按键: `GPIO0_PC7` (消警按键)
- 用户告警灯: `GPIO0_PA5` (环境告警闪烁)
- RGB LED: R=`GPIO0_PB5`, G=`GPIO0_PB4`, B=`GPIO0_PD0` (热湿告警白亮)
- 电机: `GPIO1_PD0` (超限转动)
- SHT30/BH1750 I2C0: SCL=`GPIO0_PA1`, SDA=`GPIO0_PA0`
- MQ2 ADC: `SARADC_CH4` (`GPIO0_PC4`)
- LCD 屏: 2.4 寸 SPI LCD，分辨率 320x240
