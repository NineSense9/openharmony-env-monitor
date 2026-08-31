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
