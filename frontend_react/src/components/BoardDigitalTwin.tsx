import React, { useState, useEffect } from 'react';
import { Cpu, RotateCw, Volume2, Activity, Gauge, Zap, BellRing, RefreshCw, Radio, ZapOff, CheckCircle2 } from 'lucide-react';
import { TelemetryData, SystemState } from '../types/telemetry';

interface BoardDigitalTwinProps {
  telemetry: TelemetryData | null;
  systemState: SystemState;
  onTriggerKey?: (key: 'K3' | 'K4' | 'K5' | 'K6') => void;
}

export const BoardDigitalTwin: React.FC<BoardDigitalTwinProps> = ({
  telemetry,
  systemState,
  onTriggerKey,
}) => {
  const [fanAngle, setFanAngle] = useState(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [holdMs, setHoldMs] = useState(0);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isSelfTesting, setIsSelfTesting] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);

  const holdStartRef = React.useRef<number | null>(null);
  const holdIntervalRef = React.useRef<any>(null);

  const isFanSpinning = isSelfTesting || systemState.isMotorRunning;
  const effectiveFanSpeed = isSelfTesting ? 3 : (telemetry?.fan_speed ?? (systemState.isMotorRunning ? 3 : 0));

  useEffect(() => {
    let step = 0;
    if (isSelfTesting) step = 30;
    else if (effectiveFanSpeed === 1) step = 6;
    else if (effectiveFanSpeed === 2) step = 14;
    else if (effectiveFanSpeed === 3) step = 28;
    else if (effectiveFanSpeed === 4) step = systemState.isMotorRunning ? 18 : 2;

    if (step === 0) return;

    const interval = setInterval(() => {
      setFanAngle((prev) => (prev + step) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [effectiveFanSpeed, isFanSpinning, isSelfTesting]);

  const handleKeyClick = (key: 'K3' | 'K4' | 'K5' | 'K6') => {
    setActiveKey(key);
    setTimeout(() => setActiveKey(null), 600);
    if (onTriggerKey) {
      onTriggerKey(key);
    }
  };

  const triggerGesture = (type: 'tap' | 'hold_test' | 'hold_rescan') => {
    if (type === 'tap') {
      const keyToTrigger = (systemState.isAlarmActive || isSelfTesting) ? 'K3' : 'K4';
      handleKeyClick(keyToTrigger);
      setActionFeedback(systemState.isAlarmActive ? '已消警 (K3)' : '调速换档 (K4)');
      setTimeout(() => setActionFeedback(null), 1500);
    } else if (type === 'hold_test') {
      setIsSelfTesting(true);
      setActionFeedback('声光自检运转中...');
      handleKeyClick('K5');
      setTimeout(() => {
        setIsSelfTesting(false);
        setActionFeedback(null);
      }, 3500);
    } else if (type === 'hold_rescan') {
      setIsRescanning(true);
      setActionFeedback('I2C 拓扑重扫中...');
      handleKeyClick('K6');
      setTimeout(() => {
        setIsRescanning(false);
        setActionFeedback(null);
      }, 2500);
    }
  };

  const startHold = () => {
    setIsHolding(true);
    setHoldMs(0);
    holdStartRef.current = Date.now();
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = setInterval(() => {
      if (holdStartRef.current) {
        setHoldMs(Date.now() - holdStartRef.current);
      }
    }, 40);
  };

  const endHold = () => {
    if (!isHolding || holdStartRef.current === null) return;
    const duration = Date.now() - holdStartRef.current;
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setIsHolding(false);
    setHoldMs(0);
    holdStartRef.current = null;

    if (duration >= 40 && duration < 1000) {
      triggerGesture('tap');
    } else if (duration >= 1000 && duration < 2500) {
      triggerGesture('hold_test');
    } else if (duration >= 2500 && duration <= 5000) {
      triggerGesture('hold_rescan');
    } else if (duration > 5000) {
      setActionFeedback('超时取消 (>5s)');
      setTimeout(() => setActionFeedback(null), 1200);
    }
  };

  const cancelHold = () => {
    if (isHolding) {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      setIsHolding(false);
      setHoldMs(0);
      holdStartRef.current = null;
    }
  };

  const temp = telemetry?.temperature ?? 25.4;
  const humi = telemetry?.humidity ?? 52.0;
  const lux = telemetry?.lux ?? 350;
  const gas = telemetry?.gas_ppm ?? 6.5;
  const pitch = telemetry?.pitch ?? 0.0;
  const roll = telemetry?.roll ?? 0.0;
  const totalG = Math.sqrt((telemetry?.accel_x || 0) ** 2 + (telemetry?.accel_y || 0) ** 2 + (telemetry?.accel_z || 1) ** 2);
  const fanSpeed = effectiveFanSpeed;
  const lastKey = activeKey || telemetry?.last_key || 'NONE';

  const isAlarmEffective = systemState.isAlarmActive || isSelfTesting;

  return (
    <div className="glass-panel rounded-xl p-3 flex flex-col justify-between h-full w-full relative overflow-hidden bg-[#060D1A]/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.06)]">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#00F0FF] animate-pulse" />
          <span className="font-hud text-sm font-bold text-slate-100 tracking-wider">
            小凌派-RK2206 实物板卡高精度数字孪生
          </span>
          <span className="text-xs font-mono px-2 py-0.5 bg-cyan-950/80 text-cyan-400 font-bold border border-cyan-500/40 rounded">
            Cortex-M4F @ 200MHz
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            WDT: ALIVE
          </span>
          <span className="text-slate-400">
            I2C0: 4 DEVICES ONLINE
          </span>
        </div>
      </div>

      {/* PCB 板卡主体视图 (饱满充实，绝无空洞) */}
      <div className="flex-1 relative flex items-center justify-center p-1 select-none w-full min-h-0 overflow-hidden my-1">
        <div className="w-full h-full bg-[#0A1628] border-2 border-cyan-500/40 rounded-2xl relative shadow-inner flex flex-col p-3 overflow-hidden justify-between">
          
          {/* 金手指插槽 */}
          <div className="absolute left-0 top-10 bottom-10 w-2 flex flex-col justify-between py-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-2 h-3 bg-amber-400/80 rounded-r-sm shadow-[0_0_3px_#F59E0B]" />
            ))}
          </div>
          <div className="absolute right-0 top-10 bottom-10 w-2 flex flex-col justify-between py-2 items-end">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-2 h-3 bg-amber-400/80 rounded-l-sm shadow-[0_0_3px_#F59E0B]" />
            ))}
          </div>

          {/* 丝印文字 */}
          <div className="flex justify-between items-center text-xs font-mono text-cyan-400/80 pb-1 border-b border-cyan-900/40 shrink-0">
            <span>LOCKZHINER RK2206 OPENHARMONY 3.0 LTS</span>
            <span>LZ_HM_RK2206_BOTTOM V1.4</span>
          </div>

          {/* 核心功能部件分块布局 */}
          <div className="flex-1 grid grid-cols-12 gap-2.5 my-1.5 min-h-0 items-stretch">
            
            {/* 左区：4 大硬件组件完全填满 (解决 P2 左侧大空白) */}
            <div className="col-span-3 flex flex-col justify-between gap-1.5 h-full">
              {/* 1. SoC 主控芯片 */}
              <div className="bg-[#050B14] border border-cyan-400/40 rounded-lg p-1.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-cyan-300">ROCKCHIP RK2206</span>
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                </div>
                <div className="mt-0.5 text-xs font-mono text-slate-200 flex flex-col gap-0.5">
                  <div className="flex justify-between"><span>CORE: 200MHz M4F</span><span className="text-emerald-400 font-bold">RTOS OK</span></div>
                  <div className="flex justify-between"><span>RAM: 256KB SRAM</span><span>FLASH: 8MB</span></div>
                  {/* CPU 实时模拟负载条 */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-slate-300 font-medium">CPU负载:</span>
                    <div className="flex-1 bg-slate-900 h-1.5 rounded overflow-hidden">
                      <div className="bg-cyan-400 h-full w-[24%]" />
                    </div>
                    <span className="text-cyan-300 font-bold text-xs">24%</span>
                  </div>
                </div>
              </div>

              {/* 2. 电源稳压管理模块 (填补原空白) */}
              <div className="bg-[#050B14] border border-slate-700/60 rounded-lg p-1 shadow-inner">
                <div className="flex items-center justify-between text-xs font-mono text-slate-200">
                  <span className="text-amber-300 font-bold">PMU 电源管理与时钟</span>
                  <span className="text-xs text-emerald-400 font-bold">● 3.3V / 1.2V</span>
                </div>
                <div className="text-xs font-mono text-slate-300 flex justify-between mt-0.5">
                  <span>RTC: 32.768kHz</span>
                  <span>稳压纹波: &lt;12mV</span>
                </div>
              </div>

              {/* 3. MPU6050 姿态传感器 */}
              <div className="bg-[#050B14] border border-blue-500/30 rounded-lg p-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-blue-300">
                  <span>MPU6050 6-AXIS IMU</span>
                  <Gauge className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex items-center justify-around py-0.5 font-mono text-xs">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-300 font-bold block">PITCH 俯仰</span>
                    <span className="text-cyan-300 font-black text-sm">{pitch >= 0 ? '+' : ''}{pitch.toFixed(1)}°</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-300 font-bold block">ROLL 滚转</span>
                    <span className="text-cyan-300 font-black text-sm">{roll >= 0 ? '+' : ''}{roll.toFixed(1)}°</span>
                  </div>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden flex items-center justify-center relative mt-0.5">
                  <div 
                    className="w-4 h-full bg-amber-400 rounded-full transition-transform" 
                    style={{ transform: `translateX(${pitch * 1.5}px)` }}
                  />
                </div>
              </div>

              {/* 4. 压电蜂鸣器与驱动输出 */}
              <div className={`border rounded-lg p-1.5 flex items-center justify-between transition-all ${
                isAlarmEffective 
                  ? 'bg-rose-950/60 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse' 
                  : 'bg-[#050B14] border-slate-800'
              }`}>
                <div className="flex items-center gap-2">
                  <Volume2 className={`w-4 h-4 ${isAlarmEffective ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
                  <div className="flex flex-col">
                    <span className="text-xs font-mono font-bold text-slate-200">PIEZO BUZZER 蜂鸣器</span>
                    <span className="text-xs font-mono text-slate-300">
                      {isAlarmEffective ? '4kHz PWM 蜂鸣报警' : 'STANDBY (待机)'}
                    </span>
                  </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  isAlarmEffective ? 'bg-rose-500 animate-ping' : 'bg-slate-700'
                }`} />
              </div>
            </div>

            {/* 中区：LCD 屏幕实物数字镜面 (四象限数据饱满充实，解决 P2 LCD 内部空白) */}
            <div className="col-span-5 bg-[#000814] border-2 border-cyan-400/60 rounded-xl p-2.5 flex flex-col justify-between shadow-[0_0_20px_rgba(0,240,255,0.2)] relative overflow-hidden h-full">
              {/* LCD 顶栏 */}
              <div className="bg-[#001F3F] text-xs font-mono font-bold px-2.5 py-1.5 rounded flex items-center justify-between text-cyan-200 shrink-0">
                <span className="text-amber-300">CSS-01 鸿蒙空间站</span>
                <span>T:{temp.toFixed(1)}°C H:{humi.toFixed(0)}%</span>
                <span className="text-emerald-300">WDT:OK *</span>
              </div>

              {/* LCD 状态视窗 */}
              {isSelfTesting ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-rose-950/40 border border-rose-500/80 rounded-lg p-3 my-1 text-center font-mono animate-pulse">
                  <span className="text-sm font-bold text-amber-300">⚠️ [声光自检测试模式]</span>
                  <span className="text-xs text-rose-200 mt-2 font-bold">蜂鸣器 4kHz 鸣叫 / LED D1 / 风机全速</span>
                  <span className="text-[10px] text-slate-400 mt-1">硬件自检通路状态正常 · 3.5秒自动复位</span>
                </div>
              ) : isRescanning ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-purple-950/40 border border-purple-500/80 rounded-lg p-3 my-1 text-center font-mono animate-pulse">
                  <span className="text-sm font-bold text-cyan-300">📡 [I2C0 总线寻址扫描]</span>
                  <span className="text-xs text-emerald-300 mt-2 font-bold">0x44:SHT30 0x23:BH1750 0x68:MPU 0x51:RTC</span>
                  <span className="text-[10px] text-purple-200 mt-1">总线拓扑扫描完毕：4 枚从设备在线响应</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 my-1 flex-1">
                  {/* 象限 1: 环境感知温湿度 (丰富排布) */}
                  <div className="bg-[#001020] border border-cyan-900/60 rounded-lg p-1.5 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-cyan-300 font-mono font-bold">● SHT30 温湿感知</span>
                      <span className="text-[10px] text-slate-400 font-mono">0x44</span>
                    </div>
                    <div className="my-0.5">
                      <div className="text-base font-mono font-black text-slate-100">
                        {temp.toFixed(1)} <span className="text-[10px] text-cyan-300 font-normal">°C</span> / {humi.toFixed(0)} <span className="text-[10px] text-blue-300 font-normal">%RH</span>
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        光照: <span className="text-amber-300 font-bold">{Math.round(lux)}lx</span> · 露点: 16.2°C
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 flex items-center justify-between border-t border-cyan-950/80 pt-0.5 font-medium">
                      <span>环控评级: 适居优</span>
                      <span>采样: 500ms</span>
                    </div>
                  </div>

                  {/* 象限 2: 六轴姿态与惯导 (丰富排布) */}
                  <div className="bg-[#001020] border border-cyan-900/60 rounded-lg p-1.5 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-cyan-300 font-mono font-bold">● MPU6050 姿态仪</span>
                      <span className="text-[10px] text-slate-400 font-mono">0x68</span>
                    </div>
                    <div className="my-0.5">
                      <div className="text-base font-mono font-black text-cyan-300">
                        P:{pitch >= 0 ? '+' : ''}{pitch.toFixed(1)}° <span className="text-slate-500">|</span> R:{roll >= 0 ? '+' : ''}{roll.toFixed(1)}°
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        微重力过载: <span className="text-emerald-300 font-bold">{totalG.toFixed(2)}g</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 flex items-center justify-between border-t border-cyan-950/80 pt-0.5 font-medium">
                      <span>DMP 姿态解算: 锁定</span>
                      <span>航向: 稳定</span>
                    </div>
                  </div>

                  {/* 象限 3: 环控动力与烟雾毒气 (丰富排布) */}
                  <div className="bg-[#001020] border border-cyan-900/60 rounded-lg p-1.5 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-cyan-300 font-mono font-bold">● 环控动力与排风</span>
                      <span className="text-[10px] text-slate-400 font-mono">PWM_PB7</span>
                    </div>
                    <div className="my-0.5">
                      <div className="text-base font-mono font-black text-emerald-300">
                        {fanSpeed === 4 ? 'AUTO' : `L${fanSpeed}`} <span className="text-[10px] text-slate-300 font-normal">({isFanSpinning ? `${fanSpeed * 1500 || 4500}RPM` : '0 RPM'})</span>
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        烟雾浓度: <span className="text-emerald-400 font-bold">{gas.toFixed(1)} PPM</span> (安全)
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 flex items-center justify-between border-t border-cyan-950/80 pt-0.5 font-medium">
                      <span>风量: {isFanSpinning ? (fanSpeed * 120 + 180) : 0}m³/h</span>
                      <span className={isFanSpinning ? 'text-emerald-400 font-bold' : ''}>{isFanSpinning ? '运转中' : '待命'}</span>
                    </div>
                  </div>

                  {/* 象限 4: 物理总线与按键控制 (丰富排布) */}
                  <div className="bg-[#001020] border border-cyan-900/60 rounded-lg p-1.5 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-cyan-300 font-mono font-bold">● 总线与实体微动</span>
                      <span className="text-[10px] text-slate-400 font-mono">GPIO0_PC7</span>
                    </div>
                    <div className="my-0.5">
                      <div className="text-base font-mono font-black text-purple-300">
                        KEY: {lastKey}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        I2C0 从机: <span className="text-emerald-400 font-bold">4/4 在线响应</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 flex items-center justify-between border-t border-cyan-950/80 pt-0.5 font-medium">
                      <span>通信速率: 400kHz</span>
                      <span className="text-emerald-400">ACK 畅通</span>
                    </div>
                  </div>
                </div>
              )}

              {/* LCD 底栏 */}
              <div className="bg-[#001428] text-xs font-mono px-2.5 py-1.5 rounded flex items-center justify-between text-slate-300 shrink-0">
                <span className="text-slate-400">MISSION STATUS:</span>
                <span className={`font-bold ${isAlarmEffective ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  {isSelfTesting ? '● HARDWARE SELF-TESTING' : (systemState.isAlarmActive ? '● ALARM TRIGGERED' : '● NORMAL AUTONOMOUS MONITOR')}
                </span>
              </div>
            </div>

            {/* 右区：电机风扇 + KEY K3 微动开关 (消除 P2 圈出的空白) */}
            <div className="col-span-4 flex flex-col justify-between gap-1.5 h-full">
              {/* 电机风扇控制视窗 */}
              <div className="bg-[#050B14] border border-cyan-500/40 rounded-lg p-1.5 flex items-center justify-between shadow-inner">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold font-mono text-cyan-300">PWM VENT FAN 散热排风</span>
                  <span className="text-xs font-mono text-slate-200">
                    转速: <span className="text-emerald-300 font-bold">{isFanSpinning ? `${fanSpeed * 1500 || 4500} RPM` : '0 RPM (停转)'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">PIN: PD0 / PWM_PB7</span>
                </div>
                <div className="w-10 h-10 rounded-full border border-cyan-500/50 bg-[#001020] flex items-center justify-center relative overflow-hidden shrink-0">
                  <svg 
                    className="w-9 h-9" 
                    viewBox="0 0 100 100" 
                    style={{ transform: `rotate(${fanAngle}deg)` }}
                  >
                    <circle cx="50" cy="50" r="12" fill="#FFF" />
                    <path d="M 50 50 L 50 15 A 10 10 0 0 1 65 25 Z" fill="#00F0FF" />
                    <path d="M 50 50 L 85 50 A 10 10 0 0 1 75 65 Z" fill="#00F0FF" />
                    <path d="M 50 50 L 50 85 A 10 10 0 0 1 35 75 Z" fill="#00F0FF" />
                    <path d="M 50 50 L 15 50 A 10 10 0 0 1 25 35 Z" fill="#00F0FF" />
                  </svg>
                </div>
              </div>

              {/* K3 微动开关操作区 (布局紧凑紧密，上下充实) */}
              <div className="bg-[#050B14] border border-cyan-500/40 rounded-lg p-2 flex flex-col justify-between flex-1 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm font-hud text-cyan-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    KEY K3 复合微动开关
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/40">
                    GPIO0_PC7
                  </span>
                </div>

                {/* 仿真贴片微动开关 (蓄力长按) */}
                <button
                  onMouseDown={startHold}
                  onMouseUp={endHold}
                  onMouseLeave={cancelHold}
                  onTouchStart={startHold}
                  onTouchEnd={endHold}
                  className={`w-full py-2 px-3 rounded-xl border font-mono transition-all flex flex-col items-center justify-center my-1 select-none cursor-pointer ${
                    isHolding || activeKey === 'K3' || activeKey === 'K4' || activeKey === 'K5' || activeKey === 'K6'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'bg-[#0A1628] border-cyan-500/50 hover:border-cyan-300 text-slate-100'
                  }`}
                >
                  <span className="text-sm font-hud font-bold tracking-wide">
                    {isHolding ? `蓄力中 ${(holdMs/1000).toFixed(1)}s` : (actionFeedback || '按住 K3 开关蓄力 (松手触发)')}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 mt-0.5">短按调速 / 长按自检重扫</span>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-75 ${
                        holdMs >= 2500 ? 'bg-purple-400' : (holdMs >= 1000 ? 'bg-amber-400' : 'bg-cyan-400')
                      }`}
                      style={{ width: `${Math.min(100, (holdMs / 3000) * 100)}%` }}
                    />
                  </div>
                </button>

                {/* 快捷手势点选区 (短按调速消警、长按自检、长按重扫) */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => triggerGesture('tap')}
                    className="w-full py-1 px-2.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/60 rounded-lg flex items-center justify-between font-mono transition-all active:scale-95"
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs font-bold text-cyan-200">短按单击 (&lt;1s)</span>
                    </div>
                    <span className="text-xs font-bold text-cyan-300 bg-cyan-900/80 px-2 py-0.5 rounded">
                      调速 / 消警
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => triggerGesture('hold_test')}
                      className={`py-1.5 px-1.5 rounded-lg flex flex-col items-center justify-center font-mono transition-all active:scale-95 border ${
                        isSelfTesting
                          ? 'bg-amber-500/40 border-amber-300 text-amber-100 shadow-[0_0_12px_#F59E0B] animate-pulse'
                          : 'bg-amber-950/50 hover:bg-amber-900/70 border-amber-500/60 text-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs font-bold">
                        <BellRing className={`w-3.5 h-3.5 text-amber-400 ${isSelfTesting ? 'animate-bounce' : ''}`} />
                        {isSelfTesting ? '自检中(3s)' : '长按自检(1.2s)'}
                      </div>
                      <span className="text-xs text-amber-200/90 mt-0.5 font-sans font-medium">
                        声光报警测试
                      </span>
                    </button>

                    <button
                      onClick={() => triggerGesture('hold_rescan')}
                      className={`py-1.5 px-1.5 rounded-lg flex flex-col items-center justify-center font-mono transition-all active:scale-95 border ${
                        isRescanning
                          ? 'bg-purple-500/40 border-purple-300 text-purple-100 shadow-[0_0_12px_#C084FC] animate-pulse'
                          : 'bg-purple-950/50 hover:bg-purple-900/70 border-purple-500/60 text-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs font-bold">
                        <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isRescanning ? 'animate-spin' : ''}`} />
                        {isRescanning ? '重扫中(2s)' : '长按重扫(3.0s)'}
                      </div>
                      <span className="text-xs text-purple-200/90 mt-0.5 font-sans font-medium">
                        I2C 传感器重扫
                      </span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* 底部指示灯 */}
          <div className="flex items-center justify-between pt-1.5 border-t border-cyan-900/40 text-xs font-mono text-slate-200 shrink-0">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isAlarmEffective || systemState.isLedOn ? 'bg-rose-500 shadow-[0_0_8px_#F43F5E] animate-ping' : 'bg-slate-700'}`} />
                PA5 照明/告警 (D1)
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isFanSpinning ? 'bg-cyan-400 shadow-[0_0_8px_#00F0FF]' : 'bg-slate-700'}`} />
                PD0 电机驱动 (D2)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981] animate-pulse" />
                3.3V 稳压供电
              </span>
            </div>
            <div className="text-xs text-cyan-400 font-bold">
              CLICK KEY TO INTERACT
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
