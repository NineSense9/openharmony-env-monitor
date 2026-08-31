# 4.5 lab01_lcd 镜像归档清单（2026-08-31）

为避免烧录目录混淆，`D:\实习\tmp\rk2206_images` 主目录只保留当前最后一版：

`lab02_lab01_lcd_landscape_normal_hwspi_mode3_relinked_20260831`

该版本已经在板上显示实验文字，方向仍为右下角倒置，但按阶段性决定作为后续
实验的可运行基线。

之前生成的 11 个 LCD 版本已移动到：

`D:\实习\tmp\rk2206_images\archive\2026-08-31-lcd-trials`

- `lab02_lab01_lcd`
- `lab02_lab01_lcd_dc_idle_20260831`
- `lab02_lab01_lcd_diagnostic_20260831`
- `lab02_lab01_lcd_invalid_double_entry_20260831`
- `lab02_lab01_lcd_landscape_normal_hwspi_mode3_20260831`
- `lab02_lab01_lcd_landscape_orientation3_hwspi_20260831`
- `lab02_lab01_lcd_landscape_orientation3_hwspi_mode3_20260831`
- `lab02_lab01_lcd_portrait_hwspi_20260831`
- `lab02_lab01_lcd_portrait_reverse_hwspi_20260831`
- `lab02_lab01_lcd_smart_r_a4_20260831`
- `lab02_lab01_lcd_yield_20260831`

归档操作只移动目录，没有删除历史镜像。后续烧录默认只从主目录当前基线取用；
归档目录仅用于查阅历史构建和故障记录。
