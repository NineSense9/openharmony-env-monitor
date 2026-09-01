/**
 * 太空空间站掌上测控终端全局常量
 */
export class Constants {
  // 云端微服务接口基地址 (百度云 BCC 实例公网 IP)
  public static readonly BASE_URL: string = 'http://180.76.137.117:8000';
  public static readonly DEVICE_ID: string = 'rk2206-station-01';

  // 极速遥测轮询周期 (ms)
  public static readonly POLL_INTERVAL_MS: number = 300;

  // 硬件失锁离线判定超时 (秒)
  public static readonly OFFLINE_TIMEOUT_SEC: number = 6;

  // 6 位安全授权 PIN 码
  public static readonly DEFAULT_PIN: string = '123456';

  // 告警阈值定义
  public static readonly THRESHOLD_TEMP: number = 35.0; // ℃
  public static readonly THRESHOLD_HUMI: number = 80.0; // %
  public static readonly THRESHOLD_LUX_MIN: number = 10.0; // lx
  public static readonly THRESHOLD_GAS: number = 30.0; // ppm

  // 航天 HUD 调色板
  public static readonly COLOR_BG_DARK: string = '#0A0E1A';
  public static readonly COLOR_BG_PANEL: string = '#121826';
  public static readonly COLOR_BG_CARD: string = '#162032';
  public static readonly COLOR_BORDER: string = '#1E293B';
  public static readonly COLOR_BORDER_GLOW: string = '#00F0FF';
  public static readonly COLOR_CYAN: string = '#00F0FF';
  public static readonly COLOR_GREEN: string = '#00E676';
  public static readonly COLOR_RED: string = '#FF3B30';
  public static readonly COLOR_YELLOW: string = '#FFCC00';
  public static readonly COLOR_MUTED: string = '#94A3B8';
  public static readonly COLOR_WHITE: string = '#FFFFFF';
}
