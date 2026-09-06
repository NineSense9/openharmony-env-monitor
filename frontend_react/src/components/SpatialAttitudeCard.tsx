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

  const tempScore = Math.max(0, 100 - Math.abs(telemetry.temperature - 23.5) * 4);
  const humiScore = Math.max(0, 100 - Math.abs(telemetry.humidity - 50.0) * 1.8);
  const luxScore = telemetry.lux >= 100 ? 100 : Math.max(20, (telemetry.lux / 100) * 100);
  const gasScore = telemetry.gas_ppm <= 30 ? 100 : Math.max(0, 100 - (telemetry.gas_ppm - 30) * 1.5);
  const habitabilityIndex = Math.min(100, Math.max(0, Math.round(
    tempScore * 0.35 + humiScore * 0.25 + luxScore * 0.15 + gasScore * 0.25
  )));

  const pitchClamped = Math.max(-45, Math.min(45, pitch));
  const rollClamped = Math.max(-180, Math.min(180, roll));
  const bubbleX = Math.max(-20, Math.min(20, ax * 20));
  const bubbleY = Math.max(-20, Math.min(20, -ay * 20));

  const isScanning = systemState.lastKey === 'K6';

  return (
    <div className="glass-panel rounded-xl p-3 flex flex-col justify-between bg-[#060D1A]/90 border border-cyan-500/30 flex-1 min-h-0 overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.06)]">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#00F0FF] animate-spin" style={{ animationDuration: '12s' }} />
          <span className="font-hud text-xs font-bold text-slate-100 tracking-wider">
            空间姿态与重力矢量 HUD
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-500/40 rounded">
            MPU6050
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400">ECLSS适居:</span>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
            habitabilityIndex >= 85
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
          }`}>
            {habitabilityIndex}分 · {habitabilityIndex >= 85 ? '适居优' : '良'}
          </span>
        </div>
      </div>

      {/* 2. Middle Row: Horizon + Bubble Level (大尺寸仪表盘，填满卡片内部) */}
      <div className="grid grid-cols-2 gap-2 my-1 flex-1 min-h-0 items-stretch">
        {/* 2.1 航空姿态地平仪 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col items-center justify-between relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-cyan-300">
              <Crosshair className="w-3 h-3" /> 姿态地平仪
            </span>
            <span className="text-slate-500">PITCH/ROLL</span>
          </div>

          <div className="w-[104px] h-[104px] rounded-full border-2 border-cyan-500/40 relative overflow-hidden bg-slate-900 shadow-[inset_0_0_12px_rgba(0,0,0,0.8)] my-auto">
            <div
              className="absolute w-[180px] h-[180px] -top-[38px] -left-[38px] transition-transform duration-150 ease-out"
              style={{
                transform: `rotate(${-rollClamped}deg) translateY(${pitchClamped * 0.9}px)`
              }}
            >
              <div className="w-full h-[90px] bg-gradient-to-t from-sky-700/80 to-sky-950/90 border-b border-cyan-300/80" />
              <div className="w-full h-[90px] bg-gradient-to-b from-amber-950/80 to-slate-950 border-t border-amber-500/50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-[8px] font-mono text-cyan-200/70">
                <div className="w-7 border-b border-cyan-200/50 mb-2.5" />
                <div className="w-11 border-b border-cyan-100 font-bold" />
                <div className="w-7 border-b border-cyan-200/50 mt-2.5" />
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-0.5 bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.8)] flex items-center justify-center relative">
                <div className="w-2 h-2 rounded-full border border-amber-300 bg-amber-400/50" />
              </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-between text-[10px] font-mono px-1">
            <span className="text-cyan-300">仰角: {pitch >= 0 ? `+${pitch.toFixed(1)}` : pitch.toFixed(1)}°</span>
            <span className="text-amber-300">滚转: {roll >= 0 ? `+${roll.toFixed(1)}` : roll.toFixed(1)}°</span>
          </div>
        </div>

        {/* 2.2 重力水准仪 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Activity className="w-3 h-3" /> 重力水准仪
            </span>
            <span className="text-slate-500">|G|={totalG.toFixed(2)}g</span>
          </div>

          <div className="w-[94px] h-[94px] rounded-full border border-slate-700 bg-slate-900/90 relative flex items-center justify-center shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] my-auto">
            <div className="absolute w-full h-[1px] bg-slate-700/60" />
            <div className="absolute h-full w-[1px] bg-slate-700/60" />
            <div className="w-14 h-14 rounded-full border border-slate-700/40" />
            <div className="w-6 h-6 rounded-full border border-emerald-500/30" />
            
            <div
              className="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.8)] absolute transition-all duration-150 ease-out"
              style={{ transform: `translate(${bubbleX}px, ${bubbleY}px)` }}
            />
          </div>

          <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 px-1">
            <span className="text-cyan-400">X:{ax.toFixed(2)}</span>
            <span className="text-blue-400">Y:{ay.toFixed(2)}</span>
            <span className="text-purple-400">Z:{az.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: I2C0 Bus Matrix */}
      <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2 flex flex-col gap-1 shrink-0">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="flex items-center gap-1 text-slate-400">
            <Layers className="w-3 h-3 text-cyan-400" />
            I2C0 物理总线外设矩阵
          </span>
          <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            20s WDT: ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
          <div className={`border rounded py-1 px-0.5 transition-all ${isScanning ? 'bg-cyan-500/20 border-cyan-400 animate-pulse' : 'bg-cyan-950/40 border-cyan-500/30'}`}>
            <div className="text-cyan-300 font-bold">SHT30</div>
            <div className="text-[8px] text-slate-400">0x44</div>
            <div className="text-[8px] text-emerald-400 font-bold">ONLINE</div>
          </div>
          <div className={`border rounded py-1 px-0.5 transition-all ${isScanning ? 'bg-amber-500/20 border-amber-400 animate-pulse' : 'bg-amber-950/40 border-amber-500/30'}`}>
            <div className="text-amber-300 font-bold">BH1750</div>
            <div className="text-[8px] text-slate-400">0x23</div>
            <div className="text-[8px] text-emerald-400 font-bold">ONLINE</div>
          </div>
          <div className={`border rounded py-1 px-0.5 transition-all ${isScanning ? 'bg-purple-500/20 border-purple-400 animate-pulse' : 'bg-purple-950/40 border-purple-500/30'}`}>
            <div className="text-purple-300 font-bold">MPU6050</div>
            <div className="text-[8px] text-slate-400">0x68</div>
            <div className="text-[8px] text-emerald-400 font-bold">ONLINE</div>
          </div>
          <div className={`border rounded py-1 px-0.5 transition-all ${isScanning ? 'bg-emerald-500/20 border-emerald-400 animate-pulse' : 'bg-slate-900/60 border-slate-700/50'}`}>
            <div className="text-slate-300 font-bold">PCF8563</div>
            <div className="text-[8px] text-slate-400">0x51</div>
            <div className="text-[8px] text-emerald-400 font-bold">RTC-OK</div>
          </div>
        </div>
      </div>
    </div>
  );
};
