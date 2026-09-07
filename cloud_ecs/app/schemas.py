from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_serializer


class HealthResponse(BaseModel):
    status: str


class TelemetryCreate(BaseModel):
    device_id: str = Field(min_length=1, max_length=64)
    temperature: float | None = None
    humidity: float | None = None
    lux: float | None = None
    gas_ppm: float | None = None
    motor_on: bool | None = False
    alarm_on: bool | None = False
    accel_x: float | None = 0.0
    accel_y: float | None = 0.0
    accel_z: float | None = 1.0
    pitch: float | None = 0.0
    roll: float | None = 0.0
    fan_speed: int | None = 0
    wdt_alive: bool | None = True
    i2c_devices: str | None = "SHT30,BH1750,MPU6050"
    last_key: str | None = "NONE"


class TelemetryRead(TelemetryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    led_on: bool | None = False

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: str
    level: str
    message: str
    created_at: datetime

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()


class CommandCreate(BaseModel):
    device_id: str = Field(min_length=1, max_length=64)
    target: str = Field(min_length=1, max_length=16)
    action: str = Field(min_length=1, max_length=16)
    value: str | None = None


class CommandAck(BaseModel):
    status: str = Field(min_length=1, max_length=16)
    note: str | None = None


class CommandRead(CommandCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    created_at: datetime
    finished_at: datetime | None = None
    note: str | None = None

