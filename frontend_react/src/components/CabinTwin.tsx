import React from 'react';
import { Box, Fan } from 'lucide-react';
import { AirflowCanvas } from './AirflowCanvas';
import { SystemState } from '../types/telemetry';

interface CabinTwinProps {
  systemState: SystemState;
}

export const CabinTwin: React.FC<CabinTwinProps> = ({ systemState }) => {
  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col h-[360px] relative overflow-hidden">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-[#00F0FF]" />
          <span className="font-hud text-sm font-bold text-slate-200 tracking-wider">
            空间站核心舱数字孪生模型 (CSS-MODULE-01)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-code border ${
            systemState.isMotorRunning 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            VENT MOTOR: {systemState.isMotorRunning ? 'RUNNING (6000 RPM)' : 'STANDBY'}
          </span>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-radial-gradient">
        <AirflowCanvas isRunning={systemState.isMotorRunning} isAlarm={systemState.isAlarmActive} />

        {/* Space Cabin Isometric Vector Blueprint */}
        <svg className="w-[90%] h-[90%] z-10 filter drop-shadow-[0_0_12px_rgba(0,240,255,0.15)]" viewBox="0 0 640 280" fill="none">
          {/* Outer Shell */}
          <rect x="60" y="30" width="520" height="220" rx="36" stroke="rgba(0, 240, 255, 0.35)" strokeWidth="1.5" fill="rgba(8, 14, 30, 0.4)" />
          
          {/* Sub-module Grid Lines */}
          <line x1="60" y1="140" x2="580" y2="140" stroke="rgba(0, 240, 255, 0.12)" strokeDasharray="4 4" />
          <line x1="230" y1="30" x2="230" y2="250" stroke="rgba(0, 240, 255, 0.12)" strokeDasharray="4 4" />
          <line x1="410" y1="30" x2="410" y2="250" stroke="rgba(0, 240, 255, 0.12)" strokeDasharray="4 4" />

          {/* Module Section Labels */}
          <text x="100" y="60" fill="#64748B" fontSize="10" fontFamily="Orbitron" letterSpacing="1">SEC-A: CREW HABITAT</text>
          <text x="260" y="60" fill="#64748B" fontSize="10" fontFamily="Orbitron" letterSpacing="1">SEC-B: SCIENCE LAB</text>
          <text x="440" y="60" fill="#64748B" fontSize="10" fontFamily="Orbitron" letterSpacing="1">SEC-C: AIR VENTILATION</text>

          {/* Sensor 1: SHT30 Node */}
          <g>
            <circle cx="145" cy="140" r="7" fill={systemState.isAlarmActive ? '#F43F5E' : '#00F0FF'} className="animate-pulse" />
            <circle cx="145" cy="140" r="14" stroke={systemState.isAlarmActive ? '#F43F5E' : '#00F0FF'} strokeWidth="1" opacity="0.4" />
            <text x="115" y="172" fill="#00F0FF" fontSize="9" fontFamily="JetBrains Mono">SHT30 (TEMP/HUMI)</text>
          </g>

          {/* Sensor 2: BH1750 Lux Node */}
          <g>
            <circle cx="320" cy="100" r="7" fill="#FF9900" />
            <circle cx="320" cy="100" r="14" stroke="#FF9900" strokeWidth="1" opacity="0.4" />
            <text x="290" y="130" fill="#FF9900" fontSize="9" fontFamily="JetBrains Mono">BH1750 (LUX)</text>
          </g>

          {/* Sensor 3: MQ2 Gas Node */}
          <g>
            <circle cx="320" cy="190" r="7" fill={systemState.isAlarmActive ? '#F43F5E' : '#10B981'} />
            <circle cx="320" cy="190" r="14" stroke={systemState.isAlarmActive ? '#F43F5E' : '#10B981'} strokeWidth="1" opacity="0.4" />
            <text x="290" y="220" fill={systemState.isAlarmActive ? '#F43F5E' : '#10B981'} fontSize="9" fontFamily="JetBrains Mono">MQ2 (GAS PPM)</text>
          </g>

          {/* Motor / Fan in Section C */}
          <g className={systemState.isMotorRunning ? 'animate-spin origin-[510px_140px]' : ''}>
            <circle cx="510" cy="140" r="26" stroke="#00F0FF" strokeWidth="1.5" fill="rgba(0,240,255,0.08)" />
            <path d="M 510 140 L 510 118 A 6 6 0 0 1 516 124 Z" fill="#00F0FF" />
            <path d="M 510 140 L 532 140 A 6 6 0 0 1 526 146 Z" fill="#00F0FF" />
            <path d="M 510 140 L 510 162 A 6 6 0 0 1 504 156 Z" fill="#00F0FF" />
            <path d="M 510 140 L 488 140 A 6 6 0 0 1 494 134 Z" fill="#00F0FF" />
            <circle cx="510" cy="140" r="5" fill="#FFF" />
          </g>
          <text x="460" y="185" fill="#38BDF8" fontSize="9" fontFamily="JetBrains Mono">VENT FAN (RK2206)</text>
        </svg>
      </div>
    </div>
  );
};
