import { StationViewModel } from '../viewmodel/StationViewModel';
import { StationHeader } from '../components/StationHeader';
import { SensorCard } from '../components/SensorCard';
import { ControlSection } from '../components/ControlSection';
import { TrendChart } from '../components/TrendChart';
import { EventLogView } from '../components/EventLogView';
import { SplashScreen } from '../components/SplashScreen';
import { Constants } from '../common/Constants';

/**
 * 鸿蒙天宫空间站航电综合测控终端主页面 (Zero Emoji / Pure Vector HUD)
 */
@Preview
@Entry
@Component
struct Index {
  @State viewModel: StationViewModel = new StationViewModel();
  @State refreshTrigger: number = 0;
  @State showSplash: boolean = true;

  aboutToAppear() {
    this.viewModel.startPolling(() => {
      this.refreshTrigger++;
    });
  }

  aboutToDisappear() {
    this.viewModel.stopPolling();
  }

  build() {
    Stack() {
      // 1. 主控制台界面
      Column() {
        Scroll() {
          Column({ space: 10 }) {
            // 1. 顶部状态抬头
            StationHeader({
              telemetry: this.viewModel.telemetry,
              isCached: this.viewModel.isCached,
              lastSyncTime: this.viewModel.lastSyncTime,
              currentTimeStr: this.viewModel.currentTimeStr
            })

            // 2. 2x2 拟态毛玻璃环境数据矩阵
            Column({ space: 10 }) {
              Row({ space: 10 }) {
                SensorCard({
                  label: '舱内温度',
                  valueStr: this.viewModel.telemetry.temperature.toFixed(1),
                  unit: '℃',
                  channel: 'I2C0 @ 0x44',
                  isAlarm: this.viewModel.telemetry.temperature > Constants.THRESHOLD_TEMP_HIGH || this.viewModel.telemetry.temperature < Constants.THRESHOLD_TEMP_LOW,
                  iconRes: $r('app.media.ic_temp'),
                  progressRatio: (this.viewModel.telemetry.temperature - 15) / (40 - 15)
                })

                SensorCard({
                  label: '相对湿度',
                  valueStr: this.viewModel.telemetry.humidity.toFixed(1),
                  unit: '%',
                  channel: 'I2C0 @ 0x44',
                  isAlarm: this.viewModel.telemetry.humidity > Constants.THRESHOLD_HUMI_HIGH || this.viewModel.telemetry.humidity < Constants.THRESHOLD_HUMI_LOW,
                  iconRes: $r('app.media.ic_humi'),
                  progressRatio: (this.viewModel.telemetry.humidity - 20) / (80 - 20)
                })
              }
              .width('100%')

              Row({ space: 10 }) {
                SensorCard({
                  label: '环境光照',
                  valueStr: Math.round(this.viewModel.telemetry.lux).toString(),
                  unit: 'lx',
                  channel: 'I2C0 @ 0x23',
                  isAlarm: this.viewModel.telemetry.lux < Constants.THRESHOLD_LUX_LOW,
                  iconRes: $r('app.media.ic_lux'),
                  progressRatio: Math.min(1.0, this.viewModel.telemetry.lux / 1000)
                })

                SensorCard({
                  label: '烟雾气体',
                  valueStr: this.viewModel.telemetry.gas_ppm.toFixed(1),
                  unit: 'ppm',
                  channel: 'SARADC @ CH4',
                  isAlarm: this.viewModel.telemetry.gas_ppm > Constants.THRESHOLD_GAS,
                  iconRes: $r('app.media.ic_gas'),
                  progressRatio: Math.min(1.0, this.viewModel.telemetry.gas_ppm / 30)
                })
              }
              .width('100%')
            }
            .width('100%')

            // 3. 极速双向执行机构控制台 (纯矢量 360° 旋转风扇 + 防溢出)
            ControlSection({
              isMotorRunning: this.viewModel.telemetry.motor_on,
              isAlarmOn: this.viewModel.telemetry.alarm_on,
              onToggleMotor: (turnOn: boolean) => {
                this.viewModel.sendMotorCommand(turnOn);
              },
              onMuteAlarm: () => {
                this.viewModel.sendMuteCommand();
              }
            })

            // 4. 原生 Canvas 温湿度时序示波走势
            TrendChart({
              tempData: this.viewModel.tempHistory,
              humiData: this.viewModel.humiHistory
            })

            // 5. 测控事件实时流水
            EventLogView({
              logs: this.viewModel.eventLogs
            })

            // 底部留白
            Row().height(16)
          }
          .width('100%')
          .padding({ left: 12, right: 12, top: 12, bottom: 12 })
        }
        .width('100%')
        .layoutWeight(1)
      }
      .width('100%')
      .height('100%')
      .backgroundColor(Constants.COLOR_BG_DARK)

      // 2. 航电自检开屏画面（冷启动展示）
      if (this.showSplash) {
        SplashScreen({
          onFinish: () => {
            this.showSplash = false;
          }
        })
      }
    }
    .width('100%')
    .height('100%')
  }
}
