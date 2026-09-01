# 09_lab08_wifi_ping 实验

## 1. 实验目标
- 授课文档 4.12 节：Wi-Fi + Ping 百度
- 启动 Wi-Fi 联网获取本地 IP（连接 2.4GHz 热点 `Patient.`）
- 使用 lwIP ICMP RAW Socket 向公网（百度 IP `124.237.178.212`）发送 4 次 Ping 请求并监听回包
- LCD 屏幕与串口同步显示：
  - `WiFi: 192.168.9.51` (绿色)
  - `Ping: OK seq=4` (绿色)
  - `Summary: 4/4 OK` (绿色)

## 2. 引脚与网络配置
- 热点 SSID: `Patient.`
- 热点密码: `88888888`
- 网络初始化: `ExternalTaskConfigNetwork();` in `main.c`
- 屏幕: 2.4 寸 SPI LCD，分辨率 320x240

## 3. 驱动与业务模块
- `src/lcd.c`: 液晶屏底层驱动与字符绘制
- `src/ping.c`: lwIP ICMP RAW Socket 报文构造、校验和计算与收发统计
- `lab08_wifi_ping.c`: Wi-Fi 状态查询、4 次 Ping 调度与 LCD 渲染主任务

## 4. 验证与产物
- 烧录目录: `D:\实习\tmp\rk2206_images\lab09_lab08_wifi_ping_20260901`
- `Firmware.img` MD5: `a20764a68dc114bcb59c46242e5a9a2e`
- `rk2206_db_loader.bin` MD5: `5f2ea974b0e1df5564a8e1ee910627bb`
- **实物验收结果**: 【验收通过】实物板成功连接热点获取 IP `192.168.9.51`，向百度 IP `124.237.178.212` 发送 4 次 ICMP Ping 全部成功，屏幕显示绿色 `Summary: 4/4 OK`！
