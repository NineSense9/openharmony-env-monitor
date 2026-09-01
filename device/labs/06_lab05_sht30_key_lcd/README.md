# 06_lab05_sht30_key_lcd 实验

## 1. 实验目标
- 授课文档 4.9 节：SHT30 + 按键 + LCD
- 通过 I2C0 (0x44) 周期读取 SHT30 温湿度数据
- LCD 屏幕实时显示 `Temp: xx.x C` 与 `Humi: xx.x %`
- K3 (`GPIO0_PC7`) 短按边沿检测控制数据刷新冻结/继续（Freeze: ON/OFF）

## 2. 引脚与外设映射
- K3 按键: `GPIO0_PC7` (低电平按下，`tx_key_click` 边沿检测)
- SHT30 I2C0: SCL=`GPIO0_PA1`, SDA=`GPIO0_PA0`，从机地址 `0x44`
- LCD 屏: 2.4 寸 SPI LCD，分辨率 320x240

## 3. 驱动模块
- `src/lcd.c`: 液晶屏底层驱动与字符绘制
- `src/tx_key.c`: K3 按键初始化与 `tx_key_click` 单击边沿判定
- `src/sht30.c`: SHT30 I2C 通信、CRC8 校验、温湿度数据解析
