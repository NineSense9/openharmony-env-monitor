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
