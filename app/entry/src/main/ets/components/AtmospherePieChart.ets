import { TelemetryData } from '../model/TelemetryModel';
import { Constants } from '../common/Constants';

interface GasSlice {
  name: string;
  chemical: string;
  pct: number;
  color: string;
  desc: string;
}

/**
 * 🪐 中国空间站 ECLSS 环控生保系统 - 舱内大气成分动态配比环形饼图
 * 纯原生 Canvas 绘制双环矢量气态成分色相环，动态关联合成硬件 MQ-2 烟雾传感器与风机动力
 */
@Component
export struct AtmospherePieChart {
  @Prop @Watch('onTelemetryUpdate') telemetry: TelemetryData;

  private settings: RenderingContextSettings = new RenderingContextSettings(true);
  private context: CanvasRenderingContext2D = new CanvasRenderingContext2D(this.settings);

  private onTelemetryUpdate(): void {
    this.drawDonutChart();
  }

  private getGasSlices(): GasSlice[] {
    const gasPpm = this.telemetry ? this.telemetry.gas_ppm : 8.0;
    const fanSpeed = this.telemetry ? this.telemetry.fan_speed : 4;

    // 动态模拟空间站真实微重力大气成分
    // VOC 痕量气体动态关联 MQ-2 传感器 PPM
    const vocPct = Math.min(2.5, Math.max(0.45, 0.45 + (gasPpm / 40.0) * 0.8));
    // CO2 动态模拟：风机停转时代谢积聚微升，风机高档排风时维持 0.35%
    const co2Pct = fanSpeed === 0 ? 0.48 : (fanSpeed === 3 ? 0.32 : 0.38);
    // O2 维持生命标称 21.0%
    const o2Pct = 21.0;
    // N2 稀释缓冲气基底补足 100%
    const n2Pct = 100.0 - o2Pct - co2Pct - vocPct;

    return [
      { name: '氮气', chemical: 'N₂', pct: n2Pct, color: '#00F2FE', desc: '稀释缓冲气体' },
      { name: '氧气', chemical: 'O₂', pct: o2Pct, color: '#10B981', desc: '电解水再生生保' },
      { name: '二氧化碳', chemical: 'CO₂', pct: co2Pct, color: '#F59E0B', desc: '微重力代谢产物' },
      { name: '痕量杂质/VOC', chemical: 'VOC', pct: vocPct, color: '#EF4444', desc: 'MQ-2 实时监测' }
    ];
  }

  private drawDonutChart(): void {
    const ctx = this.context;
    const size = 140;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = 56;
    const innerR = 36;

    ctx.clearRect(0, 0, size, size);

    const slices = this.getGasSlices();
    let currentAngle = -Math.PI / 2; // 从 12 点钟位置开始

    for (let i = 0; i < slices.length; i++) {
      const slice = slices[i];
      const sliceAngle = (slice.pct / 100.0) * Math.PI * 2;
      const endAngle = currentAngle + sliceAngle;

      // 绘制环形扇区
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, currentAngle, endAngle, false);
      ctx.arc(cx, cy, innerR, endAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();

      // 扇区间隙高精度微缝
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#080E1E';
      ctx.stroke();

      currentAngle = endAngle;
    }

    // 绘制中心圆孔与光晕
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2);
    ctx.fillStyle = '#060D1A';
    ctx.fill();

    // 中心装饰细光圈
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#1B2A4A88';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  build() {
    Column({ space: 8 }) {
      // 1. 标题与状态标签
      Row() {
        Row({ space: 6 }) {
          Image($r('app.media.ic_gas'))
            .width(15)
            .height(15)

          Text('ECLSS 空间站大气成分动态配比')
            .fontSize(13)
            .fontWeight(FontWeight.Bold)
            .fontColor(Constants.COLOR_WHITE)
        }

        Row({ space: 4 }) {
          Circle({ width: 5, height: 5 }).fill(Constants.COLOR_GREEN)
          Text('101.3 kPa 标称')
            .fontSize(9.5)
            .fontColor(Constants.COLOR_GREEN)
            .fontFamily('monospace')
        }
        .padding({ left: 6, right: 6, top: 2, bottom: 2 })
        .backgroundColor('#10B98118')
        .borderRadius(3)
        .border({ width: 0.8, color: '#10B98155' })
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)

      // 2. 饼图主体：左侧 Donut 环形图 + 右侧气态成分实时明细
      Row({ space: 10 }) {
        // 左侧环形饼图视窗
        Stack({ alignContent: Alignment.Center }) {
          Canvas(this.context)
            .width(140)
            .height(140)
            .onReady(() => {
              this.drawDonutChart();
            })

          // 环心驻留文字：舱压与评级
          Column({ space: 1 }) {
            Text('101.3')
              .fontSize(13.5)
              .fontWeight(FontWeight.Bolder)
              .fontColor(Constants.COLOR_WHITE)
              .fontFamily('monospace')

            Text('kPa 标称')
              .fontSize(8.5)
              .fontColor(Constants.COLOR_CYAN)

            Text('适居优')
              .fontSize(8)
              .fontColor(Constants.COLOR_GREEN)
              .fontWeight(FontWeight.Medium)
          }
        }
        .width(140)
        .height(140)

        // 右侧气体成分数据矩阵
        Column({ space: 6 }) {
          ForEach(this.getGasSlices(), (slice: GasSlice) => {
            Row() {
              Row({ space: 5 }) {
                Rect({ width: 7, height: 7 })
                  .fill(slice.color)
                  .borderRadius(1.5)

                Text(slice.chemical)
                  .fontSize(11)
                  .fontWeight(FontWeight.Bold)
                  .fontColor(Constants.COLOR_WHITE)
                  .fontFamily('monospace')

                Text(slice.name)
                  .fontSize(10)
                  .fontColor(Constants.COLOR_MUTED)
              }

              Text(`${slice.pct.toFixed(2)}%`)
                .fontSize(11)
                .fontWeight(FontWeight.Bold)
                .fontColor(slice.color)
                .fontFamily('monospace')
            }
            .width('100%')
            .justifyContent(FlexAlign.SpaceBetween)
            .padding({ left: 6, right: 6, top: 3.5, bottom: 3.5 })
            .backgroundColor('#0D182E66')
            .borderRadius(4)
            .border({ width: 0.6, color: '#1B2A4A88' })
          })
        }
        .layoutWeight(1)
      }
      .width('100%')
      .alignItems(VerticalAlign.Center)

      // 3. 底部生保大闭环与烟雾关联联动指示条
      Row() {
        Row({ space: 4 }) {
          Circle({ width: 4, height: 4 }).fill(Constants.COLOR_CYAN)
          Text(`VOC痕量: ${this.telemetry ? this.telemetry.gas_ppm.toFixed(1) : '8.0'} ppm (正常)`)
            .fontSize(9.5)
            .fontColor(Constants.COLOR_CYAN)
            .fontFamily('monospace')
        }

        Row({ space: 4 }) {
          Text('环控闭环再生率 95.8%')
            .fontSize(9.5)
            .fontColor(Constants.COLOR_MUTED)
            .fontFamily('monospace')
        }
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
      .padding({ top: 4 })
      .border({ width: { top: 0.8 }, color: '#1B2A4A66' })
    }
    .width('100%')
    .padding(12)
    .backgroundColor('#0A112299')
    .borderRadius(6)
    .border({ width: 1, color: '#1B2A4A' })
  }
}
