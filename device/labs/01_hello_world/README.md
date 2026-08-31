# 01 Hello World

## 状态

源码和补丁已保存，Ubuntu 独立 worktree 已编译成功，实验镜像已烧录，UART
验收通过。板载显示屏没有输出是预期现象：本实验只验证串口周期打印，没有
包含 LCD 初始化或绘图代码。该目录保存本实验独立的源码、补丁、编译日志和
串口验证结果，不与 `00_bringup` 共用可变源码文件。

## 课程目标

按照授课文档，将两个 LiteOS-M 任务接入 RK2206 启动流程：

- 每隔 1 秒打印 `Hello World`；
- 每隔 2 秒打印 `Hello OpenHarmony`。

## 计划保存内容

- `src/hello_world.c`：任务实现；
- `patches/main.c.patch`：主函数入口修改；
- `patches/Makefile.patch`：静态库链接修改；
- `patches/BUILD.gn.patch`：构建依赖修改；
- `records/`：编译、烧录和串口日志。

## 当前验证

- 补丁检查通过；
- `libtask_helloworld.a` 已成功生成并参与链接；
- `hb build -f` 成功，耗时约 31 秒；
- `Firmware.img` 已复制并完成 MD5 校验；
- 实验镜像已烧录到开发板；
- UART 已观察到两个周期任务的输出；
- 本实验未接入 LCD，板载显示屏无输出不影响本实验验收。

## 编译避错记录

本实验第一次构建失败的位置不是 C 源码编译，也不是静态库链接，而是最终
`mkimage.sh` 打包阶段。非交互 SSH 会话的 `PATH` 没有包含
`/home/lzdz/.local/bin`，脚本调用 `hb` 时出现：

```text
hb：未找到命令
```

修复后重新构建成功。以后每次通过 Ubuntu SSH 编译前，必须先执行：

```bash
export PATH="/home/lzdz/.local/bin:$PATH"
command -v hb
hb --help | head
hb build -f
```

其中 `command -v hb` 必须输出 `/home/lzdz/.local/bin/hb`，否则先不要开始编译。
完整失败和成功日志保存在 `records/2026-08-31-build.log`。

## 本实验烧录文件

烧录本实验时使用以下目录中的文件：

```text
D:\实习\tmp\rk2206_images\lab01_hello_world\rk2206_db_loader.bin
D:\实习\tmp\rk2206_images\lab01_hello_world\Firmware.img
```

`Firmware.img` 的 MD5 为：

```text
5561e5deaf9c36a34fc9860c5cb5f52b
```

不要使用 `D:\实习\tmp\rk2206_images\images\Firmware.img`，那个是
`00_bringup` 基础固件。

## 实现接入点

1. 将 `src/hello_world.c` 和 `src/BUILD.gn` 放入源码树的
   `vendor/lockzhiner/rk2206/samples/a0_hello_world/`。
2. 应用 `patches/main.c.patch`，在启动阶段调用 `task_example()`。
3. 应用 `patches/Makefile.patch`，把 `libtask_helloworld.a` 加入最终链接。
4. 应用 `patches/sdk_liteos_BUILD.gn.patch`，让 `hb` 构建这个静态库。

## 预期串口现象

烧录后按下 `Reset`，串口应同时出现两类输出：

```text
Hello World
Hello OpenHarmony
```

其中 `Hello World` 间隔约 1 秒，`Hello OpenHarmony` 间隔约 2 秒。

本次实际串口输出与上述现象一致。LCD 功能不属于本实验范围，后续由
`03_lcd` 独立实验实现。下一步按实验顺序进入 `02_gpio`。
