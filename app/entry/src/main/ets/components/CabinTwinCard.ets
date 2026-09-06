import { TelemetryData } from '../model/TelemetryModel';
import { AppTheme, Constants } from '../common/Constants';

/**
 * 中国空间站天和核心舱数字孪生透视卡片 (CSS-CABIN-TWIN)
 * 纯原生矢量渲染，包含生保居住舱(SEC-A)、实验载荷舱(SEC-B)、环控动力舱(SEC-C)及动态涡轮旋转动效
 */
@Component
export struct CabinTwinCard {
  @Prop telemetry: TelemetryData = new TelemetryData();
  @State fanRotation: number = 0;
  private fanTimerId: number = -1;

  aboutToAppear() {
    this.fanTimerId = setInterval(() => {
      if (this.telemetry.motor_on) {
        let step = 15;
        if (this.telemetry.fan_speed === 1) step = 8;
        else if (this.telemetry.fan_speed === 2) step = 16;
        else if (this.telemetry.fan_speed === 3) step = 32;
        else if (this.telemetry.fan_speed === 4) step = 20;
        this.fanRotation = (this.fanRotation + step) % 360;
      } else {
        this.fanRotation = (this.fanRotation + 1) % 360;
      }
    }, 30);
  }

  aboutToDisappear() {
    if (this.fanTimerId !== -1) {
      clearInterval(this.fanTimerId);
    }
  }

  build() {
    Column() {
      // 1. 卡片顶栏
      Row() {
        Row({ space: 6 }) {
          // 卫星/核心舱矢量图标
          Stack() {
            Circle({ width: 14, height: 14 })
              .fill('none')
              .stroke(AppTheme.ACCENT_CYAN)
              .strokeWidth(1.2)
            Circle({ width: 6, height: 6 })
              .fill(AppTheme.ACCENT_CYAN)
            Line().startPoint([0, 7]).endPoint([14, 7]).stroke(AppTheme.ACCENT_CYAN).strokeWidth(1)
            Line().startPoint([7, 0]).endPoint([7, 14]).stroke(AppTheme.ACCENT_CYAN).strokeWidth(1)
          }
          .width(16)
          .height(16)

          Text('空间站核心舱透视模型')
            .fontSize(13)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.TEXT_WHITE)
            .fontFamily('monospace')

          Text('CSS-CABIN')
            .fontSize(9)
            .fontColor(AppTheme.ACCENT_CYAN)
            .backgroundColor('rgba(0, 242, 254, 0.12)')
            .padding({ left: 5, right: 5, top: 1, bottom: 1 })
            .borderRadius(3)
            .fontFamily('monospace')
        }

        Row({ space: 4 }) {
          Circle({ width: 6, height: 6 })
            .fill(this.telemetry.alarm_on ? AppTheme.ACCENT_RED : AppTheme.ACCENT_GREEN)
          Text(this.telemetry.alarm_on ? '异常告警' : '适居优')
            .fontSize(10)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.telemetry.alarm_on ? AppTheme.ACCENT_RED : AppTheme.ACCENT_GREEN)
        }
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
      .padding({ left: 12, right: 12, top: 10, bottom: 8 })
      .border({ width: { bottom: 1 }, color: 'rgba(255, 255, 255, 0.06)' })

      // 2. 核心舱三舱立体透视主体
      Stack() {
        // 耐压外壳底框
        Rect({ width: '100%', height: 160 })
          .fill('rgba(5, 12, 24, 0.85)')
          .stroke('rgba(0, 242, 254, 0.45)')
          .strokeWidth(1.2)
          .borderRadius(16)

        // 内部虚线结构线
        Rect({ width: '97%', height: 150 })
          .fill('none')
          .stroke('rgba(0, 242, 254, 0.15)')
          .strokeWidth(1)
          .strokeDashArray([4, 3])
          .borderRadius(12)

        // 三舱内容水平横向排列
        Row() {
          // ==================== SEC-A: 生保居住舱 ====================
          Column() {
            Text('SEC-A 居住舱')
              .fontSize(10)
              .fontWeight(FontWeight.Bold)
              .fontColor(AppTheme.ACCENT_CYAN)
              .fontFamily('monospace')
            Text('LIFE-SUPPORT')
              .fontSize(7)
              .fontColor(AppTheme.TEXT_MUTED)
              .fontFamily('monospace')
              .margin({ bottom: 6 })

            // SHT30 主测点指示
            Stack() {
              Circle({ width: 14, height: 14 })
                .fill(this.telemetry.alarm_on ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 242, 254, 0.25)')
              Circle({ width: 7, height: 7 })
                .fill(this.telemetry.alarm_on ? AppTheme.ACCENT_RED : AppTheme.ACCENT_CYAN)
            }
            .margin({ bottom: 4 })

            Text('SHT30 主测点')
              .fontSize(8)
              .fontColor(AppTheme.ACCENT_CYAN)
              .fontFamily('monospace')
              .margin({ bottom: 4 })

            // 遥测微型卡片
            Column({ space: 2 }) {
              Text(`温: ${this.telemetry.temperature.toFixed(1)}℃`)
                .fontSize(9.5)
                .fontWeight(FontWeight.Bold)
                .fontColor(AppTheme.TEXT_WHITE)
                .fontFamily('monospace')
              Text(`湿: ${this.telemetry.humidity.toFixed(0)}%`)
                .fontSize(9.5)
                .fontWeight(FontWeight.Bold)
                .fontColor(AppTheme.ACCENT_BLUE)
                .fontFamily('monospace')
              Text('● 适居标称')
                .fontSize(7.5)
                .fontColor(AppTheme.ACCENT_GREEN)
            }
            .padding({ left: 6, right: 6, top: 4, bottom: 4 })
            .backgroundColor('rgba(6, 18, 38, 0.85)')
            .borderRadius(4)
            .border({ width: 0.8, color: 'rgba(0, 242, 254, 0.3)' })
          }
          .layoutWeight(1)
          .alignItems(HorizontalAlign.Center)
          .padding({ top: 8, bottom: 8 })

          // 隔舱气密门 HATCH A-B
          Column() {
            Line().startPoint([0, 0]).endPoint([0, 140]).stroke('rgba(0, 242, 254, 0.25)').strokeWidth(1).strokeDashArray([3, 2])
            Text('H-AB')
              .fontSize(7)
              .fontColor(AppTheme.TEXT_MUTED)
              .fontFamily('monospace')
              .position({ x: -10, y: 65 })
          }
          .width(1)
          .height(140)

          // ==================== SEC-B: 实验载荷舱 ====================
          Column() {
            Text('SEC-B 实验舱')
              .fontSize(10)
              .fontWeight(FontWeight.Bold)
              .fontColor(AppTheme.ACCENT_CYAN)
              .fontFamily('monospace')
            Text('SCIENCE RACKS')
              .fontSize(7)
              .fontColor(AppTheme.TEXT_MUTED)
              .fontFamily('monospace')
              .margin({ bottom: 6 })

            // 传感器状态指示
            Row({ space: 4 }) {
              Circle({ width: 6, height: 6 }).fill(AppTheme.ACCENT_YELLOW)
              Text(`光: ${Math.round(this.telemetry.lux)}lx`)
                .fontSize(8.5)
                .fontWeight(FontWeight.Bold)
                .fontColor(AppTheme.ACCENT_YELLOW)
                .fontFamily('monospace')
            }
            .margin({ bottom: 4 })

            Row({ space: 4 }) {
              Circle({ width: 6, height: 6 }).fill(this.telemetry.gas_ppm > Constants.THRESHOLD_GAS ? AppTheme.ACCENT_RED : AppTheme.ACCENT_GREEN)
              Text(`气: ${this.telemetry.gas_ppm.toFixed(1)}ppm`)
                .fontSize(8.5)
                .fontWeight(FontWeight.Bold)
                .fontColor(this.telemetry.gas_ppm > Constants.THRESHOLD_GAS ? AppTheme.ACCENT_RED : AppTheme.ACCENT_GREEN)
                .fontFamily('monospace')
            }
            .margin({ bottom: 6 })

            // 实验机柜状态卡片
            Column({ space: 2 }) {
              Text(this.telemetry.gas_ppm > Constants.THRESHOLD_GAS ? '⚠️ 气体异常' : '● 洁净度: 极佳')
                .fontSize(8.5)
                .fontWeight(FontWeight.Bold)
                .fontColor(this.telemetry.gas_ppm > Constants.THRESHOLD_GAS ? AppTheme.ACCENT_RED : AppTheme.ACCENT_GREEN)
              Text('机柜 RACK: 供电')
                .fontSize(7.5)
                .fontColor(AppTheme.TEXT_MUTED)
            }
            .padding({ left: 5, right: 5, top: 4, bottom: 4 })
            .backgroundColor('rgba(6, 18, 38, 0.85)')
            .borderRadius(4)
            .border({ width: 0.8, color: this.telemetry.gas_ppm > Constants.THRESHOLD_GAS ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)' })
          }
          .layoutWeight(1)
          .alignItems(HorizontalAlign.Center)
          .padding({ top: 8, bottom: 8 })

          // 隔舱气密门 HATCH B-C
          Column() {
            Line().startPoint([0, 0]).endPoint([0, 140]).stroke('rgba(0, 242, 254, 0.25)').strokeWidth(1).strokeDashArray([3, 2])
            Text('H-BC')
              .fontSize(7)
              .fontColor(AppTheme.TEXT_MUTED)
              .fontFamily('monospace')
              .position({ x: -10, y: 65 })
          }
          .width(1)
          .height(140)

          // ==================== SEC-C: 环控动力舱 ====================
          Column() {
            Text('SEC-C 动力舱')
              .fontSize(10)
              .fontWeight(FontWeight.Bold)
              .fontColor(AppTheme.ACCENT_CYAN)
              .fontFamily('monospace')
            Text('VENT & POWER')
              .fontSize(7)
              .fontColor(AppTheme.TEXT_MUTED)
              .fontFamily('monospace')
              .margin({ bottom: 4 })

            // 动态旋转风机叶轮
            Stack() {
              Circle({ width: 28, height: 28 })
                .fill('rgba(0, 242, 254, 0.08)')
                .stroke(AppTheme.ACCENT_CYAN)
                .strokeWidth(1)

              Stack() {
                Rect({ width: 2.5, height: 16 }).fill(AppTheme.ACCENT_CYAN).borderRadius(1)
                Rect({ width: 16, height: 2.5 }).fill(AppTheme.ACCENT_CYAN).borderRadius(1)
                Rect({ width: 2.5, height: 16 }).fill(AppTheme.ACCENT_CYAN).borderRadius(1).rotate({ angle: 45 })
                Rect({ width: 16, height: 2.5 }).fill(AppTheme.ACCENT_CYAN).borderRadius(1).rotate({ angle: 45 })
              }
              .rotate({ angle: this.fanRotation })

              Circle({ width: 5, height: 5 }).fill(AppTheme.COLOR_WHITE)
            }
            .width(30)
            .height(30)
            .margin({ bottom: 4 })

            Text(this.telemetry.motor_on ? `PWM L${this.telemetry.fan_speed}` : '风机待命')
              .fontSize(8.5)
              .fontWeight(FontWeight.Bold)
              .fontColor(this.telemetry.motor_on ? AppTheme.ACCENT_CYAN : AppTheme.TEXT_MUTED)
              .fontFamily('monospace')
              .margin({ bottom: 3 })

            // 风速与排风信息
            Column({ space: 2 }) {
              Text(this.telemetry.motor_on 
                ? `${(0.8 + (this.telemetry.fan_speed === 4 ? 3 : this.telemetry.fan_speed) * 0.75).toFixed(1)} m/s` 
                : '0.0 m/s')
                .fontSize(9)
                .fontWeight(FontWeight.Bold)
                .fontColor(AppTheme.TEXT_WHITE)
                .fontFamily('monospace')
              Text('ECLSS 净化 99%')
                .fontSize(7.5)
                .fontColor(AppTheme.ACCENT_GREEN)
            }
            .padding({ left: 4, right: 4, top: 3, bottom: 3 })
            .backgroundColor('rgba(6, 18, 38, 0.85)')
            .borderRadius(4)
            .border({ width: 0.8, color: 'rgba(0, 242, 254, 0.3)' })
          }
          .layoutWeight(1)
          .alignItems(HorizontalAlign.Center)
          .padding({ top: 8, bottom: 8 })
        }
        .width('96%')
        .height(150)
      }
      .width('100%')
      .padding({ left: 10, right: 10, top: 8, bottom: 8 })

      // 3. 底部微气候指标栏 (4项核心参数)
      Row() {
        // 循环风速
        Column({ space: 2 }) {
          Text('循环风速')
            .fontSize(8.5)
            .fontColor(AppTheme.TEXT_MUTED)
          Text(this.telemetry.motor_on 
            ? `${(0.8 + (this.telemetry.fan_speed === 4 ? 3 : this.telemetry.fan_speed) * 0.75).toFixed(1)} m/s` 
            : '0.0 m/s')
            .fontSize(10)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.ACCENT_CYAN)
            .fontFamily('monospace')
        }
        .layoutWeight(1)
        .alignItems(HorizontalAlign.Center)

        // 换气流量
        Column({ space: 2 }) {
          Text('换气流量')
            .fontSize(8.5)
            .fontColor(AppTheme.TEXT_MUTED)
          Text(this.telemetry.motor_on 
            ? `${((this.telemetry.fan_speed === 4 ? 3 : this.telemetry.fan_speed) * 120 + 180)} m³/h` 
            : '0 m³/h')
            .fontSize(10)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.ACCENT_GREEN)
            .fontFamily('monospace')
        }
        .layoutWeight(1)
        .alignItems(HorizontalAlign.Center)

        // 基准舱压
        Column({ space: 2 }) {
          Text('基准舱压')
            .fontSize(8.5)
            .fontColor(AppTheme.TEXT_MUTED)
          Text('101.3 kPa')
            .fontSize(10)
            .fontWeight(FontWeight.Bold)
            .fontColor(AppTheme.ACCENT_BLUE)
            .fontFamily('monospace')
        }
        .layoutWeight(1)
        .alignItems(HorizontalAlign.Center)

        // HEPA 滤网
        Column({ space: 2 }) {
          Text('HEPA滤网')
            .fontSize(8.5)
            .fontColor(AppTheme.TEXT_MUTED)
          Text('99.97%')
            .fontSize(10)
            .fontWeight(FontWeight.Bold)
            .fontColor('#C084FC')
            .fontFamily('monospace')
        }
        .layoutWeight(1)
        .alignItems(HorizontalAlign.Center)
      }
      .width('100%')
      .padding({ left: 10, right: 10, top: 8, bottom: 10 })
      .backgroundColor('rgba(0, 0, 0, 0.25)')
      .border({ width: { top: 1 }, color: 'rgba(255, 255, 255, 0.06)' })
    }
    .width('100%')
    .backgroundColor(AppTheme.BG_CARD)
    .borderRadius(10)
    .border({ width: 1, color: Constants.COLOR_BORDER })
  }
}
