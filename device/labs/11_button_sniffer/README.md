# RK2206 按键与引脚独立全功能硬件嗅探诊断程序 (Button Sniffer HUD)

本诊断程序用于在不依赖任何云端、Wi-Fi 或复杂业务逻辑的前提下，以最高刷新率直接在板载 LCD 屏幕（320x240，正向朝向 USE_HORIZONTAL 3）和串口（115200 8N1）上实时可视化探测开发板所有候选按键 GPIO 和 ADC 通道。

## 诊断背景与目标

1. 用户反馈实物底板上按压 K3、K4、K6 均触发同一风机换档功能，K5 无响应；
2. 原理图分析显示 K5 直连 CPU 硬件复位线 RK2206_RESET_N，K6 直连 MASKROM / STATE_LED；
3. 本程序对以下所有管脚进行 20ms 高频实时采样：
   - GPIO: GPIO0_PC7 (K3标准), GPIO0_PC6, GPIO0_PC5, GPIO0_PC4, GPIO0_PA2, GPIO0_PA3, GPIO0_PA4, GPIO0_PA5, GPIO0_PB5, GPIO0_PB6
   - ADC: SARADC CH0, CH1, CH2, CH3, CH4, CH5 (USER_KEY_ADC)

## 屏幕显示与交互

1. **左半区 (GPIO 状态)**:
   - 正常高电平：显示 HIGH(1)
   - 按下低电平：整行瞬间变为**鲜艳红底白字 LOW [DOWN]**，并记录累计按压次数。
2. **右半区 (SARADC 电压)**:
   - 实时显示 CH0~CH5 电压（精确到 0.01V）和原始采样值 Raw。
   - 当电阻分压按键按下（电压低于 2.90V 时），整行瞬间变为**鲜艳绿底黑字**。
3. **底部事件栏**:
   - 实时显示最近一次触发的按键/引脚名，以及系统运行 Tick 和总事件计数。

## 固件输出路径

1. D:\\实习\\tmp\\rk2206_images\\Firmware.img
2. D:\\实习\\tmp\\rk2206_images\\button_sniffer_diagnostic\\Firmware.img
3. D:\\实习\\Firmware.img
