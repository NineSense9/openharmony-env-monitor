import { Constants } from '../common/Constants';
import { EventLogItem } from '../model/TelemetryModel';

/**
 * 测控事件实时流水组件（纯矢量航天终端格式）
 */
@Component
export struct EventLogView {
  @Prop logs: EventLogItem[];

  build() {
    Column({ space: 6 }) {
      Row() {
        Row({ space: 6 }) {
          Image($r('app.media.ic_terminal'))
            .width(14)
            .height(14)

          Text('测控事件实时流水')
            .fontSize(13)
            .fontWeight(FontWeight.Bold)
            .fontColor(Constants.COLOR_WHITE)
        }

        Text('TELEMETRY BUS // 20 RECS')
          .fontSize(9)
          .fontColor(Constants.COLOR_MUTED)
          .fontFamily('monospace')
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)

      // 流水列表
      List({ space: 4 }) {
        ForEach(this.logs, (item: EventLogItem) => {
          ListItem() {
            Row({ space: 6 }) {
              Text(`[${item.timestamp}]`)
                .fontSize(9)
                .fontColor(Constants.COLOR_MUTED)
                .fontFamily('monospace')

              Text(item.level === 'alarm' ? '[ALARM]' : (item.level === 'warn' ? '[WARN]' : '[INFO]'))
                .fontSize(8)
                .fontWeight(FontWeight.Bold)
                .fontColor(item.level === 'alarm' ? Constants.COLOR_RED : (item.level === 'warn' ? Constants.COLOR_YELLOW : Constants.COLOR_CYAN))
                .fontFamily('monospace')

              Text(item.message)
                .fontSize(10)
                .fontColor(Constants.COLOR_WHITE)
                .fontFamily('monospace')
                .maxLines(1)
                .textOverflow({ overflow: TextOverflow.Ellipsis })
            }
            .width('100%')
            .padding({ left: 8, right: 8, top: 4, bottom: 4 })
            .backgroundColor('#060C18')
            .borderRadius(3)
          }
        })
      }
      .width('100%')
      .height(72)
    }
    .width('100%')
    .padding(12)
    .backgroundColor('#0A112299')
    .borderRadius(6)
    .border({ width: 1, color: '#1B2A4A' })
  }
}
