import React from 'react';
import { Box, Wind, ShieldCheck, Activity, Gauge, Cpu, CheckCircle } from 'lucide-react';
import { AirflowCanvas } from './AirflowCanvas';
import { SystemState, TelemetryData } from '../types/telemetry';

interface CabinTwinProps {
  systemState: SystemState;
  telemetry?: TelemetryData | null;
}

export const CabinTwin: React.FC<CabinTwinProps> = ({ systemState, telemetry }) => {
  const temp = Number(telemetry?.temperature ?? 25.4).toFixed(1);
  const humi = Number(telemetry?.humidity ?? 52.0).toFixed(0);
  const lux = Math.round(telemetry?.lux ?? 350);
  const gas = Number(telemetry?.gas_ppm ?? 6.5).toFixed(1);
  const fanSpeed = telemetry?.fan_speed ?? systemState.fanSpeed ?? (systemState.isMotorRunning ? 3 : 0);
  const isAlarm = systemState.isAlarmActive;
  const isMotor = systemState.isMotorRunning;

  const fanRpm = isMotor ? (fanSpeed === 4 ? 4500 : fanSpeed * 1500) : 0;
  const windVelocity = isMotor ? (0.8 + (fanSpeed === 4 ? 3 : fanSpeed) * 0.75).toFixed(1) : '0.0';
  const flowRate = isMotor ? ((fanSpeed === 4 ? 3 : fanSpeed) * 120 + 180) : 0;

  return (
    <div className="glass-panel rounded-xl p-3 flex flex-col justify-between h-full w-full relative overflow-hidden bg-[#060D1A]/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.06)]">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-[#00F0FF] animate-pulse" />
          <span className="font-hud text-sm font-bold text-slate-100 tracking-wider">
            空间站核心舱透视模型 (CSS-CABIN-TWIN)
          </span>
          <span className="text-xs font-mono px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-500/40 rounded font-bold">
            微重力 ECLSS 生保舱
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className={`px-2.5 py-0.5 rounded border flex items-center gap-1.5 font-bold ${
            isMotor 
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Wind className={`w-3.5 h-3.5 ${isMotor ? 'animate-spin' : ''}`} />
            风机: {isMotor ? `${fanRpm} RPM (L${fanSpeed})` : '待机节能'}
          </span>
          <span className="flex items-center gap-1 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded bg-cyan-950/50 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            环控自巡检: 正常
          </span>
        </div>
      </div>

      {/* 空间站核心舱全景透视剖面图 (填充左右黑边，充实动力舱空白) */}
      <div className="flex-1 relative flex items-center justify-center bg-radial-gradient py-1 overflow-hidden min-h-0 w-full">
        {/* 背景微粒通风流线 */}
        <AirflowCanvas isRunning={isMotor} isAlarm={isAlarm} />

        <svg
          className="w-full h-full max-h-[300px] z-10 filter drop-shadow-[0_0_15px_rgba(0,240,255,0.2)] select-none"
          viewBox="0 0 960 280"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* ============================================================== */}
          {/* 1. 左翼：太阳能柔性光伏翼帆 A (填补左侧黑边空白) */}
          {/* ============================================================== */}
          <g className="filter drop-shadow-[0_0_8px_rgba(0,240,255,0.25)]">
            <line x1="20" y1="138" x2="135" y2="138" stroke="rgba(0, 240, 255, 0.7)" strokeWidth="2" />
            
            {/* 上光伏板 */}
            <rect x="25" y="42" width="85" height="82" rx="5" fill="rgba(8, 25, 52, 0.85)" stroke="#00F0FF" strokeWidth="1.2" />
            <line x1="25" y1="69" x2="110" y2="69" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="25" y1="96" x2="110" y2="96" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="67" y1="42" x2="67" y2="124" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" />
            
            {/* 下光伏板 */}
            <rect x="25" y="152" width="85" height="82" rx="5" fill="rgba(8, 25, 52, 0.85)" stroke="#00F0FF" strokeWidth="1.2" />
            <line x1="25" y1="179" x2="110" y2="179" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="25" y1="206" x2="110" y2="206" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="67" y1="152" x2="67" y2="234" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" />

            {/* 光伏翼说明标签 */}
            <text x="67" y="32" fill="#00F0FF" fontSize="9" fontFamily="Orbitron" fontWeight="bold" textAnchor="middle">
              SOLAR WING-A
            </text>
            <text x="67" y="248" fill="#38BDF8" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
              48V / 14.2kW
            </text>

            {/* 关节万向节 */}
            <circle cx="125" cy="138" r="5" fill="#00F0FF" />
            <circle cx="125" cy="138" r="8" stroke="#00F0FF" strokeWidth="1" fill="none" opacity="0.5" />
          </g>

          {/* ============================================================== */}
          {/* 2. 右翼：太阳能柔性光伏翼帆 B (填补右侧黑边空白) */}
          {/* ============================================================== */}
          <g className="filter drop-shadow-[0_0_8px_rgba(0,240,255,0.25)]">
            <line x1="825" y1="138" x2="940" y2="138" stroke="rgba(0, 240, 255, 0.7)" strokeWidth="2" />
            
            {/* 上光伏板 */}
            <rect x="850" y="42" width="85" height="82" rx="5" fill="rgba(8, 25, 52, 0.85)" stroke="#00F0FF" strokeWidth="1.2" />
            <line x1="850" y1="69" x2="935" y2="69" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="850" y1="96" x2="935" y2="96" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="892" y1="42" x2="892" y2="124" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" />
            
            {/* 下光伏板 */}
            <rect x="850" y="152" width="85" height="82" rx="5" fill="rgba(8, 25, 52, 0.85)" stroke="#00F0FF" strokeWidth="1.2" />
            <line x1="850" y1="179" x2="935" y2="179" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="850" y1="206" x2="935" y2="206" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="892" y1="152" x2="892" y2="234" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" />

            {/* 光伏翼说明标签 */}
            <text x="892" y="32" fill="#00F0FF" fontSize="9" fontFamily="Orbitron" fontWeight="bold" textAnchor="middle">
              SOLAR WING-B
            </text>
            <text x="892" y="248" fill="#38BDF8" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">
              48V / 14.2kW
            </text>

            {/* 关节万向节 */}
            <circle cx="835" cy="138" r="5" fill="#00F0FF" />
            <circle cx="835" cy="138" r="8" stroke="#00F0FF" strokeWidth="1" fill="none" opacity="0.5" />
          </g>

          {/* ============================================================== */}
          {/* 3. 核心舱主耐压壳体与三舱段 (居中黄金比例) */}
          {/* ============================================================== */}

          {/* 左侧对接口 DOCK-01 */}
          <rect x="124" y="105" width="16" height="66" rx="4" fill="rgba(0, 240, 255, 0.15)" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.5" />
          <line x1="132" y1="115" x2="132" y2="161" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* 右侧排气口 VENT-OUT */}
          <rect x="818" y="105" width="16" height="66" rx="4" fill="rgba(0, 240, 255, 0.15)" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.5" />
          <line x1="826" y1="115" x2="826" y2="161" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* 外舱壁 */}
          <rect
            x="138"
            y="20"
            width="682"
            height="236"
            rx="36"
            stroke="rgba(0, 240, 255, 0.55)"
            strokeWidth="2"
            fill="rgba(5, 12, 24, 0.75)"
          />
          <rect
            x="144"
            y="26"
            width="670"
            height="224"
            rx="30"
            stroke="rgba(0, 240, 255, 0.18)"
            strokeWidth="1"
            strokeDasharray="6 4"
            fill="none"
          />

          {/* 顶部主供风管道 */}
          <path d="M 160 66 L 795 66" stroke="rgba(0, 240, 255, 0.22)" strokeWidth="1.2" strokeDasharray="5 3" />
          
          {/* 底部主回风管道 */}
          <path d="M 160 214 L 795 214" stroke="rgba(0, 240, 255, 0.22)" strokeWidth="1.2" strokeDasharray="5 3" />
          <text x="165" y="224" fill="#3A86FF" fontSize="7.5" fontFamily="JetBrains Mono" opacity="0.7">
            ▼ 回风循环管 [AIR RETURN &gt;&gt;&gt;]
          </text>

          {/* 隔舱肋骨与隔离气密门 (Hatch A-B) */}
          <g>
            <line x1="365" y1="20" x2="365" y2="256" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1.5" strokeDasharray="6 3" />
            <rect x="357" y="110" width="16" height="56" rx="8" fill="#0B1C33" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.2" />
            <circle cx="365" cy="138" r="3.5" fill="#10B981" />
            <text x="365" y="178" textAnchor="middle" fill="#64748B" fontSize="7.5" fontFamily="JetBrains Mono">HATCH A-B</text>
          </g>

          {/* 隔舱肋骨与隔离气密门 (Hatch B-C) */}
          <g>
            <line x1="592" y1="20" x2="592" y2="256" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1.5" strokeDasharray="6 3" />
            <rect x="584" y="110" width="16" height="56" rx="8" fill="#0B1C33" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.2" />
            <circle cx="592" cy="138" r="3.5" fill="#10B981" />
            <text x="592" y="178" textAnchor="middle" fill="#64748B" fontSize="7.5" fontFamily="JetBrains Mono">HATCH B-C</text>
          </g>

          {/* ============================================================== */}
          {/* SEC-A: 生保居住舱 (x: 140 ~ 365) */}
          {/* ============================================================== */}
          <g>
            <text x="160" y="46" fill="#00F0FF" fontSize="11" fontFamily="Orbitron" fontWeight="bold" letterSpacing="0.5">
              SEC-A 生保居住舱
            </text>
            <text x="160" y="58" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">
              HABITAT &amp; LIFE-SUPPORT
            </text>

            {/* SHT30 主测点 */}
            <circle cx="250" cy="108" r="10" fill={isAlarm ? '#F43F5E' : '#00F0FF'} className="animate-pulse" />
            <circle cx="250" cy="108" r="20" stroke={isAlarm ? '#F43F5E' : '#00F0FF'} strokeWidth="1.2" opacity="0.35" />
            <text x="250" y="132" textAnchor="middle" fill="#00F0FF" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
              SHT30 环控微气候
            </text>

            <rect x="180" y="138" width="140" height="52" rx="7" fill="rgba(6, 18, 38, 0.9)" stroke="rgba(0, 240, 255, 0.45)" strokeWidth="1" />
            <text x="191" y="157" fill="#E2E8F0" fontSize="10" fontFamily="JetBrains Mono">
              温度: <tspan fill="#00F0FF" fontWeight="bold">{temp}°C</tspan>
            </text>
            <text x="191" y="173" fill="#E2E8F0" fontSize="10" fontFamily="JetBrains Mono">
              湿度: <tspan fill="#60A5FA" fontWeight="bold">{humi}% RH</tspan>
            </text>
            <text x="191" y="185" fill="#10B981" fontSize="8" fontFamily="JetBrains Mono">
              ● 舱内微气候: 适居优
            </text>
          </g>

          {/* ============================================================== */}
          {/* SEC-B: 实验载荷舱 (x: 365 ~ 592) */}
          {/* ============================================================== */}
          <g>
            <text x="388" y="46" fill="#00F0FF" fontSize="11" fontFamily="Orbitron" fontWeight="bold" letterSpacing="0.5">
              SEC-B 实验载荷舱
            </text>
            <text x="388" y="58" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">
              SCIENCE PAYLOAD RACKS
            </text>

            {/* BH1750 照度传感器 */}
            <g>
              <circle cx="436" cy="98" r="9" fill="#FF9900" />
              <circle cx="436" cy="98" r="16" stroke="#FF9900" strokeWidth="1" opacity="0.3" />
              <text x="454" y="102" fill="#FFB74D" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                BH1750: {lux} Lux
              </text>
            </g>

            {/* MQ-2 气体传感器 */}
            <g>
              <circle cx="436" cy="136" r="9" fill={isAlarm ? '#F43F5E' : '#10B981'} className={isAlarm ? 'animate-ping' : ''} />
              <circle cx="436" cy="136" r="16" stroke={isAlarm ? '#F43F5E' : '#10B981'} strokeWidth="1" opacity="0.3" />
              <text x="454" y="140" fill={isAlarm ? '#F43F5E' : '#34D399'} fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                MQ-2: {gas} PPM
              </text>
            </g>

            <rect x="396" y="156" width="162" height="34" rx="6" fill="rgba(6, 18, 38, 0.9)" stroke={isAlarm ? 'rgba(244, 63, 94, 0.6)' : 'rgba(16, 185, 129, 0.45)'} strokeWidth="1" />
            <text x="406" y="172" fill={isAlarm ? '#F43F5E' : '#34D399'} fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
              {isAlarm ? '⚠️ 舱内气体异常超标告警' : '● 空气洁净度: 极佳 (ISO 14644)'}
            </text>
            <text x="406" y="184" fill="#94A3B8" fontSize="8" fontFamily="JetBrains Mono">
              实验机柜 RACK #01/#02: 正常
            </text>
          </g>

          {/* ============================================================== */}
          {/* SEC-C: 环控动力舱 (x: 592 ~ 820) - 彻底充实红框 2 的上部空白 */}
          {/* ============================================================== */}
          <g>
            <text x="615" y="46" fill="#00F0FF" fontSize="11" fontFamily="Orbitron" fontWeight="bold" letterSpacing="0.5">
              SEC-C 环控动力舱
            </text>
            <text x="615" y="58" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">
              ECLSS VENTILATION &amp; POWER
            </text>

            {/* 解决红框 2 空白：新增 ECLSS 热控催化净化与吸附单元卡片 */}
            <rect x="615" y="68" width="186" height="36" rx="6" fill="rgba(6, 22, 48, 0.92)" stroke="rgba(0, 240, 255, 0.45)" strokeWidth="1" />
            <circle cx="628" cy="86" r="4" fill="#10B981" className="animate-pulse" />
            <text x="638" y="81" fill="#00F0FF" fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
              ECLSS 催化净化与热控换热
            </text>
            <text x="638" y="95" fill="#94A3B8" fontSize="8" fontFamily="JetBrains Mono">
              ▲ 供风主风道 [AIR SUPPLY &lt;&lt;&lt;] · 99.9% 洁净
            </text>

            {/* PWM 涡轮风机外圈与动叶轮 */}
            <circle cx="708" cy="144" r="32" stroke="#00F0FF" strokeWidth="2" fill="rgba(0, 240, 255, 0.07)" />
            <circle cx="708" cy="144" r="40" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1" strokeDasharray="4 4" />
            
            <g className={isMotor ? 'animate-spin origin-[708px_144px]' : ''} style={{ animationDuration: fanSpeed === 1 ? '1.5s' : fanSpeed === 2 ? '0.8s' : '0.35s' }}>
              <path d="M 708 144 L 708 118 A 6 6 0 0 1 716 125 Z" fill="#00F0FF" />
              <path d="M 708 144 L 734 144 A 6 6 0 0 1 727 154 Z" fill="#00F0FF" />
              <path d="M 708 144 L 708 170 A 6 6 0 0 1 700 163 Z" fill="#00F0FF" />
              <path d="M 708 144 L 682 144 A 6 6 0 0 1 689 134 Z" fill="#00F0FF" />
              <circle cx="708" cy="144" r="5" fill="#FFF" />
            </g>

            {/* 风机状态信息 */}
            <text x="708" y="192" textAnchor="middle" fill="#38BDF8" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
              PWM 涡轮主循环风机
            </text>
            <rect x="638" y="198" width="140" height="22" rx="5" fill="rgba(6, 18, 38, 0.85)" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" />
            <text x="708" y="213" textAnchor="middle" fill="#E2E8F0" fontSize="9" fontFamily="JetBrains Mono">
              {isMotor ? `排风: ${windVelocity} m/s | ${fanRpm} RPM` : '风机待命: 0.0 m/s (待机)'}
            </text>
          </g>
        </svg>
      </div>

      {/* 底部微气候参数栏 */}
      <div className="grid grid-cols-4 gap-2 pt-1.5 border-t border-slate-800/80 shrink-0">
        <div className="bg-[#081224] border border-cyan-900/50 hover:border-cyan-500/40 rounded-lg p-2 flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">循环风速</span>
            <span className="text-[10px] font-mono text-cyan-400">PWM_PB7</span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-mono font-bold text-cyan-300">{windVelocity}</span>
            <span className="text-[10px] text-slate-400">m/s</span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full mt-1 overflow-hidden">
            <div className="bg-cyan-400 h-full transition-all" style={{ width: `${Math.min(100, (Number(windVelocity) / 3.8) * 100)}%` }} />
          </div>
        </div>

        <div className="bg-[#081224] border border-cyan-900/50 hover:border-emerald-500/40 rounded-lg p-2 flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">换气流量</span>
            <span className="text-[10px] font-mono text-emerald-400">CFM</span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-mono font-bold text-emerald-400">{flowRate}</span>
            <span className="text-[10px] text-slate-400">m³/h</span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full mt-1 overflow-hidden">
            <div className="bg-emerald-400 h-full transition-all" style={{ width: `${Math.min(100, (flowRate / 600) * 100)}%` }} />
          </div>
        </div>

        <div className="bg-[#081224] border border-cyan-900/50 hover:border-blue-500/40 rounded-lg p-2 flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">基准舱压</span>
            <span className="text-[10px] font-mono text-blue-400">1.0 ATM</span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-mono font-bold text-blue-300">101.3</span>
            <span className="text-[10px] text-slate-400">kPa</span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full mt-1 overflow-hidden">
            <div className="bg-blue-400 h-full w-[95%]" />
          </div>
        </div>

        <div className="bg-[#081224] border border-cyan-900/50 hover:border-purple-500/40 rounded-lg p-2 flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">HEPA 滤网</span>
            <span className="text-[10px] font-mono text-purple-400">CLASS A</span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-mono font-bold text-purple-300">99.97%</span>
            <span className="text-[10px] text-slate-400">效率</span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full mt-1 overflow-hidden">
            <div className="bg-purple-400 h-full w-[99.97%]" />
          </div>
        </div>
      </div>
    </div>
  );
};
