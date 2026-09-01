import { Constants } from '../common/Constants';

/**
 * 📈 舱内温湿度时序示波走势图（纯矢量 HUD 示波器）
 */
@Component
export struct TrendChart {
  @Prop tempData: number[];
  @Prop humiData: number[];

  private settings: RenderingContextSettings = new RenderingContextSettings(true);
  private context: CanvasRenderingContext2D = new CanvasRenderingContext2D(this.settings);

  private drawChart(): void {
    const ctx = this.context;
    const w = 310;
    const h = 100;
    ctx.clearRect(0, 0, w, h);

    // 1. 绘制示波器网格线
    ctx.strokeStyle = '#1B2A4A55';
    ctx.lineWidth = 1;
    for (let y = 20; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let x = 30; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // 2. 绘制湿度曲线（绿色）+ 渐变填充
    if (this.humiData && this.humiData.length > 1) {
      const step = w / (this.humiData.length - 1);

      // 面积填充
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < this.humiData.length; i++) {
        const val = this.humiData[i];
        const y = h - ((val - 20) / (80 - 20)) * (h - 16) - 8;
        ctx.lineTo(i * step, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = '#10B98114';
      ctx.fill();

      // 折线
      ctx.beginPath();
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < this.humiData.length; i++) {
        const val = this.humiData[i];
        const y = h - ((val - 20) / (80 - 20)) * (h - 16) - 8;
        if (i === 0) {
          ctx.moveTo(0, y);
        } else {
          ctx.lineTo(i * step, y);
        }
      }
      ctx.stroke();
    }

    // 3. 绘制温度曲线（青色）+ 渐变填充 + 最新发光点
    if (this.tempData && this.tempData.length > 1) {
      const step = w / (this.tempData.length - 1);

      // 面积填充
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < this.tempData.length; i++) {
        const val = this.tempData[i];
        const y = h - ((val - 15) / (40 - 15)) * (h - 16) - 8;
        ctx.lineTo(i * step, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = '#00F2FE1A';
      ctx.fill();

      // 折线
      ctx.beginPath();
      ctx.strokeStyle = '#00F2FE';
      ctx.lineWidth = 1.8;
      let lastX = 0;
      let lastY = 0;
      for (let i = 0; i < this.tempData.length; i++) {
        const val = this.tempData[i];
        const y = h - ((val - 15) / (40 - 15)) * (h - 16) - 8;
        if (i === 0) {
          ctx.moveTo(0, y);
        } else {
          ctx.lineTo(i * step, y);
        }
        lastX = i * step;
        lastY = y;
      }
      ctx.stroke();

      // 最新发光点
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lastX, lastY, 6.5, 0, 2 * Math.PI);
      ctx.strokeStyle = '#00F2FE88';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  build() {
    Column({ space: 8 }) {
      // 标题与图例
      Row() {
        Row({ space: 6 }) {
          Image($r('app.media.ic_pulse'))
            .width(15)
            .height(15)

          Text('温湿度时序示波走势')
            .fontSize(13)
            .fontWeight(FontWeight.Bold)
            .fontColor(Constants.COLOR_WHITE)
        }

        Row({ space: 10 }) {
          Row({ space: 4 }) {
            Circle({ width: 5, height: 5 }).fill('#00F2FE')
            Text('TEMP(℃)').fontSize(9).fontColor(Constants.COLOR_MUTED).fontFamily('monospace')
          }

          Row({ space: 4 }) {
            Circle({ width: 5, height: 5 }).fill('#10B981')
            Text('HUMI(%)').fontSize(9).fontColor(Constants.COLOR_MUTED).fontFamily('monospace')
          }
        }
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)

      // Canvas 示波走势画布
      Canvas(this.context)
        .width('100%')
        .height(100)
        .backgroundColor('#060C18')
        .borderRadius(4)
        .border({ width: 1, color: '#1B2A4A' })
        .onReady(() => {
          this.drawChart();
        })
    }
    .width('100%')
    .padding(12)
    .backgroundColor('#0A112299')
    .borderRadius(6)
    .border({ width: 1, color: '#1B2A4A' })
  }
}
