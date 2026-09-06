import React, { useState } from 'react';
import { useTelemetry } from './hooks/useTelemetry';
import { useAudioFeedback } from './hooks/useAudioFeedback';
import { HudHeader } from './components/HudHeader';
import { SensorGrid } from './components/SensorGrid';
import { SpatialAttitudeCard } from './components/SpatialAttitudeCard';
import { CabinTwin } from './components/CabinTwin';
import { BoardDigitalTwin } from './components/BoardDigitalTwin';
import { TelemetryChart } from './components/TelemetryChart';
import { ControlPanel } from './components/ControlPanel';
import { EventFeed } from './components/EventFeed';
import { sendRemoteCommand } from './services/api';
import { Cpu, Box } from 'lucide-react';

export function App() {
  const { telemetry, history, systemState, setSystemState, setOptimisticFanSpeed, logs, addLog } = useTelemetry();
  const [activeCenterTab, setActiveCenterTab] = useState<'board' | 'cabin'>('board');
  const { playAlarm, playScan } = useAudioFeedback();

  const handleBoardKeyTrigger = async (key: 'K3' | 'K4' | 'K5' | 'K6') => {
    if (key === 'K3') {
      // 消警
      addLog('[BOARD INTERACT] 触发 K3 实体消警微动', 'cmd');
      await sendRemoteCommand({
        device_id: 'rk2206-station-01',
        target: 'alarm',
        action: 'ack'
      });
      setSystemState(prev => ({ ...prev, isMuted: true, isAlarmActive: false, lastKey: 'K3' }));
      addLog('[COMMAND ACK] K3 本地消警已生效', 'cmd');
    } else if (key === 'K4') {
      // 切换风机档位
      const curSpeed = systemState.fanSpeed ?? 4;
      const nextSpeed = (curSpeed + 1) % 5;
      const actionMap: Record<number, string> = {
        0: 'speed_0',
        1: 'speed_1',
        2: 'speed_2',
        3: 'speed_3',
        4: 'auto'
      };
      setOptimisticFanSpeed(nextSpeed);
      setSystemState(prev => ({ ...prev, lastKey: 'K4' }));
      addLog(`[BOARD INTERACT] 触发 K4 单击循环调速 -> L${nextSpeed}`, 'cmd');
      await sendRemoteCommand({
        device_id: 'rk2206-station-01',
        target: 'fan',
        action: actionMap[nextSpeed] as any
      });
      addLog(`[COMMAND ACK] K4 档位已循环切换至 L${nextSpeed}`, 'cmd');
    } else if (key === 'K5') {
      // 长按 1.2s：声光报警与风机自检测试
      playAlarm();
      setSystemState(prev => ({ 
        ...prev, 
        lastKey: 'K5', 
        isAlarmActive: true, 
        isMotorRunning: true,
        fanSpeed: 3
      }));
      addLog('[BOARD TEST] K3 长按 1.2s：启动声光报警与电机自检 (蜂鸣器/PA5-LED/全速排烟)', 'alarm');
      
      // 下发电机高速测试
      sendRemoteCommand({
        device_id: 'rk2206-station-01',
        target: 'fan',
        action: 'speed_3'
      }).catch(() => {});

      setTimeout(async () => {
        setSystemState(prev => ({ 
          ...prev, 
          isAlarmActive: false, 
          isMotorRunning: false,
          fanSpeed: 0
        }));
        addLog('[BOARD ACK] 声光与振动电机自检测试通过，系统已自动恢复待机', 'info');
        await sendRemoteCommand({
          device_id: 'rk2206-station-01',
          target: 'fan',
          action: 'speed_0'
        }).catch(() => {});
      }, 3500);
    } else if (key === 'K6') {
      // 长按 3.0s：I2C0 物理总线动态重扫
      playScan();
      setSystemState(prev => ({ ...prev, lastKey: 'K6' }));
      addLog('[BOARD SCAN] K3 长按 3.0s：启动 I2C0 物理总线动态寻址重扫', 'cmd');
      setTimeout(() => {
        addLog('[BOARD ACK] I2C0 拓扑重扫完毕：SHT30(0x44), BH1750(0x23), MPU6050(0x68), PCF8563(0x51) 全部就绪', 'info');
      }, 2500);
    }
  };

  return (
    <div className={`h-screen max-h-screen p-2 max-w-[1920px] mx-auto flex flex-col gap-1.5 overflow-hidden transition-all duration-300 ${
      systemState.isAlarmActive ? 'border-rose-500/50 shadow-[inset_0_0_60px_rgba(244,63,94,0.15)]' : ''
    }`}>
      {/* 1. Top HUD Header */}
      <HudHeader systemState={systemState} />

      {/* 2. Main 3-Column Dashboard Grid (锁定一屏高度，绝不溢出) */}
      <main className="grid grid-cols-1 lg:grid-cols-[320px_1fr_340px] gap-2 flex-1 min-h-0 overflow-hidden">
        
        {/* Left Column: 4 Metric Cards + Spatial Attitude HUD */}
        <div className="flex flex-col gap-1.5 min-h-0 overflow-hidden">
          <SensorGrid telemetry={telemetry} systemState={systemState} />
          <SpatialAttitudeCard telemetry={telemetry} systemState={systemState} />
        </div>

        {/* Center Column: Digital Twin Switcher & ECharts History */}
        <div className="flex flex-col gap-1.5 min-h-0 overflow-hidden">
          {/* 数字孪生视图切换导航 */}
          <div className="flex items-center justify-between px-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveCenterTab('board')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold transition-all border ${
                  activeCenterTab === 'board'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Cpu className="w-3 h-3" />
                小凌派-RK2206 实物板卡孪生
              </button>

              <button
                onClick={() => setActiveCenterTab('cabin')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold transition-all border ${
                  activeCenterTab === 'cabin'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Box className="w-3 h-3" />
                空间站核心舱透视模型
              </button>
            </div>

            <span className="text-[9px] font-mono text-cyan-400/80">
              {activeCenterTab === 'board' ? '● 实体引脚与 LCD 实时镜面' : '● 空间站气流矢量仿真'}
            </span>
          </div>

          {/* 渲染所选视图 (370px 等高无缝切换) */}
          {activeCenterTab === 'board' ? (
            <BoardDigitalTwin
              telemetry={telemetry}
              systemState={systemState}
              onTriggerKey={handleBoardKeyTrigger}
            />
          ) : (
            <CabinTwin 
              systemState={systemState} 
              telemetry={telemetry}
            />
          )}

          {/* ECharts 多维示波曲线 */}
          <TelemetryChart history={history} />
        </div>

        {/* Right Column: Actuator Controls & Live Event Feed */}
        <div className="flex flex-col gap-1.5 min-h-0 overflow-hidden">
          <ControlPanel 
            systemState={systemState} 
            setSystemState={setSystemState} 
            setOptimisticFanSpeed={setOptimisticFanSpeed}
            addLog={addLog} 
          />
          <EventFeed logs={logs} />
        </div>

      </main>
    </div>
  );
}

export default App;
