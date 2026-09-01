import { Constants } from '../common/Constants';

/**
 * 航天测控 HUD 顶栏
 */
@Component
export struct StationHeader {
  @Prop isConnected: boolean;
  @Prop isCached: boolean;
  @Prop lastSyncTime: string;
  @Prop currentTimeStr: string;

  build() {
    Column() {
      // 空间站编号与在线呼吸指示
      Row() {
        Row({ space: 6 }) {
          // 空间站航天徽章
          Text('🛰️')
            .fontSize(20)
          Text('CSS-CABIN-01')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .fontColor(Constants.COLOR_WHITE)
            .fontFamily('monospace')
        }

        // 状态徽章
        Row({ space: 4 }) {
          Circle({ width: 8, height: 8 })
            .fill(this.isCached ? Constants.COLOR_YELLOW : (this.isConnected ? Constants.COLOR_GREEN : Constants.COLOR_RED))
          Text(this.isCached ? `CACHED (${this.lastSyncTime})` : (this.isConnected ? 'LIVE LINK' : 'OFFLINE'))
            .fontSize(11)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.isCached ? Constants.COLOR_YELLOW : (this.isConnected ? Constants.COLOR_GREEN : Constants.COLOR_RED))
            .fontFamily('monospace')
        }
        .padding({ left: 8, right: 8, top: 4, bottom: 4 })
        .backgroundColor('#1E293B')
        .borderRadius(12)
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
      .alignItems(VerticalAlign.Center)

      // 第二行：IP 与时钟
      Row() {
        Text(`TARGET IP: 192.168.9.51`)
          .fontSize(11)
          .fontColor(Constants.COLOR_CYAN)
          .fontFamily('monospace')

        Text(`BJT: ${this.currentTimeStr}`)
          .fontSize(11)
          .fontColor(Constants.COLOR_MUTED)
          .fontFamily('monospace')
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
      .margin({ top: 6 })
    }
    .width('100%')
    .padding({ left: 16, right: 16, top: 12, bottom: 12 })
    .backgroundColor(Constants.COLOR_BG_PANEL)
    .border({ width: { bottom: 1 }, color: Constants.COLOR_BORDER })
  }
}
