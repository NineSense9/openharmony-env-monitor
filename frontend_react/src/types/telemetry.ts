export interface TelemetryData {
  id: number;
  device_id: string;
  temperature: number;
  humidity: number;
  lux: number;
  gas_ppm: number;
  motor_on?: boolean;
  alarm_on?: boolean;
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
  target: 'motor' | 'led' | 'alarm';
  action: 'on' | 'off' | 'ack';
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
}
