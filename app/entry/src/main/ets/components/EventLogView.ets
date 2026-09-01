import { Constants } from '../common/Constants';
import { EventLogItem } from '../model/TelemetryModel';

/**
 * 实时事件流水列表
 */
@Component
export struct EventLogView {
  @Prop logs: EventLogItem[];

  build() {
    Column() {
      Row() {
        Text('📋 测控事件实时流水')
          .fontSize(13)
          .fontWeight(FontWeight.Bold)
          .fontColor(Constants.COLOR_WHITE)

        Text('最近 20 条')
          .fontSize(10)
          .fontColor(Constants.COLOR_MUTED)
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
      .margin({ bottom: 8 })

      List({ space: 6 }) {
        ForEach(this.logs, (item: EventLogItem) => {
          ListItem() {
            Row({ space: 8 }) {
              Text(`[${item.timestamp}]`)
                .fontSize(10)
                .fontColor(Constants.COLOR_MUTED)
                .fontFamily('monospace')

              Text(item.message)
                .fontSize(11)
                .fontColor(item.level === 'alarm' ? Constants.COLOR_RED : (item.level === 'warn' ? Constants.COLOR_YELLOW : Constants.COLOR_CYAN))
                .layoutWeight(1)
            }
            .width('100%')
            .padding({ left: 6, right: 6, top: 4, bottom: 4 })
            .backgroundColor('#0B1120')
            .borderRadius(4)
          }
        }, (item: EventLogItem) => item.id.toString())
      }
      .height(100)
      .width('100%')
    }
    .width('100%')
    .padding(12)
    .backgroundColor(Constants.COLOR_BG_PANEL)
    .borderRadius(10)
    .border({ width: 1, color: Constants.COLOR_BORDER })
  }
}
