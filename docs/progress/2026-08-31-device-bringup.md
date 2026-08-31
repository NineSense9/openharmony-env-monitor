# 2026-08-31 南向开发进度记录

## 目标

完成授课文档 3.4 至 3.9 的环境准备、基础固件编译、烧录和串口启动验证，为后续独立实验建立可复现基线。

## 完成情况

### 3.4 准备源码

在 Ubuntu 中克隆：

```text
https://gitee.com/Lockzhiner-Electronics/lockzhiner-rk2206-openharmony3.0lts.git
```

源码目录：

```text
/home/lzdz/rk2206/lockzhiner-rk2206-openharmony3.0lts
```

设置 `OHOS_ROOT` 后完成源码完整性检查，确认存在 `build`、`device`、`vendor`、`kernel`、`applications` 以及 RK2206 示例目录。

### 3.5 安装 `hb`

在源码根目录执行 `pip3 install --user build/lite`，安装成功：

```text
ohos-build==0.4.3
hb -> /home/lzdz/.local/bin/hb
```

### 3.6 编译

执行 `hb set` 选择 `lockzhiner` 和 `lockzhiner-rk2206`，再执行 `hb build -f`。编译结果：

```text
lockzhiner-rk2206 build success
cost time: 0:00:45
```

生成文件：

```text
Firmware.img
Firmware.md5
rk2206_db_loader.bin
```

### 3.8 烧录

Windows 使用 RKDevTool v2.63，Loader 和 Firmware 分别加载：

```text
D:\实习\tmp\rk2206_images\images\rk2206_db_loader.bin
D:\实习\tmp\rk2206_images\images\Firmware.img
```

工具日志显示：

```text
正在下载 Firmware... (100%)
正在校验 Firmware... (100%)
下载完成
```

烧录前后 `Firmware.img` 的 MD5 均为：

```text
8b4f88c7c3bf8dbbc63241a5eda00944
```

### 3.9 串口调试

烧录完成后板子退出 MASKROM，恢复为 `USB-SERIAL CH340 (COM5)`。UART 使用 `115200 8N1`、无流控，串口观察到：

```text
entering kernel init...
hiview will init.
[MAIN:D]Main: LOS_Start ...
Entering scheduler
OHOS # hiview init success.
```

## 结论

本日已完成南向基础环境、基础固件编译、烧录和 OpenHarmony 内核启动验证。当前固件只作为启动基线，尚未接入本项目的传感器、云端和远程控制业务。

## 下一步

进入 `device/labs/01_hello_world/`，已保留独立源码和补丁并完成编译、烧录
和 UART 验收。下一步按顺序开始 `02_gpio`。

## 01_hello_world 编译检查点

- 独立 worktree：`/home/lzdz/rk2206/lab01-hello-world-20260831`
- 补丁检查通过；
- `libtask_helloworld.a` 已生成并参与链接；
- `lockzhiner-rk2206 build success`；
- `Firmware.img` MD5：`5561e5deaf9c36a34fc9860c5cb5f52b`；
- 实验镜像已烧录；
- UART 已确认 `Hello World` 约每 1 秒输出、`Hello OpenHarmony` 约每 2 秒输出；
- 板载显示屏无输出，确认是因为本实验没有 LCD 初始化和绘图代码。

详细串口验收记录：
`device/labs/01_hello_world/records/2026-08-31-uart.txt`

### 编译问题记录

第一次构建在最终 `mkimage.sh` 打包阶段失败，错误为
`hb：未找到命令`。检查完整日志后确认，静态库已经编译并参与最终
链接，根因是非交互 SSH 会话的 `PATH` 没有包含
`/home/lzdz/.local/bin`。执行
`export PATH="/home/lzdz/.local/bin:$PATH"` 后重新构建成功。

后续每个实验编译前固定执行：

```bash
export PATH="/home/lzdz/.local/bin:$PATH"
command -v hb
hb --help | head
hb build -f
```
