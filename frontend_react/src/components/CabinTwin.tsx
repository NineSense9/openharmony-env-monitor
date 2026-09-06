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

      {/* 空间站核心舱宽屏全景透视模型 (移除外侧杂框，舱体整体铺满，彻底消除文字溢出) */}
      <div className="flex-1 relative flex items-center justify-center bg-radial-gradient py-1 overflow-hidden min-h-0 w-full">
        {/* 背景气流微粒 */}
        <AirflowCanvas isRunning={isMotor} isAlarm={isAlarm} />

        <svg
          className="w-full h-full max-h-[300px] z-10 filter drop-shadow-[0_0_15px_rgba(0,240,255,0.2)] select-none"
          viewBox="0 0 920 270"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 左侧节点对接口 (机械对接环结构，无旋转文字溢出) */}
          <g>
            <rect x="20" y="96" width="22" height="78" rx="4" fill="rgba(0, 240, 255, 0.12)" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.5" />
            <rect x="25" y="104" width="12" height="62" rx="2" fill="rgba(0, 240, 255, 0.2)" stroke="rgba(0, 240, 255, 0.35)" strokeWidth="1" />
            <line x1="31" y1="100" x2="31" y2="170" stroke="rgba(0, 240, 255, 0.5)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="31" cy="114" r="2" fill="#00F0FF" />
            <circle cx="31" cy="135" r="2.5" fill="#00F0FF" />
            <circle cx="31" cy="156" r="2" fill="#00F0FF" />
          </g>

          {/* 右侧动力排气口 (多孔排气环结构，无旋转文字溢出) */}
          <g>
            <rect x="878" y="96" width="22" height="78" rx="4" fill="rgba(0, 240, 255, 0.12)" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.5" />
            <rect x="883" y="104" width="12" height="62" rx="2" fill="rgba(0, 240, 255, 0.2)" stroke="rgba(0, 240, 255, 0.35)" strokeWidth="1" />
            <line x1="889" y1="100" x2="889" y2="170" stroke="rgba(0, 240, 255, 0.5)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="889" cy="114" r="2" fill="#00F0FF" />
            <circle cx="889" cy="135" r="2.5" fill="#00F0FF" />
            <circle cx="889" cy="156" r="2" fill="#00F0FF" />
          </g>

          {/* 核心耐压外舱壁 (宽屏完整舒展铺满) */}
          <rect
            x="42"
            y="18"
            width="836"
            height="234"
            rx="36"
            stroke="rgba(0, 240, 255, 0.55)"
            strokeWidth="2"
            fill="rgba(5, 12, 24, 0.78)"
          />
          <rect
            x="48"
            y="24"
            width="824"
            height="222"
            rx="30"
            stroke="rgba(0, 240, 255, 0.18)"
            strokeWidth="1"
            strokeDasharray="6 4"
            fill="none"
          />

          {/* 隔舱肋骨与隔离气密门 (Hatch A-B) - x: 320 */}
          <g>
            <line x1="320" y1="18" x2="320" y2="252" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1.5" strokeDasharray="6 3" />
            <rect x="312" y="108" width="16" height="54" rx="8" fill="#0B1C33" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.2" />
            <circle cx="320" cy="135" r="3.5" fill="#10B981" />
            <text x="320" y="174" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">HATCH A-B</text>
          </g>

          {/* 隔舱肋骨与隔离气密门 (Hatch B-C) - x: 600 */}
          <g>
            <line x1="600" y1="18" x2="600" y2="252" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1.5" strokeDasharray="6 3" />
            <rect x="592" y="108" width="16" height="54" rx="8" fill="#0B1C33" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.2" />
            <circle cx="600" cy="135" r="3.5" fill="#10B981" />
            <text x="600" y="174" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="JetBrains Mono">HATCH B-C</text>
          </g>

          {/* ============================================================== */}
          {/* SEC-A: 生保居住舱 (x: 42 ~ 320, 宽敞无挤压) */}
          {/* ============================================================== */}
          <g>
            <text x="65" y="46" fill="#00F0FF" fontSize="12" fontFamily="Orbitron" fontWeight="bold" letterSpacing="0.5">
              SEC-A 生保居住舱
            </text>
            <text x="65" y="59" fill="#64748B" fontSize="8.5" fontFamily="JetBrains Mono">
              HABITAT &amp; LIFE-SUPPORT
            </text>

            {/* SHT30 主测点 */}
            <circle cx="180" cy="106" r="10" fill={isAlarm ? '#F43F5E' : '#00F0FF'} className="animate-pulse" />
            <circle cx="180" cy="106" r="20" stroke={isAlarm ? '#F43F5E' : '#00F0FF'} strokeWidth="1.2" opacity="0.35" />
            <text x="180" y="128" textAnchor="middle" fill="#00F0FF" fontSize="10.5" fontFamily="JetBrains Mono" fontWeight="bold">
              SHT30 环控微气候主测点
            </text>

            {/* 遥测数据卡片 */}
            <rect x="85" y="136" width="190" height="56" rx="7" fill="rgba(6, 18, 38, 0.9)" stroke="rgba(0, 240, 255, 0.45)" strokeWidth="1" />
            <text x="100" y="156" fill="#E2E8F0" fontSize="11" fontFamily="JetBrains Mono">
              温度: <tspan fill="#00F0FF" fontWeight="bold">{temp}°C</tspan>
            </text>
            <text x="100" y="173" fill="#E2E8F0" fontSize="11" fontFamily="JetBrains Mono">
              湿度: <tspan fill="#60A5FA" fontWeight="bold">{humi}% RH</tspan>
            </text>
            <text x="100" y="186" fill="#10B981" fontSize="8.5" fontFamily="JetBrains Mono">
              ● 舱内生态: 适居优 (ECLSS标称)
            </text>
          </g>

          {/* ============================================================== */}
          {/* SEC-B: 实验载荷舱 (x: 320 ~ 600, 宽屏舒展，卡片加宽彻底消除溢出) */}
          {/* ============================================================== */}
          <g>
            <text x="340" y="46" fill="#00F0FF" fontSize="12" fontFamily="Orbitron" fontWeight="bold" letterSpacing="0.5">
              SEC-B 实验载荷舱
            </text>
            <text x="340" y="59" fill="#64748B" fontSize="8.5" fontFamily="JetBrains Mono">
              SCIENCE PAYLOAD RACKS
            </text>

            {/* BH1750 照度传感器 */}
            <g>
              <circle cx="410" cy="95" r="9" fill="#FF9900" />
              <circle cx="410" cy="95" r="16" stroke="#FF9900" strokeWidth="1" opacity="0.3" />
              <text x="430" y="99" fill="#FFB74D" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                BH1750 光照: {lux} Lux
              </text>
            </g>

            {/* MQ-2 气体传感器 */}
            <g>
              <circle cx="410" cy="128" r="9" fill={isAlarm ? '#F43F5E' : '#10B981'} className={isAlarm ? 'animate-ping' : ''} />
              <circle cx="410" cy="128" r="16" stroke={isAlarm ? '#F43F5E' : '#10B981'} strokeWidth="1" opacity="0.3" />
              <text x="430" y="132" fill={isAlarm ? '#F43F5E' : '#34D399'} fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                MQ-2 毒气烟雾: {gas} PPM
              </text>
            </g>

            {/* 解决红框溢出：卡片宽度增至 230px，文字精炼，留白宽裕 */}
            <rect x="345" y="148" width="230" height="42" rx="7" fill="rgba(6, 18, 38, 0.9)" stroke={isAlarm ? 'rgba(244, 63, 94, 0.6)' : 'rgba(16, 185, 129, 0.45)'} strokeWidth="1" />
            <text x="358" y="167" fill={isAlarm ? '#F43F5E' : '#34D399'} fontSize="10.5" fontFamily="JetBrains Mono" fontWeight="bold">
              {isAlarm ? '⚠️ 舱内气体异常超标告警' : '● 空气洁净度: 极佳 (ISO 14644)'}
            </text>
            <text x="358" y="182" fill="#94A3B8" fontSize="8.5" fontFamily="JetBrains Mono">
              实验机柜 RACK #01/#02: 正常供电
            </text>
          </g>

          {/* ============================================================== */}
          {/* SEC-C: 环控动力舱 (x: 600 ~ 880, 宽屏舒展，卡片加宽彻底消除溢出) */}
          {/* ============================================================== */}
          <g>
            <text x="620" y="46" fill="#00F0FF" fontSize="12" fontFamily="Orbitron" fontWeight="bold" letterSpacing="0.5">
              SEC-C 环控动力舱
            </text>
            <text x="620" y="59" fill="#64748B" fontSize="8.5" fontFamily="JetBrains Mono">
              ECLSS VENTILATION &amp; POWER
            </text>

            {/* 解决红框溢出：卡片宽度增至 230px，文案精炼对齐，绝不溢出 */}
            <rect x="620" y="68" width="230" height="38" rx="6" fill="rgba(6, 22, 48, 0.92)" stroke="rgba(0, 240, 255, 0.45)" strokeWidth="1" />
            <circle cx="634" cy="87" r="4" fill="#10B981" className="animate-pulse" />
            <text x="646" y="82" fill="#00F0FF" fontSize="10.5" fontFamily="JetBrains Mono" fontWeight="bold">
              ECLSS 催化净化与热控换热
            </text>
            <text x="646" y="97" fill="#94A3B8" fontSize="8.5" fontFamily="JetBrains Mono">
              供风净化率: 99.9% · 循环压差正常
            </text>

            {/* PWM 涡轮风机外圈与动叶轮 */}
            <circle cx="735" cy="146" r="32" stroke="#00F0FF" strokeWidth="2" fill="rgba(0, 240, 255, 0.07)" />
            <circle cx="735" cy="146" r="40" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1" strokeDasharray="4 4" />
            
            <g className={isMotor ? 'animate-spin origin-[735px_146px]' : ''} style={{ animationDuration: fanSpeed === 1 ? '1.5s' : fanSpeed === 2 ? '0.8s' : '0.35s' }}>
              <path d="M 735 146 L 735 120 A 6 6 0 0 1 743 127 Z" fill="#00F0FF" />
              <path d="M 735 146 L 761 146 A 6 6 0 0 1 754 156 Z" fill="#00F0FF" />
              <path d="M 735 146 L 735 172 A 6 6 0 0 1 727 165 Z" fill="#00F0FF" />
              <path d="M 735 146 L 709 146 A 6 6 0 0 1 716 136 Z" fill="#00F0FF" />
              <circle cx="735" cy="146" r="5" fill="#FFF" />
            </g>

            {/* 风机状态信息 */}
            <text x="735" y="195" textAnchor="middle" fill="#38BDF8" fontSize="10.5" fontFamily="JetBrains Mono" fontWeight="bold">
              PWM 涡轮主循环风机
            </text>
            <rect x="655" y="201" width="160" height="24" rx="5" fill="rgba(6, 18, 38, 0.85)" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1" />
            <text x="735" y="217" textAnchor="middle" fill="#E2E8F0" fontSize="9.5" fontFamily="JetBrains Mono">
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
