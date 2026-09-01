from pathlib import Path


LAB_ROOT = Path(__file__).resolve().parents[1]
SNIFFER_ROOT = LAB_ROOT / "diagnostics" / "pin_sniffer"
SOURCE = SNIFFER_ROOT / "pin_sniffer.c"
BUILD = SNIFFER_ROOT / "BUILD.gn"
README = SNIFFER_ROOT / "README.md"


def test_pin_sniffer_has_a_standalone_uart_only_build_target():
    source = SOURCE.read_text(encoding="utf-8")
    build = BUILD.read_text(encoding="utf-8")

    assert 'static_library("lab02_key_pin_sniffer")' in build
    assert '"pin_sniffer.c"' in build
    assert '"../../src/lcd.c"' not in build
    assert '#include "lcd.h"' not in source
    assert "lcd_init" not in source
    assert "lcd_show_string" not in source
    assert "APP_FEATURE_INIT(pin_sniffer_example)" in source


def test_pin_sniffer_scans_safe_gpio0_candidates_without_known_busy_pins():
    source = SOURCE.read_text(encoding="utf-8")
    readme = README.read_text(encoding="utf-8")

    for pin in (
        "GPIO0_PA0",
        "GPIO0_PA1",
        "GPIO0_PA2",
        "GPIO0_PA3",
        "GPIO0_PA5",
        "GPIO0_PB0",
        "GPIO0_PB7",
        "GPIO0_PC4",
        "GPIO0_PC7",
        "GPIO0_PD0",
        "GPIO0_PD7",
    ):
        assert pin in source

    for busy_pin in (
        "GPIO0_PA4",
        "GPIO0_PA6",
        "GPIO0_PA7",
        "GPIO0_PC0",
        "GPIO0_PC1",
        "GPIO0_PC2",
        "GPIO0_PC3",
        "GPIO0_PC6",
    ):
        assert busy_pin not in source

    assert "UART" in readme
    assert "LCD" in readme
    assert "GPIO0_PC6" in readme


def test_pin_sniffer_reports_gpio_edges_and_adc_channel_changes():
    source = SOURCE.read_text(encoding="utf-8")
    readme = README.read_text(encoding="utf-8")

    assert "PIN_SNIFFER_READY" in source
    assert "GPIO_CHANGE" in source
    assert "ADC_CHANGE" in source
    assert "GPIO_INIT" in source
    assert "ADC_INIT" in source
    assert "LzGpioGetVal" in source
    assert "LzSaradcReadValue" in source
    assert "ADC_CHANNEL_COUNT 8" in source
    assert "ADC_CHANGE_THRESHOLD 20" in source
    assert "POLL_INTERVAL_MS 20" in source
    assert "GPIO_CHANGE name=" in readme
    assert "ADC_CHANGE ch=" in readme


def test_pin_sniffer_readme_records_teacher_questions():
    readme = README.read_text(encoding="utf-8")

    assert "ohos-training" in readme
    assert "USER_KEY_ADC" in readme
    assert "raw" in readme
    assert "阈值" in readme
