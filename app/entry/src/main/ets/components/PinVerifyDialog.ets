import { Constants } from '../common/Constants';

/**
 * 6 位安全 PIN 码验证弹窗
 */
@CustomDialog
export struct PinVerifyDialog {
  controller: CustomDialogController;
  public actionTitle: string = '执行控制指令';
  public onConfirmed: () => void = () => {};
  @State pinInput: string = '';
  @State errorMessage: string = '';

  build() {
    Column({ space: 16 }) {
      // 弹窗标题
      Row({ space: 8 }) {
        Text('🔒')
          .fontSize(18)
        Text('安全授权验证')
          .fontSize(16)
          .fontWeight(FontWeight.Bold)
          .fontColor(Constants.COLOR_WHITE)
      }
      .width('100%')
      .justifyContent(FlexAlign.Start)

      Text(`您正在操作: 【${this.actionTitle}】\n请输入 6 位测控安全 PIN 码以确认下发`)
        .fontSize(13)
        .fontColor(Constants.COLOR_MUTED)
        .lineHeight(18)
        .width('100%')

      // PIN 码输入框
      TextInput({ placeholder: '••••••', text: this.pinInput })
        .type(InputType.Password)
        .maxLength(6)
        .fontSize(20)
        .fontFamily('monospace')
        .fontColor(Constants.COLOR_WHITE)
        .placeholderColor('#475569')
        .backgroundColor('#0B1120')
        .borderRadius(8)
        .border({ width: 1, color: this.errorMessage ? Constants.COLOR_RED : Constants.COLOR_BORDER })
        .onChange((val: string) => {
          this.pinInput = val;
          this.errorMessage = '';
        })

      if (this.errorMessage.length > 0) {
        Text(this.errorMessage)
          .fontSize(12)
          .fontColor(Constants.COLOR_RED)
          .width('100%')
      }

      // 按钮操作行
      Row({ space: 12 }) {
        Button('取消')
          .backgroundColor('#334155')
          .fontColor(Constants.COLOR_WHITE)
          .fontSize(14)
          .layoutWeight(1)
          .onClick(() => {
            this.controller.close();
          })

        Button('确认授权')
          .backgroundColor(Constants.COLOR_CYAN)
          .fontColor('#0A0E1A')
          .fontWeight(FontWeight.Bold)
          .fontSize(14)
          .layoutWeight(1)
          .onClick(() => {
            if (this.pinInput === Constants.DEFAULT_PIN) {
              this.controller.close();
              this.onConfirmed();
            } else {
              this.errorMessage = 'PIN 码错误，请重新输入';
            }
          })
      }
      .width('100%')
    }
    .padding(20)
    .backgroundColor(Constants.COLOR_BG_PANEL)
    .borderRadius(16)
    .border({ width: 1, color: Constants.COLOR_BORDER })
    .width('90%')
  }
}
