import React, { useState, useEffect } from 'react';
import { Satellite, Radio, WifiOff, Clock } from 'lucide-react';
import { SystemState } from '../types/telemetry';

interface HudHeaderProps {
  systemState: SystemState;
}

export const HudHeader: React.FC<HudHeaderProps> = ({ systemState }) => {
  const [bjtTime, setBjtTime] = useState('--:--:--');
  const [utcTime, setUtcTime] = useState('--:--:--');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setBjtTime(now.toTimeString().split(' ')[0]);
      setUtcTime(now.toUTCString().split(' ')[4] || '--:--:--');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex items-center justify-between px-3 py-1.5 rounded-lg glass-panel relative overflow-hidden shrink-0">
      {/* Top Precision Accent Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF]/80 to-transparent" />

      {/* Brand & Mission Identity */}
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-md bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.25)]">
          <Satellite className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-hud font-bold text-sm tracking-wider text-slate-100">
              CSS-CABIN-01
            </h1>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-code tracking-wider bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
              DIGITAL TWIN
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-data tracking-tight leading-none mt-0.5">
            太空空间站舱内环境监测与闭环控制系统 · 任务测控中心
          </p>
        </div>
      </div>

      {/* Telemetry Clocks & Metadata */}
      <div className="flex items-center gap-4 text-xs font-code">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" /> BJT:
          </span>
          <span className="text-xs font-bold text-slate-200">{bjtTime}</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-700/60" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">UTC:</span>
          <span className="text-xs font-bold text-slate-400">{utcTime}</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-700/60" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">IP:</span>
          <span className="text-xs font-bold text-[#00F0FF]">192.168.9.51</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-700/60" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">报文:</span>
          <span className="text-xs font-bold text-emerald-400 font-hud">
            {systemState.totalPackets} <span className="text-[9px] font-normal text-slate-500">PKTS</span>
          </span>
        </div>
      </div>

      {/* Connection Status Badge */}
      <div className="flex items-center gap-2">
        {systemState.isConnected ? (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-[11px] font-semibold shadow-[0_0_8px_rgba(16,185,129,0.2)]">
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
            <span>LIVE LINK</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/50 text-amber-400 text-[11px] font-semibold">
            <WifiOff className="w-3 h-3 text-amber-400 animate-bounce" />
            <span>LINK LOST ({systemState.lastSyncTime})</span>
          </div>
        )}
      </div>
    </header>
  );
};
