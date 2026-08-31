# 01 Hello World

## 状态

待开始。该目录用于保存本实验独立的源码、补丁、编译日志和串口验证结果，不与 `00_bringup` 共用可变源码文件。

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

实现前先确认基础源码中的原始文件内容和当前编译配置，再按本实验的补丁编译验证。
