from fastapi.testclient import TestClient

from cloud_ecs.app.main import create_app


def make_client(tmp_path):
    app = create_app(database_url=f"sqlite:///{(tmp_path / 'station.db').as_posix()}")
    return TestClient(app)


def test_command_pending_and_ack_flow(tmp_path):
    client = make_client(tmp_path)

    created = client.post(
        "/api/command",
        json={"device_id": "stu01-board", "target": "led", "action": "on", "value": None},
    )
    assert created.status_code == 200
    command_id = created.json()["id"]

    pending = client.get("/api/command/pending", params={"device_id": "stu01-board"})
    assert pending.status_code == 200
    assert pending.json()["id"] == command_id
    assert pending.json()["status"] == "pending"

    ack = client.post(f"/api/command/{command_id}/ack", json={"status": "done", "note": "ok"})
    assert ack.status_code == 200
    assert ack.json()["status"] == "done"
    assert ack.json()["note"] == "ok"

    logs = client.get("/api/commands", params={"device_id": "stu01-board"})
    assert logs.status_code == 200
    assert len(logs.json()) == 1
    assert logs.json()[0]["status"] == "done"


def test_command_validation_rejects_invalid_target_action(tmp_path):
    client = make_client(tmp_path)

    bad_target = client.post(
        "/api/command",
        json={"device_id": "stu01-board", "target": "sensor", "action": "on", "value": None},
    )
    assert bad_target.status_code == 400

    bad_action = client.post(
        "/api/command",
        json={"device_id": "stu01-board", "target": "led", "action": "ack", "value": None},
    )
    assert bad_action.status_code == 400
