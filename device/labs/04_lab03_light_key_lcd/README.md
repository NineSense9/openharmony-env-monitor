# 04_lab03_light_key_lcd 实验

## 1. 实验目标
- 授课文档 4.7 节：灯 + 按键 + LCD
- K3 (`GPIO0_PC7`) 短按边沿翻转告警灯 (`TX_GPIO_ALARM_LIGHT` = `GPIO0_PA5`)
- LCD 屏实时显示 `Light: ON` / `Light: OFF`，状态与物理灯保持一致

## 2. 引脚与外设映射
- K3 按键: `GPIO0_PC7` (低电平按下，`tx_key_click` 边沿检测)
- 告警灯: `GPIO0_PA5` (高电平亮，低电平灭，`tx_light_set`)
- LCD 屏: 2.4 寸 SPI LCD，分辨率 320x240

## 3. 驱动模块
- `src/lcd.c`: 液晶屏底层驱动与字符绘制
- `src/tx_key.c`: K3 按键初始化、电平读取与 `tx_key_click` 单击边沿判定
- `src/tx_light.c`: 告警灯初始化与开关控制

## 4. 验证与产物
- 烧录目录: `D:\实习\tmp\rk2206_images\lab04_lab03_light_key_lcd_20260901`
- `Firmware.img` MD5: `bf891d8f00f72c5cd82af3b0abc91845`
- `rk2206_db_loader.bin` MD5: `5f2ea974b0e1df5564a8e1ee910627bb`
- **实物验收结果**: 【验收通过】K3 短按成功翻转 PA5 物理告警灯，屏幕 `Light: ON / OFF` 状态与物理灯完全同步，串口日志正常。

