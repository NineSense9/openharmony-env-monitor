import os
import pathlib
import pytest

LAB_DIR = pathlib.Path(__file__).resolve().parents[1]

def test_lab06_files_exist():
    assert (LAB_DIR / "lab06_multitask_lcd.c").exists()
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

def test_lab06_multitask_structure():
    content = (LAB_DIR / "lab06_multitask_lcd.c").read_text(encoding="utf-8")
    assert "lab06_sample_task" in content
    assert "lab06_ui_task" in content
    assert "g_tick" in content
    assert "g_temp" in content
    assert "g_humi" in content
    assert "g_freeze" in content
    assert "LOS_TaskCreate" in content
    assert "SYS_RUN" in content

def test_build_gn():
    content = (LAB_DIR / "BUILD.gn").read_text(encoding="utf-8")
    assert 'lite_library("lab06_multitask_lcd")' in content
    assert '"src/sht30.c"' in content
