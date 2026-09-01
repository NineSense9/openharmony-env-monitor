# 07_lab06_multitask_lcd 实验

## 1. 实验目标
- 授课文档 4.10 节：多任务 + LCD
- 创建双并行任务：
  - `sample_task` (约 3000ms 周期)：慢速采集 SHT30 温湿度写入 `g_temp`/`g_humi`
  - `ui_task` (约 200ms 周期)：高速更新 `Tick` 计数、刷新 LCD 界面、监听 K3 冻结
- K3 (`GPIO0_PC7`) 短按冻结采样，UI 任务 `Tick` 依然持续快跳，验证多任务调度无阻塞

## 2. 引脚与外设映射
- K3 按键: `GPIO0_PC7` (低电平按下，`tx_key_click` 边沿检测)
- SHT30 I2C0: SCL=`GPIO0_PA1`, SDA=`GPIO0_PA0`，从机地址 `0x44`
- LCD 屏: 2.4 寸 SPI LCD，分辨率 320x240

## 3. 驱动模块
- `src/lcd.c`: 液晶屏底层驱动与字符绘制
- `src/tx_key.c`: K3 按键初始化与 `tx_key_click` 单击边沿判定
- `src/sht30.c`: SHT30 I2C 通信、CRC8 校验、温湿度数据解析
