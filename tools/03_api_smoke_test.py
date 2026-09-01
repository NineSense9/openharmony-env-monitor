# -*- coding: utf-8 -*-
import argparse
import sys
import requests

def smoke_test(base_url: str, device_id: str):
    base = base_url.rstrip("/")
    print("=" * 60)
    print(f"[TEST] Full-Stack API Smoke Test -> {base} (Device: {device_id})")
    print("=" * 60)
    
    # 1. Health Check
    try:
        r = requests.get(f"{base}/health", timeout=5)
        assert r.status_code == 200, f"Health check failed with {r.status_code}"
        print(f"[PASS] 1. GET /health OK: {r.json()}")
    except Exception as e:
        print(f"[FAIL] 1. GET /health Failed: {e}")
        return False
        
    # 2. Post Telemetry
    try:
        payload = {
            "device_id": device_id,
            "temperature": 26.5,
            "humidity": 55.0,
            "lux": 400.0,
            "gas_ppm": 6.2,
            "motor_on": False,
            "alarm_on": False
        }
        r = requests.post(f"{base}/api/telemetry", json=payload, timeout=5)
        assert r.status_code == 200, f"Post telemetry failed with {r.status_code}"
        print(f"[PASS] 2. POST /api/telemetry OK: ID={r.json().get('id')}")
    except Exception as e:
        print(f"[FAIL] 2. POST /api/telemetry Failed: {e}")
        return False
        
    # 3. Latest Telemetry
    try:
        r = requests.get(f"{base}/api/telemetry/latest?device_id={device_id}", timeout=5)
        assert r.status_code == 200 and r.json() is not None
        print(f"[PASS] 3. GET /api/telemetry/latest OK: Temp={r.json().get('temperature')} C")
    except Exception as e:
        print(f"[FAIL] 3. GET /api/telemetry/latest Failed: {e}")
        return False
        
    # 4. History Telemetry
    try:
        r = requests.get(f"{base}/api/telemetry/history?device_id={device_id}&limit=5", timeout=5)
        assert r.status_code == 200 and isinstance(r.json(), list)
        print(f"[PASS] 4. GET /api/telemetry/history OK: Returned {len(r.json())} records")
    except Exception as e:
        print(f"[FAIL] 4. GET /api/telemetry/history Failed: {e}")
        return False
        
    # 5. Alerts
    try:
        r = requests.get(f"{base}/api/alerts?device_id={device_id}&limit=5", timeout=5)
        assert r.status_code == 200 and isinstance(r.json(), list)
        print(f"[PASS] 5. GET /api/alerts OK: Returned {len(r.json())} alerts")
    except Exception as e:
        print(f"[FAIL] 5. GET /api/alerts Failed: {e}")
        return False
        
    # 6. Post Command
    cmd_id = None
    try:
        cmd_payload = {
            "device_id": device_id,
            "target": "motor",
            "action": "on"
        }
        r = requests.post(f"{base}/api/command", json=cmd_payload, timeout=5)
        assert r.status_code == 200
        cmd_id = r.json().get("id")
        print(f"[PASS] 6. POST /api/command OK: Command ID={cmd_id}")
    except Exception as e:
        print(f"[FAIL] 6. POST /api/command Failed: {e}")
        return False
        
    # 7. Get Pending Command
    try:
        r = requests.get(f"{base}/api/command/pending?device_id={device_id}", timeout=5)
        assert r.status_code == 200
        print(f"[PASS] 7. GET /api/command/pending OK: Pending ID={r.json().get('id') if r.json() else 'None'}")
    except Exception as e:
        print(f"[FAIL] 7. GET /api/command/pending Failed: {e}")
        return False
        
    # 8. Command ACK
    if cmd_id:
        try:
            ack_payload = {"status": "done", "note": "smoke test executed"}
            r = requests.post(f"{base}/api/command/{cmd_id}/ack", json=ack_payload, timeout=5)
            assert r.status_code == 200
            print(f"[PASS] 8. POST /api/command/{cmd_id}/ack OK: status={r.json().get('status')}")
        except Exception as e:
            print(f"[FAIL] 8. POST /api/command/{cmd_id}/ack Failed: {e}")
            return False
            
    print("=" * 60)
    print("[ALL PASS] Congratulations! Full-Stack API Smoke Test Passed 100%!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="API Smoke Test")
    parser.add_argument("--base", default="http://180.76.137.117:8000", help="Cloud Base URL")
    parser.add_argument("--device", default="rk2206-station-01", help="Device ID")
    args = parser.parse_args()
    
    success = smoke_test(args.base, args.device)
    sys.exit(0 if success else 1)
