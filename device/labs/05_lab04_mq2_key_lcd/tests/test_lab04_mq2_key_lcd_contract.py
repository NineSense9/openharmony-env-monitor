import os
import pathlib
import pytest

LAB_DIR = pathlib.Path(__file__).resolve().parents[1]

def test_lab04_files_exist():
    assert (LAB_DIR / "lab04_mq2_key_lcd.c").exists()
    assert (LAB_DIR / "BUILD.gn").exists()
    assert (LAB_DIR / "include" / "board_pins.h").exists()
    assert (LAB_DIR / "include" / "tx_key.h").exists()
    assert (LAB_DIR / "include" / "mq2.h").exists()
    assert (LAB_DIR / "include" / "lcd.h").exists()
    assert (LAB_DIR / "src" / "tx_key.c").exists()
    assert (LAB_DIR / "src" / "mq2.c").exists()
    assert (LAB_DIR / "src" / "lcd.c").exists()
    assert (LAB_DIR / "patches" / "README.md").exists()

def test_board_pins():
    content = (LAB_DIR / "include" / "board_pins.h").read_text(encoding="utf-8")
    assert "GPIO0_PC7" in content
    assert "TX_KEY_K3" in content
    assert "MQ2_ADC_PORT" in content

def test_mq2_driver():
    h_content = (LAB_DIR / "include" / "mq2.h").read_text(encoding="utf-8")
    c_content = (LAB_DIR / "src" / "mq2.c").read_text(encoding="utf-8")
    assert "mq2_dev_init" in h_content
    assert "get_mq2_ppm" in h_content
    assert "mq2_ppm_calibration" in h_content
    assert "LzSaradcReadValue" in c_content
    assert "613.9" in c_content

def test_lab04_main():
    content = (LAB_DIR / "lab04_mq2_key_lcd.c").read_text(encoding="utf-8")
    assert "mq2_dev_init" in content
    assert "mq2_ppm_calibration" in content
    assert "get_mq2_ppm" in content
    assert "tx_key_click" in content
    assert "Gas:" in content
    assert "SYS_RUN" in content

def test_build_gn():
    content = (LAB_DIR / "BUILD.gn").read_text(encoding="utf-8")
    assert 'lite_library("lab04_mq2_key_lcd")' in content
    assert '"src/mq2.c"' in content
