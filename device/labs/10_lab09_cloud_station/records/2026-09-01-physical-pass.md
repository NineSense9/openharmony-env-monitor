# 10_lab09_cloud_station 南向环境遥测上云与远程控制综合实验实物验收通过报告

- 验收日期: 2026-09-01
- 目标设备: Lockzhiner RK2206 开发板 + 舱内多传感器扩展板 + 2.4 寸 SPI LCD
- 联网热点: `Patient.` (2.4GHz Wi-Fi, 获取 IP `192.168.9.51`)
- 云端服务器: 百度智能云 BCC `180.76.137.117:8000`

---

## 1. 验收项与测试结果

| 测试项 | 预期行为 | 实测结果 | 结论 |
| :--- | :--- | :--- | :--- |
| **Wi-Fi 自动联网** | 启动后自动连接 `Patient.` 热点并获取 DHCP IP | LCD 第二行绿色显示 `IP: 192.168.9.51`，串口打印 `[cloud] wifi ready` | **PASS** |
| **四路传感采集** | 实时采集 SHT30（温湿度）、BH1750（光照）、MQ2（烟雾） | LCD 实时刷新 `T:31.9 C H:50.6%`, `Lux:xxx Gas:x.x` | **PASS** |
| **云端遥测上报** | 每 3 秒通过 lwIP 原生 TCP Socket 直连百度云 POST 上报 | LCD 计数 `Cloud: OK=26+ Err=0`，云端数据库实时入库 | **PASS** |
| **告警联动与自动复位** | 环境超标触发声光电机报警，恢复正常后自动停转 | 超标触发电机震动，环境恢复正常后电机立即自动停止 | **PASS** |
| **K3 锁存消警静音** | 按下 K3 立即停转电机并保持静音，直到环境完全恢复 | 按下 K3 电机停转，LCD 显示 `Status: [MUTED]`，环境恢复后自动解除静音 | **PASS** |
| **云端远程控制** | Swagger 下发 `target: motor, action: on/off` | 板端在 2~3 秒内捕获指令并驱动电机启停，云端状态置为 `done` | **PASS** |

---

## 2. 云端远程指令执行日志（摘录）
- Command ID 18: `motor on` -> `status: done`, `note: executed on rk2206`
- Command ID 19: `motor off` -> `status: done`, `note: executed on rk2206`
- Command ID 20: `motor on` -> `status: done`, `note: executed on rk2206`
- Command ID 21: `motor off` -> `status: done`, `note: executed on rk2206`

## 3. 验收结论
**【全链路验收通过】**
南向 RK2206 硬件端（四路传感采集、本地 LCD UI、K3 锁存消警、Wi-Fi 联网通信、双向 HTTP 遥测与指令控制闭环）与百度云端微服务全面打通，端云一体化完整闭环！
