import React, { useState } from 'react';
import { useTelemetry } from './hooks/useTelemetry';
import { HudHeader } from './components/HudHeader';
import { SensorGrid } from './components/SensorGrid';
import { CabinTwin } from './components/CabinTwin';
import { BoardDigitalTwin } from './components/BoardDigitalTwin';
import { TelemetryChart } from './components/TelemetryChart';
import { ControlPanel } from './components/ControlPanel';
import { EventFeed } from './components/EventFeed';
import { sendRemoteCommand } from './services/api';
import { Cpu, Box } from 'lucide-react';

export function App() {
  const { telemetry, history, systemState, setSystemState, logs, addLog } = useTelemetry();
  const [activeCenterTab, setActiveCenterTab] = useState<'board' | 'cabin'>('board');

  const handleBoardKeyTrigger = async (key: 'K3' | 'K4' | 'K5' | 'K6') => {
    addLog(`[BOARD INTERACT] 触发板载实体轻触微动开关 ${key}`, 'cmd');

    if (key === 'K3') {
      // 消警
      await sendRemoteCommand({
        device_id: 'rk2206-station-01',
        target: 'alarm',
        action: 'ack'
      });
      setSystemState(prev => ({ ...prev, isMuted: true, lastKey: 'K3' }));
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
      await sendRemoteCommand({
        device_id: 'rk2206-station-01',
        target: 'fan',
        action: actionMap[nextSpeed] as any
      });
      setSystemState(prev => ({ ...prev, fanSpeed: nextSpeed, isMotorRunning: nextSpeed > 0, lastKey: 'K4' }));
      addLog(`[COMMAND ACK] K4 档位已循环切换至 L${nextSpeed}`, 'cmd');
    } else if (key === 'K5') {
      setSystemState(prev => ({ ...prev, lastKey: 'K5' }));
      addLog('[BOARD ACK] K5 触发声光自检测试模式', 'info');
    } else if (key === 'K6') {
      setSystemState(prev => ({ ...prev, lastKey: 'K6' }));
      addLog('[BOARD ACK] K6 触发 I2C0 总线动态重扫 (SHT30, BH1750, MPU6050)', 'info');
    }
  };

  return (
    <div className={`min-h-screen p-4 max-w-[1920px] mx-auto flex flex-col gap-4 transition-all duration-300 ${
      systemState.isAlarmActive ? 'border-rose-500/50 shadow-[inset_0_0_80px_rgba(244,63,94,0.15)]' : ''
    }`}>
      {/* 1. Top HUD Header */}
      <HudHeader systemState={systemState} />

      {/* 2. Main 3-Column Dashboard Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-[360px_1fr_380px] gap-4 flex-1">
        
        {/* Left Column: 4 Metric Cards */}
        <div className="flex flex-col gap-4">
          <SensorGrid telemetry={telemetry} systemState={systemState} />
        </div>

        {/* Center Column: Digital Twin Switcher & ECharts History */}
        <div className="flex flex-col gap-4">
          {/* 数字孪生视图切换导航 */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveCenterTab('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                  activeCenterTab === 'board'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                小凌派-RK2206 实物板卡数字孪生 (推荐)
              </button>

              <button
                onClick={() => setActiveCenterTab('cabin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                  activeCenterTab === 'cabin'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                空间站核心舱透视模型
              </button>
            </div>

            <span className="text-[10px] font-mono text-cyan-400/80">
              {activeCenterTab === 'board' ? '● 实体引脚与 LCD 实时镜面' : '● 空间站气流矢量仿真'}
            </span>
          </div>

          {/* 渲染所选视图 */}
          {activeCenterTab === 'board' ? (
            <BoardDigitalTwin
              telemetry={telemetry}
              systemState={systemState}
              onTriggerKey={handleBoardKeyTrigger}
            />
          ) : (
            <CabinTwin systemState={systemState} />
          )}

          {/* ECharts 温湿度时序示波曲线 */}
          <TelemetryChart history={history} />
        </div>

        {/* Right Column: Actuator Controls & Live Event Feed */}
        <div className="flex flex-col gap-4">
          <ControlPanel 
            systemState={systemState} 
            setSystemState={setSystemState} 
            addLog={addLog} 
          />
          <EventFeed logs={logs} />
        </div>

      </main>
    </div>
  );
}

export default App;
