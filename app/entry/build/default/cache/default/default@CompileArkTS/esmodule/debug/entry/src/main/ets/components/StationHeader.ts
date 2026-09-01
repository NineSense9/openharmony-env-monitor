if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface StationHeader_Params {
    isConnected?: boolean;
    isCached?: boolean;
    lastSyncTime?: string;
    currentTimeStr?: string;
}
import { Constants } from "@bundle:com.spacestation.monitor/entry/ets/common/Constants";
export class StationHeader extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__isConnected = new SynchedPropertySimpleOneWayPU(params.isConnected, this, "isConnected");
        this.__isCached = new SynchedPropertySimpleOneWayPU(params.isCached, this, "isCached");
        this.__lastSyncTime = new SynchedPropertySimpleOneWayPU(params.lastSyncTime, this, "lastSyncTime");
        this.__currentTimeStr = new SynchedPropertySimpleOneWayPU(params.currentTimeStr, this, "currentTimeStr");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: StationHeader_Params) {
    }
    updateStateVars(params: StationHeader_Params) {
        this.__isConnected.reset(params.isConnected);
        this.__isCached.reset(params.isCached);
        this.__lastSyncTime.reset(params.lastSyncTime);
        this.__currentTimeStr.reset(params.currentTimeStr);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__isConnected.purgeDependencyOnElmtId(rmElmtId);
        this.__isCached.purgeDependencyOnElmtId(rmElmtId);
        this.__lastSyncTime.purgeDependencyOnElmtId(rmElmtId);
        this.__currentTimeStr.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__isConnected.aboutToBeDeleted();
        this.__isCached.aboutToBeDeleted();
        this.__lastSyncTime.aboutToBeDeleted();
        this.__currentTimeStr.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __isConnected: SynchedPropertySimpleOneWayPU<boolean>;
    get isConnected() {
        return this.__isConnected.get();
    }
    set isConnected(newValue: boolean) {
        this.__isConnected.set(newValue);
    }
    private __isCached: SynchedPropertySimpleOneWayPU<boolean>;
    get isCached() {
        return this.__isCached.get();
    }
    set isCached(newValue: boolean) {
        this.__isCached.set(newValue);
    }
    private __lastSyncTime: SynchedPropertySimpleOneWayPU<string>;
    get lastSyncTime() {
        return this.__lastSyncTime.get();
    }
    set lastSyncTime(newValue: string) {
        this.__lastSyncTime.set(newValue);
    }
    private __currentTimeStr: SynchedPropertySimpleOneWayPU<string>;
    get currentTimeStr() {
        return this.__currentTimeStr.get();
    }
    set currentTimeStr(newValue: string) {
        this.__currentTimeStr.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Column.backgroundColor(Constants.COLOR_BG_PANEL);
            Column.border({ width: { bottom: 1 }, color: Constants.COLOR_BORDER });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 空间站编号与在线呼吸指示
            Row.create();
            // 空间站编号与在线呼吸指示
            Row.width('100%');
            // 空间站编号与在线呼吸指示
            Row.justifyContent(FlexAlign.SpaceBetween);
            // 空间站编号与在线呼吸指示
            Row.alignItems(VerticalAlign.Center);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 6 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 空间站航天徽章
            Text.create('🛰️');
            // 空间站航天徽章
            Text.fontSize(20);
        }, Text);
        // 空间站航天徽章
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('CSS-CABIN-01');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Constants.COLOR_WHITE);
            Text.fontFamily('monospace');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 状态徽章
            Row.create({ space: 4 });
            // 状态徽章
            Row.padding({ left: 8, right: 8, top: 4, bottom: 4 });
            // 状态徽章
            Row.backgroundColor('#1E293B');
            // 状态徽章
            Row.borderRadius(12);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Circle.create({ width: 8, height: 8 });
            Circle.fill(this.isCached ? Constants.COLOR_YELLOW : (this.isConnected ? Constants.COLOR_GREEN : Constants.COLOR_RED));
        }, Circle);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.isCached ? `CACHED (${this.lastSyncTime})` : (this.isConnected ? 'LIVE LINK' : 'OFFLINE'));
            Text.fontSize(11);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(this.isCached ? Constants.COLOR_YELLOW : (this.isConnected ? Constants.COLOR_GREEN : Constants.COLOR_RED));
            Text.fontFamily('monospace');
        }, Text);
        Text.pop();
        // 状态徽章
        Row.pop();
        // 空间站编号与在线呼吸指示
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 第二行：IP 与时钟
            Row.create();
            // 第二行：IP 与时钟
            Row.width('100%');
            // 第二行：IP 与时钟
            Row.justifyContent(FlexAlign.SpaceBetween);
            // 第二行：IP 与时钟
            Row.margin({ top: 6 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`TARGET IP: 192.168.9.51`);
            Text.fontSize(11);
            Text.fontColor(Constants.COLOR_CYAN);
            Text.fontFamily('monospace');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`BJT: ${this.currentTimeStr}`);
            Text.fontSize(11);
            Text.fontColor(Constants.COLOR_MUTED);
            Text.fontFamily('monospace');
        }, Text);
        Text.pop();
        // 第二行：IP 与时钟
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
