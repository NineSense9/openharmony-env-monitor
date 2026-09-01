import { Constants } from '../common/Constants';

/**
 * 拟态毛玻璃传感器卡片组件
 */
@Component
export struct SensorCard {
  @Prop label: string;
  @Prop valueStr: string;
  @Prop unit: string;
  @Prop channel: string;
  @Prop isAlarm: boolean;
  @Prop icon: string;

  build() {
    Column() {
      // 头部：通道标号与图标
      Row() {
        Text(this.channel)
          .fontSize(10)
          .fontColor(Constants.COLOR_MUTED)
          .fontFamily('monospace')

        Text(this.icon)
          .fontSize(14)
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)

      // 中部：指标数值
      Row({ space: 2 }) {
        Text(this.valueStr)
          .fontSize(26)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.isAlarm ? Constants.COLOR_RED : Constants.COLOR_WHITE)
          .fontFamily('monospace')

        Text(this.unit)
          .fontSize(13)
          .fontColor(this.isAlarm ? Constants.COLOR_RED : Constants.COLOR_CYAN)
          .margin({ bottom: 4 })
      }
      .alignItems(VerticalAlign.Bottom)
      .margin({ top: 8, bottom: 4 })

      // 底部：参数名称与状态提示
      Row() {
        Text(this.label)
          .fontSize(12)
          .fontColor(Constants.COLOR_MUTED)

        Text(this.isAlarm ? '越限告警' : '正常')
          .fontSize(10)
          .fontColor(this.isAlarm ? Constants.COLOR_RED : Constants.COLOR_GREEN)
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
    }
    .width('48%')
    .padding(12)
    .backgroundColor(Constants.COLOR_BG_CARD)
    .borderRadius(10)
    .border({
      width: 1,
      color: this.isAlarm ? Constants.COLOR_RED : Constants.COLOR_BORDER
    })
  }
}
