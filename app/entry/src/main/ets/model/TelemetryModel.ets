/**
 * 空间站数据实体模型
 */
export class TelemetryData {
  public id: number = 0;
  public device_id: string = 'rk2206-station-01';
  public temperature: number = 28.5;
  public humidity: number = 50.0;
  public lux: number = 300.0;
  public gas_ppm: number = 8.0;
  public motor_on: boolean = false;
  public alarm_on: boolean = false;
  public created_at: string = '';

  constructor() {}
}

export class CommandPayload {
  public device_id: string = 'rk2206-station-01';
  public target: string = '';
  public action: string = '';

  constructor(target: string, action: string) {
    this.target = target;
    this.action = action;
  }
}

export class EventLogItem {
  public id: number = 0;
  public timestamp: string = '';
  public message: string = '';
  public level: 'info' | 'warn' | 'alarm' = 'info';

  constructor(id: number, timestamp: string, message: string, level: 'info' | 'warn' | 'alarm' = 'info') {
    this.id = id;
    this.timestamp = timestamp;
    this.message = message;
    this.level = level;
  }
}
