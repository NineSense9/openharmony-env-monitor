import React, { useState } from 'react';
import { Cpu, Wind, BellOff, Loader2 } from 'lucide-react';
import { sendRemoteCommand } from '../services/api';
import { SystemState } from '../types/telemetry';
import { useAudioFeedback } from '../hooks/useAudioFeedback';

interface ControlPanelProps {
  systemState: SystemState;
  setSystemState: React.Dispatch<React.SetStateAction<SystemState>>;
  addLog: (msg: string, type?: 'info' | 'alarm' | 'cmd') => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ systemState, setSystemState, addLog }) => {
  const [loadingMotor, setLoadingMotor] = useState(false);
  const [loadingMute, setLoadingMute] = useState(false);
  const { playClick } = useAudioFeedback();

  const handleToggleMotor = async () => {
    playClick();
    const nextAction = systemState.isMotorRunning ? 'off' : 'on';
    setLoadingMotor(true);
    addLog(`[COMMAND] 发送远程电机控制指令 -> ${nextAction}`, 'cmd');

    const res = await sendRemoteCommand({
      device_id: 'rk2206-station-01',
      target: 'motor',
      action: nextAction
    });

    setLoadingMotor(false);
    if (res.ok) {
      setSystemState(prev => ({ ...prev, isMotorRunning: (nextAction === 'on') }));
      addLog(`[COMMAND ACK] 电机指令已入库 (ID: ${res.id})，板端 2~3s 内响应`, 'cmd');
    } else {
      addLog(`[COMMAND FAIL] 指令发送失败: ${res.msg}`, 'alarm');
    }
  };

  const handleEmergencyMute = async () => {
    playClick();
    setLoadingMute(true);
    addLog(`[COMMAND] 发送应急消警静音指令 (K3 Latch Mute)`, 'cmd');

    const res = await sendRemoteCommand({
      device_id: 'rk2206-station-01',
      target: 'alarm',
      action: 'ack'
    });

    setLoadingMute(false);
    if (res.ok) {
      setSystemState(prev => ({ ...prev, isMuted: true }));
      addLog(`[COMMAND ACK] 应急消警已生效，系统进入锁存静音`, 'cmd');
    } else {
      addLog(`[COMMAND FAIL] 消警指令发送失败: ${res.msg}`, 'alarm');
    }
  };

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#00F0FF]" />
          <span className="font-hud text-sm font-bold text-slate-200 tracking-wider">
            执行器与闭环控制台
          </span>
        </div>
        <span className="text-[10px] font-code px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
          BI-DIRECTIONAL
        </span>
      </div>

      {/* Control Switch: Motor */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[#080E1E] border border-slate-800/80">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Wind className="w-4 h-4 text-[#00F0FF]" />
            舱内排风换气电机
          </span>
          <span className="text-[10px] font-code text-slate-500">
            {systemState.isMotorRunning ? '状态: 运转中 (6000 RPM)' : '状态: 待机停转'}
          </span>
        </div>

        <button
          onClick={handleToggleMotor}
          disabled={loadingMotor}
          className={`px-4 py-1.5 rounded-lg text-xs font-hud tracking-wider transition-all flex items-center gap-1.5 ${
            systemState.isMotorRunning
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:bg-emerald-500/30'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
          }`}
        >
          {loadingMotor && <Loader2 className="w-3 h-3 animate-spin" />}
          {systemState.isMotorRunning ? '停止电机' : '启动电机'}
        </button>
      </div>

      {/* Emergency Mute Button */}
      <button
        onClick={handleEmergencyMute}
        disabled={loadingMute}
        className="w-full py-2.5 px-4 rounded-lg bg-rose-500/15 border border-rose-500/40 hover:bg-rose-500/25 text-rose-400 font-hud text-xs font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(244,63,94,0.15)] flex items-center justify-center gap-2"
      >
        {loadingMute ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellOff className="w-3.5 h-3.5" />}
        应急消警静音 (K3 LATCH MUTE)
      </button>
    </div>
  );
};
