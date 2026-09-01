import os
import pathlib
import pytest

LAB_DIR = pathlib.Path(__file__).resolve().parents[1]

def test_lab05_files_exist():
    assert (LAB_DIR / "lab05_sht30_key_lcd.c").exists()
    assert (LAB_DIR / "BUILD.gn").exists()
    assert (LAB_DIR / "include" / "board_pins.h").exists()
    assert (LAB_DIR / "include" / "tx_key.h").exists()
    assert (LAB_DIR / "include" / "sht30.h").exists()
    assert (LAB_DIR / "include" / "lcd.h").exists()
    assert (LAB_DIR / "src" / "tx_key.c").exists()
    assert (LAB_DIR / "src" / "sht30.c").exists()
    assert (LAB_DIR / "src" / "lcd.c").exists()
    assert (LAB_DIR / "patches" / "README.md").exists()

def test_board_pins():
    content = (LAB_DIR / "include" / "board_pins.h").read_text(encoding="utf-8")
    assert "GPIO0_PC7" in content
    assert "TX_KEY_K3" in content
    assert "0x44" in content

def test_sht30_driver():
    h_content = (LAB_DIR / "include" / "sht30.h").read_text(encoding="utf-8")
    c_content = (LAB_DIR / "src" / "sht30.c").read_text(encoding="utf-8")
    assert "sht30_init" in h_content
    assert "sht30_read_data" in h_content
    assert "LzI2cInit" in c_content
    assert "LzI2cRead" in c_content
    assert "175.0" in c_content

def test_lab05_main():
    content = (LAB_DIR / "lab05_sht30_key_lcd.c").read_text(encoding="utf-8")
    assert "sht30_init" in content
    assert "sht30_read_data" in content
    assert "tx_key_click" in content
    assert "Temp:" in content
    assert "Humi:" in content
    assert "SYS_RUN" in content

def test_build_gn():
    content = (LAB_DIR / "BUILD.gn").read_text(encoding="utf-8")
    assert 'lite_library("lab05_sht30_key_lcd")' in content
    assert '"src/sht30.c"' in content
