if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    viewModel?: StationViewModel;
    refreshTrigger?: number;
}
import { StationViewModel } from "@bundle:com.spacestation.monitor/entry/ets/viewmodel/StationViewModel";
import { Constants } from "@bundle:com.spacestation.monitor/entry/ets/common/Constants";
import { StationHeader } from "@bundle:com.spacestation.monitor/entry/ets/components/StationHeader";
import { SensorCard } from "@bundle:com.spacestation.monitor/entry/ets/components/SensorCard";
import { ControlSection } from "@bundle:com.spacestation.monitor/entry/ets/components/ControlSection";
import { TrendChart } from "@bundle:com.spacestation.monitor/entry/ets/components/TrendChart";
import { EventLogView } from "@bundle:com.spacestation.monitor/entry/ets/components/EventLogView";
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__viewModel = new ObservedPropertyObjectPU(new StationViewModel(), this, "viewModel");
        this.__refreshTrigger = new ObservedPropertySimplePU(0, this, "refreshTrigger");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Index_Params) {
        if (params.viewModel !== undefined) {
            this.viewModel = params.viewModel;
        }
        if (params.refreshTrigger !== undefined) {
            this.refreshTrigger = params.refreshTrigger;
        }
    }
    updateStateVars(params: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__viewModel.purgeDependencyOnElmtId(rmElmtId);
        this.__refreshTrigger.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__viewModel.aboutToBeDeleted();
        this.__refreshTrigger.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __viewModel: ObservedPropertyObjectPU<StationViewModel>;
    get viewModel() {
        return this.__viewModel.get();
    }
    set viewModel(newValue: StationViewModel) {
        this.__viewModel.set(newValue);
    }
    private __refreshTrigger: ObservedPropertySimplePU<number>;
    get refreshTrigger() {
        return this.__refreshTrigger.get();
    }
    set refreshTrigger(newValue: number) {
        this.__refreshTrigger.set(newValue);
    }
    aboutToAppear() {
        this.viewModel.startPolling(() => {
            this.refreshTrigger++;
        });
    }
    aboutToDisappear() {
        this.viewModel.stopPolling();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor(Constants.COLOR_BG_DARK);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new 
                    // 1. 顶部航天 HUD 状态栏
                    StationHeader(this, {
                        isConnected: this.viewModel.isConnected,
                        isCached: this.viewModel.isCached,
                        lastSyncTime: this.viewModel.lastSyncTime,
                        currentTimeStr: this.viewModel.currentTimeStr
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 32, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            isConnected: this.viewModel.isConnected,
                            isCached: this.viewModel.isCached,
                            lastSyncTime: this.viewModel.lastSyncTime,
                            currentTimeStr: this.viewModel.currentTimeStr
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        isConnected: this.viewModel.isConnected,
                        isCached: this.viewModel.isCached,
                        lastSyncTime: this.viewModel.lastSyncTime,
                        currentTimeStr: this.viewModel.currentTimeStr
                    });
                }
            }, { name: "StationHeader" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 2. 主体可滑动区域
            Scroll.create();
            // 2. 主体可滑动区域
            Scroll.scrollable(ScrollDirection.Vertical);
            // 2. 主体可滑动区域
            Scroll.scrollBar(BarState.Auto);
            // 2. 主体可滑动区域
            Scroll.layoutWeight(1);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.padding(14);
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 2x2 四路环境感知矩阵
            Row.create({ space: 10 });
            // 2x2 四路环境感知矩阵
            Row.width('100%');
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new SensorCard(this, {
                        label: '舱内温度',
                        valueStr: this.viewModel.telemetry.temperature.toFixed(1),
                        unit: '℃',
                        channel: 'I2C0@0x44',
                        isAlarm: this.viewModel.telemetry.temperature > Constants.THRESHOLD_TEMP,
                        icon: '🌡️'
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 45, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            label: '舱内温度',
                            valueStr: this.viewModel.telemetry.temperature.toFixed(1),
                            unit: '℃',
                            channel: 'I2C0@0x44',
                            isAlarm: this.viewModel.telemetry.temperature > Constants.THRESHOLD_TEMP,
                            icon: '🌡️'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        label: '舱内温度',
                        valueStr: this.viewModel.telemetry.temperature.toFixed(1),
                        unit: '℃',
                        channel: 'I2C0@0x44',
                        isAlarm: this.viewModel.telemetry.temperature > Constants.THRESHOLD_TEMP,
                        icon: '🌡️'
                    });
                }
            }, { name: "SensorCard" });
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new SensorCard(this, {
                        label: '相对湿度',
                        valueStr: this.viewModel.telemetry.humidity.toFixed(1),
                        unit: '%',
                        channel: 'I2C0@0x44',
                        isAlarm: this.viewModel.telemetry.humidity > Constants.THRESHOLD_HUMI,
                        icon: '💧'
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 54, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            label: '相对湿度',
                            valueStr: this.viewModel.telemetry.humidity.toFixed(1),
                            unit: '%',
                            channel: 'I2C0@0x44',
                            isAlarm: this.viewModel.telemetry.humidity > Constants.THRESHOLD_HUMI,
                            icon: '💧'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        label: '相对湿度',
                        valueStr: this.viewModel.telemetry.humidity.toFixed(1),
                        unit: '%',
                        channel: 'I2C0@0x44',
                        isAlarm: this.viewModel.telemetry.humidity > Constants.THRESHOLD_HUMI,
                        icon: '💧'
                    });
                }
            }, { name: "SensorCard" });
        }
        // 2x2 四路环境感知矩阵
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.width('100%');
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new SensorCard(this, {
                        label: '环境光照',
                        valueStr: this.viewModel.telemetry.lux.toFixed(0),
                        unit: 'lx',
                        channel: 'I2C0@0x23',
                        isAlarm: this.viewModel.telemetry.lux < Constants.THRESHOLD_LUX_MIN,
                        icon: '☀️'
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 66, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            label: '环境光照',
                            valueStr: this.viewModel.telemetry.lux.toFixed(0),
                            unit: 'lx',
                            channel: 'I2C0@0x23',
                            isAlarm: this.viewModel.telemetry.lux < Constants.THRESHOLD_LUX_MIN,
                            icon: '☀️'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        label: '环境光照',
                        valueStr: this.viewModel.telemetry.lux.toFixed(0),
                        unit: 'lx',
                        channel: 'I2C0@0x23',
                        isAlarm: this.viewModel.telemetry.lux < Constants.THRESHOLD_LUX_MIN,
                        icon: '☀️'
                    });
                }
            }, { name: "SensorCard" });
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new SensorCard(this, {
                        label: '烟雾气体',
                        valueStr: this.viewModel.telemetry.gas_ppm.toFixed(1),
                        unit: 'ppm',
                        channel: 'SARADC_CH4',
                        isAlarm: this.viewModel.telemetry.gas_ppm > Constants.THRESHOLD_GAS,
                        icon: '💨'
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 75, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            label: '烟雾气体',
                            valueStr: this.viewModel.telemetry.gas_ppm.toFixed(1),
                            unit: 'ppm',
                            channel: 'SARADC_CH4',
                            isAlarm: this.viewModel.telemetry.gas_ppm > Constants.THRESHOLD_GAS,
                            icon: '💨'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        label: '烟雾气体',
                        valueStr: this.viewModel.telemetry.gas_ppm.toFixed(1),
                        unit: 'ppm',
                        channel: 'SARADC_CH4',
                        isAlarm: this.viewModel.telemetry.gas_ppm > Constants.THRESHOLD_GAS,
                        icon: '💨'
                    });
                }
            }, { name: "SensorCard" });
        }
        Row.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new 
                    // 3. 极速双向执行机构控制台
                    ControlSection(this, {
                        isMotorRunning: this.viewModel.telemetry.motor_on,
                        isAlarmOn: this.viewModel.telemetry.alarm_on,
                        onToggleMotor: (turnOn: boolean) => {
                            this.viewModel.sendMotorCommand(turnOn);
                        },
                        onMuteAlarm: () => {
                            this.viewModel.sendMuteCommand();
                        }
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 87, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            isMotorRunning: this.viewModel.telemetry.motor_on,
                            isAlarmOn: this.viewModel.telemetry.alarm_on,
                            onToggleMotor: (turnOn: boolean) => {
                                this.viewModel.sendMotorCommand(turnOn);
                            },
                            onMuteAlarm: () => {
                                this.viewModel.sendMuteCommand();
                            }
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        isMotorRunning: this.viewModel.telemetry.motor_on,
                        isAlarmOn: this.viewModel.telemetry.alarm_on
                    });
                }
            }, { name: "ControlSection" });
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new 
                    // 4. 原生 Canvas 温湿度时序走势图
                    TrendChart(this, {
                        tempData: this.viewModel.tempHistory,
                        humiData: this.viewModel.humiHistory
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 99, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            tempData: this.viewModel.tempHistory,
                            humiData: this.viewModel.humiHistory
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        tempData: this.viewModel.tempHistory,
                        humiData: this.viewModel.humiHistory
                    });
                }
            }, { name: "TrendChart" });
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new 
                    // 5. 测控事件实时流水
                    EventLogView(this, {
                        logs: this.viewModel.eventLogs
                    }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Index.ets", line: 105, col: 11 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            logs: this.viewModel.eventLogs
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        logs: this.viewModel.eventLogs
                    });
                }
            }, { name: "EventLogView" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 底部留白
            Row.create();
            // 底部留白
            Row.height(20);
        }, Row);
        // 底部留白
        Row.pop();
        Column.pop();
        // 2. 主体可滑动区域
        Scroll.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Index";
    }
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.spacestation.monitor", moduleName: "entry", pagePath: "pages/Index", pageFullPath: "entry/src/main/ets/pages/Index", integratedHsp: "false", moduleType: "followWithHap" });
