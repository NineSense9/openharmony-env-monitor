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

      {/* 空间站核心舱高精剖面图 */}
      <div className="flex-1 relative flex items-center justify-center bg-radial-gradient py-1 overflow-hidden min-h-0">
        {/* 背景气流微粒流动动效 */}
        <AirflowCanvas isRunning={isMotor} isAlarm={isAlarm} />

        <svg
          className="w-full h-full max-h-[300px] z-10 filter drop-shadow-[0_0_15px_rgba(0,240,255,0.2)]"
          viewBox="0 0 740 280"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 左侧节点对接口 (Docking Port) */}
          <rect x="18" y="105" width="18" height="66" rx="4" fill="rgba(0, 240, 255, 0.15)" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.5" />
          <line x1="27" y1="115" x2="27" y2="161" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="22" y="185" fill="#64748B" fontSize="7" fontFamily="JetBrains Mono" transform="rotate(-90 22 185)">DOCK-01</text>

          {/* 右侧动力排气口 (Exhaust Port) */}
          <rect x="704" y="105" width="18" height="66" rx="4" fill="rgba(0, 240, 255, 0.15)" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.5" />
          <line x1="713" y1="115" x2="713" y2="161" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="730" y="125" fill="#64748B" fontSize="7" fontFamily="JetBrains Mono" transform="rotate(90 730 125)">VENT-OUT</text>

          {/* 双层耐压外舱壁与防热瓦结构 */}
          <rect
            x="36"
            y="20"
            width="668"
            height="236"
            rx="36"
            stroke="rgba(0, 240, 255, 0.55)"
            strokeWidth="2"
            fill="rgba(5, 12, 24, 0.72)"
          />
          <rect
            x="42"
            y="26"
            width="656"
            height="224"
            rx="30"
            stroke="rgba(0, 240, 255, 0.18)"
            strokeWidth="1"
            strokeDasharray="6 4"
            fill="none"
          />

          {/* 顶部送风主风道 (从动力舱吹向实验舱与居住舱) */}
          <path d="M 60 68 L 680 68" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
          <text x="660" y="65" fill="#00F0FF" fontSize="7" fontFamily="JetBrains Mono" opacity="0.6">▲ 供风主风道 [AIR SUPPLY &lt;&lt;&lt;]</text>

          {/* 底部回风主风道 */}
          <path d="M 60 216 L 680 216" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
          <text x="75" y="226" fill="#3A86FF" fontSize="7" fontFamily="JetBrains Mono" opacity="0.6">▼ 回风循环管 [AIR RETURN &gt;&gt;&gt;]</text>

          {/* 隔舱肋骨与隔离气密门 (Hatch A-B) */}
          <g>
            <line x1="258" y1="20" x2="258" y2="256" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1.5" strokeDasharray="6 3" />
            <rect x="250" y="110" width="16" height="56" rx="8" fill="#0B1C33" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.2" />
            <circle cx="258" cy="138" r="3.5" fill="#10B981" />
            <text x="258" y="178" textAnchor="middle" fill="#64748B" fontSize="7" fontFamily="JetBrains Mono">HATCH A-B</text>
          </g>

          {/* 隔舱肋骨与隔离气密门 (Hatch B-C) */}
          <g>
            <line x1="482" y1="20" x2="482" y2="256" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1.5" strokeDasharray="6 3" />
            <rect x="474" y="110" width="16" height="56" rx="8" fill="#0B1C33" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.2" />
            <circle cx="482" cy="138" r="3.5" fill="#10B981" />
            <text x="482" y="178" textAnchor="middle" fill="#64748B" fontSize="7" fontFamily="JetBrains Mono">HATCH B-C</text>
          </g>

          {/* ============================================================== */}
          {/* SEC-A: 生保居住舱 (彻底解决字体重叠，上下规整排布) */}
          {/* ============================================================== */}
          <g>
            {/* 舱段标题 (单行不重叠) */}
            <text x="60" y="46" fill="#00F0FF" fontSize="11" fontFamily="Orbitron" fontWeight="bold" letterSpacing="0.5">
              SEC-A 生保居住舱
            </text>
            <text x="60" y="58" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">
              HABITAT &amp; LIFE-SUPPORT
            </text>

            {/* SHT30 主测点传感器图形 */}
            <circle cx="145" cy="108" r="10" fill={isAlarm ? '#F43F5E' : '#00F0FF'} className="animate-pulse" />
            <circle cx="145" cy="108" r="20" stroke={isAlarm ? '#F43F5E' : '#00F0FF'} strokeWidth="1.2" opacity="0.35" />
            <text x="145" y="132" textAnchor="middle" fill="#00F0FF" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
              SHT30 环控微气候
            </text>

            {/* 遥测数据卡片 */}
            <rect x="75" y="138" width="140" height="52" rx="7" fill="rgba(6, 18, 38, 0.9)" stroke="rgba(0, 240, 255, 0.45)" strokeWidth="1" />
            <text x="86" y="157" fill="#E2E8F0" fontSize="10" fontFamily="JetBrains Mono">
              温度: <tspan fill="#00F0FF" fontWeight="bold">{temp}°C</tspan>
            </text>
            <text x="86" y="173" fill="#E2E8F0" fontSize="10" fontFamily="JetBrains Mono">
              湿度: <tspan fill="#60A5FA" fontWeight="bold">{humi}% RH</tspan>
            </text>
            <text x="86" y="185" fill="#10B981" fontSize="8" fontFamily="JetBrains Mono">
              ● 舱内微气候: 适居优
            </text>
          </g>

          {/* ============================================================== */}
          {/* SEC-B: 实验载荷舱 (彻底解决字体重叠，上下规整排布) */}
          {/* ============================================================== */}
          <g>
            {/* 舱段标题 (单行不重叠) */}
            <text x="282" y="46" fill="#00F0FF" fontSize="11" fontFamily="Orbitron" fontWeight="bold" letterSpacing="0.5">
              SEC-B 实验载荷舱
            </text>
            <text x="282" y="58" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">
              SCIENCE PAYLOAD RACKS
            </text>

            {/* BH1750 照度传感器 */}
            <g>
              <circle cx="330" cy="98" r="9" fill="#FF9900" />
              <circle cx="330" cy="98" r="16" stroke="#FF9900" strokeWidth="1" opacity="0.3" />
              <text x="348" y="102" fill="#FFB74D" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                BH1750: {lux} Lux
              </text>
            </g>

            {/* MQ-2 气体传感器 */}
            <g>
              <circle cx="330" cy="136" r="9" fill={isAlarm ? '#F43F5E' : '#10B981'} className={isAlarm ? 'animate-ping' : ''} />
              <circle cx="330" cy="136" r="16" stroke={isAlarm ? '#F43F5E' : '#10B981'} strokeWidth="1" opacity="0.3" />
              <text x="348" y="140" fill={isAlarm ? '#F43F5E' : '#34D399'} fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                MQ-2: {gas} PPM
              </text>
            </g>

            {/* 空气洁净与载荷状态卡片 */}
            <rect x="290" y="156" width="162" height="34" rx="6" fill="rgba(6, 18, 38, 0.9)" stroke={isAlarm ? 'rgba(244, 63, 94, 0.6)' : 'rgba(16, 185, 129, 0.45)'} strokeWidth="1" />
            <text x="300" y="172" fill={isAlarm ? '#F43F5E' : '#34D399'} fontSize="9.5" fontFamily="JetBrains Mono" fontWeight="bold">
              {isAlarm ? '⚠️ 舱内气体异常超标告警' : '● 空气洁净度: 极佳 (ISO 14644)'}
            </text>
            <text x="300" y="184" fill="#94A3B8" fontSize="8" fontFamily="JetBrains Mono">
              实验机柜 RACK #01/#02: 正常
            </text>
          </g>

          {/* ============================================================== */}
          {/* SEC-C: 环控动力舱 (彻底解决字体重叠，上下规整排布) */}
          {/* ============================================================== */}
          <g>
            {/* 舱段标题 (单行不重叠) */}
            <text x="506" y="46" fill="#00F0FF" fontSize="11" fontFamily="Orbitron" fontWeight="bold" letterSpacing="0.5">
              SEC-C 环控动力舱
            </text>
            <text x="506" y="58" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">
              ECLSS VENTILATION &amp; POWER
            </text>

            {/* PWM 涡轮风机外圈与动叶轮 */}
            <circle cx="585" cy="126" r="34" stroke="#00F0FF" strokeWidth="2" fill="rgba(0, 240, 255, 0.07)" />
            <circle cx="585" cy="126" r="42" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* 旋转风扇扇叶 */}
            <g className={isMotor ? 'animate-spin origin-[585px_126px]' : ''} style={{ animationDuration: fanSpeed === 1 ? '1.5s' : fanSpeed === 2 ? '0.8s' : '0.35s' }}>
              <path d="M 585 126 L 585 98 A 7 7 0 0 1 595 105 Z" fill="#00F0FF" />
              <path d="M 585 126 L 613 126 A 7 7 0 0 1 606 136 Z" fill="#00F0FF" />
              <path d="M 585 126 L 585 154 A 7 7 0 0 1 575 147 Z" fill="#00F0FF" />
              <path d="M 585 126 L 557 126 A 7 7 0 0 1 564 116 Z" fill="#00F0FF" />
              <circle cx="585" cy="126" r="6" fill="#FFF" />
            </g>

            {/* 风机状态信息 */}
            <text x="585" y="174" textAnchor="middle" fill="#38BDF8" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
              PWM 涡轮主循环风机
            </text>
            <rect x="515" y="180" width="140" height="24" rx="5" fill="rgba(6, 18, 38, 0.85)" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" />
            <text x="585" y="196" textAnchor="middle" fill="#E2E8F0" fontSize="9" fontFamily="JetBrains Mono">
              {isMotor ? `排风速: ${windVelocity} m/s | ${fanRpm} RPM` : '风机待命: 0.0 m/s (待机)'}
            </text>
          </g>
        </svg>
      </div>

      {/* 底部微气候参数栏 (高质感遥测卡片) */}
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
