from pathlib import Path


LAB_ROOT = Path(__file__).resolve().parents[1]
SOURCE = LAB_ROOT / "src" / "gpio_example.c"
BUILD = LAB_ROOT / "src" / "BUILD.gn"
PATCH_NOTES = LAB_ROOT / "patches" / "README.md"


def test_adc_key_contract_uses_board_mapping_and_rejects_reset_keys():
    source = SOURCE.read_text(encoding="utf-8")
    notes = PATCH_NOTES.read_text(encoding="utf-8")

    assert "ADC_CHANNEL 5" in source
    assert "GPIO0_PC5" in source
    assert "LzSaradcReadValue" in source
    assert "IoTGpioGetInputVal" not in source
    assert "K1" not in source or "RESET" in source
    assert "K2" not in source or "MASKROM" in source
    assert all(key in notes for key in ("K3", "K4", "K5", "K6"))


def test_adc_key_contract_has_voltage_bands_and_debounce():
    source = SOURCE.read_text(encoding="utf-8")

    assert "data * 3.3 / 1024.0" in source
    assert "UNKNOWN" in source
    assert "20" in source
    assert "3" in source
    assert "KEY_LEVEL" in source


def test_adc_key_contract_has_build_target():
    build = BUILD.read_text(encoding="utf-8")

    assert 'static_library("gpio_example")' in build
    assert "gpio_example.c" in build
