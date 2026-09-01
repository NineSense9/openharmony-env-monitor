/**
 * 空间站全局常量与航天赛博配色配置
 */
export class Constants {
  // 云端微服务接口基地址
  public static readonly BASE_URL: string = 'http://180.76.137.117:8000';
  public static readonly DEVICE_ID: string = 'rk2206-station-01';
  public static readonly DEFAULT_PIN: string = '123456';

  // 轮询与超时配置
  public static readonly POLL_INTERVAL_MS: number = 300;
  public static readonly OFFLINE_TIMEOUT_SEC: number = 6;

  // 传感器阈值
  public static readonly THRESHOLD_TEMP_HIGH: number = 32.0;
  public static readonly THRESHOLD_TEMP_LOW: number = 18.0;
  public static readonly THRESHOLD_HUMI_HIGH: number = 70.0;
  public static readonly THRESHOLD_HUMI_LOW: number = 30.0;
  public static readonly THRESHOLD_GAS: number = 15.0;
  public static readonly THRESHOLD_LUX_LOW: number = 50.0;

  // 航天工程深空配色系
  public static readonly COLOR_BG_DARK: string = '#040711';
  public static readonly COLOR_BG_CARD: string = '#0A1020';
  public static readonly COLOR_BG_PANEL: string = '#0E172C';
  public static readonly COLOR_BORDER: string = '#1B2A4A';
  public static readonly COLOR_BORDER_CYAN: string = '#0284C7';

  public static readonly COLOR_CYAN: string = '#00F2FE';
  public static readonly COLOR_BLUE: string = '#38BDF8';
  public static readonly COLOR_GREEN: string = '#10B981';
  public static readonly COLOR_YELLOW: string = '#F59E0B';
  public static readonly COLOR_RED: string = '#EF4444';
  public static readonly COLOR_WHITE: string = '#F8FAFC';
  public static readonly COLOR_MUTED: string = '#64748B';
}
