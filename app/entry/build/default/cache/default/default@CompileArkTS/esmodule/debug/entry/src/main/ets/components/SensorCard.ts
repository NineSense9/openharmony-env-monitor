if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface SensorCard_Params {
    label?: string;
    valueStr?: string;
    unit?: string;
    channel?: string;
    isAlarm?: boolean;
    icon?: string;
}
import { Constants } from "@bundle:com.spacestation.monitor/entry/ets/common/Constants";
export class SensorCard extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__label = new SynchedPropertySimpleOneWayPU(params.label, this, "label");
        this.__valueStr = new SynchedPropertySimpleOneWayPU(params.valueStr, this, "valueStr");
        this.__unit = new SynchedPropertySimpleOneWayPU(params.unit, this, "unit");
        this.__channel = new SynchedPropertySimpleOneWayPU(params.channel, this, "channel");
        this.__isAlarm = new SynchedPropertySimpleOneWayPU(params.isAlarm, this, "isAlarm");
        this.__icon = new SynchedPropertySimpleOneWayPU(params.icon, this, "icon");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SensorCard_Params) {
    }
    updateStateVars(params: SensorCard_Params) {
        this.__label.reset(params.label);
        this.__valueStr.reset(params.valueStr);
        this.__unit.reset(params.unit);
        this.__channel.reset(params.channel);
        this.__isAlarm.reset(params.isAlarm);
        this.__icon.reset(params.icon);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__label.purgeDependencyOnElmtId(rmElmtId);
        this.__valueStr.purgeDependencyOnElmtId(rmElmtId);
        this.__unit.purgeDependencyOnElmtId(rmElmtId);
        this.__channel.purgeDependencyOnElmtId(rmElmtId);
        this.__isAlarm.purgeDependencyOnElmtId(rmElmtId);
        this.__icon.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__label.aboutToBeDeleted();
        this.__valueStr.aboutToBeDeleted();
        this.__unit.aboutToBeDeleted();
        this.__channel.aboutToBeDeleted();
        this.__isAlarm.aboutToBeDeleted();
        this.__icon.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __label: SynchedPropertySimpleOneWayPU<string>;
    get label() {
        return this.__label.get();
    }
    set label(newValue: string) {
        this.__label.set(newValue);
    }
    private __valueStr: SynchedPropertySimpleOneWayPU<string>;
    get valueStr() {
        return this.__valueStr.get();
    }
    set valueStr(newValue: string) {
        this.__valueStr.set(newValue);
    }
    private __unit: SynchedPropertySimpleOneWayPU<string>;
    get unit() {
        return this.__unit.get();
    }
    set unit(newValue: string) {
        this.__unit.set(newValue);
    }
    private __channel: SynchedPropertySimpleOneWayPU<string>;
    get channel() {
        return this.__channel.get();
    }
    set channel(newValue: string) {
        this.__channel.set(newValue);
    }
    private __isAlarm: SynchedPropertySimpleOneWayPU<boolean>;
    get isAlarm() {
        return this.__isAlarm.get();
    }
    set isAlarm(newValue: boolean) {
        this.__isAlarm.set(newValue);
    }
    private __icon: SynchedPropertySimpleOneWayPU<string>;
    get icon() {
        return this.__icon.get();
    }
    set icon(newValue: string) {
        this.__icon.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('48%');
            Column.padding(12);
            Column.backgroundColor(Constants.COLOR_BG_CARD);
            Column.borderRadius(10);
            Column.border({
                width: 1,
                color: this.isAlarm ? Constants.COLOR_RED : Constants.COLOR_BORDER
            });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 头部：通道标号与图标
            Row.create();
            // 头部：通道标号与图标
            Row.width('100%');
            // 头部：通道标号与图标
            Row.justifyContent(FlexAlign.SpaceBetween);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.channel);
            Text.fontSize(10);
            Text.fontColor(Constants.COLOR_MUTED);
            Text.fontFamily('monospace');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.icon);
            Text.fontSize(14);
        }, Text);
        Text.pop();
        // 头部：通道标号与图标
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 中部：指标数值
            Row.create({ space: 2 });
            // 中部：指标数值
            Row.alignItems(VerticalAlign.Bottom);
            // 中部：指标数值
            Row.margin({ top: 8, bottom: 4 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.valueStr);
            Text.fontSize(26);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.isAlarm ? Constants.COLOR_RED : Constants.COLOR_WHITE);
            Text.fontFamily('monospace');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.unit);
            Text.fontSize(13);
            Text.fontColor(this.isAlarm ? Constants.COLOR_RED : Constants.COLOR_CYAN);
            Text.margin({ bottom: 4 });
        }, Text);
        Text.pop();
        // 中部：指标数值
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 底部：参数名称与状态提示
            Row.create();
            // 底部：参数名称与状态提示
            Row.width('100%');
            // 底部：参数名称与状态提示
            Row.justifyContent(FlexAlign.SpaceBetween);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.label);
            Text.fontSize(12);
            Text.fontColor(Constants.COLOR_MUTED);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.isAlarm ? '越限告警' : '正常');
            Text.fontSize(10);
            Text.fontColor(this.isAlarm ? Constants.COLOR_RED : Constants.COLOR_GREEN);
        }, Text);
        Text.pop();
        // 底部：参数名称与状态提示
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
