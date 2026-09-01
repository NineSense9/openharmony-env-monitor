import os
import pytest

base_dir = r"d:\实习\workspace\device\labs\10_lab09_cloud_station"

def test_files_exist():
    assert os.path.exists(os.path.join(base_dir, "include", "board_pins.h"))
    assert os.path.exists(os.path.join(base_dir, "include", "smart_home.h"))
    assert os.path.exists(os.path.join(base_dir, "include", "http_client.h"))
    assert os.path.exists(os.path.join(base_dir, "include", "lcd.h"))
    assert os.path.exists(os.path.join(base_dir, "src", "smart_home.c"))
    assert os.path.exists(os.path.join(base_dir, "src", "http_client.c"))
    assert os.path.exists(os.path.join(base_dir, "src", "lcd.c"))
    assert os.path.exists(os.path.join(base_dir, "lab09_cloud_station.c"))
    assert os.path.exists(os.path.join(base_dir, "BUILD.gn"))

def test_board_pins():
    content = open(os.path.join(base_dir, "include", "board_pins.h"), encoding="utf-8").read()
    assert "GPIO0_PC7" in content
    assert "GPIO0_PA5" in content
    assert "GPIO0_PC4" in content
    assert "180.76.137.117" in content
    assert "8000" in content
    assert "rk2206-station-01" in content

def test_http_client():
    content = open(os.path.join(base_dir, "src", "http_client.c"), encoding="utf-8").read()
    assert "POST /api/telemetry" in content
    assert "GET /api/command/pending" in content
    assert "POST /api/command/%d/ack" in content
    assert "lwip_socket" in content
    assert "lwip_connect" in content
    assert "lwip_send" in content
    assert "lwip_recv" in content

def test_multitask_structure():
    content = open(os.path.join(base_dir, "lab09_cloud_station.c"), encoding="utf-8").read()
    assert "SensorTask" in content
    assert "UiTask" in content
    assert "CloudTask" in content
    assert "KeyTask" in content
    assert "lab09_cloud_station_process" in content
    assert "Space Station Cloud" in content
