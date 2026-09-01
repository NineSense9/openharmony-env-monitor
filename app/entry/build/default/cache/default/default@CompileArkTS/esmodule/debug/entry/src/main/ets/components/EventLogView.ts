if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface EventLogView_Params {
    logs?: EventLogItem[];
}
import { Constants } from "@bundle:com.spacestation.monitor/entry/ets/common/Constants";
import type { EventLogItem } from '../model/TelemetryModel';
export class EventLogView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__logs = new SynchedPropertyObjectOneWayPU(params.logs, this, "logs");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: EventLogView_Params) {
    }
    updateStateVars(params: EventLogView_Params) {
        this.__logs.reset(params.logs);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__logs.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__logs.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __logs: SynchedPropertySimpleOneWayPU<EventLogItem[]>;
    get logs() {
        return this.__logs.get();
    }
    set logs(newValue: EventLogItem[]) {
        this.__logs.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.padding(12);
            Column.backgroundColor(Constants.COLOR_BG_PANEL);
            Column.borderRadius(10);
            Column.border({ width: 1, color: Constants.COLOR_BORDER });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.justifyContent(FlexAlign.SpaceBetween);
            Row.margin({ bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('📋 测控事件实时流水');
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Constants.COLOR_WHITE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('最近 20 条');
            Text.fontSize(10);
            Text.fontColor(Constants.COLOR_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            List.create({ space: 6 });
            List.height(100);
            List.width('100%');
        }, List);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                {
                    const itemCreation = (elmtId, isInitialRender) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                        ListItem.create(deepRenderFunction, true);
                        if (!isInitialRender) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(deepRenderFunction, true);
                    };
                    const deepRenderFunction = (elmtId, isInitialRender) => {
                        itemCreation(elmtId, isInitialRender);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create({ space: 8 });
                            Row.width('100%');
                            Row.padding({ left: 6, right: 6, top: 4, bottom: 4 });
                            Row.backgroundColor('#0B1120');
                            Row.borderRadius(4);
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(`[${item.timestamp}]`);
                            Text.fontSize(10);
                            Text.fontColor(Constants.COLOR_MUTED);
                            Text.fontFamily('monospace');
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(item.message);
                            Text.fontSize(11);
                            Text.fontColor(item.level === 'alarm' ? Constants.COLOR_RED : (item.level === 'warn' ? Constants.COLOR_YELLOW : Constants.COLOR_CYAN));
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        Row.pop();
                        ListItem.pop();
                    };
                    this.observeComponentCreation2(itemCreation2, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(elmtId, this.logs, forEachItemGenFunction, (item: EventLogItem) => item.id.toString(), false, false);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
