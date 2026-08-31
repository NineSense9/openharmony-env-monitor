# RK2206 南向实验记录

南向实验按授课顺序独立保存。每个实验目录只描述一个清晰的课程检查点，不覆盖之前的实验。

| 编号 | 目录 | 内容 | 状态 |
| --- | --- | --- | --- |
| 00 | `00_bringup` | 源码准备、hb、基础编译、烧录、UART 启动验证 | 已完成 |
| 01 | `01_hello_world` | LiteOS-M 任务创建与串口周期打印 | UART 验收通过，LCD 未接入 |
| 02 | `02_lab01_lcd` | 授课文档 4.5：LCD 欢迎文字 | 单入口版已烧录，UART 卡在 LCD 初始化；诊断版待验证 |
| 03 | `03_lab02_key_lcd` | 授课文档 4.6：K3 按键 + LCD | 待开始 |
| 04 | `04_lab03_light_key_lcd` | 授课文档 4.7：告警灯 + K3 + LCD | 待开始 |
| 05 | `05_lab04_mq2_key_lcd` | 授课文档 4.8：MQ2 + K3 校准 + LCD | 待开始 |
| 06 | `06_lab05_sht30_key_lcd` | 授课文档 4.9：SHT30 + K3 冻结 + LCD | 待开始 |
| 07 | `07_lab06_multitask_lcd` | 授课文档 4.10：多任务 + LCD | 待开始 |
| 08 | `08_lab07_cabin_station` | 授课文档 4.11：舱内环境监测站 | 待开始 |
| 09 | `09_lab08_wifi_ping` | 授课文档 4.12：Wi-Fi + Ping + LCD | 待开始 |
| 10 | `10_cloud_telemetry` | 第五章：FastAPI、SQLite、遥测接口 | 云端基础代码已完成 |

完整的目录、记录和提交规则见：

`docs/superpowers/specs/2026-08-31-device-experiment-recording-design.md`

授课文档第四章的实验目录以 `02_lab01_lcd` 至
`09_lab08_wifi_ping` 保存；`01_hello_world` 是第三章 3.10 的通链路
例程，单独保留。
