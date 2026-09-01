import { Constants } from '../common/Constants';
import { PinVerifyDialog } from './PinVerifyDialog';

/**
 * 掌上极速双向控制台组件
 */
@Component
export struct ControlSection {
  @Prop isMotorRunning: boolean;
  @Prop isAlarmOn: boolean;
  public onToggleMotor: (turnOn: boolean) => void = () => {};
  public onMuteAlarm: () => void = () => {};

  @State pendingActionTitle: string = '执行控制指令';
  private pendingActionType: string = 'motor_on';

  private pinDialogController: CustomDialogController = new CustomDialogController({
    builder: PinVerifyDialog({
      actionTitle: this.pendingActionTitle,
      onConfirmed: () => {
        this.executePendingAction();
      }
    }),
    autoCancel: true,
    customStyle: true
  });

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
    this.pinDialogController.open();
  }

  build() {
    Column({ space: 10 }) {
      // 模块标题
      Row() {
        Text('⚡ 空间站执行机构控制台')
          .fontSize(14)
          .fontWeight(FontWeight.Bold)
          .fontColor(Constants.COLOR_WHITE)

        Text('双向响应 < 240ms')
          .fontSize(11)
          .fontColor(Constants.COLOR_CYAN)
          .fontFamily('monospace')
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)

      // 控制卡片网格
      Row({ space: 10 }) {
        // 排风电机控制卡片
        Column() {
          Row() {
            Text('🌀 排风通风电机')
              .fontSize(12)
              .fontWeight(FontWeight.Bold)
              .fontColor(Constants.COLOR_WHITE)

            Circle({ width: 6, height: 6 })
              .fill(this.isMotorRunning ? Constants.COLOR_CYAN : Constants.COLOR_MUTED)
          }
          .width('100%')
          .justifyContent(FlexAlign.SpaceBetween)

          Text(this.isMotorRunning ? '高速运转 (6000RPM)' : '待机停转 (STANDBY)')
            .fontSize(11)
            .fontColor(this.isMotorRunning ? Constants.COLOR_CYAN : Constants.COLOR_MUTED)
            .fontFamily('monospace')
            .margin({ top: 4, bottom: 8 })

          Button(this.isMotorRunning ? '停止电机' : '启动电机')
            .backgroundColor(this.isMotorRunning ? '#EF4444' : '#0EA5E9')
            .fontColor(Constants.COLOR_WHITE)
            .fontSize(12)
            .width('100%')
            .height(32)
            .borderRadius(6)
            .onClick(() => {
              this.requestAction(this.isMotorRunning ? 'motor_off' : 'motor_on', this.isMotorRunning ? '停止排风电机' : '启动排风电机');
            })
        }
        .layoutWeight(1)
        .padding(10)
        .backgroundColor(Constants.COLOR_BG_CARD)
        .borderRadius(8)
        .border({ width: 1, color: this.isMotorRunning ? Constants.COLOR_CYAN : Constants.COLOR_BORDER })

        // 应急消警静音卡片
        Column() {
          Row() {
            Text('🔕 应急消警静音')
              .fontSize(12)
              .fontWeight(FontWeight.Bold)
              .fontColor(Constants.COLOR_WHITE)

            Circle({ width: 6, height: 6 })
              .fill(this.isAlarmOn ? Constants.COLOR_RED : Constants.COLOR_GREEN)
          }
          .width('100%')
          .justifyContent(FlexAlign.SpaceBetween)

          Text(this.isAlarmOn ? '警报触发中 (ALARM)' : '系统静默 (NORMAL)')
            .fontSize(11)
            .fontColor(this.isAlarmOn ? Constants.COLOR_RED : Constants.COLOR_GREEN)
            .fontFamily('monospace')
            .margin({ top: 4, bottom: 8 })

          Button('一键消警静音')
            .backgroundColor('#334155')
            .fontColor(Constants.COLOR_WHITE)
            .fontSize(12)
            .width('100%')
            .height(32)
            .borderRadius(6)
            .onClick(() => {
              this.requestAction('mute', '应急消警静音与复位');
            })
        }
        .layoutWeight(1)
        .padding(10)
        .backgroundColor(Constants.COLOR_BG_CARD)
        .borderRadius(8)
        .border({ width: 1, color: this.isAlarmOn ? Constants.COLOR_RED : Constants.COLOR_BORDER })
      }
      .width('100%')
    }
    .width('100%')
    .padding(12)
    .backgroundColor(Constants.COLOR_BG_PANEL)
    .borderRadius(10)
    .border({ width: 1, color: Constants.COLOR_BORDER })
  }
}
