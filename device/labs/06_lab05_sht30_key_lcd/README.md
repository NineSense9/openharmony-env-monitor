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

## 4. 验证与产物
- 烧录目录: `D:\实习\tmp\rk2206_images\lab06_lab05_sht30_key_lcd_20260901`
- `Firmware.img` MD5: `3f18a1654466fcc7b3ade57780c06273`
- `rk2206_db_loader.bin` MD5: `5f2ea974b0e1df5564a8e1ee910627bb`
- **实物验收结果**: 【验收通过】用户实测温湿度动态采样真实准确，捂传感器温湿度快速响应上升，K3 短按成功冻结/解冻屏幕刷新。

