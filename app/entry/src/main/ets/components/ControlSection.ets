import { Constants } from '../common/Constants';
import { PinVerifyDialog } from './PinVerifyDialog';

export class FanSpeedOption {
  public id: number = 0;
  public label: string = '';
  constructor(id: number, label: string) {
    this.id = id;
    this.label = label;
  }
}

/**
 * 掌上极速双向控制台组件（五档风机调速旋钮 + 远程系统重启 + 纯矢量风扇 360° 高速旋转动效 + PIN 保护）
 */
@Component
export struct ControlSection {
  @Prop isMotorRunning: boolean;
  @Prop isAlarmOn: boolean;
  @Prop fanSpeed: number = 4; // 0=关, 1=弱, 2=中, 3=强, 4=AUTO
  public onToggleMotor: (turnOn: boolean) => void = () => {};
  public onSetFanSpeed: (speed: number) => void = () => {};
  public onMuteAlarm: () => void = () => {};
  public onRebootSystem: () => void = () => {};

  @State isAuthorized: boolean = false;
  @State fanRotation: number = 0;
  @State pendingActionTitle: string = '执行控制指令';
  private pendingActionType: string = 'motor_on';
  private targetSpeed: number = 4;
  private fanTimerId: number = -1;

  private speedOptions: FanSpeedOption[] = [
    new FanSpeedOption(0, '0:停机'),
    new FanSpeedOption(1, '1:30%'),
    new FanSpeedOption(2, '2:65%'),
    new FanSpeedOption(3, '3:100%'),
    new FanSpeedOption(4, 'AUTO')
  ];

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
    // 动态矢量风扇根据档位改变旋转速度
    this.fanTimerId = setInterval(() => {
      if (this.isMotorRunning) {
        let step = 30;
        if (this.fanSpeed === 1) step = 15;
        else if (this.fanSpeed === 2) step = 28;
        else if (this.fanSpeed === 3) step = 48;
        else if (this.fanSpeed === 4) step = 32;
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

  private executePendingAction(): void {
    if (this.pendingActionType === 'motor_on') {
      this.onToggleMotor(true);
    } else if (this.pendingActionType === 'motor_off') {
      this.onToggleMotor(false);
    } else if (this.pendingActionType === 'mute') {
      this.onMuteAlarm();
    } else if (this.pendingActionType === 'set_speed') {
      this.onSetFanSpeed(this.targetSpeed);
    } else if (this.pendingActionType === 'reboot') {
      this.onRebootSystem();
    }
  }

  private requestAction(type: string, title: string, speedVal: number = 4): void {
    this.pendingActionType = type;
    this.pendingActionTitle = title;
    this.targetSpeed = speedVal;
    if (this.isAuthorized) {
      this.executePendingAction();
    } else {
      this.pinDialogController.open();
    }
  }

  build() {
    Column({ space: 10 }) {
      // 模块标题栏
      Row() {
        Row({ space: 6 }) {
          Image($r('app.media.ic_terminal'))
            .width(15)
            .height(15)

          Text('执行机构与多档测控台')
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

        // 右侧状态与重置授权
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

      // 五档风机调速选择栏
      Column({ space: 6 }) {
        Row() {
          Row({ space: 6 }) {
            Image($r('app.media.ic_fan'))
              .width(15)
              .height(15)
              .rotate({ angle: this.fanRotation })

            Text('风机转速档位 (PWM 硬件驱动)')
              .fontSize(12)
              .fontWeight(FontWeight.Bold)
              .fontColor(Constants.COLOR_WHITE)
          }

          Text(this.fanSpeed === 4 ? 'AUTO 温控' : (this.fanSpeed === 0 ? '已停机' : `L${this.fanSpeed} 档`))
            .fontSize(10)
            .fontWeight(FontWeight.Bold)
            .fontColor(this.isMotorRunning ? Constants.COLOR_CYAN : Constants.COLOR_MUTED)
            .fontFamily('monospace')
        }
        .width('100%')
        .justifyContent(FlexAlign.SpaceBetween)

        // 5 档选择胶囊
        Row({ space: 6 }) {
          ForEach(this.speedOptions, (item: FanSpeedOption) => {
            Button(item.label)
              .layoutWeight(1)
              .height(28)
              .fontSize(10)
              .fontWeight(FontWeight.Bold)
              .fontColor(this.fanSpeed === item.id ? '#000' : Constants.COLOR_WHITE)
              .backgroundColor(this.fanSpeed === item.id ? Constants.COLOR_CYAN : '#1B2A4A')
              .borderRadius(4)
              .border({ width: 1, color: this.fanSpeed === item.id ? '#FFF' : '#2A3F6B' })
              .onClick(() => {
                this.requestAction('set_speed', `切换风机档位至 ${item.label}`, item.id);
              })
          })
        }
        .width('100%')
      }
      .width('100%')
      .padding(10)
      .backgroundColor('#0A1122')
      .borderRadius(6)
      .border({ width: 1, color: '#1B2A4A' })

      // 下排控制按钮组：消警与远程系统重启
      Row({ space: 10 }) {
        // 应急消警
        Button('一键消警与复位')
          .layoutWeight(1)
          .height(34)
          .fontSize(12)
          .fontWeight(FontWeight.Bold)
          .fontColor(Constants.COLOR_WHITE)
          .backgroundColor('#1E293B')
          .borderRadius(4)
          .border({ width: 1, color: this.isAlarmOn ? Constants.COLOR_RED : '#334155' })
          .onClick(() => {
            this.requestAction('mute', '应急消警静音与复位');
          })

        // 远程软重启 (b13_reboot)
        Button('远程系统安全重启')
          .layoutWeight(1)
          .height(34)
          .fontSize(12)
          .fontWeight(FontWeight.Bold)
          .fontColor(Constants.COLOR_WHITE)
          .backgroundColor('#450A0A')
          .borderRadius(4)
          .border({ width: 1, color: '#DC2626' })
          .onClick(() => {
            this.requestAction('reboot', '触发开发板远程系统软重启 (RebootDevice)');
          })
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
