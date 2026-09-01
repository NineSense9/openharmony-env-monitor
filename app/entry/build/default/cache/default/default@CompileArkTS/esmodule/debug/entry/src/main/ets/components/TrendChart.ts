if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface TrendChart_Params {
    tempData?: number[];
    humiData?: number[];
    settings?: RenderingContextSettings;
    context?: CanvasRenderingContext2D;
}
import { Constants } from "@bundle:com.spacestation.monitor/entry/ets/common/Constants";
export class TrendChart extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__tempData = new SynchedPropertyObjectOneWayPU(params.tempData, this, "tempData");
        this.__humiData = new SynchedPropertyObjectOneWayPU(params.humiData, this, "humiData");
        this.settings = new RenderingContextSettings(true);
        this.context = new CanvasRenderingContext2D(this.settings);
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: TrendChart_Params) {
        if (params.settings !== undefined) {
            this.settings = params.settings;
        }
        if (params.context !== undefined) {
            this.context = params.context;
        }
    }
    updateStateVars(params: TrendChart_Params) {
        this.__tempData.reset(params.tempData);
        this.__humiData.reset(params.humiData);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__tempData.purgeDependencyOnElmtId(rmElmtId);
        this.__humiData.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__tempData.aboutToBeDeleted();
        this.__humiData.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __tempData: SynchedPropertySimpleOneWayPU<number[]>;
    get tempData() {
        return this.__tempData.get();
    }
    set tempData(newValue: number[]) {
        this.__tempData.set(newValue);
    }
    private __humiData: SynchedPropertySimpleOneWayPU<number[]>;
    get humiData() {
        return this.__humiData.get();
    }
    set humiData(newValue: number[]) {
        this.__humiData.set(newValue);
    }
    private settings: RenderingContextSettings;
    private context: CanvasRenderingContext2D;
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
            Text.create('📈 舱内温湿度实时走势');
            Text.fontSize(13);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Constants.COLOR_WHITE);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Circle.create({ width: 6, height: 6 });
            Circle.fill('#00F0FF');
        }, Circle);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('温度(℃)');
            Text.fontSize(10);
            Text.fontColor(Constants.COLOR_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Circle.create({ width: 6, height: 6 });
            Circle.fill('#00E676');
        }, Circle);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('湿度(%)');
            Text.fontSize(10);
            Text.fontColor(Constants.COLOR_MUTED);
        }, Text);
        Text.pop();
        Row.pop();
        Row.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Canvas.create(this.context);
            Canvas.width('100%');
            Canvas.height(130);
            Canvas.backgroundColor('#0B1120');
            Canvas.borderRadius(8);
            Canvas.onReady(() => {
                this.drawChart();
            });
        }, Canvas);
        Canvas.pop();
        Column.pop();
    }
    private drawChart() {
        const ctx = this.context;
        const w = 320;
        const h = 130;
        ctx.clearRect(0, 0, w, h);
        // 绘制背景网格标尺
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1;
        for (let y = 20; y < h; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        // 绘制温度曲线 (青色)
        if (this.tempData.length > 1) {
            ctx.strokeStyle = '#00F0FF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const stepX = w / (this.tempData.length - 1);
            for (let i = 0; i < this.tempData.length; i++) {
                const val = this.tempData[i];
                // 映射 20~40℃ 到 h-10 ~ 10
                const y = h - 10 - ((val - 20) / 20) * (h - 20);
                const x = i * stepX;
                if (i === 0)
                    ctx.moveTo(x, y);
                else
                    ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        // 绘制湿度曲线 (绿色)
        if (this.humiData.length > 1) {
            ctx.strokeStyle = '#00E676';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const stepX = w / (this.humiData.length - 1);
            for (let i = 0; i < this.humiData.length; i++) {
                const val = this.humiData[i];
                // 映射 30~80% 到 h-10 ~ 10
                const y = h - 10 - ((val - 30) / 50) * (h - 20);
                const x = i * stepX;
                if (i === 0)
                    ctx.moveTo(x, y);
                else
                    ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }
    rerender() {
        this.updateDirtyElements();
    }
}
