if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface PinVerifyDialog_Params {
    controller?: CustomDialogController;
    actionTitle?: string;
    onConfirmed?: () => void;
    pinInput?: string;
    errorMessage?: string;
}
import { Constants } from "@bundle:com.spacestation.monitor/entry/ets/common/Constants";
export class PinVerifyDialog extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.controller = undefined;
        this.actionTitle = '执行控制指令';
        this.onConfirmed = () => { };
        this.__pinInput = new ObservedPropertySimplePU('', this, "pinInput");
        this.__errorMessage = new ObservedPropertySimplePU('', this, "errorMessage");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: PinVerifyDialog_Params) {
        if (params.controller !== undefined) {
            this.controller = params.controller;
        }
        if (params.actionTitle !== undefined) {
            this.actionTitle = params.actionTitle;
        }
        if (params.onConfirmed !== undefined) {
            this.onConfirmed = params.onConfirmed;
        }
        if (params.pinInput !== undefined) {
            this.pinInput = params.pinInput;
        }
        if (params.errorMessage !== undefined) {
            this.errorMessage = params.errorMessage;
        }
    }
    updateStateVars(params: PinVerifyDialog_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__pinInput.purgeDependencyOnElmtId(rmElmtId);
        this.__errorMessage.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__pinInput.aboutToBeDeleted();
        this.__errorMessage.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private controller: CustomDialogController;
    setController(ctr: CustomDialogController) {
        this.controller = ctr;
    }
    public actionTitle: string;
    public onConfirmed: () => void;
    private __pinInput: ObservedPropertySimplePU<string>;
    get pinInput() {
        return this.__pinInput.get();
    }
    set pinInput(newValue: string) {
        this.__pinInput.set(newValue);
    }
    private __errorMessage: ObservedPropertySimplePU<string>;
    get errorMessage() {
        return this.__errorMessage.get();
    }
    set errorMessage(newValue: string) {
        this.__errorMessage.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.padding(20);
            Column.backgroundColor(Constants.COLOR_BG_PANEL);
            Column.borderRadius(16);
            Column.border({ width: 1, color: Constants.COLOR_BORDER });
            Column.width('90%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 弹窗标题
            Row.create({ space: 8 });
            // 弹窗标题
            Row.width('100%');
            // 弹窗标题
            Row.justifyContent(FlexAlign.Start);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🔒');
            Text.fontSize(18);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('安全授权验证');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Constants.COLOR_WHITE);
        }, Text);
        Text.pop();
        // 弹窗标题
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`您正在操作: 【${this.actionTitle}】\n请输入 6 位测控安全 PIN 码以确认下发`);
            Text.fontSize(13);
            Text.fontColor(Constants.COLOR_MUTED);
            Text.lineHeight(18);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // PIN 码输入框
            TextInput.create({ placeholder: '••••••', text: this.pinInput });
            // PIN 码输入框
            TextInput.type(InputType.Password);
            // PIN 码输入框
            TextInput.maxLength(6);
            // PIN 码输入框
            TextInput.fontSize(20);
            // PIN 码输入框
            TextInput.fontFamily('monospace');
            // PIN 码输入框
            TextInput.fontColor(Constants.COLOR_WHITE);
            // PIN 码输入框
            TextInput.placeholderColor('#475569');
            // PIN 码输入框
            TextInput.backgroundColor('#0B1120');
            // PIN 码输入框
            TextInput.borderRadius(8);
            // PIN 码输入框
            TextInput.border({ width: 1, color: this.errorMessage ? Constants.COLOR_RED : Constants.COLOR_BORDER });
            // PIN 码输入框
            TextInput.onChange((val: string) => {
                this.pinInput = val;
                this.errorMessage = '';
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.errorMessage.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.errorMessage);
                        Text.fontSize(12);
                        Text.fontColor(Constants.COLOR_RED);
                        Text.width('100%');
                    }, Text);
                    Text.pop();
                });
            }
            // 按钮操作行
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 按钮操作行
            Row.create({ space: 12 });
            // 按钮操作行
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('取消');
            Button.backgroundColor('#334155');
            Button.fontColor(Constants.COLOR_WHITE);
            Button.fontSize(14);
            Button.layoutWeight(1);
            Button.onClick(() => {
                this.controller.close();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('确认授权');
            Button.backgroundColor(Constants.COLOR_CYAN);
            Button.fontColor('#0A0E1A');
            Button.fontWeight(FontWeight.Bold);
            Button.fontSize(14);
            Button.layoutWeight(1);
            Button.onClick(() => {
                if (this.pinInput === Constants.DEFAULT_PIN) {
                    this.controller.close();
                    this.onConfirmed();
                }
                else {
                    this.errorMessage = 'PIN 码错误，请重新输入';
                }
            });
        }, Button);
        Button.pop();
        // 按钮操作行
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
