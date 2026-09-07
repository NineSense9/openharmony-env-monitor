import React, { useState, useEffect } from 'react';
import { Satellite, Radio, WifiOff, Clock, Maximize2, Minimize2 } from 'lucide-react';
import { SystemState } from '../types/telemetry';

interface HudHeaderProps {
  systemState: SystemState;
}

export const HudHeader: React.FC<HudHeaderProps> = ({ systemState }) => {
  const [bjtTime, setBjtTime] = useState('--:--:--');
  const [utcTime, setUtcTime] = useState('--:--:--');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setBjtTime(now.toTimeString().split(' ')[0]);
      setUtcTime(now.toUTCString().split(' ')[4] || '--:--:--');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex items-center justify-between px-4 py-2 rounded-xl glass-panel relative overflow-hidden shrink-0 border border-cyan-500/30 bg-[#060D1A]/90 shadow-[0_0_20px_rgba(0,240,255,0.06)]">
      {/* Top Precision Accent Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF]/80 to-transparent" />

      {/* Brand & Mission Identity */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]">
          <Satellite className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-hud font-bold text-base tracking-wider text-slate-100">
              CSS-CABIN-01
            </h1>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-code tracking-widest bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
              MISSION CONTROL
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-data tracking-tight leading-none mt-0.5">
            太空空间站舱内环境监测与闭环控制系统 · 任务测控中心
          </p>
        </div>
      </div>

      {/* Telemetry Clocks & Metadata */}
      <div className="flex items-center gap-5 text-xs font-code">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" /> BJT:
          </span>
          <span className="text-xs font-bold text-slate-200">{bjtTime}</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-700/60" />

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">UTC:</span>
          <span className="text-xs font-bold text-slate-400">{utcTime}</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-700/60" />

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">终端 IP:</span>
          <span className="text-xs font-bold text-[#00F0FF]">192.168.9.51</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-700/60" />

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">遥测报文:</span>
          <span className="text-xs font-bold text-emerald-400 font-hud">
            {systemState.totalPackets} <span className="text-[10px] font-normal text-slate-500">PKTS</span>
          </span>
        </div>
      </div>

      {/* Connection Status Badge & Fullscreen Toggle */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? '退出全屏 (Esc)' : '进入大屏全屏模式 (F11)'}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-mono transition-all active:scale-95 shadow-sm"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{isFullscreen ? '退出全屏' : '大屏全屏'}</span>
        </button>

        {systemState.isConnected ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-semibold shadow-[0_0_10px_rgba(16,185,129,0.25)]">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>LIVE LINK</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/50 text-amber-400 text-xs font-semibold">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>LINK LOST ({systemState.lastSyncTime})</span>
          </div>
        )}
      </div>
    </header>
  );
};
