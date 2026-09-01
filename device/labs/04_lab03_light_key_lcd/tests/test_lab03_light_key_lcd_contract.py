import os
import pathlib
import pytest

LAB_DIR = pathlib.Path(__file__).resolve().parents[1]

def test_lab03_files_exist():
    assert (LAB_DIR / "lab03_light_key_lcd.c").exists()
    assert (LAB_DIR / "BUILD.gn").exists()
    assert (LAB_DIR / "include" / "board_pins.h").exists()
    assert (LAB_DIR / "include" / "tx_key.h").exists()
    assert (LAB_DIR / "include" / "tx_light.h").exists()
    assert (LAB_DIR / "include" / "lcd.h").exists()
    assert (LAB_DIR / "src" / "tx_key.c").exists()
    assert (LAB_DIR / "src" / "tx_light.c").exists()
    assert (LAB_DIR / "src" / "lcd.c").exists()
    assert (LAB_DIR / "patches" / "README.md").exists()

def test_board_pins():
    content = (LAB_DIR / "include" / "board_pins.h").read_text(encoding="utf-8")
    assert "GPIO0_PC7" in content
    assert "TX_KEY_K3" in content
    assert "GPIO0_PA5" in content
    assert "TX_GPIO_ALARM_LIGHT" in content

def test_tx_light():
    h_content = (LAB_DIR / "include" / "tx_light.h").read_text(encoding="utf-8")
    c_content = (LAB_DIR / "src" / "tx_light.c").read_text(encoding="utf-8")
    assert "tx_light_init" in h_content
    assert "tx_light_set" in h_content
    assert "LZGPIO_DIR_OUT" in c_content
    assert "LzGpioSetVal" in c_content

def test_tx_key_click():
    h_content = (LAB_DIR / "include" / "tx_key.h").read_text(encoding="utf-8")
    c_content = (LAB_DIR / "src" / "tx_key.c").read_text(encoding="utf-8")
    assert "tx_key_click" in h_content
    assert "tx_key_click" in c_content
    assert "was_pressed" in c_content

def test_lab03_main():
    content = (LAB_DIR / "lab03_light_key_lcd.c").read_text(encoding="utf-8")
    assert "tx_key_click" in content
    assert "tx_light_set" in content
    assert "TX_GPIO_ALARM_LIGHT" in content
    assert "Light: ON" in content
    assert "Light: OFF" in content
    assert "SYS_RUN" in content

def test_build_gn():
    content = (LAB_DIR / "BUILD.gn").read_text(encoding="utf-8")
    assert 'lite_library("lab03_light_key_lcd")' in content
    assert '"src/tx_light.c"' in content
    assert '"src/tx_key.c"' in content
