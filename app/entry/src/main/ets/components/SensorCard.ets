import { Constants } from '../common/Constants';

/**
 * 拟态毛玻璃环境传感器卡片（纯矢量图标 + 动态刻度微条）
 */
@Component
export struct SensorCard {
  @Prop label: string;
  @Prop valueStr: string;
  @Prop unit: string;
  @Prop channel: string;
  @Prop isAlarm: boolean;
  @Prop iconRes: Resource;
  @Prop progressRatio: number; // 0.0 ~ 1.0

  build() {
    Column() {
      // 顶部通道信息与矢量图标
      Row() {
        Text(this.channel)
          .fontSize(9)
          .fontColor(Constants.COLOR_MUTED)
          .fontFamily('monospace')

        Image(this.iconRes)
          .width(16)
          .height(16)
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)

      // 核心数值与单位
      Row({ space: 2 }) {
        Text(this.valueStr)
          .fontSize(22)
          .fontWeight(FontWeight.Bolder)
          .fontColor(this.isAlarm ? Constants.COLOR_RED : Constants.COLOR_WHITE)
          .fontFamily('monospace')

        Text(this.unit)
          .fontSize(11)
          .fontColor(this.isAlarm ? Constants.COLOR_RED : Constants.COLOR_CYAN)
          .margin({ bottom: 2 })
      }
      .alignItems(VerticalAlign.Bottom)
      .margin({ top: 4, bottom: 4 })

      // 动态量程刻度微条
      Stack({ alignContent: Alignment.Start }) {
        Row()
          .width('100%')
          .height(3)
          .backgroundColor('#13213C')
          .borderRadius(1)

        Row()
          .width(`${Math.max(6, Math.min(100, Math.round(this.progressRatio * 100)))}%`)
          .height(3)
          .backgroundColor(this.isAlarm ? Constants.COLOR_RED : Constants.COLOR_CYAN)
          .borderRadius(1)
      }
      .width('100%')
      .margin({ top: 2, bottom: 4 })

      // 底部标签与状态
      Row() {
        Text(this.label)
          .fontSize(11)
          .fontColor(Constants.COLOR_MUTED)

        Text(this.isAlarm ? 'ALERT' : 'NOMINAL')
          .fontSize(9)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.isAlarm ? Constants.COLOR_RED : Constants.COLOR_GREEN)
          .fontFamily('monospace')
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
    }
    .layoutWeight(1)
    .padding(10)
    .backgroundColor('#0A1122')
    .borderRadius(6)
    .border({
      width: 1,
      color: this.isAlarm ? '#EF4444' : '#1B2A4A'
    })
  }
}
