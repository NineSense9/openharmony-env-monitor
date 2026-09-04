import { TelemetryData } from '../model/TelemetryModel';
import { AppTheme } from '../common/Constants';

@Component
export struct BoardDisplayCard {
  @Prop telemetry: TelemetryData = new TelemetryData();

  build() {
    Column() {
      // 头部标题栏
      Row() {
        Row() {
          // 芯片硬件矢量图标
          Stack() {
            Rect({ width: 18, height: 18 })
              .fill('none')
              .stroke(AppTheme.ACCENT_CYAN)
              .strokeWidth(1.2)
              .borderRadius(2)
            Rect({ width: 8, height: 8 })
              .fill(AppTheme.ACCENT_CYAN)
            // 四向引脚针脚
            Line().startPoint([9, 0]).endPoint([9, 3]).stroke(AppTheme.ACCENT_CYAN).strokeWidth(1)
            Line().startPoint([9, 15]).endPoint([9, 18]).stroke(AppTheme.ACCENT_CYAN).strokeWidth(1)
            Line().startPoint([0, 9]).endPoint([3, 9]).stroke(AppTheme.ACCENT_CYAN).strokeWidth(1)
            Line().startPoint([15, 9]).endPoint([18, 9]).stroke(AppTheme.ACCENT_CYAN).strokeWidth(1)
          }
          .width(20)
          .height(20)

          Text('小凌派-RK2206 硬件数字孪生与屏显镜面')
            .fontSize(13)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.TEXT_WHITE)
            .fontFamily('monospace')
            .margin({ left: 8 })
        }

        Row() {
          Text('WDT: ALIVE')
            .fontSize(9)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.ACCENT_GREEN)
            .backgroundColor('rgba(16, 185, 129, 0.12)')
            .padding({ left: 6, right: 6, top: 2, bottom: 2 })
            .borderRadius(4)
            .border({ width: 1, color: 'rgba(16, 185, 129, 0.3)' })
        }
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
      .padding({ left: 14, right: 14, top: 12, bottom: 10 })
      .border({ width: { bottom: 1 }, color: 'rgba(255, 255, 255, 0.06)' })

      // 开发板实物参数面板
      Row() {
        Column() {
          Text('SoC 主控芯片')
            .fontSize(10)
            .fontColor(AppTheme.TEXT_MUTED)
          Text('RK2206 M4F 200M')
            .fontSize(11)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.TEXT_WHITE)
            .fontFamily('monospace')
            .margin({ top: 2 })
        }
        .alignItems(HorizontalAlign.Start)

        Column() {
          Text('底层操作系统')
            .fontSize(10)
            .fontColor(AppTheme.TEXT_MUTED)
          Text('OpenHarmony 3.0')
            .fontSize(11)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.ACCENT_CYAN)
            .fontFamily('monospace')
            .margin({ top: 2 })
        }
        .alignItems(HorizontalAlign.Start)

        Column() {
          Text('I2C0 挂载总线')
            .fontSize(10)
            .fontColor(AppTheme.TEXT_MUTED)
          Text('SHT / BH / MPU')
            .fontSize(11)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.ACCENT_YELLOW)
            .fontFamily('monospace')
            .margin({ top: 2 })
        }
        .alignItems(HorizontalAlign.Start)
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
      .padding({ left: 14, right: 14, top: 10, bottom: 10 })
      .backgroundColor('rgba(0, 0, 0, 0.2)')

      // 320x240 LCD 屏幕仿真镜面 (显示当前开发板屏幕高保真内容)
      Column() {
        Row() {
          Text('● LCD 320x240 实时镜面')
            .fontSize(10)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.ACCENT_CYAN)
          Text(`DEVICE: ${this.telemetry.device_id}`)
            .fontSize(9)
            .fontColor(AppTheme.TEXT_MUTED)
            .fontFamily('monospace')
        }
        .width('100%')
        .justifyContent(FlexAlign.SpaceBetween)
        .margin({ bottom: 6 })

        // 模拟 LCD 屏幕框体
        Column() {
          // 仿 LCD 顶栏
          Row() {
            Text('CSS-01 鸿蒙空间站')
              .fontSize(9)
              .fontColor(AppTheme.ACCENT_YELLOW)
              .fontWeight(FontWeight.Bold)
            Text(`T:${this.telemetry.temperature.toFixed(1)}C H:${this.telemetry.humidity.toFixed(0)}%`)
              .fontSize(9)
              .fontColor(AppTheme.TEXT_WHITE)
            Text('WDT:OK *')
              .fontSize(9)
              .fontColor(AppTheme.ACCENT_CYAN)
          }
          .width('100%')
          .justifyContent(FlexAlign.SpaceBetween)
          .padding({ left: 6, right: 6, top: 3, bottom: 3 })
          .backgroundColor('#001F3F')

          // 仿 LCD 核心 4 象限
          Row() {
            // 象限 1 & 3
            Column() {
              Text(`ENV: ${this.telemetry.lux.toFixed(0)}lx | ${this.telemetry.gas_ppm.toFixed(1)}ppm`)
                .fontSize(8)
                .fontColor(AppTheme.ACCENT_CYAN)
                .fontFamily('monospace')
              Text(`FAN: L${this.telemetry.fan_speed} [${this.telemetry.motor_on ? 'RUNNING' : 'STANDBY'}]`)
                .fontSize(8)
                .fontColor(AppTheme.ACCENT_GREEN)
                .fontFamily('monospace')
                .margin({ top: 3 })
            }
            .layoutWeight(1)
            .alignItems(HorizontalAlign.Start)

            // 象限 2 & 4
            Column() {
              Text(`ATT: P:${this.telemetry.pitch.toFixed(1)}° R:${this.telemetry.roll.toFixed(1)}°`)
                .fontSize(8)
                .fontColor(AppTheme.TEXT_WHITE)
                .fontFamily('monospace')
              Text(`KEY: ${this.telemetry.last_key} | I2C: OK`)
                .fontSize(8)
                .fontColor(AppTheme.ACCENT_YELLOW)
                .fontFamily('monospace')
                .margin({ top: 3 })
            }
            .layoutWeight(1)
            .alignItems(HorizontalAlign.End)
          }
          .width('100%')
          .padding(8)

          // 仿 LCD 底栏
          Row() {
            Text('[K3:消警]  [K4:调速]  [K5:自检]  [K6:扫描]')
              .fontSize(8)
              .fontColor(AppTheme.TEXT_MUTED)
              .fontFamily('monospace')
          }
          .width('100%')
          .justifyContent(FlexAlign.Center)
          .padding({ top: 2, bottom: 4 })
          .backgroundColor('#000A14')
        }
        .width('100%')
        .backgroundColor('#050B16')
        .borderRadius(6)
        .border({ width: 1.5, color: 'rgba(0, 240, 255, 0.4)' })
      }
      .width('100%')
      .padding({ left: 14, right: 14, top: 10, bottom: 10 })

      // 底部按键矩阵状态
      Row() {
        Row() {
          Text('按键矩阵: ')
            .fontSize(10)
            .fontColor(AppTheme.TEXT_MUTED)

          // K3..K6 状态小胶囊
          ForEach(['K3', 'K4', 'K5', 'K6'], (k: string) => {
            Text(k)
              .fontSize(9)
              .fontWeight(FontWeight.Bold)
              .fontColor(this.telemetry.last_key === k ? '#000' : AppTheme.ACCENT_CYAN)
              .backgroundColor(this.telemetry.last_key === k ? AppTheme.ACCENT_YELLOW : 'rgba(0, 240, 255, 0.12)')
              .padding({ left: 6, right: 6, top: 1, bottom: 1 })
              .borderRadius(3)
              .margin({ left: 4 })
          })
        }

        Row() {
          Text('底板分压: SARADC5')
            .fontSize(9)
            .fontColor(AppTheme.TEXT_MUTED)
            .fontFamily('monospace')
        }
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
      .padding({ left: 14, right: 14, top: 8, bottom: 10 })
      .backgroundColor('rgba(0, 0, 0, 0.35)')
      .borderRadius({ bottomLeft: 12, bottomRight: 12 })
    }
    .width('100%')
    .backgroundColor(AppTheme.BG_CARD)
    .borderRadius(12)
    .border({ width: 1, color: 'rgba(0, 240, 255, 0.2)' })
    .margin({ top: 6, bottom: 8 })
  }
}
