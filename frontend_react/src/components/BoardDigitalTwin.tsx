import React, { useState, useEffect } from 'react';
import { Cpu, Wifi, RotateCw, Volume2, ShieldCheck, Activity, Gauge } from 'lucide-react';
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
  const holdStartRef = React.useRef<number | null>(null);
  const holdIntervalRef = React.useRef<any>(null);

  // 根据风机档位动态驱动风扇叶片旋转
  useEffect(() => {
    const speed = telemetry?.fan_speed ?? (systemState.isMotorRunning ? 3 : 0);
    let step = 0;
    if (speed === 1) step = 6;
    else if (speed === 2) step = 14;
    else if (speed === 3) step = 28;
    else if (speed === 4) step = systemState.isMotorRunning ? 18 : 2; // AUTO

    if (step === 0) return;

    const interval = setInterval(() => {
      setFanAngle((prev) => (prev + step) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [telemetry?.fan_speed, systemState.isMotorRunning]);

  const handleKeyClick = (key: 'K3' | 'K4' | 'K5' | 'K6') => {
    setActiveKey(key);
    setTimeout(() => setActiveKey(null), 500);
    if (onTriggerKey) {
      onTriggerKey(key);
    }
  };

  const triggerGesture = (type: 'tap' | 'hold_test' | 'hold_rescan') => {
    if (type === 'tap') {
      const keyToTrigger = systemState.isAlarmActive ? 'K3' : 'K4';
      handleKeyClick(keyToTrigger);
      setActionFeedback(systemState.isAlarmActive ? '已消警 (K3)' : '换档调速 (K4)');
    } else if (type === 'hold_test') {
      handleKeyClick('K5');
      setActionFeedback('报警自检 (K5)');
    } else if (type === 'hold_rescan') {
      handleKeyClick('K6');
      setActionFeedback('I2C 重扫 (K6)');
    }
    setTimeout(() => setActionFeedback(null), 1600);
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
      setActionFeedback('已超时取消 (>5s)');
      setTimeout(() => setActionFeedback(null), 1500);
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

  const getHoldHint = (ms: number) => {
    if (ms < 1000) return '松手: 调速/消警';
    if (ms < 2500) return '松手: 声光自检';
    if (ms <= 5000) return '松手: I2C重扫';
    return '已超时(松手取消)';
  };

  const getHoldTitle = (ms: number) => {
    if (ms < 1000) return `蓄力 ${(ms / 1000).toFixed(1)}s [调速]`;
    if (ms < 2500) return `蓄力 ${(ms / 1000).toFixed(1)}s [自检]`;
    if (ms <= 5000) return `蓄力 ${(ms / 1000).toFixed(1)}s [重扫]`;
    return `蓄力 ${(ms / 1000).toFixed(1)}s [取消]`;
  };

  const temp = telemetry?.temperature ?? 25.4;
  const humi = telemetry?.humidity ?? 52.0;
  const lux = telemetry?.lux ?? 350;
  const gas = telemetry?.gas_ppm ?? 6.5;
  const pitch = telemetry?.pitch ?? 0.0;
  const roll = telemetry?.roll ?? 0.0;
  const fanSpeed = telemetry?.fan_speed ?? 4;
  const lastKey = activeKey || telemetry?.last_key || 'NONE';

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col h-[480px] relative overflow-hidden bg-[#060D1A]/90 border border-cyan-500/30">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#00F0FF] animate-pulse" />
          <span className="font-hud text-sm font-bold text-slate-100 tracking-wider">
            小凌派-RK2206 实物开发板高精度数字孪生 (HARDWARE TWIN)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 rounded">
            Cortex-M4F @ 200MHz
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            WDT: ALIVE
          </span>
          <span className="text-slate-400">
            I2C: SHT30/BH1750/MPU6050
          </span>
        </div>
      </div>

      {/* PCB 板卡主体视图 */}
      <div className="flex-1 relative flex items-center justify-center p-2 select-none">
        {/* PCB 底板底纹与外框 */}
        <div className="w-full max-w-[700px] h-[380px] bg-[#0A1628] border-2 border-cyan-500/40 rounded-2xl relative shadow-[0_0_30px_rgba(0,240,255,0.15)] flex flex-col p-4 overflow-hidden">
          
          {/* 金手指插槽仿真 (Edge Connectors) */}
          <div className="absolute left-0 top-12 bottom-12 w-2 flex flex-col justify-between py-2">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="w-2 h-3 bg-amber-400/80 rounded-r-sm shadow-[0_0_3px_#F59E0B]" />
            ))}
          </div>
          <div className="absolute right-0 top-12 bottom-12 w-2 flex flex-col justify-between py-2 items-end">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="w-2 h-3 bg-amber-400/80 rounded-l-sm shadow-[0_0_3px_#F59E0B]" />
            ))}
          </div>

          {/* 丝印文字 (Silkscreen) */}
          <div className="flex justify-between items-center text-[9px] font-mono text-cyan-400/60 pb-1 border-b border-cyan-900/40">
            <span>LOCKZHINER RK2206 OPENHARMONY 3.0 LTS</span>
            <span>LZ_HM_RK2206_BOTTOM V1.4</span>
          </div>

          {/* 核心功能部件分块布局 */}
          <div className="flex-1 grid grid-cols-12 gap-3 mt-2">
            
            {/* 左区：SoC 主控 + 姿态 MPU6050 + 蜂鸣器 (4 列) */}
            <div className="col-span-4 flex flex-col justify-between space-y-2">
              {/* RK2206 SoC 芯片 */}
              <div className="bg-[#050B14] border border-cyan-400/40 rounded-lg p-2.5 relative shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-cyan-300">ROCKCHIP RK2206</span>
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                </div>
                <div className="mt-1 text-[9px] font-mono text-slate-400 flex flex-col gap-0.5">
                  <span>CORE: 200MHz M4F</span>
                  <span>RTOS: LiteOS-M</span>
                  <span className="text-emerald-400">STATUS: RUNNING</span>
                </div>
                {/* 芯片引脚微纹理 */}
                <div className="absolute -left-1 top-2 bottom-2 w-0.5 bg-amber-400/50" />
                <div className="absolute -right-1 top-2 bottom-2 w-0.5 bg-amber-400/50" />
              </div>

              {/* MPU6050 姿态罗盘小视窗 */}
              <div className="bg-[#050B14] border border-blue-500/30 rounded-lg p-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[9px] font-mono text-blue-300">
                  <span>MPU6050 ATTITUDE</span>
                  <Gauge className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex items-center justify-around py-1 font-mono text-[10px]">
                  <div className="text-center">
                    <span className="text-slate-400 text-[8px] block">PITCH</span>
                    <span className="text-cyan-300 font-bold">{pitch >= 0 ? '+' : ''}{pitch.toFixed(1)}°</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-400 text-[8px] block">ROLL</span>
                    <span className="text-cyan-300 font-bold">{roll >= 0 ? '+' : ''}{roll.toFixed(1)}°</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex items-center justify-center relative">
                  <div 
                    className="w-4 h-1 bg-amber-400 rounded-full transition-transform" 
                    style={{ transform: `translateX(${pitch * 1.5}px)` }}
                  />
                </div>
              </div>

              {/* 蜂鸣器与警报指示 */}
              <div className={`border rounded-lg p-2 flex items-center justify-between transition-all ${
                systemState.isAlarmActive 
                  ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]' 
                  : 'bg-[#050B14] border-slate-800'
              }`}>
                <div className="flex items-center gap-2">
                  <Volume2 className={`w-4 h-4 ${systemState.isAlarmActive ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono font-bold text-slate-200">PIEZO BUZZER</span>
                    <span className="text-[8px] font-mono text-slate-400">
                      {systemState.isAlarmActive ? '1000/2000Hz SIREN' : 'STANDBY'}
                    </span>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  systemState.isAlarmActive ? 'bg-rose-500 animate-ping' : 'bg-slate-700'
                }`} />
              </div>
            </div>

            {/* 中区：320x240 LCD 实体屏显数字镜面 (5 列) */}
            <div className="col-span-5 bg-[#000814] border-2 border-cyan-400/60 rounded-xl p-2.5 flex flex-col justify-between shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              {/* LCD 顶栏 */}
              <div className="bg-[#001F3F] text-[9px] font-mono font-bold px-2 py-1 rounded flex items-center justify-between text-cyan-200">
                <span className="text-amber-300">CSS-01 鸿蒙空间站</span>
                <span>T:{temp.toFixed(1)}°C H:{humi.toFixed(0)}%</span>
                <span className="text-emerald-300">WDT:OK *</span>
              </div>

              {/* LCD 四象限仪表 */}
              <div className="grid grid-cols-2 gap-1.5 py-1 text-[9px] font-mono">
                {/* 象限 1：传感器 */}
                <div className="bg-[#071326] border border-cyan-500/20 p-1.5 rounded">
                  <span className="text-cyan-400 block text-[8px]">ENV SENSORS</span>
                  <div className="flex justify-between text-slate-200 mt-0.5">
                    <span>L:{lux.toFixed(0)}lx</span>
                    <span>G:{gas.toFixed(1)}p</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded mt-1 overflow-hidden">
                    <div className="bg-cyan-400 h-full" style={{ width: `${Math.min(100, (temp / 40) * 100)}%` }} />
                  </div>
                </div>

                {/* 象限 2：姿态 */}
                <div className="bg-[#071326] border border-cyan-500/20 p-1.5 rounded">
                  <span className="text-cyan-400 block text-[8px]">ATTITUDE MPU</span>
                  <div className="text-slate-200 mt-0.5">
                    P:{pitch >= 0 ? '+' : ''}{pitch.toFixed(1)}° R:{roll >= 0 ? '+' : ''}{roll.toFixed(1)}°
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded mt-1 flex items-center justify-center">
                    <div className="w-2 h-1 bg-amber-400" style={{ transform: `rotate(${roll}deg)` }} />
                  </div>
                </div>

                {/* 象限 3：风机 */}
                <div className="bg-[#071326] border border-cyan-500/20 p-1.5 rounded">
                  <span className="text-cyan-400 block text-[8px]">VENT FAN</span>
                  <span className="text-emerald-300 block mt-0.5 font-bold">
                    {fanSpeed === 4 ? 'AUTO 温控' : `MODE: L${fanSpeed}`}
                  </span>
                  <div className="text-[8px] text-slate-400">
                    {systemState.isMotorRunning ? 'RUNNING (PWM)' : 'OFF'}
                  </div>
                </div>

                {/* 象限 4：按键与总线 */}
                <div className="bg-[#071326] border border-cyan-500/20 p-1.5 rounded flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400 block text-[8px] font-bold">KEY K3 & I2C</span>
                    <span className="text-[7px] text-amber-400/90 font-mono">GPIO0_PC7</span>
                  </div>
                  <span className="text-amber-300 block mt-0.5 font-bold truncate">
                    {isHolding 
                      ? (holdMs < 1000 ? '>> K3: FAN CYCLE <<' : (holdMs < 2500 ? '>> K3: ALARM TEST <<' : '>> K3: I2C RESCAN <<'))
                      : (actionFeedback || (activeKey ? `>> KEY ${activeKey} <<` : (systemState.isMuted ? '>> MUTED <<' : `FAN: L${fanSpeed}`)))}
                  </span>
                  <div className="text-[7.5px] text-slate-400 flex justify-between">
                    <span>TAP:CYCLE</span>
                    <span className="text-cyan-300">HOLD:TEST</span>
                  </div>
                </div>
              </div>

              {/* 空间站状态标语 (消除残影字符) */}
              <div className="bg-[#000d1a] border border-cyan-900/60 rounded px-2 py-0.5 flex items-center justify-between font-mono text-[8.5px]">
                <span className="text-slate-400">STATUS:</span>
                {systemState.isAlarmActive ? (
                  <span className="text-rose-400 font-bold animate-pulse">警报 ALARM CRITICAL</span>
                ) : systemState.isMuted ? (
                  <span className="text-cyan-300 font-bold">静音 MUTED LATCHED</span>
                ) : (
                  <span className="text-emerald-400 font-bold">正常 NORMAL MONITOR</span>
                )}
              </div>

              {/* LCD 底栏：单键多功能手势引导 */}
              <div className="bg-[#001026] text-[8px] font-mono text-cyan-300/90 px-2 py-0.5 rounded flex items-center justify-between border-t border-cyan-900/50">
                <span className="text-amber-300 font-bold">[KEY K3 复合控制]</span>
                <span className="text-slate-300">短按:调速/消警 | 长按:自检/重扫</span>
              </div>
            </div>

            {/* 右区：PWM 硬件调速风扇 + K3单键多功能控制器 (3 列) */}
            <div className="col-span-3 flex flex-col justify-between space-y-2">
              
              {/* PWM 硬件无刷排风风机 */}
              <div className="bg-[#050B14] border border-cyan-500/30 rounded-lg p-2.5 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-[9px] font-mono text-slate-400 absolute top-1.5 left-2">
                  PWM VENT FAN
                </span>
                
                {/* 旋转风扇叶片 SVG */}
                <div className="relative w-16 h-16 my-1 flex items-center justify-center">
                  <div 
                    className="w-14 h-14 rounded-full border border-cyan-500/40 flex items-center justify-center transition-transform"
                    style={{ transform: `rotate(${fanAngle}deg)` }}
                  >
                    <svg className="w-12 h-12" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="10" fill="#00F0FF" />
                      <path d="M 50 50 L 50 15 A 10 10 0 0 1 65 25 Z" fill="#00F0FF" opacity="0.85" />
                      <path d="M 50 50 L 85 50 A 10 10 0 0 1 75 65 Z" fill="#00F0FF" opacity="0.85" />
                      <path d="M 50 50 L 50 85 A 10 10 0 0 1 35 75 Z" fill="#00F0FF" opacity="0.85" />
                      <path d="M 50 50 L 15 50 A 10 10 0 0 1 25 35 Z" fill="#00F0FF" opacity="0.85" />
                    </svg>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-center">
                  <span className={`font-bold ${systemState.isMotorRunning ? 'text-cyan-300' : 'text-slate-500'}`}>
                    {fanSpeed === 4 ? 'AUTO (温控)' : (fanSpeed === 0 ? '0 RPM (停机)' : `L${fanSpeed} 档`)}
                  </span>
                </div>
              </div>

              {/* K3 单键多功能微动开关 (GPIO0_PC7, 硬件上拉, 松手触发模式) */}
              <div className="bg-[#050B14] border border-cyan-500/30 rounded-lg p-2 flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-center text-[9px] font-mono mb-1">
                  <span className="font-bold text-cyan-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    KEY K3 控制器
                  </span>
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                    GPIO0_PC7
                  </span>
                </div>
                
                {/* 仿真贴片微动开关实体按键 (支持鼠标长按蓄力与松手触发) */}
                <div className="relative my-0.5 flex flex-col items-center">
                  <button
                    onMouseDown={startHold}
                    onMouseUp={endHold}
                    onMouseLeave={cancelHold}
                    onTouchStart={startHold}
                    onTouchEnd={endHold}
                    className={`w-full py-2 px-2 rounded-lg border font-mono transition-all flex flex-col items-center justify-center relative select-none cursor-pointer ${
                      isHolding || activeKey === 'K3' || activeKey === 'K4' || activeKey === 'K5' || activeKey === 'K6'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-[0.98]'
                        : 'bg-[#0A1628] border-cyan-500/40 hover:border-cyan-300 text-slate-200 hover:shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                        isHolding
                          ? 'bg-amber-400 border-amber-200 shadow-[0_0_8px_#F59E0B]'
                          : 'bg-cyan-950 border-cyan-400'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isHolding ? 'bg-slate-950 animate-ping' : 'bg-cyan-400'}`} />
                      </div>
                      <span className="text-[10.5px] font-hud font-bold tracking-wider">
                        {isHolding ? getHoldTitle(holdMs) : (actionFeedback || 'K3 实体轻触开关')}
                      </span>
                    </div>

                    {/* 按住实时蓄力进度条 */}
                    <div className="w-full bg-slate-900/90 h-1.5 rounded-full mt-1.5 overflow-hidden border border-cyan-950">
                      <div 
                        className={`h-full transition-all duration-75 ${
                          holdMs >= 2500 ? 'bg-purple-400 shadow-[0_0_6px_#C084FC]' : (holdMs >= 1000 ? 'bg-amber-400 shadow-[0_0_6px_#F59E0B]' : 'bg-cyan-400')
                        }`}
                        style={{ width: `${Math.min(100, (holdMs / 3000) * 100)}%` }}
                      />
                    </div>

                    {/* 实时手势判定提示 */}
                    <div className="text-[7.5px] font-mono text-slate-400 mt-1 flex justify-between w-full px-0.5">
                      <span>{isHolding ? `蓄力 ${(holdMs / 1000).toFixed(1)}s` : '支持按住蓄力'}</span>
                      <span className={isHolding ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                        {isHolding ? getHoldHint(holdMs) : '松手判定触发'}
                      </span>
                    </div>
                  </button>
                </div>

                {/* 快速手势点选药丸 (为方便点击，也可直接单击指定手势) */}
                <div className="grid grid-cols-3 gap-1 mt-1">
                  <button
                    onClick={() => triggerGesture('tap')}
                    className="py-1 px-0.5 bg-slate-900/90 hover:bg-cyan-950/70 border border-cyan-800/60 hover:border-cyan-400 rounded text-center font-mono transition-all active:scale-95"
                    title="短按单击 (<1s)：循环切换风机档位 / 发生警报时消警静音"
                  >
                    <div className="text-[8px] font-bold text-cyan-300">短按单击</div>
                    <div className="text-[7px] text-slate-400">调速/消警</div>
                  </button>
                  <button
                    onClick={() => triggerGesture('hold_test')}
                    className="py-1 px-0.5 bg-slate-900/90 hover:bg-amber-950/70 border border-amber-800/60 hover:border-amber-400 rounded text-center font-mono transition-all active:scale-95"
                    title="长按 (1.0~2.5s)：声光自检与振动电机测试模式"
                  >
                    <div className="text-[8px] font-bold text-amber-300">长按自检</div>
                    <div className="text-[7px] text-slate-400">1.2s 声光</div>
                  </button>
                  <button
                    onClick={() => triggerGesture('hold_rescan')}
                    className="py-1 px-0.5 bg-slate-900/90 hover:bg-purple-950/70 border border-purple-800/60 hover:border-purple-400 rounded text-center font-mono transition-all active:scale-95"
                    title="超长按 (2.5~5.0s)：I2C0 传感器总线动态重扫"
                  >
                    <div className="text-[8px] font-bold text-purple-300">长按重扫</div>
                    <div className="text-[7px] text-slate-400">3.0s 总线</div>
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* 底部板载状态指示灯组 (LEDs) */}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-cyan-900/40 text-[9px] font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${systemState.isAlarmActive ? 'bg-rose-500 shadow-[0_0_6px_#F43F5E]' : 'bg-slate-700'}`} />
                PA5 告警灯 (D1)
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${systemState.isMotorRunning ? 'bg-cyan-400 shadow-[0_0_6px_#00F0FF]' : 'bg-slate-700'}`} />
                PD0 电机驱动 (D2)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981] animate-pulse" />
                3.3V 稳压电源
              </span>
            </div>
            <div className="text-[8px] text-cyan-400/80">
              CLICK KEYPAD TO INTERACT
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
