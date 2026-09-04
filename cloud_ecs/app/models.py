from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from cloud_ecs.app.database import Base


class Telemetry(Base):
    __tablename__ = "telemetry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    temperature: Mapped[float] = mapped_column(Float, nullable=True)
    humidity: Mapped[float] = mapped_column(Float, nullable=True)
    lux: Mapped[float] = mapped_column(Float, nullable=True)
    gas_ppm: Mapped[float] = mapped_column(Float, nullable=True)
    motor_on: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    alarm_on: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    accel_x: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    accel_y: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    accel_z: Mapped[float] = mapped_column(Float, nullable=True, default=1.0)
    pitch: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    roll: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    fan_speed: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    wdt_alive: Mapped[bool] = mapped_column(Boolean, default=True, nullable=True)
    i2c_devices: Mapped[str] = mapped_column(String(128), default="SHT30,BH1750,MPU6050", nullable=True)
    last_key: Mapped[str] = mapped_column(String(32), default="NONE", nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    level: Mapped[str] = mapped_column(String(16), default="warn", nullable=False)
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class Command(Base):
    __tablename__ = "commands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    target: Mapped[str] = mapped_column(String(16), nullable=False)
    action: Mapped[str] = mapped_column(String(16), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    finished_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    note: Mapped[str] = mapped_column(String(255), nullable=True)
