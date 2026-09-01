# 10_lab09_cloud_station 实验：南向开发板环境遥测上云与远程控制综合实验

## 1. 实验目标
本实验将**实验 7（四路传感器 + 声光电机联动 + 本地消警）** 与 **实验 8（Wi-Fi 联网）** 深度整合，与百度智能云 BCC 微服务全面打通，实现**端云一体化**：
1. **自动 Wi-Fi 联网**：连接 2.4GHz 热点 `Patient.`，分配局域网 DHCP IP；
2. **四路传感器实时采集**：
   - SHT30（I2C0）：舱内温度（℃）与相对湿度（%）
   - BH1750（I2C0）：光照强度（Lux）
   - MQ2（SARADC CH4 / `GPIO0_PC4`）：烟雾浓度（ppm）
3. **本地声光电机告警与 LCD 交互**：
   - 正常状态：绿字（`NORMAL`），PA5 熄灭，电机停止
   - 告警状态：红字（`ALARM`），PA5 闪烁，电机旋转排风
   - 屏幕同步显示：IP、温湿度、光照、烟雾、告警状态、上云成功计数（`Cloud: OK=N Err=N`）
4. **云端遥测上报与双向控制闭环**：
   - 每 3 秒通过 lwIP 原生 TCP Socket 直连百度云微服务 `http://180.76.137.117:8000/api/telemetry` 发送 HTTP POST 遥测 JSON；
   - 轮询拉取云端远程指令（`GET /api/command/pending`），若有指令（如电机启动/停止、告警确认）则执行并上报回执（`POST /api/command/{id}/ack`）；
5. **K3 键本地安全复位**：
   - 短按 K3（`GPIO0_PC7`）执行本地一键消警、电机停转与传感器安全复位。

## 2. 硬件引脚与外设分配
- 告警指示灯: `GPIO0_PA5`（`TX_GPIO_ALARM_LIGHT`）
- 矩阵按键 K3: `GPIO0_PC7`（`TX_GPIO_KEY_K3`）
- MQ2 烟雾传感器: `SARADC_CH4`（`GPIO0_PC4`）
- SHT30 & BH1750: `I2C0`（SCL: `GPIO0_PA1`, SDA: `GPIO0_PA0`）
- 电机驱动引脚: `GPIO1_PD0` / `GPIO0_PC6` / `GPIO0_PA2`（全引脚兼容驱动）
- 屏幕显示: 2.4 寸 SPI LCD，分辨率 320x240

## 3. 产物与烧录
- **Windows 烧录目录**: `D:\实习\tmp\rk2206_images\lab10_lab09_cloud_station_20260901`
- `Firmware.img` MD5: `3218b8a754c6e22b69d1166428b8b1d0`
- `rk2206_db_loader.bin` MD5: `5f2ea974b0e1df5564a8e1ee910627bb`
