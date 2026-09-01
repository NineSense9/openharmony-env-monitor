import http from "@ohos:net.http";
import { Constants } from "@bundle:com.spacestation.monitor/entry/ets/common/Constants";
import { CommandPayload } from "@bundle:com.spacestation.monitor/entry/ets/model/TelemetryModel";
import type { TelemetryData } from "@bundle:com.spacestation.monitor/entry/ets/model/TelemetryModel";
/**
 * 空间站端云 HTTP 通信工具类
 */
export class HttpUtil {
    /**
     * 拉取最新遥测数据
     */
    public static async fetchLatestTelemetry(): Promise<TelemetryData | null> {
        const httpRequest = http.createHttp();
        const url = `${Constants.BASE_URL}/api/telemetry/latest?device_id=${Constants.DEVICE_ID}`;
        try {
            const response = await httpRequest.request(url, {
                method: http.RequestMethod.GET,
                readTimeout: 1500,
                connectTimeout: 1500,
                header: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.responseCode === 200 && response.result) {
                const rawStr = typeof response.result === 'string' ? response.result : JSON.stringify(response.result);
                const data: TelemetryData = JSON.parse(rawStr);
                return data;
            }
        }
        catch (err) {
            // 网络静默异常，由上层 ViewModel 判定失锁快照模式
        }
        finally {
            httpRequest.destroy();
        }
        return null;
    }
    /**
     * 下发远程控制指令
     */
    public static async sendCommand(target: string, action: string): Promise<boolean> {
        const httpRequest = http.createHttp();
        const url = `${Constants.BASE_URL}/api/command`;
        const payload = new CommandPayload(target, action);
        try {
            const response = await httpRequest.request(url, {
                method: http.RequestMethod.POST,
                readTimeout: 2000,
                connectTimeout: 2000,
                header: {
                    'Content-Type': 'application/json'
                },
                extraData: JSON.stringify(payload)
            });
            if (response.responseCode === 200 || response.responseCode === 201) {
                return true;
            }
        }
        catch (err) {
            console.error(`[HttpUtil] sendCommand failed: ${err}`);
        }
        finally {
            httpRequest.destroy();
        }
        return false;
    }
}
