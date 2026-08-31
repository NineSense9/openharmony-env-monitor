from fastapi.testclient import TestClient

from cloud_ecs.app.main import create_app


def make_client(tmp_path):
    app = create_app(database_url=f"sqlite:///{(tmp_path / 'station.db').as_posix()}")
    return TestClient(app)


def test_post_telemetry_creates_latest_and_alerts(tmp_path):
    client = make_client(tmp_path)

    payload = {
        "device_id": "stu01-board",
        "temperature": 36.5,
        "humidity": 82.0,
        "lux": 35.0,
        "gas_ppm": 120.0,
    }

    response = client.post("/api/telemetry", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["device_id"] == "stu01-board"
    assert body["temperature"] == 36.5

    latest = client.get("/api/telemetry/latest", params={"device_id": "stu01-board"})
    assert latest.status_code == 200
    assert latest.json()["gas_ppm"] == 120.0

    alerts = client.get("/api/alerts", params={"device_id": "stu01-board"})
    assert alerts.status_code == 200
    assert len(alerts.json()) == 4
    assert {item["message"] for item in alerts.json()} == {
        "舱温偏高 : 36.5 ℃",
        "舱湿偏高 : 82.0%",
        "舱内过暗 : 35.0 Lux",
        "气体偏高 : 120.0 ppm",
    }


def test_history_filters_by_device_and_order(tmp_path):
    client = make_client(tmp_path)

    client.post("/api/telemetry", json={"device_id": "stu01-board", "temperature": 25, "humidity": 40, "lux": 200, "gas_ppm": 30})
    client.post("/api/telemetry", json={"device_id": "stu01-board", "temperature": 26, "humidity": 41, "lux": 210, "gas_ppm": 31})
    client.post("/api/telemetry", json={"device_id": "other-board", "temperature": 99, "humidity": 99, "lux": 99, "gas_ppm": 99})

    history = client.get("/api/telemetry/history", params={"device_id": "stu01-board", "limit": 2})
    assert history.status_code == 200
    rows = history.json()
    assert len(rows) == 2
    assert rows[0]["temperature"] == 26
    assert rows[1]["temperature"] == 25
