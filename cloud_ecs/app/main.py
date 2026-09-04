from __future__ import annotations

from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from datetime import datetime, timezone
from collections.abc import Generator
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from cloud_ecs.app.database import Base, build_engine, build_session_factory, create_schema, get_db, ping_database
from cloud_ecs.app.models import Alert, Command, Telemetry
from cloud_ecs.app.schemas import AlertRead, CommandAck, CommandCreate, CommandRead, HealthResponse, TelemetryCreate, TelemetryRead
from cloud_ecs.app.settings import default_database_url


def _alert_messages(payload: TelemetryCreate) -> list[str]:
    messages: list[str] = []
    if payload.temperature is not None and payload.temperature > 35:
        messages.append(f"舱温偏高 : {payload.temperature:.1f} ℃")
    if payload.humidity is not None and payload.humidity > 80:
        messages.append(f"舱湿偏高 : {payload.humidity:.1f}%")
    if payload.lux is not None and payload.lux < 50:
        messages.append(f"舱内过暗 : {payload.lux:.1f} Lux")
    if payload.gas_ppm is not None and payload.gas_ppm > 100:
        messages.append(f"气体偏高 : {payload.gas_ppm:.1f} ppm")
    return messages


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"invalid datetime: {value}") from exc


def _validate_command(target: str, action: str) -> None:
    allowed_actions = {
        "led": {"on", "off"},
        "motor": {"on", "off"},
        "fan": {"on", "off", "speed_0", "speed_1", "speed_2", "speed_3", "auto"},
        "alarm": {"ack"},
        "system": {"reboot"},
    }
    if target not in allowed_actions:
        raise HTTPException(status_code=400, detail="invalid target")
    if action not in allowed_actions[target]:
        raise HTTPException(status_code=400, detail="invalid action")


def create_app(database_url: str | None = None) -> FastAPI:
    db_url = database_url or default_database_url()
    if db_url.startswith("sqlite"):
        sqlite_path = db_url.split("///", 1)[1].split("?", 1)[0] if "///" in db_url else ""
        if sqlite_path:
            Path(sqlite_path).expanduser().parent.mkdir(parents=True, exist_ok=True)

    app = FastAPI(title="OpenHarmony Env Monitor Cloud", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def root():
        return RedirectResponse(url="/dashboard/")
    engine = build_engine(db_url)
    session_factory = build_session_factory(engine)
    create_schema(engine)

    def db_dep() -> Generator[Session, None, None]:
        yield from get_db(session_factory)

    @app.get("/health", response_model=HealthResponse)
    def health(db: Session = Depends(db_dep)):
        try:
            ping_database(db)
            return HealthResponse(status="ok")
        except SQLAlchemyError as exc:
            raise HTTPException(status_code=503, detail="database unavailable") from exc

    @app.post("/api/telemetry", response_model=TelemetryRead)
    def post_telemetry(payload: TelemetryCreate, db: Session = Depends(db_dep)):
        try:
            row = Telemetry(**payload.model_dump())
            db.add(row)
            db.flush()
            for message in _alert_messages(payload):
                db.add(Alert(device_id=payload.device_id, level="warn", message=message))
            db.commit()
            db.refresh(row)
            return row
        except SQLAlchemyError as exc:
            db.rollback()
            raise HTTPException(status_code=500, detail="failed to store telemetry") from exc

    @app.get("/api/telemetry/latest", response_model=TelemetryRead | None)
    def get_latest(device_id: str | None = None, db: Session = Depends(db_dep)):
        query = select(Telemetry).order_by(desc(Telemetry.id))
        if device_id:
            query = query.where(Telemetry.device_id == device_id)
        return db.execute(query.limit(1)).scalar_one_or_none()

    @app.get("/api/telemetry/history", response_model=list[TelemetryRead])
    def get_history(
        device_id: str | None = None,
        start_at: str | None = None,
        end_at: str | None = None,
        limit: int = Query(100, ge=1, le=1000),
        db: Session = Depends(db_dep),
    ):
        query = select(Telemetry)
        if device_id:
            query = query.where(Telemetry.device_id == device_id)
        start_dt = _parse_dt(start_at)
        end_dt = _parse_dt(end_at)
        if start_dt:
            query = query.where(Telemetry.created_at >= start_dt)
        if end_dt:
            query = query.where(Telemetry.created_at <= end_dt)
        query = query.order_by(desc(Telemetry.created_at), desc(Telemetry.id)).limit(limit)
        return list(db.execute(query).scalars().all())

    @app.get("/api/alerts", response_model=list[AlertRead])
    def get_alerts(
        device_id: str | None = None,
        start_at: str | None = None,
        end_at: str | None = None,
        limit: int = Query(100, ge=1, le=1000),
        db: Session = Depends(db_dep),
    ):
        query = select(Alert)
        if device_id:
            query = query.where(Alert.device_id == device_id)
        start_dt = _parse_dt(start_at)
        end_dt = _parse_dt(end_at)
        if start_dt:
            query = query.where(Alert.created_at >= start_dt)
        if end_dt:
            query = query.where(Alert.created_at <= end_dt)
        query = query.order_by(desc(Alert.created_at), desc(Alert.id)).limit(limit)
        return list(db.execute(query).scalars().all())

    @app.post("/api/command", response_model=CommandRead)
    def post_command(payload: CommandCreate, db: Session = Depends(db_dep)):
        _validate_command(payload.target, payload.action)
        try:
            row = Command(**payload.model_dump(), status="pending")
            db.add(row)
            db.commit()
            db.refresh(row)
            return row
        except SQLAlchemyError as exc:
            db.rollback()
            raise HTTPException(status_code=500, detail="failed to create command") from exc

    @app.get("/api/command/pending", response_model=CommandRead | None)
    def get_pending(device_id: str | None = None, db: Session = Depends(db_dep)):
        query = select(Command).where(Command.status == "pending")
        if device_id:
            query = query.where(Command.device_id == device_id)
        query = query.order_by(Command.created_at.asc(), Command.id.asc())
        return db.execute(query.limit(1)).scalar_one_or_none()

    @app.post("/api/command/{command_id}/ack", response_model=CommandRead)
    def ack_command(command_id: int, payload: CommandAck, db: Session = Depends(db_dep)):
        if payload.status not in {"done", "failed"}:
            raise HTTPException(status_code=400, detail="invalid status")
        row = db.get(Command, command_id)
        if row is None:
            raise HTTPException(status_code=404, detail="command not found")
        row.status = payload.status
        row.note = payload.note
        row.finished_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(row)
        return row

    @app.get("/api/commands", response_model=list[CommandRead])
    def get_commands(
        device_id: str | None = None,
        start_at: str | None = None,
        end_at: str | None = None,
        limit: int = Query(100, ge=1, le=1000),
        db: Session = Depends(db_dep),
    ):
        query = select(Command)
        if device_id:
            query = query.where(Command.device_id == device_id)
        start_dt = _parse_dt(start_at)
        end_dt = _parse_dt(end_at)
        if start_dt:
            query = query.where(Command.created_at >= start_dt)
        if end_dt:
            query = query.where(Command.created_at <= end_dt)
        query = query.order_by(desc(Command.created_at), desc(Command.id)).limit(limit)
        return list(db.execute(query).scalars().all())

    static_dir = Path(__file__).resolve().parent.parent / "static"
    if not static_dir.exists():
        static_dir = Path("/opt/openharmony-env-monitor/cloud_ecs/static")
    if static_dir.exists():
        app.mount("/dashboard", StaticFiles(directory=str(static_dir), html=True), name="dashboard")
    return app


app = create_app()
