import React from 'react';
import { Box, Wind, ShieldCheck, Gauge, Activity, AlertTriangle } from 'lucide-react';
import { AirflowCanvas } from './AirflowCanvas';
import { SystemState, TelemetryData } from '../types/telemetry';

interface CabinTwinProps {
  systemState: SystemState;
  telemetry?: TelemetryData | null;
}

export const CabinTwin: React.FC<CabinTwinProps> = ({ systemState, telemetry }) => {
  const temp = telemetry?.temperature ?? 25.4;
  const humi = telemetry?.humidity ?? 52.0;
  const lux = Math.round(telemetry?.lux ?? 350);
  const gas = Number(telemetry?.gas_ppm ?? 6.5).toFixed(1);
  const fanSpeed = telemetry?.fan_speed ?? systemState.fanSpeed ?? (systemState.isMotorRunning ? 3 : 0);
  const isAlarm = systemState.isAlarmActive;
  const isMotor = systemState.isMotorRunning;

  // 根据风速档位计算风速与转速
  const fanRpm = isMotor ? (fanSpeed === 4 ? 4500 : fanSpeed * 1500) : 0;
  const windVelocity = isMotor ? (0.8 + (fanSpeed === 4 ? 3 : fanSpeed) * 0.75).toFixed(1) : '0.0';
  const flowRate = isMotor ? ((fanSpeed === 4 ? 3 : fanSpeed) * 120 + 180) : 0;

  return (
    <div className="glass-panel rounded-xl p-3 flex flex-col h-[520px] relative overflow-hidden bg-[#060D1A]/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.06)]">
      {/* 1. 顶部标题栏 */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-[#00F0FF] animate-pulse" />
          <span className="font-hud text-sm font-bold text-slate-100 tracking-wider">
            空间站核心舱透视模型 (CSS-CABIN-TWIN)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 rounded">
            微重力 ECLSS 生保舱
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
            isMotor 
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
              : 'bg-slate-800/80 text-slate-400 border-slate-700'
          }`}>
            <Wind className={`w-3 h-3 ${isMotor ? 'animate-spin' : ''}`} />
            风机: {isMotor ? `${fanRpm} RPM (L${fanSpeed})` : '待机节能'}
          </span>
          <span className="flex items-center gap-1 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-950/40">
            <ShieldCheck className="w-3 h-3 text-cyan-300" />
            环控自巡检: 正常
          </span>
        </div>
      </div>

      {/* 2. 空间站核心舱剖面图与气流粒子系统 */}
      <div className="flex-1 relative flex items-center justify-center bg-radial-gradient py-1 overflow-hidden">
        <AirflowCanvas isRunning={isMotor} isAlarm={isAlarm} />

        {/* Space Cabin Isometric Vector Blueprint */}
        <svg
          className="w-full h-full max-h-[350px] z-10 filter drop-shadow-[0_0_12px_rgba(0,240,255,0.18)]"
          viewBox="0 0 700 280"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 外舱壁复合防护层 */}
          <rect
            x="40"
            y="20"
            width="620"
            height="235"
            rx="38"
            stroke="rgba(0, 240, 255, 0.45)"
            strokeWidth="1.8"
            fill="rgba(6, 13, 26, 0.65)"
          />
          {/* 舱壁内衬防辐射装甲条 */}
          <rect
            x="46"
            y="26"
            width="608"
            height="223"
            rx="32"
            stroke="rgba(0, 240, 255, 0.15)"
            strokeWidth="1"
            strokeDasharray="6 4"
            fill="none"
          />

          {/* 舱室隔断密封门框线 */}
          <line x1="40" y1="135" x2="660" y2="135" stroke="rgba(0, 240, 255, 0.12)" strokeDasharray="4 4" />
          <line x1="245" y1="20" x2="245" y2="255" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1.2" strokeDasharray="5 3" />
          <line x1="455" y1="20" x2="455" y2="255" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1.2" strokeDasharray="5 3" />

          {/* 舱段名称标识 */}
          <text x="65" y="48" fill="#38BDF8" fontSize="11" fontFamily="Orbitron" fontWeight="bold" letterSpacing="1">
            SEC-A: 生保居住舱 (HABITAT)
          </text>
          <text x="270" y="48" fill="#38BDF8" fontSize="11" fontFamily="Orbitron" fontWeight="bold" letterSpacing="1">
            SEC-B: 实验载荷舱 (LAB EXPERIMENT)
          </text>
          <text x="480" y="48" fill="#38BDF8" fontSize="11" fontFamily="Orbitron" fontWeight="bold" letterSpacing="1">
            SEC-C: 环控动力舱 (ECLSS VENT)
          </text>

          {/* ================= SEC-A: SHT30 温湿度传感器探针 ================= */}
          <g>
            <circle cx="140" cy="115" r="9" fill={isAlarm ? '#F43F5E' : '#00F0FF'} className="animate-pulse" />
            <circle cx="140" cy="115" r="18" stroke={isAlarm ? '#F43F5E' : '#00F0FF'} strokeWidth="1.2" opacity="0.4" />
            <circle cx="140" cy="115" r="2.5" fill="#FFF" />
            <text x="85" y="145" fill="#00F0FF" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
              SHT30 环控主测点
            </text>
            
            {/* SEC-A 遥测数据牌 */}
            <rect x="75" y="155" width="130" height="42" rx="6" fill="rgba(8, 20, 42, 0.85)" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1" />
            <text x="85" y="172" fill="#E2E8F0" fontSize="9" fontFamily="JetBrains Mono">
              温度: <tspan fill="#00F0FF" fontWeight="bold">{temp}°C</tspan>
            </text>
            <text x="85" y="188" fill="#E2E8F0" fontSize="9" fontFamily="JetBrains Mono">
              湿度: <tspan fill="#3A86FF" fontWeight="bold">{humi}% RH</tspan>
            </text>
          </g>

          {/* ================= SEC-B: BH1750 与 MQ2 传感器 ================= */}
          {/* BH1750 光强探头 */}
          <g>
            <circle cx="310" cy="95" r="8" fill="#FF9900" />
            <circle cx="310" cy="95" r="15" stroke="#FF9900" strokeWidth="1" opacity="0.4" />
            <circle cx="310" cy="95" r="2.5" fill="#FFF" />
            <text x="325" y="99" fill="#FF9900" fontSize="9" fontFamily="JetBrains Mono">
              BH1750: {lux} Lux
            </text>
          </g>

          {/* MQ2 烟雾毒气探头 */}
          <g>
            <circle cx="310" cy="155" r="8" fill={isAlarm ? '#F43F5E' : '#10B981'} className={isAlarm ? 'animate-ping' : ''} />
            <circle cx="310" cy="155" r="15" stroke={isAlarm ? '#F43F5E' : '#10B981'} strokeWidth="1" opacity="0.4" />
            <circle cx="310" cy="155" r="2.5" fill="#FFF" />
            <text x="325" y="159" fill={isAlarm ? '#F43F5E' : '#10B981'} fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
              MQ2: {gas} PPM
            </text>
          </g>

          {/* SEC-B 实验舱状态指示牌 */}
          <rect x="280" y="180" width="140" height="30" rx="5" fill="rgba(8, 20, 42, 0.85)" stroke={isAlarm ? 'rgba(244, 63, 94, 0.5)' : 'rgba(16, 185, 129, 0.4)'} strokeWidth="1" />
          <text x="290" y="199" fill={isAlarm ? '#F43F5E' : '#34D399'} fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
            {isAlarm ? '⚠️ 舱内气体异常超标' : '● 空气洁净度: 极佳'}
          </text>

          {/* ================= SEC-C: 动力区风机 ================= */}
          <g>
            {/* 外围风道法兰 */}
            <circle cx="550" cy="130" r="38" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="550" cy="130" r="32" stroke="#00F0FF" strokeWidth="1.8" fill="rgba(0, 240, 255, 0.06)" />
            
            {/* 动态旋转扇叶 */}
            <g className={isMotor ? 'animate-spin origin-[550px_130px]' : ''} style={{ animationDuration: fanSpeed === 1 ? '1.5s' : fanSpeed === 2 ? '0.8s' : '0.35s' }}>
              <circle cx="550" cy="130" r="28" stroke="#00F0FF" strokeWidth="1" fill="none" />
              <path d="M 550 130 L 550 104 A 6 6 0 0 1 558 110 Z" fill="#00F0FF" />
              <path d="M 550 130 L 576 130 A 6 6 0 0 1 570 138 Z" fill="#00F0FF" />
              <path d="M 550 130 L 550 156 A 6 6 0 0 1 542 150 Z" fill="#00F0FF" />
              <path d="M 550 130 L 524 130 A 6 6 0 0 1 530 122 Z" fill="#00F0FF" />
              <circle cx="550" cy="130" r="5" fill="#FFF" />
            </g>

            <text x="490" y="188" fill="#38BDF8" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
              PWM 离心循环风机
            </text>
            <text x="500" y="202" fill="#94A3B8" fontSize="9" fontFamily="JetBrains Mono">
              {isMotor ? `排风速: ${windVelocity} m/s` : '风机待命: 0.0 m/s'}
            </text>
          </g>
        </svg>
      </div>

      {/* 3. 底部环控生保微气候参数栏 */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 z-10">
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400">循环风速</span>
          <span className="text-xs font-mono font-bold text-cyan-300">
            {windVelocity} m/s
          </span>
          <span className="text-[9px] text-slate-500">{isMotor ? '微风层流' : '静态自然对流'}</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400">换气流量</span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {flowRate} m³/h
          </span>
          <span className="text-[9px] text-slate-500">舱容周转 12次/h</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400">基准舱压</span>
          <span className="text-xs font-mono font-bold text-blue-300">
            101.3 kPa
          </span>
          <span className="text-[9px] text-slate-500">1.00 atm 标准气压</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] font-mono text-slate-400">HEPA 滤网</span>
          <span className="text-xs font-mono font-bold text-purple-300">
            99.97%
          </span>
          <span className="text-[9px] text-slate-500">压差 42Pa 畅通</span>
        </div>
      </div>
    </div>
  );
};
