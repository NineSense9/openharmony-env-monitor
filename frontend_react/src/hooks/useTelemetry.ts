import { useState, useEffect, useRef } from 'react';
import { TelemetryData, TelemetryHistoryItem, SystemState } from '../types/telemetry';
import { fetchLatestTelemetry, fetchTelemetryHistory, DEVICE_ID } from '../services/api';
import { useAudioFeedback } from './useAudioFeedback';

export function useTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    id: 0,
    device_id: DEVICE_ID,
    temperature: 25.0,
    humidity: 50.0,
    lux: 300.0,
    gas_ppm: 8.0,
    created_at: ''
  });

  const [history, setHistory] = useState<TelemetryHistoryItem[]>([]);
  const [logs, setLogs] = useState<{ id: string; time: string; msg: string; type: 'info' | 'alarm' | 'cmd' }[]>([
    { id: '1', time: new Date().toTimeString().split(' ')[0], msg: '太空地面控制中心数字孪生引擎启动...', type: 'info' }
  ]);

  const [systemState, setSystemState] = useState<SystemState>({
    isConnected: false,
    isCachedSnapshot: true,
    lastSyncTime: '--:--:--',
    totalPackets: 0,
    isAlarmActive: false,
    isMuted: false,
    isMotorRunning: false
  });

  const { playAlarm } = useAudioFeedback();

  const addLog = (msg: string, type: 'info' | 'alarm' | 'cmd' = 'info') => {
    setLogs(prev => [
      {
        id: Math.random().toString(36).substring(2, 9),
        time: new Date().toTimeString().split(' ')[0],
        msg,
        type
      },
      ...prev.slice(0, 29)
    ]);
  };

  // 1. Polling Latest Telemetry with Heartbeat Timeout Check (1.5s interval)
  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      const data = await fetchLatestTelemetry();
      if (!isMounted) return;

      if (data && data.created_at) {
        // 计算数据上报时间戳与当前时间的差距 (秒)
        // 支持 ISO 格式解析
        const dataTime = new Date(data.created_at.endsWith('Z') ? data.created_at : data.created_at + 'Z').getTime();
        const nowTime = Date.now();
        // 允许时区偏移计算：如果最新报文距今超过 12 秒，判定为硬件离线 (开发板每 3 秒上传一次)
        const ageSec = Math.abs(nowTime - dataTime) / 1000;
        
        // 格式化最后同步时间 (UTC -> Local String)
        const syncTimeStr = new Date(dataTime).toTimeString().split(' ')[0] || '--:--:--';

        // 判断硬件是否在线 (报文必须在 12 秒内生成)
        const isOnline = (ageSec <= 12);

        // 告警阈值判定
        const isAlarm = (
          data.temperature > 38.0 ||
          data.humidity > 85.0 ||
          data.lux < 20.0 ||
          data.gas_ppm > 100.0
        );

        setTelemetry(data);
        setSystemState(prev => {
          if (isOnline && isAlarm && !prev.isAlarmActive) {
            playAlarm();
            addLog(`[ALERT] 舱内环境越限告警触发 (T:${data.temperature}°C Gas:${data.gas_ppm}ppm)`, 'alarm');
          } else if (!isAlarm && prev.isAlarmActive) {
            addLog(`[RECOVERY] 舱内环境恢复正常安全阈值`, 'info');
          }

          return {
            ...prev,
            isConnected: isOnline,
            isCachedSnapshot: !isOnline,
            lastSyncTime: syncTimeStr,
            totalPackets: data.id || prev.totalPackets,
            isAlarmActive: isOnline ? isAlarm : false
          };
        });
      } else {
        setSystemState(prev => ({
          ...prev,
          isConnected: false,
          isCachedSnapshot: true
        }));
      }
    };

    poll();
    const interval = setInterval(poll, 1500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Polling History Curves (3.5s interval)
  useEffect(() => {
    let isMounted = true;

    const pollHistory = async () => {
      const list = await fetchTelemetryHistory(DEVICE_ID, 25);
      if (!isMounted || !list.length) return;

      const formatted: TelemetryHistoryItem[] = list.reverse().map(item => ({
        id: item.id,
        time: item.created_at ? item.created_at.split('T')[1].split('.')[0] : '--:--',
        temperature: Number(item.temperature.toFixed(1)),
        humidity: Number(item.humidity.toFixed(1)),
        lux: Math.round(item.lux),
        gas_ppm: Number(item.gas_ppm.toFixed(1))
      }));

      setHistory(formatted);
    };

    pollHistory();
    const interval = setInterval(pollHistory, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return {
    telemetry,
    history,
    systemState,
    setSystemState,
    logs,
    addLog
  };
}
