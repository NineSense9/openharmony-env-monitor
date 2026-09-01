# -*- coding: utf-8 -*-
import time
import random
import argparse
import requests

def mock_uploader(base_url: str, device_id: str, interval: float = 2.0):
    print(f"[START] Mock Telemetry Uploader -> {base_url} (Device: {device_id}, Interval: {interval}s)")
    url = f"{base_url.rstrip('/')}/api/telemetry"
    
    temp = 25.0
    humi = 50.0
    lux = 300.0
    gas = 5.0
    motor = False
    alarm = False
    
    while True:
        temp = round(max(15.0, min(45.0, temp + random.uniform(-0.5, 0.5))), 1)
        humi = round(max(20.0, min(95.0, humi + random.uniform(-1.0, 1.0))), 1)
        lux = round(max(10.0, min(1000.0, lux + random.uniform(-10.0, 10.0))), 1)
        gas = round(max(1.0, min(120.0, gas + random.uniform(-0.3, 0.3))), 1)
        
        payload = {
            "device_id": device_id,
            "temperature": temp,
            "humidity": humi,
            "lux": lux,
            "gas_ppm": gas,
            "motor_on": motor,
            "alarm_on": alarm
        }
        
        try:
            resp = requests.post(url, json=payload, timeout=3.0)
            if resp.status_code == 200:
                print(f"[POST OK] Temp={temp:.1f} C, Humi={humi:.1f}%, Lux={lux:.1f}lx, Gas={gas:.1f}ppm")
            else:
                print(f"[POST ERR] HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[POST FAIL] Connection error: {e}")
            
        time.sleep(interval)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mock Telemetry Uploader")
    parser.add_argument("--base", default="http://180.76.137.117:8000", help="Cloud Base URL")
    parser.add_argument("--device", default="rk2206-station-01", help="Device ID")
    parser.add_argument("--interval", type=float, default=2.0, help="Upload interval seconds")
    args = parser.parse_args()
    
    mock_uploader(args.base, args.device, args.interval)
