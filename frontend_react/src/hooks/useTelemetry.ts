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
    created_at: new Date().toISOString()
  });

  const [history, setHistory] = useState<TelemetryHistoryItem[]>([]);
  const [logs, setLogs] = useState<{ id: string; time: string; msg: string; type: 'info' | 'alarm' | 'cmd' }[]>([
    { id: '1', time: new Date().toTimeString().split(' ')[0], msg: '太空地面控制中心数字孪生引擎启动...', type: 'info' }
  ]);

  const [systemState, setSystemState] = useState<SystemState>({
    isConnected: false,
    isCachedSnapshot: false,
    lastSyncTime: '--:--:--',
    totalPackets: 0,
    isAlarmActive: false,
    isMuted: false,
    isMotorRunning: false
  });

  const { playAlarm } = useAudioFeedback();
  const failCountRef = useRef(0);

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

  // 1. Polling Latest Telemetry (1.5s interval)
  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      const data = await fetchLatestTelemetry();
      if (!isMounted) return;

      if (data) {
        failCountRef.current = 0;
        const nowTime = new Date().toTimeString().split(' ')[0];

        // 告警阈值判定
        const isAlarm = (
          data.temperature > 38.0 ||
          data.humidity > 85.0 ||
          data.lux < 20.0 ||
          data.gas_ppm > 100.0
        );

        setTelemetry(data);
        setSystemState(prev => {
          if (isAlarm && !prev.isAlarmActive) {
            playAlarm();
            addLog(`[ALERT] 舱内环境越限告警触发 (T:${data.temperature}°C Gas:${data.gas_ppm}ppm)`, 'alarm');
          } else if (!isAlarm && prev.isAlarmActive) {
            addLog(`[RECOVERY] 舱内环境恢复正常安全阈值`, 'info');
          }

          return {
            ...prev,
            isConnected: true,
            isCachedSnapshot: false,
            lastSyncTime: nowTime,
            totalPackets: data.id || prev.totalPackets + 1,
            isAlarmActive: isAlarm
          };
        });
      } else {
        failCountRef.current += 1;
        // 连续 2 次失败进入 Snapshot 状态
        if (failCountRef.current >= 2) {
          setSystemState(prev => ({
            ...prev,
            isConnected: false,
            isCachedSnapshot: true
          }));
        }
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
