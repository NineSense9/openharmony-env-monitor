import { Constants } from '../common/Constants';
import { TelemetryData } from '../model/TelemetryModel';

/**
 * 🛰️ 空间站顶部状态抬头组件（纯矢量无 Emoji 航天 HUD）
 */
@Component
export struct StationHeader {
  @Prop telemetry: TelemetryData;
  @Prop isCached: boolean;
  @Prop lastSyncTime: string;
  @Prop currentTimeStr: string;
  @State blinkState: boolean = true;
  private timerId: number = -1;

  aboutToAppear() {
    this.timerId = setInterval(() => {
      this.blinkState = !this.blinkState;
    }, 1000);
  }

  aboutToDisappear() {
    if (this.timerId !== -1) {
      clearInterval(this.timerId);
    }
  }

  build() {
    Column({ space: 8 }) {
      // 第一行：代号与链路锁存状态
      Row() {
        Row({ space: 8 }) {
          Image($r('app.media.ic_satellite'))
            .width(18)
            .height(18)

          Column({ space: 1 }) {
            Text('CSS-CABIN-01')
              .fontSize(15)
              .fontWeight(FontWeight.Bolder)
              .fontColor(Constants.COLOR_WHITE)
              .fontFamily('monospace')
              .letterSpacing(1)

            Text('TIANGONG CORE // ECS-01')
              .fontSize(8)
              .fontColor(Constants.COLOR_MUTED)
              .fontFamily('monospace')
          }
          .alignItems(HorizontalAlign.Start)
        }

        // 连接状态胶囊
        Row({ space: 5 }) {
          Circle({ width: 6, height: 6 })
            .fill(!this.isCached ? (this.blinkState ? Constants.COLOR_GREEN : '#065F46') : Constants.COLOR_YELLOW)

          Text(!this.isCached ? 'LIVE LINK' : `CACHED (${this.lastSyncTime})`)
            .fontSize(9)
            .fontWeight(FontWeight.Bold)
            .fontColor(!this.isCached ? Constants.COLOR_GREEN : Constants.COLOR_YELLOW)
            .fontFamily('monospace')
        }
        .padding({ left: 8, right: 8, top: 4, bottom: 4 })
        .backgroundColor(!this.isCached ? '#064E3B33' : '#78350F33')
        .borderRadius(4)
        .border({ width: 1, color: !this.isCached ? '#05966955' : '#D9770655' })
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)

      // 第二行：目标板端与时钟
      Row() {
        Row({ space: 4 }) {
          Text('NODE:')
            .fontSize(10)
            .fontColor(Constants.COLOR_MUTED)
            .fontFamily('monospace')

          Text(this.telemetry.device_id)
            .fontSize(10)
            .fontWeight(FontWeight.Bold)
            .fontColor(Constants.COLOR_CYAN)
            .fontFamily('monospace')
        }

        Row({ space: 4 }) {
          Text('BJT:')
            .fontSize(10)
            .fontColor(Constants.COLOR_MUTED)
            .fontFamily('monospace')

          Text(this.currentTimeStr)
            .fontSize(10)
            .fontColor(Constants.COLOR_WHITE)
            .fontFamily('monospace')
        }
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
    }
    .width('100%')
    .padding({ left: 14, right: 14, top: 10, bottom: 10 })
    .backgroundColor('#0A112299')
    .borderRadius(6)
    .border({ width: 1, color: '#1B2A4A' })
  }
}
