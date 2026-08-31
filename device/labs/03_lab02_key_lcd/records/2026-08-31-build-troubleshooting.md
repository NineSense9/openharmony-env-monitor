# 4.6 构建排错记录（2026-08-31）

## 问题 1：复制工程后 hb 环境仍指向 4.5

从 4.5 基线复制新工程时，复制内容带有旧的 `out/` 生成目录。第一次预检发现
`hb env` 的 root path 仍是
`/home/lzdz/rk2206/lab02-lab01-lcd-20260831`，不能把该次构建结果当作 4.6
产物。

处理：在新工程内执行：

```bash
cd /home/lzdz/rk2206/lab03-lab02-key-lcd-20260831
rm -rf out
export PATH="/home/lzdz/.local/bin:$PATH"
hb set -root .
hb set -p
hb env
```

确认 root、product path 和 device path 都指向
`lab03-lab02-key-lcd-20260831` 后才继续构建。4.5 原工程未修改。

## 问题 2：scp 多源复制将子目录文件扁平化

第一次把 `include/*` 和 `src/*` 与顶层文件一起用 `scp` 传到目标目录，导致
`src/lcd.c` 实际落在了实验目录顶层。Ninja 报错：

```text
ninja: error: '../../../vendor/lockzhiner/rk2206/samples/lab02_key_lcd/src/lcd.c',
needed by 'obj/vendor/lockzhiner/rk2206/samples/lab02_key_lcd/src/liblab02_key_lcd.lcd.o',
missing and no known rule to make it
```

处理：在目标工程中把 `board_pins.h`、`lcd.h`、`lcd_font.h`、`tx_key.h` 移回
`include/`，把 `lcd.c`、`tx_key.c` 移回 `src/`，再重新执行 `hb build`。

## 最终结果

修正后重新生成独立 `out/` 并执行 `hb build`，完整成功输出保存在
`2026-08-31-build.log`。最终链接使用 `lab02_key_lcd`，没有链接 `lab01_lcd`；
构建产物和 MD5 保存在 `2026-08-31-build.md5`。

## 后续固定检查

每个后续实验从基线复制后必须：

1. 删除新工程的 `out/`，避免绝对路径和旧 Ninja 规则污染；
2. 用 `hb set -root .`、`hb set -p` 重新绑定工程；
3. 用 `hb env` 核对 root/product/device 三条路径；
4. 传输源码时保持 `include/`、`src/` 目录结构；
5. 构建前检查新库对象，构建后检查最终链接库名和产物时间。

## 问题 3：非交互 SSH 的 PATH 不完整

通过非交互 SSH 直接执行构建时，`hb` 未在默认 PATH 中；补充
`/home/lzdz/.local/bin` 后又发现系统交叉编译器实际位于 `/usr/bin`。因此后续
远端构建必须显式设置完整 PATH：

```bash
export PATH="/home/lzdz/.local/bin:/usr/bin:$PATH"
command -v hb
command -v arm-none-eabi-gcc
```

本次第一次构建因缺少 `hb` 只完成到打包前，第二次因缺少交叉编译器未开始；补齐
PATH 后重新执行 `hb build -f`，最终 `853/853`、返回码 0。完整日志保存在
`2026-08-31-build-k3-retry.log`。

## 问题 4：K3 首次 GPIO 读取失败会使任务过早退出

初始实现遇到 `tx_key_is_pressed()` 读取错误时直接 `return`，因此 LCD 欢迎文字
仍可显示，但状态行不显示，后续 K3 轮询也不会运行，表现为“K3 没反应”。修复后
首次读取失败会显示 `K3: READ ERR`，任务保留并每 100 ms 重试；读取恢复后再
输出并显示 `K3=PRESSED` 或 `K3=RELEASED`。

## 问题 5：PULL_KEEP 导致 K3 pinctrl 初始化失败

第一次为解决 GPIO 读取失败而采用 `PULL_KEEP`，但用户烧录该版本后的 UART 明确
输出：

```text
lab02_key_lcd: K3 pinctrl failed ret=1
lab02_key_lcd: tx_key_init failed(1)
```

这说明失败发生在 `PinctrlSet` 初始化阶段，任务还没有进入 K3 状态轮询；因此
截图中的“K3 没反应”不是按键读取逻辑或 K3 机械按键的结论。该版本的
`Firmware.img` MD5 为 `df7f5e3fbb3926bcbc08e3d657453a59`，已标记作废。

## 处理结果

保留读取失败可见、100 ms 重试和 30 ms 正常轮询逻辑，将 K3 pinctrl 上拉配置改回
`PULL_UP`，并重新执行 `hb build -f`。新构建完成 `853/853`，镜像 MD5 为
`5d5360c5bcea67ec33f0c30924e27f4a`，产物目录为
`D:\实习\tmp\rk2206_images\lab03_lab02_key_lcd_pullup_20260831`。

烧录前必须先核对目录和 MD5；在实物反馈前，不把 K3 修复标记为已验收。
