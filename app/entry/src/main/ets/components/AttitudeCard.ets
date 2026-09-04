import { TelemetryData } from '../model/TelemetryModel';
import { AppTheme } from '../common/Constants';

@Component
export struct AttitudeCard {
  @Prop telemetry: TelemetryData = new TelemetryData();

  build() {
    Column() {
      // 头部标题栏
      Row() {
        Row() {
          // 矢量罗盘瞄准标靶
          Stack() {
            Circle({ width: 18, height: 18 })
              .fill('none')
              .stroke(AppTheme.ACCENT_CYAN)
              .strokeWidth(1.5)
            Circle({ width: 6, height: 6 })
              .fill(AppTheme.ACCENT_CYAN)
            Line()
              .startPoint([9, 1])
              .endPoint([9, 17])
              .stroke(AppTheme.ACCENT_CYAN)
              .strokeWidth(1)
            Line()
              .startPoint([1, 9])
              .endPoint([17, 9])
              .stroke(AppTheme.ACCENT_CYAN)
              .strokeWidth(1)
          }
          .width(20)
          .height(20)

          Text('MPU6050 空间站姿态与微重力 HUD')
            .fontSize(13)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.TEXT_WHITE)
            .fontFamily('monospace')
            .margin({ left: 8 })
        }

        Row() {
          Text('NAV LOCK')
            .fontSize(10)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.ACCENT_CYAN)
            .backgroundColor('rgba(0, 240, 255, 0.12)')
            .padding({ left: 6, right: 6, top: 2, bottom: 2 })
            .borderRadius(4)
            .border({ width: 1, color: 'rgba(0, 240, 255, 0.3)' })
        }
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
      .padding({ left: 14, right: 14, top: 12, bottom: 10 })
      .border({ width: { bottom: 1 }, color: 'rgba(255, 255, 255, 0.06)' })

      // 核心姿态仪表区域
      Row() {
        // 左侧：Pitch 俯仰角仪表
        Column() {
          Text('PITCH (俯仰)')
            .fontSize(10)
            .fontColor(AppTheme.TEXT_MUTED)
            .fontFamily('monospace')

          Text(`${(this.telemetry.pitch >= 0 ? '+' : '')}${this.telemetry.pitch.toFixed(1)}°`)
            .fontSize(20)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.ACCENT_CYAN)
            .fontFamily('monospace')
            .margin({ top: 4, bottom: 4 })

          // 微型偏角刻度指示
          Row() {
            Rect({ width: 60, height: 4 })
              .fill('rgba(255, 255, 255, 0.1)')
              .borderRadius(2)
          }
        }
        .layoutWeight(1)
        .alignItems(HorizontalAlign.Center)

        // 中间：人工地平仪拟态显示
        Column() {
          Stack() {
            Circle({ width: 64, height: 64 })
              .fill('rgba(8, 18, 38, 0.8)')
              .stroke(AppTheme.ACCENT_CYAN)
              .strokeWidth(1.2)

            // 十字准星
            Line()
              .startPoint([32, 10])
              .endPoint([32, 54])
              .stroke('rgba(0, 240, 255, 0.4)')
              .strokeWidth(1)
            Line()
              .startPoint([10, 32])
              .endPoint([54, 32])
              .stroke('rgba(0, 240, 255, 0.4)')
              .strokeWidth(1)

            // 姿态地平线 (带有旋转与偏置)
            Rect({ width: 44, height: 2 })
              .fill(AppTheme.ACCENT_YELLOW)
              .rotate({ angle: this.telemetry.roll })
              .translate({ y: this.telemetry.pitch * 0.5 })
          }
          .width(64)
          .height(64)

          Text('HORIZON')
            .fontSize(9)
            .fontColor(AppTheme.TEXT_MUTED)
            .fontFamily('monospace')
            .margin({ top: 4 })
        }
        .layoutWeight(1.2)
        .alignItems(HorizontalAlign.Center)

        // 右侧：Roll 横滚角仪表
        Column() {
          Text('ROLL (横滚)')
            .fontSize(10)
            .fontColor(AppTheme.TEXT_MUTED)
            .fontFamily('monospace')

          Text(`${(this.telemetry.roll >= 0 ? '+' : '')}${this.telemetry.roll.toFixed(1)}°`)
            .fontSize(20)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.ACCENT_CYAN)
            .fontFamily('monospace')
            .margin({ top: 4, bottom: 4 })

          Row() {
            Rect({ width: 60, height: 4 })
              .fill('rgba(255, 255, 255, 0.1)')
              .borderRadius(2)
          }
        }
        .layoutWeight(1)
        .alignItems(HorizontalAlign.Center)
      }
      .width('100%')
      .padding({ top: 12, bottom: 12, left: 10, right: 10 })

      // 底部三轴加速度 G值微型矩阵
      Row() {
        Row() {
          Text('ACC-X: ')
            .fontSize(10)
            .fontColor(AppTheme.TEXT_MUTED)
          Text(`${(this.telemetry.accel_x >= 0 ? '+' : '')}${this.telemetry.accel_x.toFixed(2)}G`)
            .fontSize(10)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.TEXT_WHITE)
            .fontFamily('monospace')
        }

        Row() {
          Text('ACC-Y: ')
            .fontSize(10)
            .fontColor(AppTheme.TEXT_MUTED)
          Text(`${(this.telemetry.accel_y >= 0 ? '+' : '')}${this.telemetry.accel_y.toFixed(2)}G`)
            .fontSize(10)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.TEXT_WHITE)
            .fontFamily('monospace')
        }

        Row() {
          Text('ACC-Z: ')
            .fontSize(10)
            .fontColor(AppTheme.TEXT_MUTED)
          Text(`${(this.telemetry.accel_z >= 0 ? '+' : '')}${this.telemetry.accel_z.toFixed(2)}G`)
            .fontSize(10)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.ACCENT_GREEN)
            .fontFamily('monospace')
        }
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceAround)
      .padding({ top: 8, bottom: 10 })
      .backgroundColor('rgba(0, 0, 0, 0.25)')
      .borderRadius({ bottomLeft: 12, bottomRight: 12 })
    }
    .width('100%')
    .backgroundColor(AppTheme.BG_CARD)
    .borderRadius(12)
    .border({ width: 1, color: 'rgba(0, 240, 255, 0.2)' })
    .margin({ top: 8, bottom: 8 })
  }
}
