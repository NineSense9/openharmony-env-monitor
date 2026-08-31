from pathlib import Path


LAB_ROOT = Path(__file__).resolve().parents[1]
SOURCE = LAB_ROOT / "lab01_lcd.c"
BUILD = LAB_ROOT / "BUILD.gn"
PATCH_NOTES = LAB_ROOT / "patches" / "README.md"
FONT_HEADER = LAB_ROOT / "include" / "lcd_font.h"


def test_lcd_experiment_owns_startup_and_display_flow():
    source = SOURCE.read_text(encoding="utf-8")

    assert '#include "lcd.h"' in source
    assert '#include "ohos_init.h"' in source
    assert "lcd_init();" in source
    assert "if (ret != 0)" in source
    assert "lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE);" in source
    assert 'lcd_show_string(10, 40, "TX-SMART-R Lab01"' in source
    assert "LCD OK" in source
    assert "LOS_Msleep(1000)" in source
    assert "APP_FEATURE_INIT(lab01_lcd_example)" in source


def test_lcd_experiment_has_independent_build_contract():
    build = BUILD.read_text(encoding="utf-8")
    notes = PATCH_NOTES.read_text(encoding="utf-8")

    assert 'static_library("lab01_lcd")' in build
    assert '"lab01_lcd.c"' in build
    assert '"src/lcd.c"' in build
    assert FONT_HEADER.exists()
    assert "-llab01_lcd" in notes
    assert "删除" in notes
    assert "helloworld" in notes
