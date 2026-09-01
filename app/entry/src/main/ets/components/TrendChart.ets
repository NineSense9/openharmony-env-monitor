import { Constants } from '../common/Constants';

/**
 * 原生 Canvas 绘制的多维时序走势图
 */
@Component
export struct TrendChart {
  @Prop tempData: number[];
  @Prop humiData: number[];

  private settings: RenderingContextSettings = new RenderingContextSettings(true);
  private context: CanvasRenderingContext2D = new CanvasRenderingContext2D(this.settings);

  build() {
    Column() {
      Row() {
        Text('📈 舱内温湿度实时走势')
          .fontSize(13)
          .fontWeight(FontWeight.Bold)
          .fontColor(Constants.COLOR_WHITE)

        Row({ space: 12 }) {
          Row({ space: 4 }) {
            Circle({ width: 6, height: 6 }).fill('#00F0FF')
            Text('温度(℃)').fontSize(10).fontColor(Constants.COLOR_MUTED)
          }
          Row({ space: 4 }) {
            Circle({ width: 6, height: 6 }).fill('#00E676')
            Text('湿度(%)').fontSize(10).fontColor(Constants.COLOR_MUTED)
          }
        }
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
      .margin({ bottom: 8 })

      Canvas(this.context)
        .width('100%')
        .height(130)
        .backgroundColor('#0B1120')
        .borderRadius(8)
        .onReady(() => {
          this.drawChart();
        })
    }
    .width('100%')
    .padding(12)
    .backgroundColor(Constants.COLOR_BG_PANEL)
    .borderRadius(10)
    .border({ width: 1, color: Constants.COLOR_BORDER })
  }

  private drawChart() {
    const ctx = this.context;
    const w = 320;
    const h = 130;

    ctx.clearRect(0, 0, w, h);

    // 绘制背景网格标尺
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let y = 20; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 绘制温度曲线 (青色)
    if (this.tempData.length > 1) {
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const stepX = w / (this.tempData.length - 1);
      for (let i = 0; i < this.tempData.length; i++) {
        const val = this.tempData[i];
        // 映射 20~40℃ 到 h-10 ~ 10
        const y = h - 10 - ((val - 20) / 20) * (h - 20);
        const x = i * stepX;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 绘制湿度曲线 (绿色)
    if (this.humiData.length > 1) {
      ctx.strokeStyle = '#00E676';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const stepX = w / (this.humiData.length - 1);
      for (let i = 0; i < this.humiData.length; i++) {
        const val = this.humiData[i];
        // 映射 30~80% 到 h-10 ~ 10
        const y = h - 10 - ((val - 30) / 50) * (h - 20);
        const x = i * stepX;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}
