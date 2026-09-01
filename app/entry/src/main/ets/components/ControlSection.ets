import { Constants } from '../common/Constants';
import { PinVerifyDialog } from './PinVerifyDialog';

/**
 * ⚡ 掌上极速双向控制台组件（纯矢量风扇 360° 高速旋转动效 + PIN 免密 + 消除所有 Emoji）
 */
@Component
export struct ControlSection {
  @Prop isMotorRunning: boolean;
  @Prop isAlarmOn: boolean;
  public onToggleMotor: (turnOn: boolean) => void = () => {};
  public onMuteAlarm: () => void = () => {};

  @State isAuthorized: boolean = false;
  @State fanRotation: number = 0;
  @State pendingActionTitle: string = '执行控制指令';
  private pendingActionType: string = 'motor_on';
  private fanTimerId: number = -1;

  private pinDialogController: CustomDialogController = new CustomDialogController({
    builder: PinVerifyDialog({
      actionTitle: this.pendingActionTitle,
      onConfirmed: () => {
        this.isAuthorized = true; // 会话级免密授权
        this.executePendingAction();
      }
    }),
    autoCancel: true,
    customStyle: true
  });

  aboutToAppear() {
    // 动态矢量风扇旋转定时器
    this.fanTimerId = setInterval(() => {
      if (this.isMotorRunning) {
        this.fanRotation = (this.fanRotation + 40) % 360; // 飞速旋转
      } else {
        this.fanRotation = (this.fanRotation + 2) % 360; // 待机微动
      }
    }, 30);
  }

  aboutToDisappear() {
    if (this.fanTimerId !== -1) {
      clearInterval(this.fanTimerId);
    }
  }

  private executePendingAction(): void {
    if (this.pendingActionType === 'motor_on') {
      this.onToggleMotor(true);
    } else if (this.pendingActionType === 'motor_off') {
      this.onToggleMotor(false);
    } else if (this.pendingActionType === 'mute') {
      this.onMuteAlarm();
    }
  }

  private requestAction(type: string, title: string): void {
    this.pendingActionType = type;
    this.pendingActionTitle = title;
    if (this.isAuthorized) {
      this.executePendingAction();
    } else {
      this.pinDialogController.open();
    }
  }

  build() {
    Column({ space: 10 }) {
      // 模块标题栏（自适应防溢出布局）
      Row() {
        Row({ space: 6 }) {
          Image($r('app.media.ic_terminal'))
            .width(15)
            .height(15)

          Text('执行机构控制台')
            .fontSize(13)
            .fontWeight(FontWeight.Bold)
            .fontColor(Constants.COLOR_WHITE)

          if (this.isAuthorized) {
            Row({ space: 3 }) {
              Image($r('app.media.ic_shield_check'))
                .width(11)
                .height(11)
              Text('AUTH')
                .fontSize(9)
                .fontWeight(FontWeight.Bold)
                .fontColor(Constants.COLOR_GREEN)
                .fontFamily('monospace')
            }
            .padding({ left: 4, right: 4, top: 2, bottom: 2 })
            .backgroundColor('#064E3B44')
            .borderRadius(2)
            .border({ width: 1, color: '#05966955' })
          }
        }

        // 右侧紧凑时延角标与加锁
        Row({ space: 6 }) {
          if (this.isAuthorized) {
            Text('[LOCK]')
              .fontSize(9)
              .fontColor(Constants.COLOR_MUTED)
              .fontFamily('monospace')
              .onClick(() => {
                this.isAuthorized = false;
              })
          }

          Text('RTT<240ms')
            .fontSize(9)
            .fontColor(Constants.COLOR_CYAN)
            .fontFamily('monospace')
            .backgroundColor('#0C2340')
            .padding({ left: 6, right: 6, top: 2, bottom: 2 })
            .borderRadius(2)
            .border({ width: 1, color: '#0284C744' })
        }
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)

      // 控制卡片网格
      Row({ space: 10 }) {
        // 1. 排风电机控制卡片（纯矢量 360° 旋转风扇动画）
        Column() {
          Row() {
            Row({ space: 6 }) {
              Image($r('app.media.ic_fan'))
                .width(16)
                .height(16)
                .rotate({ angle: this.fanRotation })

              Text('排风电机')
                .fontSize(12)
                .fontWeight(FontWeight.Bold)
                .fontColor(Constants.COLOR_WHITE)
            }

            Circle({ width: 6, height: 6 })
              .fill(this.isMotorRunning ? Constants.COLOR_CYAN : Constants.COLOR_MUTED)
          }
          .width('100%')
          .justifyContent(FlexAlign.SpaceBetween)

          Text(this.isMotorRunning ? 'ACTIVE (6000 RPM)' : 'STANDBY (0 RPM)')
            .fontSize(9)
            .fontColor(this.isMotorRunning ? Constants.COLOR_CYAN : Constants.COLOR_MUTED)
            .fontFamily('monospace')
            .margin({ top: 4, bottom: 8 })

          Button(this.isMotorRunning ? '停止电机' : '启动电机')
            .backgroundColor(this.isMotorRunning ? '#DC2626' : '#0284C7')
            .fontColor(Constants.COLOR_WHITE)
            .fontSize(12)
            .fontWeight(FontWeight.Bold)
            .width('100%')
            .height(32)
            .borderRadius(4)
            .onClick(() => {
              this.requestAction(this.isMotorRunning ? 'motor_off' : 'motor_on', this.isMotorRunning ? '停止排风电机' : '启动排风电机');
            })
        }
        .layoutWeight(1)
        .padding(10)
        .backgroundColor('#0A1122')
        .borderRadius(6)
        .border({ width: 1, color: this.isMotorRunning ? Constants.COLOR_CYAN : '#1B2A4A' })

        // 2. 应急消警静音卡片
        Column() {
          Row() {
            Row({ space: 6 }) {
              Image($r('app.media.ic_bell_mute'))
                .width(16)
                .height(16)

              Text('应急消警')
                .fontSize(12)
                .fontWeight(FontWeight.Bold)
                .fontColor(Constants.COLOR_WHITE)
            }

            Circle({ width: 6, height: 6 })
              .fill(this.isAlarmOn ? Constants.COLOR_RED : Constants.COLOR_GREEN)
          }
          .width('100%')
          .justifyContent(FlexAlign.SpaceBetween)

          Text(this.isAlarmOn ? 'CAUTION ACTIVE' : 'NOMINAL SILENT')
            .fontSize(9)
            .fontColor(this.isAlarmOn ? Constants.COLOR_RED : Constants.COLOR_GREEN)
            .fontFamily('monospace')
            .margin({ top: 4, bottom: 8 })

          Button('一键消警')
            .backgroundColor('#1E293B')
            .fontColor(Constants.COLOR_WHITE)
            .fontSize(12)
            .fontWeight(FontWeight.Bold)
            .width('100%')
            .height(32)
            .borderRadius(4)
            .onClick(() => {
              this.requestAction('mute', '应急消警静音与复位');
            })
        }
        .layoutWeight(1)
        .padding(10)
        .backgroundColor('#0A1122')
        .borderRadius(6)
        .border({ width: 1, color: this.isAlarmOn ? Constants.COLOR_RED : '#1B2A4A' })
      }
      .width('100%')
    }
    .width('100%')
    .padding(12)
    .backgroundColor('#0A112299')
    .borderRadius(6)
    .border({ width: 1, color: '#1B2A4A' })
  }
}
