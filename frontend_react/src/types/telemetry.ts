export interface TelemetryData {
  id: number;
  device_id: string;
  temperature: number;
  humidity: number;
  lux: number;
  gas_ppm: number;
  motor_on?: boolean;
  alarm_on?: boolean;
  accel_x?: number;
  accel_y?: number;
  accel_z?: number;
  pitch?: number;
  roll?: number;
  fan_speed?: number;
  wdt_alive?: boolean;
  i2c_devices?: string;
  last_key?: string;
  created_at: string;
}

export interface TelemetryHistoryItem {
  id: number;
  time: string;
  temperature: number;
  humidity: number;
  lux: number;
  gas_ppm: number;
}

export interface RemoteCommand {
  id?: number;
  device_id: string;
  target: 'motor' | 'fan' | 'led' | 'alarm' | 'system';
  action: 'on' | 'off' | 'ack' | 'speed_0' | 'speed_1' | 'speed_2' | 'speed_3' | 'auto' | 'reboot';
  value?: string | null;
  status?: 'pending' | 'done' | 'failed';
  note?: string | null;
}

export interface AlertEvent {
  id: number;
  device_id: string;
  alert_type: string;
  metric: string;
  val: number;
  threshold: number;
  message: string;
  created_at: string;
}

export interface SystemState {
  isConnected: boolean;
  isCachedSnapshot: boolean;
  lastSyncTime: string;
  totalPackets: number;
  isAlarmActive: boolean;
  isMuted: boolean;
  isMotorRunning: boolean;
  fanSpeed?: number;
  pitch?: number;
  roll?: number;
  accelX?: number;
  accelY?: number;
  accelZ?: number;
  wdtAlive?: boolean;
  i2cDevices?: string;
  lastKey?: string;
}
