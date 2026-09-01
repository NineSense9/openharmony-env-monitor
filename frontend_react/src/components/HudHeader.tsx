import React, { useState, useEffect } from 'react';
import { Satellite, Radio, Wifi, WifiOff, Clock } from 'lucide-react';
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
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 rounded-xl glass-panel relative overflow-hidden">
      {/* Top Precision Accent Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF]/80 to-transparent" />

      {/* Brand & Mission Identity */}
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)]">
          <Satellite className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-hud font-bold text-xl tracking-wider text-slate-100">
              CSS-CABIN-01
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-code tracking-widest bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
              DIGITAL TWIN
            </span>
          </div>
          <p className="text-xs text-slate-400 font-data tracking-wide mt-0.5">
            太空空间站舱内环境监测与闭环控制系统 · 任务测控中心
          </p>
        </div>
      </div>

      {/* Telemetry Clocks & Metadata */}
      <div className="flex items-center gap-6 text-xs font-code">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> 北京时间 (BJT)
          </span>
          <span className="text-sm font-bold text-slate-200 mt-0.5">{bjtTime}</span>
        </div>

        <div className="h-6 w-[1px] bg-slate-700/60" />

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">世界协调时 (UTC)</span>
          <span className="text-sm font-bold text-slate-400 mt-0.5">{utcTime}</span>
        </div>

        <div className="h-6 w-[1px] bg-slate-700/60" />

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">终端硬件 IP</span>
          <span className="text-sm font-bold text-[#00F0FF] mt-0.5">192.168.9.51</span>
        </div>

        <div className="h-6 w-[1px] bg-slate-700/60" />

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">遥测报文统计</span>
          <span className="text-sm font-bold text-emerald-400 mt-0.5 font-hud">
            {systemState.totalPackets} <span className="text-[10px] font-normal text-slate-500">PKTS</span>
          </span>
        </div>
      </div>

      {/* Connection & Telemetry Health Status Badge */}
      <div className="flex items-center gap-3">
        {systemState.isConnected ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>LIVE LINK</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/50 text-amber-400 text-xs font-semibold shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>LINK LOST (CACHED: {systemState.lastSyncTime})</span>
          </div>
        )}
      </div>
    </header>
  );
};
