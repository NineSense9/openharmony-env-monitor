import React from 'react';
import { Compass, Crosshair, Activity, Layers } from 'lucide-react';
import { TelemetryData, SystemState } from '../types/telemetry';

interface SpatialAttitudeCardProps {
  telemetry: TelemetryData;
  systemState: SystemState;
}

export const SpatialAttitudeCard: React.FC<SpatialAttitudeCardProps> = ({ telemetry, systemState }) => {
  const pitch = telemetry.pitch ?? systemState.pitch ?? 0.0;
  const roll = telemetry.roll ?? systemState.roll ?? 0.0;
  const ax = telemetry.accel_x ?? systemState.accelX ?? 0.0;
  const ay = telemetry.accel_y ?? systemState.accelY ?? 0.0;
  const az = telemetry.accel_z ?? systemState.accelZ ?? 1.0;
  const totalG = Math.sqrt(ax * ax + ay * ay + az * az);

  // 适居度计算
  const tempScore = Math.max(0, 100 - Math.abs(telemetry.temperature - 23.5) * 4);
  const humiScore = Math.max(0, 100 - Math.abs(telemetry.humidity - 50.0) * 1.8);
  const luxScore = telemetry.lux >= 100 ? 100 : Math.max(20, (telemetry.lux / 100) * 100);
  const gasScore = telemetry.gas_ppm <= 30 ? 100 : Math.max(0, 100 - (telemetry.gas_ppm - 30) * 1.5);
  const habitabilityIndex = Math.min(100, Math.max(0, Math.round(
    tempScore * 0.35 + humiScore * 0.25 + luxScore * 0.15 + gasScore * 0.25
  )));

  const pitchClamped = Math.max(-45, Math.min(45, pitch));
  const rollClamped = Math.max(-180, Math.min(180, roll));
  const bubbleX = Math.max(-16, Math.min(16, ax * 16));
  const bubbleY = Math.max(-16, Math.min(16, -ay * 16));

  const isScanning = systemState.lastKey === 'K6';

  return (
    <div className="glass-panel rounded-lg p-2 flex flex-col gap-1.5 bg-[#060D1A]/90 border border-cyan-500/30 flex-1 min-h-0 overflow-hidden shadow-sm">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[#00F0FF] animate-spin" style={{ animationDuration: '12s' }} />
          <span className="font-hud text-[11px] font-bold text-slate-100 tracking-wider">
            姿态与微重力 HUD
          </span>
          <span className="text-[8px] font-mono px-1 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-500/40 rounded">
            MPU6050
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono text-slate-400">ECLSS适居:</span>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
            habitabilityIndex >= 85
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
          }`}>
            {habitabilityIndex}分
          </span>
        </div>
      </div>

      {/* 2. Middle Row: Horizon + Bubble Level */}
      <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0 items-center">
        {/* 2.1 地平仪 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded p-1.5 flex flex-col items-center justify-center relative overflow-hidden h-full">
          <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mb-0.5">
            <span className="flex items-center gap-0.5 text-cyan-300">
              <Crosshair className="w-2.5 h-2.5" /> 姿态盘
            </span>
            <span className="text-slate-500">P/R</span>
          </div>

          <div className="w-[78px] h-[78px] rounded-full border border-cyan-500/40 relative overflow-hidden bg-slate-900 shadow-inner">
            <div
              className="absolute w-[140px] h-[140px] -top-[31px] -left-[31px] transition-transform duration-150 ease-out"
              style={{
                transform: `rotate(${-rollClamped}deg) translateY(${pitchClamped * 0.7}px)`
              }}
            >
              <div className="w-full h-[70px] bg-gradient-to-t from-sky-700/80 to-sky-950/90 border-b border-cyan-300/80" />
              <div className="w-full h-[70px] bg-gradient-to-b from-amber-950/80 to-slate-950 border-t border-amber-500/50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-[7px] font-mono text-cyan-200/70">
                <div className="w-6 border-b border-cyan-200/50 mb-1.5" />
                <div className="w-9 border-b border-cyan-100 font-bold" />
                <div className="w-6 border-b border-cyan-200/50 mt-1.5" />
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-0.5 bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.8)] flex items-center justify-center relative">
                <div className="w-1.5 h-1.5 rounded-full border border-amber-300 bg-amber-400/50" />
              </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-between text-[9px] font-mono mt-0.5 px-0.5">
            <span className="text-cyan-300">俯仰:{pitch >= 0 ? `+${pitch.toFixed(1)}` : pitch.toFixed(1)}°</span>
            <span className="text-amber-300">横滚:{roll >= 0 ? `+${roll.toFixed(1)}` : roll.toFixed(1)}°</span>
          </div>
        </div>

        {/* 2.2 重力水准仪 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded p-1.5 flex flex-col items-center justify-center h-full">
          <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mb-0.5">
            <span className="flex items-center gap-0.5 text-emerald-400">
              <Activity className="w-2.5 h-2.5" /> 水准仪
            </span>
            <span className="text-slate-500">|G|={totalG.toFixed(2)}g</span>
          </div>

          <div className="w-[66px] h-[66px] rounded-full border border-slate-700 bg-slate-900/90 relative flex items-center justify-center shadow-inner my-0.5">
            <div className="absolute w-full h-[1px] bg-slate-700/60" />
            <div className="absolute h-full w-[1px] bg-slate-700/60" />
            <div className="w-10 h-10 rounded-full border border-slate-700/40" />
            <div className="w-4 h-4 rounded-full border border-emerald-500/30" />
            
            <div
              className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-200 shadow-[0_0_6px_rgba(52,211,153,0.8)] absolute transition-all duration-150 ease-out"
              style={{ transform: `translate(${bubbleX}px, ${bubbleY}px)` }}
            />
          </div>

          <div className="w-full flex items-center justify-between text-[8px] font-mono text-slate-400 px-0.5">
            <span className="text-cyan-400">X:{ax.toFixed(2)}</span>
            <span className="text-blue-400">Y:{ay.toFixed(2)}</span>
            <span className="text-purple-400">Z:{az.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: I2C0 Bus Matrix */}
      <div className="bg-slate-950/50 border border-slate-800/80 rounded p-1 flex flex-col gap-1 shrink-0">
        <div className="flex items-center justify-between text-[9px] font-mono">
          <span className="flex items-center gap-1 text-slate-400">
            <Layers className="w-2.5 h-2.5 text-cyan-400" />
            I2C0 物理总线外设矩阵
          </span>
          <span className="text-[8px] text-emerald-400 font-bold flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            WDT 活跃
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1 text-[8px] font-mono text-center">
          <div className={`border rounded py-0.5 px-0.5 transition-all ${isScanning ? 'bg-cyan-500/20 border-cyan-400 animate-pulse' : 'bg-cyan-950/30 border-cyan-500/30'}`}>
            <div className="text-cyan-300 font-bold">SHT30</div>
            <div className="text-[7px] text-slate-400">0x44</div>
            <div className="text-[7px] text-emerald-400 font-bold">ONLINE</div>
          </div>
          <div className={`border rounded py-0.5 px-0.5 transition-all ${isScanning ? 'bg-amber-500/20 border-amber-400 animate-pulse' : 'bg-amber-950/30 border-amber-500/30'}`}>
            <div className="text-amber-300 font-bold">BH1750</div>
            <div className="text-[7px] text-slate-400">0x23</div>
            <div className="text-[7px] text-emerald-400 font-bold">ONLINE</div>
          </div>
          <div className={`border rounded py-0.5 px-0.5 transition-all ${isScanning ? 'bg-purple-500/20 border-purple-400 animate-pulse' : 'bg-purple-950/30 border-purple-500/30'}`}>
            <div className="text-purple-300 font-bold">MPU6050</div>
            <div className="text-[7px] text-slate-400">0x68</div>
            <div className="text-[7px] text-emerald-400 font-bold">ONLINE</div>
          </div>
          <div className={`border rounded py-0.5 px-0.5 transition-all ${isScanning ? 'bg-emerald-500/20 border-emerald-400 animate-pulse' : 'bg-slate-900/60 border-slate-700/50'}`}>
            <div className="text-slate-300 font-bold">PCF8563</div>
            <div className="text-[7px] text-slate-400">0x51</div>
            <div className="text-[7px] text-emerald-400 font-bold">RTC-OK</div>
          </div>
        </div>
      </div>
    </div>
  );
};
