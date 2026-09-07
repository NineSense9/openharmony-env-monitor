import { StationViewModel } from '../viewmodel/StationViewModel';
import { StationHeader } from '../components/StationHeader';
import { CabinTwinCard } from '../components/CabinTwinCard';
import { SensorCard } from '../components/SensorCard';
import { AttitudeCard } from '../components/AttitudeCard';
import { BoardDisplayCard } from '../components/BoardDisplayCard';
import { ControlSection } from '../components/ControlSection';
import { TrendChart } from '../components/TrendChart';
import { AtmospherePieChart } from '../components/AtmospherePieChart';
import { EventLogView } from '../components/EventLogView';
import { SplashScreen } from '../components/SplashScreen';
import { Constants } from '../common/Constants';

/**
 * 鸿蒙天宫空间站航电综合测控终端 (CSS Mission Control Handheld Terminal)
 * 采用 4 大专业航电功能 Tab 分页架构，搭载核心舱透视模型与纯矢量 HUD 界面
 */
@Preview
@Entry
@Component
struct Index {
  @State viewModel: StationViewModel = new StationViewModel();
  @State refreshTrigger: number = 0;
  @State showSplash: boolean = true;
  @State currentIndex: number = 0;
  private tabsController: TabsController = new TabsController();

  aboutToAppear() {
    this.viewModel.startPolling(() => {
      this.refreshTrigger++;
    });
  }

  aboutToDisappear() {
    this.viewModel.stopPolling();
  }

  /**
   * 航天风格底部导航项构建器
   */
  @Builder
  TabBuilder(index: number, name: string, iconRes: Resource) {
    Column({ space: 3 }) {
      // 激活状态顶部高亮线
      Rect({ width: 28, height: 2 })
        .fill(this.currentIndex === index ? Constants.COLOR_CYAN : 'transparent')
        .borderRadius(1)
        .margin({ bottom: 2 })

      Image(iconRes)
        .width(19)
        .height(19)
        .fillColor(this.currentIndex === index ? Constants.COLOR_CYAN : Constants.COLOR_MUTED)

      Text(name)
        .fontSize(10.5)
        .fontWeight(this.currentIndex === index ? FontWeight.Bold : FontWeight.Normal)
        .fontColor(this.currentIndex === index ? Constants.COLOR_CYAN : Constants.COLOR_MUTED)
        .fontFamily('monospace')
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .backgroundColor(Constants.COLOR_BG_CARD)
    .border({ width: { top: 1 }, color: Constants.COLOR_BORDER })
  }

  build() {
    Stack() {
      // 1. 主控制台界面 (顶部常驻 HUD + 底部 4-Tab 切换)
      Column() {
        // 顶部全局航天 HUD 状态栏 (所有 Tab 全局常驻显示)
        StationHeader({
          telemetry: this.viewModel.telemetry,
          isCached: this.viewModel.isCached,
          lastSyncTime: this.viewModel.lastSyncTime,
          currentTimeStr: this.viewModel.currentTimeStr
        })
        .padding({ left: 10, right: 10, top: 6, bottom: 2 })

        // 4-Tab 航电工作台
        Tabs({ barPosition: BarPosition.End, controller: this.tabsController }) {
          // ==================== TAB 0: 空间监测 (核心舱透视 + 2x2环境矩阵) ====================
          TabContent() {
            Scroll() {
              Column({ space: 10 }) {
                // 1. 中国空间站核心舱透视模型
                CabinTwinCard({
                  telemetry: this.viewModel.telemetry
                })

                // 2. 2x2 拟态环境传感器矩阵
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

                // 底部安全垫
                Row().height(12)
              }
              .width('100%')
              .padding({ left: 10, right: 10, top: 8, bottom: 8 })
            }
            .width('100%')
            .height('100%')
          }
          .tabBar(this.TabBuilder(0, '空间监测', $r('app.media.ic_satellite')))

          // ==================== TAB 1: 机构控制 (五档风机 + 远程重启 + 消警) ====================
          TabContent() {
            Scroll() {
              Column({ space: 10 }) {
                ControlSection({
                  isMotorRunning: this.viewModel.telemetry.motor_on,
                  isAlarmOn: this.viewModel.telemetry.alarm_on,
                  fanSpeed: this.viewModel.telemetry.fan_speed,
                  onToggleMotor: (turnOn: boolean) => {
                    this.viewModel.sendMotorCommand(turnOn);
                  },
                  onSetFanSpeed: (speed: number) => {
                    this.viewModel.sendFanSpeedCommand(speed);
                  },
                  onMuteAlarm: () => {
                    this.viewModel.sendMuteCommand();
                  },
                  onRebootSystem: () => {
                    this.viewModel.sendRebootCommand();
                  }
                })

                Row().height(12)
              }
              .width('100%')
              .padding({ left: 10, right: 10, top: 8, bottom: 8 })
            }
            .width('100%')
            .height('100%')
          }
          .tabBar(this.TabBuilder(1, '机构控制', $r('app.media.ic_fan')))

          // ==================== TAB 2: 硬件孪生 (开发板LCD镜面 + MPU6050姿态) ====================
          TabContent() {
            Scroll() {
              Column({ space: 10 }) {
                BoardDisplayCard({
                  telemetry: this.viewModel.telemetry
                })

                AttitudeCard({
                  telemetry: this.viewModel.telemetry
                })

                Row().height(12)
              }
              .width('100%')
              .padding({ left: 10, right: 10, top: 8, bottom: 8 })
            }
            .width('100%')
            .height('100%')
          }
          .tabBar(this.TabBuilder(2, '硬件孪生', $r('app.media.ic_terminal')))

          // ==================== TAB 3: 时序日志 (Canvas走势 + 测控事件流) ====================
          TabContent() {
            Scroll() {
              Column({ space: 10 }) {
                TrendChart({
                  tempData: this.viewModel.tempHistory,
                  humiData: this.viewModel.humiHistory
                })

                AtmospherePieChart({
                  gasPpm: this.viewModel.telemetry.gas_ppm,
                  fanSpeed: this.viewModel.telemetry.fan_speed,
                  motorOn: this.viewModel.telemetry.motor_on
                })

                EventLogView({
                  logs: this.viewModel.eventLogs
                })

                Row().height(12)
              }
              .width('100%')
              .padding({ left: 10, right: 10, top: 8, bottom: 8 })
            }
            .width('100%')
            .height('100%')
          }
          .tabBar(this.TabBuilder(3, '时序日志', $r('app.media.ic_pulse')))
        }
        .layoutWeight(1)
        .barHeight(54)
        .barMode(BarMode.Fixed)
        .onChange((index: number) => {
          this.currentIndex = index;
        })
        .backgroundColor(Constants.COLOR_BG_DARK)
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
