from pathlib import Path


LAB_ROOT = Path(__file__).resolve().parents[1]
DIAGNOSTIC_ROOT = LAB_ROOT / "diagnostics" / "adc5_key_lcd"
SOURCE = DIAGNOSTIC_ROOT / "adc5_key_lcd.c"
BUILD = DIAGNOSTIC_ROOT / "BUILD.gn"
README = DIAGNOSTIC_ROOT / "README.md"


def test_adc_diagnostic_uses_the_board_user_key_input():
    source = SOURCE.read_text(encoding="utf-8")
    readme = README.read_text(encoding="utf-8")

    assert "ADC_CHANNEL 5" in source
    assert "GPIO0_PC5" in source
    assert "DevIoInit" in source
    assert "LzSaradcInit" in source
    assert "LzSaradcReadValue" in source
    assert "USER_KEY_ADC" in source
    assert "K1" in readme and "RESET" in readme
    assert "K2" in readme and "MASKROM" in readme
    assert all(key in readme for key in ("K3", "K4", "K5", "K6"))


def test_adc_diagnostic_reports_raw_value_and_voltage_without_guessing_labels():
    source = SOURCE.read_text(encoding="utf-8")

    assert "*raw * 3.3 / 1024.0" in source
    assert "USER_KEY_ADC" in source
    assert "raw=%u" in source
    assert "voltage=%.3fV" in source
    assert "ADC5 raw=%u" in source
    assert "PC7 raw=%u" in source
    assert "ADC_SAMPLE_INTERVAL_MS 100" in source
    assert "LOS_Msleep(ADC_SAMPLE_INTERVAL_MS)" in source


def test_input_matrix_diagnostic_compares_pdf_pc7_with_board_adc5():
    source = SOURCE.read_text(encoding="utf-8")

    assert "K3_GPIO GPIO0_PC7" in source
    assert "LzGpioInit(K3_GPIO)" in source
    assert "LzGpioSetDir(K3_GPIO, LZGPIO_DIR_IN)" in source
    assert "LzGpioGetVal(K3_GPIO" in source
    assert "K3_GPIO=GPIO0_PC7" in source
    assert "PC7 raw=%u" in source
    assert "ADC5 raw=%u" in source


def test_diagnostic_readme_documents_the_dual_path_uart_signature():
    readme = README.read_text(encoding="utf-8")

    assert "ADC5 raw=" in readme
    assert "PC7 raw=" in readme
    assert "key=KEY_UNKNOWN" in readme
    assert "不要继续烧录" in readme


def test_adc_diagnostic_has_a_standalone_build_target():
    build = BUILD.read_text(encoding="utf-8")

    assert 'static_library("lab02_key_lcd_adc_diagnostic")' in build
    assert '"adc5_key_lcd.c"' in build
