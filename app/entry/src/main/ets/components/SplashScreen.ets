import { Constants } from '../common/Constants';

/**
 * 🌌 空间站航电综合系统 - 纯矢量冷启动自检画面 (Zero Emoji)
 */
@Component
export struct SplashScreen {
  public onFinish: () => void = () => {};

  @State progressValue: number = 0;
  @State statusText: string = 'SYSTEM CORE INITIALIZING...';
  @State radarRotation: number = 0;

  private timerId: number = -1;
  private animTimerId: number = -1;

  aboutToAppear() {
    this.animTimerId = setInterval(() => {
      this.radarRotation = (this.radarRotation + 8) % 360;
    }, 40);

    let step = 0;
    this.timerId = setInterval(() => {
      step += 3;
      this.progressValue = Math.min(100, step);

      if (step === 20) {
        this.statusText = 'MOUNTING I2C0 & SARADC SENSOR BUS...';
      } else if (step === 50) {
        this.statusText = 'CONNECTING TO BAIDU CLOUD BCC (180.76.137.117)...';
      } else if (step === 80) {
        this.statusText = 'SECURITY PROTOCOL HANDSHAKE: PASS...';
      } else if (step >= 100) {
        this.statusText = 'AVIONICS ONLINE - ENTERING MISSION HUD...';
        clearInterval(this.timerId);
        setTimeout(() => {
          this.onFinish();
        }, 200);
      }
    }, 40);
  }

  aboutToDisappear() {
    if (this.timerId !== -1) {
      clearInterval(this.timerId);
    }
    if (this.animTimerId !== -1) {
      clearInterval(this.animTimerId);
    }
  }

  build() {
    Stack() {
      // 1. 深邃航天暗夜背景
      Column()
        .width('100%')
        .height('100%')
        .linearGradient({
          angle: 160,
          colors: [
            ['#03060F', 0.0],
            ['#071126', 0.5],
            ['#03060F', 1.0]
          ]
        })

      // 2. 核心自检视觉
      Column({ space: 16 }) {
        // 顶部跳过按钮
        Row() {
          Blank()
          Text('SKIP >>')
            .fontSize(11)
            .fontWeight(FontWeight.Bold)
            .fontColor(Constants.COLOR_MUTED)
            .fontFamily('monospace')
            .padding({ left: 12, right: 12, top: 6, bottom: 6 })
            .backgroundColor('#0D1B3688')
            .borderRadius(4)
            .border({ width: 1, color: '#1E3A6E' })
            .onClick(() => {
              this.onFinish();
            })
        }
        .width('100%')
        .padding({ top: 36, right: 20 })

        Blank()

        // 矢量雷达测控徽标
        Stack({ alignContent: Alignment.Center }) {
          // 外层刻度环
          Circle({ width: 160, height: 160 })
            .fill(Color.Transparent)
            .stroke('#00F2FE22')
            .strokeWidth(1.5)

          Circle({ width: 120, height: 120 })
            .fill(Color.Transparent)
            .stroke('#00F2FE44')
            .strokeWidth(1)

          // 旋转雷达扫描线
          Row()
            .width(120)
            .height(2)
            .linearGradient({
              angle: 90,
              colors: [['#00F2FE00', 0], ['#00F2FECC', 1]]
            })
            .rotate({ angle: this.radarRotation })

          // 矢量航天飞船图标
          Column({ space: 6 }) {
            Image($r('app.media.ic_satellite'))
              .width(42)
              .height(42)

            Text('CSS // TIANGONG')
              .fontSize(10)
              .fontWeight(FontWeight.Bolder)
              .fontColor(Constants.COLOR_CYAN)
              .fontFamily('monospace')
              .letterSpacing(2)
          }
        }
        .width(170)
        .height(170)

        // 航天系统标题
        Column({ space: 6 }) {
          Text('天宫空间站 · 航电综合测控终端')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .fontColor(Constants.COLOR_WHITE)
            .letterSpacing(1)

          Text('CHINA MANNED SPACE // AVIONICS HUD SYSTEM')
            .fontSize(9)
            .fontColor('#475569')
            .fontFamily('monospace')
            .letterSpacing(1)

          Row({ space: 6 }) {
            Text('OpenHarmony 3.0 LTS')
              .fontSize(9)
              .fontColor('#38BDF8')
              .fontFamily('monospace')
              .backgroundColor('#0369A122')
              .padding({ left: 8, right: 8, top: 3, bottom: 3 })
              .borderRadius(2)
              .border({ width: 1, color: '#0284C744' })

            Text('ArkTS Stage 原生')
              .fontSize(9)
              .fontColor('#10B981')
              .fontFamily('monospace')
              .backgroundColor('#04785722')
              .padding({ left: 8, right: 8, top: 3, bottom: 3 })
              .borderRadius(2)
              .border({ width: 1, color: '#05966944' })
          }
          .margin({ top: 6 })
        }

        Blank()

        // 底部自检进度与终端指令行
        Column({ space: 8 }) {
          Row() {
            Text(this.statusText)
              .fontSize(9)
              .fontColor(Constants.COLOR_CYAN)
              .fontFamily('monospace')
              .maxLines(1)
              .textOverflow({ overflow: TextOverflow.Ellipsis })

            Blank()

            Text(`${this.progressValue}%`)
              .fontSize(11)
              .fontWeight(FontWeight.Bold)
              .fontColor(Constants.COLOR_WHITE)
              .fontFamily('monospace')
          }
          .width('100%')

          // 分段式精密进度条
          Stack({ alignContent: Alignment.Start }) {
            Row()
              .width('100%')
              .height(4)
              .backgroundColor('#0D1B36')
              .borderRadius(1)

            Row()
              .width(`${this.progressValue}%`)
              .height(4)
              .linearGradient({
                angle: 90,
                colors: [
                  ['#00F2FE', 0.0],
                  ['#38BDF8', 0.5],
                  ['#10B981', 1.0]
                ]
              })
              .borderRadius(1)
          }
          .width('100%')
        }
        .width('90%')
        .padding({ bottom: 36 })
      }
      .width('100%')
      .height('100%')
    }
    .width('100%')
    .height('100%')
  }
}
