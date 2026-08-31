# 00 基础环境与板卡启动验证

## 对应授课章节

- 3.4 准备源码
- 3.5 安装/修好 `hb`
- 3.6 编译固件
- 3.8 烧录到真板
- 3.9 串口调试

## 源码

源码位于 Ubuntu 虚拟机：

```text
/home/lzdz/rk2206/lockzhiner-rk2206-openharmony3.0lts
```

源码树不复制进主仓库。本实验只保存过程记录和复现信息。

## 已验证结果

- `hb` 安装成功，版本 `0.4.3`；
- `hb build -f` 成功；
- 输出目录：`out/rk2206/lockzhiner-rk2206/images/`；
- `Firmware.img` 大小为 `2097152` bytes；
- `rk2206_db_loader.bin` 已生成；
- RKDevTool 日志显示 Firmware 下载和校验均为 `100%`，最后显示“下载完成”；
- UART 使用 `USB-SERIAL CH340 (COM5)`，波特率 `115200`；
- 串口出现 `LOS_Start`、`Entering scheduler` 和 `hiview init success`。

## Windows 镜像备份

```text
D:\实习\tmp\rk2206_images\images\Firmware.img
D:\实习\tmp\rk2206_images\images\Firmware.md5
D:\实习\tmp\rk2206_images\images\rk2206_db_loader.bin
```

`Firmware.img` 的 MD5：

```text
8b4f88c7c3bf8dbbc63241a5eda00944
```

## 复现要点

1. 在 Ubuntu 中进入 `$OHOS_ROOT`。
2. 执行 `hb set -root .` 和 `hb set`，选择 `lockzhiner`、`lockzhiner-rk2206`。
3. 执行 `hb build -f`。
4. 烧录时使用 USB-OTG 口，UART 口不参与烧录。
5. RKDevTool 的 Loader 和 Firmware 文件必须分别对应 `.bin` 和 `Firmware.img`。
6. 烧录完成后切回 UART，使用 115200 观察启动日志。

## 当前边界

本阶段只证明编译环境、烧录链路和 OpenHarmony 内核启动正常；它不是最终的温度、光照、气体监测业务固件。下一个阶段是 `01_hello_world`。
