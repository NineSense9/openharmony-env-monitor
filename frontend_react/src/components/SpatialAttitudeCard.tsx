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

  // 综合环境生命保障适居度 (0-100分)
  const tempScore = Math.max(0, 100 - Math.abs(telemetry.temperature - 23.5) * 4);
  const humiScore = Math.max(0, 100 - Math.abs(telemetry.humidity - 50.0) * 1.8);
  const luxScore = telemetry.lux >= 100 ? 100 : Math.max(20, (telemetry.lux / 100) * 100);
  const gasScore = telemetry.gas_ppm <= 30 ? 100 : Math.max(0, 100 - (telemetry.gas_ppm - 30) * 1.5);
  const habitabilityIndex = Math.min(100, Math.max(0, Math.round(
    tempScore * 0.35 + humiScore * 0.25 + luxScore * 0.15 + gasScore * 0.25
  )));

  // 限制姿态与气泡位移范围
  const pitchClamped = Math.max(-45, Math.min(45, pitch));
  const rollClamped = Math.max(-180, Math.min(180, roll));
  // 气泡水平偏移 (像素)，限制在半径 22px 内
  const bubbleX = Math.max(-22, Math.min(22, ax * 22));
  const bubbleY = Math.max(-22, Math.min(22, -ay * 22));

  return (
    <div className="glass-panel rounded-xl p-3.5 flex flex-col gap-3 bg-[#060D1A]/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.06)]">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#00F0FF] animate-spin" style={{ animationDuration: '12s' }} />
          <div>
            <div className="font-hud text-xs font-bold text-slate-100 tracking-wider flex items-center gap-1.5">
              空间姿态与重力矢量 HUD
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 rounded">
                MPU6050
              </span>
            </div>
          </div>
        </div>
        
        {/* ECLSS 适居度指示 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400">ECLSS适居度:</span>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
            habitabilityIndex >= 85
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
              : habitabilityIndex >= 60
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse'
          }`}>
            {habitabilityIndex}分 · {habitabilityIndex >= 85 ? '适居优' : habitabilityIndex >= 60 ? '良' : '预警'}
          </span>
        </div>
      </div>

      {/* 2. Middle Row: Artificial Horizon + 3-Axis Accelerometer */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* 2.1 航空姿态地平仪 (Artificial Horizon) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex flex-col items-center justify-between relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-cyan-300">
              <Crosshair className="w-3 h-3" /> 姿态仪
            </span>
            <span className="text-slate-500">PITCH/ROLL</span>
          </div>

          {/* 圆形地平仪视窗 */}
          <div className="w-[108px] h-[108px] rounded-full border-2 border-cyan-500/40 relative overflow-hidden bg-slate-900 shadow-[inset_0_0_12px_rgba(0,0,0,0.8)]">
            {/* 随 roll 旋转、随 pitch 平移的动态天地盘 */}
            <div
              className="absolute w-[190px] h-[190px] -top-[41px] -left-[41px] transition-transform duration-150 ease-out"
              style={{
                transform: `rotate(${-rollClamped}deg) translateY(${pitchClamped * 0.9}px)`
              }}
            >
              {/* 天空部 (蓝色渐变) */}
              <div className="w-full h-[95px] bg-gradient-to-t from-sky-700/80 to-sky-950/90 border-b border-cyan-300/80" />
              {/* 地面/舱底 (茶褐渐变) */}
              <div className="w-full h-[95px] bg-gradient-to-b from-amber-950/80 to-slate-950 border-t border-amber-500/50" />

              {/* 俯仰刻度梯 (Pitch Ladder) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-[8px] font-mono text-cyan-200/70">
                <div className="w-7 border-b border-cyan-200/50 mb-2.5" />
                <div className="w-11 border-b border-cyan-100 font-bold" />
                <div className="w-7 border-b border-cyan-200/50 mt-2.5" />
              </div>
            </div>

            {/* 中心固定基准十字光标 (Aircraft Reference) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-0.5 bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.8)] flex items-center justify-center relative">
                <div className="w-2 h-2 rounded-full border border-amber-300 bg-amber-400/50" />
              </div>
            </div>

            {/* 边缘刻度光圈 */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/20 pointer-events-none" />
          </div>

          {/* 实时数字读数 */}
          <div className="w-full flex items-center justify-between text-[10px] font-mono mt-1 px-0.5">
            <span className="text-cyan-300">仰角:{pitch >= 0 ? `+${pitch.toFixed(1)}` : pitch.toFixed(1)}°</span>
            <span className="text-amber-300">滚转:{roll >= 0 ? `+${roll.toFixed(1)}` : roll.toFixed(1)}°</span>
          </div>
        </div>

        {/* 2.2 三轴过载与水准仪 (3-Axis G-Force & Bubble Level) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
          <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <Activity className="w-3 h-3" /> 重力水准仪
            </span>
            <span className="text-slate-500">|G|={totalG.toFixed(2)}g</span>
          </div>

          {/* 2D 瞄准镜水准球 */}
          <div className="flex items-center justify-center py-0.5">
            <div className="w-[80px] h-[80px] rounded-full border border-slate-700 bg-slate-900/90 relative flex items-center justify-center shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]">
              {/* 十字参考线 */}
              <div className="absolute w-full h-[1px] bg-slate-700/60" />
              <div className="absolute h-full w-[1px] bg-slate-700/60" />
              {/* 同心圆参考线 */}
              <div className="w-12 h-12 rounded-full border border-slate-700/40" />
              <div className="w-5 h-5 rounded-full border border-emerald-500/30" />
              
              {/* 动态水准气泡 */}
              <div
                className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.8)] absolute transition-all duration-150 ease-out"
                style={{
                  transform: `translate(${bubbleX}px, ${bubbleY}px)`
                }}
              />
            </div>
          </div>

          {/* 三轴加速度条形指示 */}
          <div className="flex flex-col gap-0.5 text-[9px] font-mono mt-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-cyan-400">X:{ax.toFixed(2)}g</span>
              <span className="text-blue-400">Y:{ay.toFixed(2)}g</span>
              <span className="text-purple-400">Z:{az.toFixed(2)}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: I2C0 Bus Health & WDT Watchdog */}
      <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2 flex flex-col gap-1.5">
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

        {/* 4 个外设芯片状态指示 */}
        <div className="grid grid-cols-4 gap-1.5 text-[9px] font-mono text-center">
          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded py-1 px-0.5">
            <div className="text-cyan-300 font-bold">SHT30</div>
            <div className="text-[8px] text-slate-400">0x44</div>
            <div className="text-[8px] text-emerald-400 font-bold">● ONLINE</div>
          </div>
          <div className="bg-amber-950/40 border border-amber-500/30 rounded py-1 px-0.5">
            <div className="text-amber-300 font-bold">BH1750</div>
            <div className="text-[8px] text-slate-400">0x23</div>
            <div className="text-[8px] text-emerald-400 font-bold">● ONLINE</div>
          </div>
          <div className="bg-purple-950/40 border border-purple-500/30 rounded py-1 px-0.5">
            <div className="text-purple-300 font-bold">MPU6050</div>
            <div className="text-[8px] text-slate-400">0x68</div>
            <div className="text-[8px] text-emerald-400 font-bold">● ONLINE</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-700/50 rounded py-1 px-0.5">
            <div className="text-slate-300 font-bold">PCF8563</div>
            <div className="text-[8px] text-slate-400">0x51</div>
            <div className="text-[8px] text-emerald-400 font-bold">● RTC-OK</div>
          </div>
        </div>
      </div>
    </div>
  );
};
