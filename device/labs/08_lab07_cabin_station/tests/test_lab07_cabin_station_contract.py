import os
import pathlib
import pytest

LAB_DIR = pathlib.Path(__file__).resolve().parents[1]

def test_lab07_files_exist():
    assert (LAB_DIR / "lab07_cabin_station.c").exists()
    assert (LAB_DIR / "BUILD.gn").exists()
    assert (LAB_DIR / "include" / "board_pins.h").exists()
    assert (LAB_DIR / "include" / "tx_key.h").exists()
    assert (LAB_DIR / "include" / "tx_light.h").exists()
    assert (LAB_DIR / "include" / "mq2.h").exists()
    assert (LAB_DIR / "include" / "smart_home.h").exists()
    assert (LAB_DIR / "include" / "lcd.h").exists()
    assert (LAB_DIR / "src" / "tx_key.c").exists()
    assert (LAB_DIR / "src" / "tx_light.c").exists()
    assert (LAB_DIR / "src" / "mq2.c").exists()
    assert (LAB_DIR / "src" / "smart_home.c").exists()
    assert (LAB_DIR / "src" / "lcd.c").exists()

def test_board_pins():
    content = (LAB_DIR / "include" / "board_pins.h").read_text(encoding="utf-8")
    assert "GPIO0_PC7" in content
    assert "TX_GPIO_ALARM_LIGHT" in content
    assert "MOTOR_PIN" in content

def test_smart_home_driver():
    h_content = (LAB_DIR / "include" / "smart_home.h").read_text(encoding="utf-8")
    c_content = (LAB_DIR / "src" / "smart_home.c").read_text(encoding="utf-8")
    assert "smart_home_init" in h_content
    assert "sht30_read_temp_humi" in h_content
    assert "bh1750_read_lux" in h_content
    assert "motor_set_state" in h_content
    assert "outputs_all_off" in c_content

def test_lab07_main_alarm_logic():
    content = (LAB_DIR / "lab07_cabin_station.c").read_text(encoding="utf-8")
    assert "TH_LIGHT_LOW" in content
    assert "TH_GAS_HIGH" in content
    assert "TH_TEMP_HIGH" in content
    assert "TH_HUMI_HIGH" in content
    assert "env_alarm_active" in content
    assert "thermal_alarm_active" in content
    assert "g_alarm_ack" in content
    assert "LCD_GREEN" in content
    assert "SYS_RUN" in content
