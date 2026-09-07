import { TelemetryData, EventLogItem } from '../model/TelemetryModel';
import { HttpUtil } from '../common/HttpUtil';
import { Constants } from '../common/Constants';

/**
 * 空间站掌上测控状态管理 ViewModel
 */
export class StationViewModel {
  public telemetry: TelemetryData = new TelemetryData();
  public isConnected: boolean = false;
  public isCached: boolean = false;
  public isLedOn: boolean = false;
  public lastSyncTime: string = '--:--:--';
  public currentTimeStr: string = '00:00:00';
  public eventLogs: EventLogItem[] = [];
  public tempHistory: number[] = [28.0, 28.2, 28.5, 29.0, 28.8, 29.1, 29.3, 29.1];
  public humiHistory: number[] = [52.0, 51.8, 52.5, 53.0, 52.2, 51.9, 52.0, 52.0];
  private timerId: number = -1;
  private logSeq: number = 1;

  constructor() {
    this.addLog('掌上测控系统初始化就绪', 'info');
  }

  public startPolling(callback: () => void) {
    this.pollOnce(callback);
    this.timerId = setInterval(() => {
      this.updateClock();
      this.pollOnce(callback);
    }, Constants.POLL_INTERVAL_MS);
  }

  public stopPolling() {
    if (this.timerId !== -1) {
      clearInterval(this.timerId);
      this.timerId = -1;
    }
  }

  private updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    this.currentTimeStr = `${hh}:${mm}:${ss}`;
  }

  private async pollOnce(callback: () => void) {
    const data = await HttpUtil.fetchLatestTelemetry();
    if (data && data.temperature !== undefined) {
      this.telemetry = data;
      this.isConnected = true;
      if (data.led_on !== undefined) {
        this.isLedOn = Boolean(data.led_on);
      }

      // 检查创建时间戳与当前系统时间差，判定硬件是否在线
      if (data.created_at) {
        let createdTime: number;
        if (data.created_at.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(data.created_at)) {
          createdTime = new Date(data.created_at).getTime();
        } else {
          createdTime = new Date(data.created_at + 'Z').getTime();
        }
        const now = new Date();
        const diffSec = !isNaN(createdTime) ? Math.abs((now.getTime() - createdTime) / 1000) : 999;
        this.isCached = diffSec > Constants.OFFLINE_TIMEOUT_SEC;
        
        if (!isNaN(createdTime)) {
          const createdDate = new Date(createdTime);
          const hh = String(createdDate.getHours()).padStart(2, '0');
          const mm = String(createdDate.getMinutes()).padStart(2, '0');
          const ss = String(createdDate.getSeconds()).padStart(2, '0');
          this.lastSyncTime = `${hh}:${mm}:${ss}`;
        }
      } else {
        this.isCached = false;
      }

      // 记录走势队列 (保持最新 12 点)
      this.tempHistory.push(data.temperature);
      if (this.tempHistory.length > 12) this.tempHistory.shift();

      this.humiHistory.push(data.humidity);
      if (this.humiHistory.length > 12) this.humiHistory.shift();

    } else {
      // 获取失败，切换为离线快照
      this.isConnected = false;
      this.isCached = true;
    }
    callback();
  }

  public async sendMotorCommand(turnOn: boolean): Promise<boolean> {
    const ok = await HttpUtil.sendCommand('motor', turnOn ? 'on' : 'off');
    if (ok) {
      this.addLog(`远程指令下发: ${turnOn ? '启动排风电机' : '停止排风电机'}`, 'info');
    } else {
      this.addLog(`远程指令下发失败: 电机控制`, 'alarm');
    }
    return ok;
  }

  public async sendFanSpeedCommand(speed: number): Promise<boolean> {
    const actionMap: Record<number, string> = {
      0: 'speed_0',
      1: 'speed_1',
      2: 'speed_2',
      3: 'speed_3',
      4: 'auto'
    };
    const action = actionMap[speed] || 'auto';
    const ok = await HttpUtil.sendCommand('fan', action);
    if (ok) {
      this.addLog(`风机调速指令下发: 档位 ${speed} (${action})`, 'info');
    } else {
      this.addLog(`风机调速指令下发失败`, 'alarm');
    }
    return ok;
  }

  public async sendLedCommand(turnOn: boolean): Promise<boolean> {
    const ok = await HttpUtil.sendCommand('led', turnOn ? 'on' : 'off');
    if (ok) {
      this.isLedOn = turnOn;
      this.telemetry.alarm_on = turnOn;
      this.addLog(`远程指令下发: ${turnOn ? '点亮 PA5 照明/告警灯' : '熄灭 PA5 照明/告警灯'}`, 'info');
    } else {
      this.addLog(`远程指令下发失败: LED 照明控制`, 'alarm');
    }
    return ok;
  }

  public async sendRebootCommand(): Promise<boolean> {
    const ok = await HttpUtil.sendCommand('system', 'reboot');
    if (ok) {
      this.addLog('远程系统重启指令下发 (RebootDevice)', 'warn');
    } else {
      this.addLog('远程系统重启指令下发失败', 'alarm');
    }
    return ok;
  }

  public async sendMuteCommand(): Promise<boolean> {
    const ok = await HttpUtil.sendCommand('alarm', 'ack');
    if (ok) {
      this.addLog('应急消警指令下发: 静音并复位状态', 'warn');
    } else {
      this.addLog('应急消警指令下发失败', 'alarm');
    }
    return ok;
  }

  public addLog(msg: string, level: 'info' | 'warn' | 'alarm' = 'info') {
    const now = new Date();
    const ts = now.toTimeString().substring(0, 8);
    this.eventLogs.unshift(new EventLogItem(this.logSeq++, ts, msg, level));
    if (this.eventLogs.length > 20) {
      this.eventLogs.pop();
    }
  }
}
