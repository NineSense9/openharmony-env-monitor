import os
import pathlib
import pytest

LAB_DIR = pathlib.Path(__file__).resolve().parents[1]

def test_lab08_files_exist():
    assert (LAB_DIR / "lab08_wifi_ping.c").exists()
    assert (LAB_DIR / "BUILD.gn").exists()
    assert (LAB_DIR / "include" / "board_pins.h").exists()
    assert (LAB_DIR / "include" / "ping.h").exists()
    assert (LAB_DIR / "include" / "lcd.h").exists()
    assert (LAB_DIR / "src" / "ping.c").exists()
    assert (LAB_DIR / "src" / "lcd.c").exists()
    assert (LAB_DIR / "patches" / "README.md").exists()

def test_board_pins_and_ping():
    content = (LAB_DIR / "include" / "board_pins.h").read_text(encoding="utf-8")
    assert "DEFAULT_PING_TARGET_IP" in content
    assert "PING_COUNT" in content

def test_ping_driver():
    h_content = (LAB_DIR / "include" / "ping.h").read_text(encoding="utf-8")
    c_content = (LAB_DIR / "src" / "ping.c").read_text(encoding="utf-8")
    assert "ping_single_packet" in h_content
    assert "IPPROTO_ICMP" in c_content
    assert "lwip_socket" in c_content

def test_lab08_main_logic():
    content = (LAB_DIR / "lab08_wifi_ping.c").read_text(encoding="utf-8")
    assert "Lab08 WiFi+Ping" in content
    assert "GetLinkedInfo" in content
    assert "Summary" in content
    assert "SYS_RUN" in content

def test_build_gn():
    content = (LAB_DIR / "BUILD.gn").read_text(encoding="utf-8")
    assert 'lite_library("lab08_wifi_ping")' in content
    assert '"src/ping.c"' in content
