# 01 Hello World

## 状态

源码和补丁已保存，Ubuntu 独立 worktree 已编译成功，待烧录串口验收。该目录保存本实验独立的源码、补丁、编译日志和串口验证结果，不与 `00_bringup` 共用可变源码文件。

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
- 当前还未烧录本实验镜像，板子仍可按 `00_bringup` 基线重新恢复。

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

实现前已确认基础源码中的原始文件内容和当前编译配置；下一步是烧录本实验镜像并通过 UART 验证两类周期输出。
