if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface ControlSection_Params {
    isMotorRunning?: boolean;
    isAlarmOn?: boolean;
    onToggleMotor?: (turnOn: boolean) => void;
    onMuteAlarm?: () => void;
    pendingActionTitle?: string;
    pendingActionType?: string;
    pinDialogController?: CustomDialogController;
}
import { Constants } from "@bundle:com.spacestation.monitor/entry/ets/common/Constants";
import { PinVerifyDialog } from "@bundle:com.spacestation.monitor/entry/ets/components/PinVerifyDialog";
export class ControlSection extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__isMotorRunning = new SynchedPropertySimpleOneWayPU(params.isMotorRunning, this, "isMotorRunning");
        this.__isAlarmOn = new SynchedPropertySimpleOneWayPU(params.isAlarmOn, this, "isAlarmOn");
        this.onToggleMotor = () => { };
        this.onMuteAlarm = () => { };
        this.__pendingActionTitle = new ObservedPropertySimplePU('执行控制指令', this, "pendingActionTitle");
        this.pendingActionType = 'motor_on';
        this.pinDialogController = new CustomDialogController({
            builder: () => {
                let jsDialog = new PinVerifyDialog(this, {
                    actionTitle: this.pendingActionTitle,
                    onConfirmed: () => {
                        this.executePendingAction();
                    }
                }, undefined, -1, () => { }, { page: "entry/src/main/ets/components/ControlSection.ets", line: 18, col: 14 });
                jsDialog.setController(this.pinDialogController);
                ViewPU.create(jsDialog);
                let paramsLambda = () => {
                    return {
                        actionTitle: this.pendingActionTitle,
                        onConfirmed: () => {
                            this.executePendingAction();
                        }
                    };
                };
                jsDialog.paramsGenerator_ = paramsLambda;
            },
            autoCancel: true,
            customStyle: true
        }, this);
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ControlSection_Params) {
        if (params.onToggleMotor !== undefined) {
            this.onToggleMotor = params.onToggleMotor;
        }
        if (params.onMuteAlarm !== undefined) {
            this.onMuteAlarm = params.onMuteAlarm;
        }
        if (params.pendingActionTitle !== undefined) {
            this.pendingActionTitle = params.pendingActionTitle;
        }
        if (params.pendingActionType !== undefined) {
            this.pendingActionType = params.pendingActionType;
        }
        if (params.pinDialogController !== undefined) {
            this.pinDialogController = params.pinDialogController;
        }
    }
    updateStateVars(params: ControlSection_Params) {
        this.__isMotorRunning.reset(params.isMotorRunning);
        this.__isAlarmOn.reset(params.isAlarmOn);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__isMotorRunning.purgeDependencyOnElmtId(rmElmtId);
        this.__isAlarmOn.purgeDependencyOnElmtId(rmElmtId);
        this.__pendingActionTitle.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__isMotorRunning.aboutToBeDeleted();
        this.__isAlarmOn.aboutToBeDeleted();
        this.__pendingActionTitle.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __isMotorRunning: SynchedPropertySimpleOneWayPU<boolean>;
    get isMotorRunning() {
        return this.__isMotorRunning.get();
    }
    set isMotorRunning(newValue: boolean) {
        this.__isMotorRunning.set(newValue);
    }
    private __isAlarmOn: SynchedPropertySimpleOneWayPU<boolean>;
    get isAlarmOn() {
        return this.__isAlarmOn.get();
    }
    set isAlarmOn(newValue: boolean) {
        this.__isAlarmOn.set(newValue);
    }
    public onToggleMotor: (turnOn: boolean) => void;
    public onMuteAlarm: () => void;
    private __pendingActionTitle: ObservedPropertySimplePU<string>;
    get pendingActionTitle() {
        return this.__pendingActionTitle.get();
    }
    set pendingActionTitle(newValue: string) {
        this.__pendingActionTitle.set(newValue);
    }
    private pendingActionType: string;
    private pinDialogController: CustomDialogController;
    private executePendingAction(): void {
        if (this.pendingActionType === 'motor_on') {
            this.onToggleMotor(true);
        }
        else if (this.pendingActionType === 'motor_off') {
            this.onToggleMotor(false);
        }
        else if (this.pendingActionType === 'mute') {
            this.onMuteAlarm();
        }
    }
    private requestAction(type: string, title: string): void {
        this.pendingActionType = type;
        this.pendingActionTitle = title;
        this.pinDialogController.open();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
            Column.width('100%');
            Column.padding(12);
            Column.backgroundColor(Constants.COLOR_BG_PANEL);
            Column.borderRadius(10);
            Column.border({ width: 1, color: Constants.COLOR_BORDER });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 模块标题
            Row.create();
            // 模块标题
            Row.width('100%');
            // 模块标题
            Row.justifyContent(FlexAlign.SpaceBetween);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('⚡ 空间站执行机构控制台');
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Constants.COLOR_WHITE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('双向响应 < 240ms');
            Text.fontSize(11);
            Text.fontColor(Constants.COLOR_CYAN);
            Text.fontFamily('monospace');
        }, Text);
        Text.pop();
        // 模块标题
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 控制卡片网格
            Row.create({ space: 10 });
            // 控制卡片网格
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 排风电机控制卡片
            Column.create();
            // 排风电机控制卡片
            Column.layoutWeight(1);
            // 排风电机控制卡片
            Column.padding(10);
            // 排风电机控制卡片
            Column.backgroundColor(Constants.COLOR_BG_CARD);
            // 排风电机控制卡片
            Column.borderRadius(8);
            // 排风电机控制卡片
            Column.border({ width: 1, color: this.isMotorRunning ? Constants.COLOR_CYAN : Constants.COLOR_BORDER });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.justifyContent(FlexAlign.SpaceBetween);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🌀 排风通风电机');
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Constants.COLOR_WHITE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Circle.create({ width: 6, height: 6 });
            Circle.fill(this.isMotorRunning ? Constants.COLOR_CYAN : Constants.COLOR_MUTED);
        }, Circle);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.isMotorRunning ? '高速运转 (6000RPM)' : '待机停转 (STANDBY)');
            Text.fontSize(11);
            Text.fontColor(this.isMotorRunning ? Constants.COLOR_CYAN : Constants.COLOR_MUTED);
            Text.fontFamily('monospace');
            Text.margin({ top: 4, bottom: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.isMotorRunning ? '停止电机' : '启动电机');
            Button.backgroundColor(this.isMotorRunning ? '#EF4444' : '#0EA5E9');
            Button.fontColor(Constants.COLOR_WHITE);
            Button.fontSize(12);
            Button.width('100%');
            Button.height(32);
            Button.borderRadius(6);
            Button.onClick(() => {
                this.requestAction(this.isMotorRunning ? 'motor_off' : 'motor_on', this.isMotorRunning ? '停止排风电机' : '启动排风电机');
            });
        }, Button);
        Button.pop();
        // 排风电机控制卡片
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 应急消警静音卡片
            Column.create();
            // 应急消警静音卡片
            Column.layoutWeight(1);
            // 应急消警静音卡片
            Column.padding(10);
            // 应急消警静音卡片
            Column.backgroundColor(Constants.COLOR_BG_CARD);
            // 应急消警静音卡片
            Column.borderRadius(8);
            // 应急消警静音卡片
            Column.border({ width: 1, color: this.isAlarmOn ? Constants.COLOR_RED : Constants.COLOR_BORDER });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.justifyContent(FlexAlign.SpaceBetween);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🔕 应急消警静音');
            Text.fontSize(12);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Constants.COLOR_WHITE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Circle.create({ width: 6, height: 6 });
            Circle.fill(this.isAlarmOn ? Constants.COLOR_RED : Constants.COLOR_GREEN);
        }, Circle);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.isAlarmOn ? '警报触发中 (ALARM)' : '系统静默 (NORMAL)');
            Text.fontSize(11);
            Text.fontColor(this.isAlarmOn ? Constants.COLOR_RED : Constants.COLOR_GREEN);
            Text.fontFamily('monospace');
            Text.margin({ top: 4, bottom: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('一键消警静音');
            Button.backgroundColor('#334155');
            Button.fontColor(Constants.COLOR_WHITE);
            Button.fontSize(12);
            Button.width('100%');
            Button.height(32);
            Button.borderRadius(6);
            Button.onClick(() => {
                this.requestAction('mute', '应急消警静音与复位');
            });
        }, Button);
        Button.pop();
        // 应急消警静音卡片
        Column.pop();
        // 控制卡片网格
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
