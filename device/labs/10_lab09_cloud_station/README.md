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
4. **云端极速低延迟遥测与双向控制闭环（<500ms）**：
   - 每 500ms 通过 lwIP 原生 TCP Socket 直连百度云微服务 `http://180.76.137.117:8000/api/telemetry` 发送 HTTP POST 极速遥测 JSON（携带 `motor_on`/`alarm_on` 物理状态）；
   - 每 200ms 轮询拉取云端远程指令（`GET /api/command/pending`），收到电机启停/消警指令后 ~50ms 内完成 GPIO 驱动并上报回执（`POST /api/command/{id}/ack`），端到端控制延迟仅 ~240ms；
5. **K3 键本地安全复位与极致灵敏度优化**：
   - 短按 K3（`GPIO0_PC7`）执行本地一键消警、电机停转与传感器安全复位；
   - 任务提权至最高用户优先级（`usTaskPrio = 3`），引入硬件级边沿检测状态机（Edge-Triggered）与 15ms 采样消抖，轻触即按即响、毫秒级响应；
6. **2.4 寸 LCD 航天动效与中文科技感 HUD 升级**：
   - 开机 3 秒自检动效与 OpenHarmony 3.0 LTS 徽章、分步自检与动态进度条；
   - 注入 59 个 16x16 常用中文字模，支持中文双列科技线框与心跳符；
   - 屏幕扫描方向切换为 `0xA0`（`USE_HORIZONTAL 3`），与主板硬件白字丝印 100% 正向对齐；
   - 状态字符严格规范为 4 字符定长并加入局部显存像素擦除（`lcd_fill`），彻底杜绝字符残影。

## 2. 硬件引脚与外设分配
- 告警指示灯: `GPIO0_PA5`（`TX_GPIO_ALARM_LIGHT`）
- 矩阵按键 K3: `GPIO0_PC7`（`TX_GPIO_KEY_K3`，优先级 Prio 3 边沿检测）
- MQ2 烟雾传感器: `SARADC_CH4`（`GPIO0_PC4`）
- SHT30 & BH1750: `I2C0`（SCL: `GPIO0_PA1`, SDA: `GPIO0_PA0`）
- 电机驱动引脚: `GPIO1_PD0` / `GPIO0_PC6` / `GPIO0_PA2`（全引脚兼容驱动）
- 屏幕显示: 2.4 寸 SPI LCD，分辨率 320x240，180° 正向横屏（`0xA0`）

## 3. 产物与烧录
- **Windows 烧录目录**: `workspace\device\images\10_lab09_cloud_station`
- `Firmware.img` MD5: `74e7c712fd0eb32187422aac1fdae4e4`
- `rk2206_db_loader.bin` MD5: `5f2ea974b0e1df5564a8e1ee910627bb`
