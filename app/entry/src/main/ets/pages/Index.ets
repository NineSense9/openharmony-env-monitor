import { StationViewModel } from '../viewmodel/StationViewModel';
import { Constants } from '../common/Constants';
import { StationHeader } from '../components/StationHeader';
import { SensorCard } from '../components/SensorCard';
import { ControlSection } from '../components/ControlSection';
import { TrendChart } from '../components/TrendChart';
import { EventLogView } from '../components/EventLogView';

/**
 * 鸿蒙太空空间站掌上测控终端主页面
 */
@Preview
@Entry
@Component
struct Index {
  @State viewModel: StationViewModel = new StationViewModel();
  @State refreshTrigger: number = 0;

  aboutToAppear() {
    this.viewModel.startPolling(() => {
      this.refreshTrigger++;
    });
  }

  aboutToDisappear() {
    this.viewModel.stopPolling();
  }

  build() {
    Column() {
      // 1. 顶部航天 HUD 状态栏
      StationHeader({
        isConnected: this.viewModel.isConnected,
        isCached: this.viewModel.isCached,
        lastSyncTime: this.viewModel.lastSyncTime,
        currentTimeStr: this.viewModel.currentTimeStr
      })

      // 2. 主体可滑动区域
      Scroll() {
        Column({ space: 12 }) {

          // 2x2 四路环境感知矩阵
          Row({ space: 10 }) {
            SensorCard({
              label: '舱内温度',
              valueStr: this.viewModel.telemetry.temperature.toFixed(1),
              unit: '℃',
              channel: 'I2C0@0x44',
              isAlarm: this.viewModel.telemetry.temperature > Constants.THRESHOLD_TEMP,
              icon: '🌡️'
            })

            SensorCard({
              label: '相对湿度',
              valueStr: this.viewModel.telemetry.humidity.toFixed(1),
              unit: '%',
              channel: 'I2C0@0x44',
              isAlarm: this.viewModel.telemetry.humidity > Constants.THRESHOLD_HUMI,
              icon: '💧'
            })
          }
          .width('100%')

          Row({ space: 10 }) {
            SensorCard({
              label: '环境光照',
              valueStr: this.viewModel.telemetry.lux.toFixed(0),
              unit: 'lx',
              channel: 'I2C0@0x23',
              isAlarm: this.viewModel.telemetry.lux < Constants.THRESHOLD_LUX_MIN,
              icon: '☀️'
            })

            SensorCard({
              label: '烟雾气体',
              valueStr: this.viewModel.telemetry.gas_ppm.toFixed(1),
              unit: 'ppm',
              channel: 'SARADC_CH4',
              isAlarm: this.viewModel.telemetry.gas_ppm > Constants.THRESHOLD_GAS,
              icon: '💨'
            })
          }
          .width('100%')

          // 3. 极速双向执行机构控制台
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

          // 4. 原生 Canvas 温湿度时序走势图
          TrendChart({
            tempData: this.viewModel.tempHistory,
            humiData: this.viewModel.humiHistory
          })

          // 5. 测控事件实时流水
          EventLogView({
            logs: this.viewModel.eventLogs
          })

          // 底部留白
          Row().height(20)
        }
        .padding(14)
        .width('100%')
      }
      .scrollable(ScrollDirection.Vertical)
      .scrollBar(BarState.Auto)
      .layoutWeight(1)
    }
    .width('100%')
    .height('100%')
    .backgroundColor(Constants.COLOR_BG_DARK)
  }
}
