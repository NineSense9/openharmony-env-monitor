# 08_lab07_cabin_station 实验

## 1. 实验目标
- 授课文档 4.11 节：舱内环境监测站
- 四路传感器融合采集：
  - SHT30: 温度 `T` (℃)、湿度 `H` (%)
  - BH1750: 光照 `Lux`
  - MQ2: 气体浓度 `ppm`
- 双路超限告警联动：
  - 环境告警 (Lux < 20.0 或 Gas > 80.0 ppm)：PA5 告警灯闪烁 + 电机旋转
  - 热湿告警 (Temp > 35.0 C 或 Humi > 70.0 %)：电机旋转
- K3 (`GPIO0_PC7`) 短按消警，全部传感器回到正常范围后自动重新 Armed

## 2. 引脚与外设映射
- K3 按键: `GPIO0_PC7` (消警按键)
- 用户告警灯: `GPIO0_PA5` (环境告警闪烁)
- 电机驱动: `GPIO1_PD0` (E53 农业板电机)、`GPIO0_PC6` (PWM6)、`GPIO0_PA2` (辅助风扇)
- SHT30/BH1750 I2C0: SCL=`GPIO0_PA1`, SDA=`GPIO0_PA0`
- MQ2 ADC: `SARADC_CH4` (`GPIO0_PC4`)
- LCD 屏: 2.4 寸 SPI LCD，分辨率 320x240

## 3. 驱动模块
- `src/lcd.c`: 液晶屏底层驱动与字符绘制（避免与 LCD SPI 引脚冲突）
- `src/tx_key.c`: K3 按键初始化与 `tx_key_click` 边沿判定
- `src/tx_light.c`: PA5 告警灯控制
- `src/mq2.c`: MQ2 SARADC 采集与 PPM 标定换算
- `src/smart_home.c`: SHT30/BH1750 I2C 通信与电机驱动

## 4. 验证与产物
- 烧录目录: `D:\实习\tmp\rk2206_images\lab08_lab07_cabin_station_20260901`
- `Firmware.img` MD5: `ba3e8586c15e7f9a3b7f6f1beab758aa`
- `rk2206_db_loader.bin` MD5: `5f2ea974b0e1df5564a8e1ee910627bb`
- **实物验收结果**: 【验收通过】用户实测四路传感器实时显示正常，遮光/吹气/捂热时告警灯闪烁、电机转动、屏幕红字告警均正常，K3 消警与安全复位功能完整闭环。
