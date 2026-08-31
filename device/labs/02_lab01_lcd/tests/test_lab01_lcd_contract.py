from pathlib import Path


LAB_ROOT = Path(__file__).resolve().parents[1]
SOURCE = LAB_ROOT / "lab01_lcd.c"
BUILD = LAB_ROOT / "BUILD.gn"
PATCH_NOTES = LAB_ROOT / "patches" / "README.md"
SAMPLES_PATCH = LAB_ROOT / "patches" / "samples_BUILD.gn.patch"
MAKEFILE_PATCH = LAB_ROOT / "patches" / "Makefile.patch"
FONT_HEADER = LAB_ROOT / "include" / "lcd_font.h"


def test_lcd_experiment_owns_startup_and_display_flow():
    source = SOURCE.read_text(encoding="utf-8")
    driver = (LAB_ROOT / "src" / "lcd.c").read_text(encoding="utf-8")

    assert '#include "lcd.h"' in source
    assert '#include "ohos_init.h"' in source
    assert 'printf("lab01_lcd: LCD_INIT_BEGIN\\r\\n");' in source
    assert "lcd_init();" in source
    assert "if (ret != 0)" in source
    assert 'printf("lab01_lcd: LCD_INIT_OK\\r\\n");' in source
    assert 'printf("lab01_lcd: LCD_FILL_BEGIN\\r\\n");' in source
    assert "lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE);" in source
    assert 'printf("lab01_lcd: LCD_FILL_DONE\\r\\n");' in source
    assert 'lcd_show_string(10, 40, "TX-SMART-R Lab01"' in source
    assert "LCD OK" in source
    assert "LOS_Msleep(1000)" in source
    assert "APP_FEATURE_INIT(lab01_lcd_example)" in source
    assert 'printf("lab01_lcd: LCD_GPIO_DONE\\r\\n");' in driver
    assert 'printf("lab01_lcd: LCD_RESET_DONE\\r\\n");' in driver
    assert 'printf("lab01_lcd: LCD_INIT_DONE\\r\\n");' in driver


def test_lcd_experiment_has_independent_build_contract():
    build = BUILD.read_text(encoding="utf-8")
    notes = PATCH_NOTES.read_text(encoding="utf-8")
    samples_patch = SAMPLES_PATCH.read_text(encoding="utf-8")
    makefile_patch = MAKEFILE_PATCH.read_text(encoding="utf-8")

    assert 'static_library("lab01_lcd")' in build
    assert '"lab01_lcd.c"' in build
    assert '"src/lcd.c"' in build
    assert FONT_HEADER.exists()
    assert "-llab01_lcd" in notes
    assert "删除" in notes
    assert "上一个实验" in notes
    assert '"./lab01_lcd:lab01_lcd",' in samples_patch
    assert "-lhal_iothardware -lhardware -lshellcmd -llab01_lcd" in makefile_patch
    assert "APP_FEATURE_INIT" in notes
    assert "do not call lab01_lcd_example from main.c" in notes
    assert not (LAB_ROOT / "patches" / "main.c.patch").exists()


def test_lcd_fullscreen_fill_yields_and_reports_row_progress():
    driver = (LAB_ROOT / "src" / "lcd.c").read_text(encoding="utf-8")
    fill_body = driver.split("void lcd_fill", 1)[1].split(
        "void lcd_draw_point", 1
    )[0]

    assert "#define LCD_FILL_YIELD_ROWS 8" in driver
    assert "LCD_FILL_PROGRESS" in fill_body
    assert "LOS_Msleep(1);" in fill_body
    assert "if (((i - ysta) % LCD_FILL_YIELD_ROWS)" in fill_body
    assert "(LCD_FILL_YIELD_ROWS - 1)" in fill_body
