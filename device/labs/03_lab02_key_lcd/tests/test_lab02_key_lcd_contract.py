from pathlib import Path


LAB_ROOT = Path(__file__).resolve().parents[1]
SOURCE = LAB_ROOT / "lab02_key_lcd.c"
BUILD = LAB_ROOT / "BUILD.gn"
PINS = LAB_ROOT / "include" / "board_pins.h"
KEY_HEADER = LAB_ROOT / "include" / "tx_key.h"
KEY_DRIVER = LAB_ROOT / "src" / "tx_key.c"
PATCH_NOTES = LAB_ROOT / "patches" / "README.md"


def test_key_driver_uses_pdf_k3_gpio_contract():
    source = SOURCE.read_text(encoding="utf-8")
    pins = PINS.read_text(encoding="utf-8")
    key_header = KEY_HEADER.read_text(encoding="utf-8")
    driver = KEY_DRIVER.read_text(encoding="utf-8")

    assert "TX_KEY_K3" in pins
    assert "GPIO0_PC7" in pins
    assert "tx_key_init" in key_header
    assert "tx_key_is_pressed" in key_header
    assert "LzGpioInit" in driver
    assert "LzGpioSetDir" in driver
    assert "LZGPIO_DIR_IN" in driver
    assert "LzGpioGetVal" in driver
    assert "LZGPIO_LEVEL_LOW" in driver
    assert "PULL_KEEP" in driver
    assert "pressed" in driver
    assert "GPIO0_PC6" not in driver
    assert "LzSaradcReadValue" not in driver
    assert '"K1"' not in source
    assert '"K2"' not in source


def test_key_lcd_task_reports_only_changed_k3_state():
    source = SOURCE.read_text(encoding="utf-8")

    assert '#include "lcd.h"' in source
    assert '#include "tx_key.h"' in source
    assert "lcd_init();" in source
    assert "tx_key_init();" in source
    assert "K3: PRESSED" in source
    assert "K3: RELEASED" in source
    assert "if (pressed != last_pressed)" in source
    assert "lcd_fill(10, 90, 300, 120, LCD_WHITE);" in source
    assert "LOS_Msleep(30);" in source
    assert "APP_FEATURE_INIT(lab02_key_lcd_example)" in source


def test_key_read_failure_is_visible_and_retried():
    source = SOURCE.read_text(encoding="utf-8")

    assert '"K3: READ ERR"' in source
    assert "initial K3 read failed" in source
    assert "last_pressed = 2U" in source
    assert "LOS_Msleep(100);" in source


def test_key_lcd_has_independent_build_and_integration_contract():
    build = BUILD.read_text(encoding="utf-8")
    notes = PATCH_NOTES.read_text(encoding="utf-8")

    assert 'static_library("lab02_key_lcd")' in build
    assert '"lab02_key_lcd.c"' in build
    assert '"src/lcd.c"' in build
    assert '"src/tx_key.c"' in build
    assert "-llab02_key_lcd" in notes
    assert "-llab01_lcd" in notes
    assert "GPIO0_PC7" in notes
    assert "APP_FEATURE_INIT" in notes


def test_key_lcd_inherits_the_known_lcd_baseline():
    driver = (LAB_ROOT / "src" / "lcd.c").read_text(encoding="utf-8")
    header = (LAB_ROOT / "include" / "lcd.h").read_text(encoding="utf-8")

    assert "GPIO0_PA4" in driver
    assert ".mode = SPI_MODE_3" in driver
    assert "lcd_wr_data8(0x60)" in driver
    assert "#define LCD_W 320" in header
    assert "#define LCD_H 240" in header
