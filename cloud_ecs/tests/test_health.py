from fastapi.testclient import TestClient

from cloud_ecs.app.main import create_app


def test_health_returns_ok(tmp_path):
    app = create_app(database_url=f"sqlite:///{tmp_path / 'station.db'}")
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
