import { Constants } from '../common/Constants';

interface GasSlice {
  name: string;
  chemical: string;
  pct: number;
  color: string;
  desc: string;
}

/**
 * 🪐 中国空间站 ECLSS 环控生保系统 - 动态气体净化与生保负荷饼图
 * 支持【动态生保负荷（高敏实时联动实物）】与【全舱常压组分（101.3kPa理论标称）】双模式切换
 */
@Component
export struct AtmospherePieChart {
  @Prop @Watch('onDataChange') gasPpm: number = 5.0;
  @Prop @Watch('onDataChange') fanSpeed: number = 0;
  @Prop @Watch('onDataChange') motorOn: boolean = false;
  @State currentMode: number = 0; // 0: 动态生保负荷 (大幅灵敏感知), 1: 全舱常压组分 (理论化学比)

  private settings: RenderingContextSettings = new RenderingContextSettings(true);
  private context: CanvasRenderingContext2D = new CanvasRenderingContext2D(this.settings);

  private onDataChange(): void {
    this.drawDonutChart();
  }

  private getGasSlices(): GasSlice[] {
    if (this.currentMode === 0) {
      // ===== 模式 0: ECLSS 动态生保与气体净化负荷配比 (敏锐联动硬件，肉眼可见剧烈变动) =====
      // 1. O2 生保电解供氧基底 (稳定基准 35.0%)
      const o2Pct = 35.0;

      // 2. CO2 代谢吸收负荷 (随风机档位强烈联动！档位越高抽风越快，微重力滞留负荷越低)
      // 0档待机: 30%, 1档低速: 24%, 2档中速: 18%, 3/4档全速: 12%
      let co2Pct = 30.0;
      if (this.fanSpeed === 1) co2Pct = 24.0;
      else if (this.fanSpeed === 2) co2Pct = 18.0;
      else if (this.fanSpeed === 3 || this.fanSpeed === 4) co2Pct = 12.0;

      // 3. VOC / 烟雾杂质净化负荷 (直接由小凌派 MQ-2 烟雾传感器大幅驱动！吹气时扇区迅速膨胀)
      // 正常 5 ppm 约 12%，烟雾 15 ppm 增至 25%，>30 ppm 飙升至 40% 红色高亮
      const ppm = this.gasPpm || 5.0;
      const vocPct = Math.min(42.0, Math.max(8.0, 8.0 + (ppm / 25.0) * 26.0));

      // 4. 微重力对流循环换气配比 (补齐 100%)
      const circPct = Math.max(8.0, 100.0 - o2Pct - co2Pct - vocPct);

      return [
        { name: '生保供氧', chemical: 'O₂', pct: o2Pct, color: '#10B981', desc: '电解水动态制氧' },
        { name: 'CO₂净化', chemical: 'CO₂', pct: co2Pct, color: '#F59E0B', desc: `风机联动 L${this.fanSpeed}` },
        { name: '烟气净化', chemical: 'VOC', pct: vocPct, color: ppm > 15 ? '#EF4444' : '#F43F5E', desc: `MQ-2实测 ${ppm.toFixed(1)}ppm` },
        { name: '气流对流', chemical: 'AIR', pct: circPct, color: '#00F2FE', desc: '微重力循环风道' }
      ];
    } else {
      // ===== 模式 1: 全舱 101.3 kPa 标准常压理论气体组分 (答辩标准数据) =====
      const vocPct = Math.min(1.8, Math.max(0.35, 0.35 + (this.gasPpm / 50.0) * 0.5));
      const co2Pct = this.fanSpeed === 0 ? 0.45 : 0.35;
      const o2Pct = 21.0;
      const n2Pct = 100.0 - o2Pct - co2Pct - vocPct;

      return [
        { name: '氮气基底', chemical: 'N₂', pct: n2Pct, color: '#00F2FE', desc: '稀释缓冲气' },
        { name: '氧气维持', chemical: 'O₂', pct: o2Pct, color: '#10B981', desc: '生保标准供氧' },
        { name: '二氧化碳', chemical: 'CO₂', pct: co2Pct, color: '#F59E0B', desc: '代谢呼吸产物' },
        { name: '痕量杂质', chemical: 'VOC', pct: vocPct, color: '#EF4444', desc: 'MQ-2 实时监测' }
      ];
    }
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
    let currentAngle = -Math.PI / 2;

    for (let i = 0; i < slices.length; i++) {
      const slice = slices[i];
      const sliceAngle = (slice.pct / 100.0) * Math.PI * 2;
      const endAngle = currentAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, currentAngle, endAngle, false);
      ctx.arc(cx, cy, innerR, endAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();

      // 分割细微缝隙
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#060C18';
      ctx.stroke();

      currentAngle = endAngle;
    }

    // 中心圆孔
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2);
    ctx.fillStyle = '#060D1A';
    ctx.fill();

    // 内部精密光圈
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#1B2A4A88';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  build() {
    Column({ space: 8 }) {
      // 1. 顶部标题栏与模式切换胶囊 (点击即刻在动态负荷与理论组分之间切换)
      Row() {
        Row({ space: 6 }) {
          Image($r('app.media.ic_gas'))
            .width(15)
            .height(15)

          Text(this.currentMode === 0 ? 'ECLSS 生保负荷动态配比' : '空间站常压标准大气配比')
            .fontSize(12.5)
            .fontWeight(FontWeight.Bold)
            .fontColor(Constants.COLOR_WHITE)
        }

        // 交互式切换胶囊按键
        Row({ space: 4 }) {
          Circle({ width: 5, height: 5 })
            .fill(this.currentMode === 0 ? Constants.COLOR_CYAN : Constants.COLOR_GREEN)

          Text(this.currentMode === 0 ? '生保动态 ⇄' : '全舱常压 ⇄')
            .fontSize(9.5)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.currentMode === 0 ? Constants.COLOR_CYAN : Constants.COLOR_GREEN)
            .fontFamily('monospace')
        }
        .padding({ left: 7, right: 7, top: 3, bottom: 3 })
        .backgroundColor(this.currentMode === 0 ? '#00F2FE18' : '#10B98118')
        .borderRadius(4)
        .border({ width: 0.8, color: this.currentMode === 0 ? '#00F2FE55' : '#10B98155' })
        .onClick(() => {
          this.currentMode = this.currentMode === 0 ? 1 : 0;
          this.drawDonutChart();
        })
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)

      // 2. 环形图主体：左侧动态环形扇区 + 右侧成分矩阵
      Row({ space: 10 }) {
        Stack({ alignContent: Alignment.Center }) {
          Canvas(this.context)
            .width(140)
            .height(140)
            .onReady(() => {
              this.drawDonutChart();
            })

          Column({ space: 1 }) {
            Text(this.currentMode === 0 ? `L${this.fanSpeed}` : '101.3')
              .fontSize(14)
              .fontWeight(FontWeight.Bolder)
              .fontColor(Constants.COLOR_WHITE)
              .fontFamily('monospace')

            Text(this.currentMode === 0 ? (this.motorOn ? '运转中' : '待机') : 'kPa 标称')
              .fontSize(8.5)
              .fontColor(this.currentMode === 0 ? (this.motorOn ? Constants.COLOR_GREEN : Constants.COLOR_YELLOW) : Constants.COLOR_CYAN)

            Text(this.currentMode === 0 ? `${(this.gasPpm || 0).toFixed(1)}ppm` : '适居优')
              .fontSize(8)
              .fontColor(Constants.COLOR_MUTED)
              .fontWeight(FontWeight.Medium)
          }
        }
        .width(140)
        .height(140)

        Column({ space: 5.5 }) {
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

              Text(`${slice.pct.toFixed(1)}%`)
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

      // 3. 底部硬件遥测联动提示条
      Row() {
        Row({ space: 4 }) {
          Circle({ width: 4, height: 4 }).fill(Constants.COLOR_CYAN)
          Text(this.currentMode === 0 ? `实物联动: MQ-2烟雾 (${(this.gasPpm || 0).toFixed(1)}ppm) · 风机L${this.fanSpeed}` : `VOC痕量: ${(this.gasPpm || 0).toFixed(1)} ppm · 闭环再生率 95.8%`)
            .fontSize(9.5)
            .fontColor(Constants.COLOR_CYAN)
            .fontFamily('monospace')
        }

        Text(this.currentMode === 0 ? '● 动态自适应' : '● 理论平衡')
          .fontSize(9)
          .fontColor(Constants.COLOR_MUTED)
          .fontFamily('monospace')
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
