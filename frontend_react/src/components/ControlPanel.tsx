import React, { useState } from 'react';
import { Cpu, Wind, BellOff, Loader2, ShieldCheck, Lock, X, RefreshCw, Lightbulb } from 'lucide-react';
import { sendRemoteCommand } from '../services/api';
import { SystemState } from '../types/telemetry';
import { useAudioFeedback } from '../hooks/useAudioFeedback';

interface ControlPanelProps {
  systemState: SystemState;
  setSystemState: React.Dispatch<React.SetStateAction<SystemState>>;
  addLog: (msg: string, type?: 'info' | 'alarm' | 'cmd') => void;
  setOptimisticFanSpeed?: (speed: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ systemState, setSystemState, addLog, setOptimisticFanSpeed }) => {
  const [loadingMotor, setLoadingMotor] = useState(false);
  const [loadingMute, setLoadingMute] = useState(false);
  const [loadingReboot, setLoadingReboot] = useState(false);
  const [loadingLed, setLoadingLed] = useState(false);
  
  // Security Modal State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const { playClick } = useAudioFeedback();

  const requireAuth = (actionFn: () => void) => {
    if (isAuthorized) {
      actionFn();
    } else {
      setPendingAction(() => actionFn);
      setPinInput('');
      setPinError(false);
      setShowPinModal(true);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '123456') {
      setIsAuthorized(true);
      setShowPinModal(false);
      playClick();
      addLog('[AUTH SUCCESS] 控制指令安全密钥验证通过', 'info');
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      setPinError(true);
      setPinInput('');
      addLog('[AUTH FAILED] 控制指令安全密钥错误 (默认: 123456)', 'alarm');
    }
  };

  const handleSetFanSpeed = async (speed: number) => {
    playClick();
    const actionMap: Record<number, string> = {
      0: 'speed_0',
      1: 'speed_1',
      2: 'speed_2',
      3: 'speed_3',
      4: 'auto'
    };

    const action = actionMap[speed];
    if (!action) return;

    if (setOptimisticFanSpeed) {
      setOptimisticFanSpeed(speed);
    }

    setLoadingMotor(true);
    addLog(`[COMMAND PENDING] 下发风机调速 -> ${speed === 4 ? 'AUTO(4)' : `L${speed}`}...`, 'cmd');

    const res = await sendRemoteCommand({
      device_id: 'rk2206-station-01',
      target: 'fan',
      action: action as any
    });

    setLoadingMotor(false);
    if (res.ok) {
      addLog(`[COMMAND ACK] 目标已同步 L${speed} (ID: ${res.id})`, 'cmd');
    } else {
      addLog(`[COMMAND FAIL] 指令发送失败: ${res.msg}`, 'alarm');
    }
  };

  const handleMute = async () => {
    playClick();
    setLoadingMute(true);
    addLog('[COMMAND PENDING] 下发消警复位指令...', 'cmd');

    const res = await sendRemoteCommand({
      device_id: 'rk2206-station-01',
      target: 'alarm',
      action: 'ack'
    });

    setLoadingMute(false);
    if (res.ok) {
      setSystemState(prev => ({ ...prev, isMuted: true, isAlarmActive: false }));
      addLog(`[COMMAND ACK] 报警已解除静音 (ID: ${res.id})`, 'cmd');
    } else {
      addLog(`[COMMAND FAIL] 消警指令发送失败: ${res.msg}`, 'alarm');
    }
  };

  const handleReboot = async () => {
    playClick();
    setLoadingReboot(true);
    addLog('[COMMAND PENDING] 下发小凌派-RK2206 硬件重启指令...', 'cmd');

    const res = await sendRemoteCommand({
      device_id: 'rk2206-station-01',
      target: 'system',
      action: 'reboot'
    });

    setLoadingReboot(false);
    if (res.ok) {
      addLog(`[COMMAND ACK] 系统重启指令已下发 (ID: ${res.id})`, 'alarm');
    } else {
      addLog(`[COMMAND FAIL] 重启指令发送失败: ${res.msg}`, 'alarm');
    }
  };

  const handleToggleLed = async (turnOn: boolean) => {
    setLoadingLed(true);
    try {
      await sendRemoteCommand({
        device_id: 'rk2206-station-01',
        target: 'led',
        action: turnOn ? 'on' : 'off'
      });
      playClick();
      setSystemState(prev => ({
        ...prev,
        isLedOn: turnOn
      }));
      addLog(`[COMMAND ACK] 舱内照明与 PA5 告警灯已执行: ${turnOn ? '点亮 (ON)' : '熄灭 (OFF)'}`, 'cmd');
    } catch {
      addLog('[COMMAND FAILED] 舱内照明控制指令发送失败', 'alarm');
    } finally {
      setLoadingLed(false);
    }
  };

  const curSpeed = systemState.fanSpeed ?? (systemState.isMotorRunning ? 3 : 0);

  return (
    <>
      <div className="glass-panel rounded-xl p-3 flex flex-col gap-2.5 shrink-0 bg-[#060D1A]/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.06)]">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#00F0FF]" />
            <span className="font-hud text-sm font-bold text-slate-100 tracking-wider">
              执行器与闭环控制台
            </span>
          </div>
          <div>
            {isAuthorized ? (
              <span className="text-xs font-code px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 已授权
              </span>
            ) : (
              <span className="text-xs font-code px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> PIN保护
              </span>
            )}
          </div>
        </div>

        {/* 1. 排风风机控制 */}
        <div className="p-2.5 rounded-lg bg-[#080E1E]/80 border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wind className={`w-3.5 h-3.5 ${systemState.isMotorRunning ? 'text-[#00F0FF] animate-spin' : 'text-slate-500'}`} />
              <span className="text-xs font-semibold text-slate-300">舱内排风风机档位 (PWM)</span>
            </div>
            <span className={`text-xs font-code font-bold ${curSpeed === 0 ? 'text-slate-400' : 'text-[#00F0FF]'}`}>
              {curSpeed === 4 ? 'AUTO (自动温湿度闭环)' : (curSpeed === 0 ? '停机 (0%)' : `L${curSpeed} (${curSpeed === 1 ? '30%' : curSpeed === 2 ? '65%' : '100%'})`)}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 pt-0.5">
            {[
              { label: '0:停机', speed: 0 },
              { label: '1:30%', speed: 1 },
              { label: '2:65%', speed: 2 },
              { label: '3:100%', speed: 3 },
              { label: 'AUTO', speed: 4 }
            ].map(btn => (
              <button
                key={btn.speed}
                disabled={loadingMotor}
                onClick={() => requireAuth(() => handleSetFanSpeed(btn.speed))}
                className={`py-1.5 rounded-lg text-xs font-code font-bold transition-all border ${
                  curSpeed === btn.speed
                    ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 舱内照明与 PA5 警示灯控制 */}
        <div className="p-2.5 rounded-lg bg-[#080E1E]/80 border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Lightbulb className={`w-3.5 h-3.5 ${systemState.isLedOn ? 'text-amber-300 drop-shadow-[0_0_6px_#F59E0B]' : 'text-slate-500'}`} />
              <span className="text-xs font-semibold text-slate-300">舱内照明与 PA5 警示灯 (GPIO0_PA5)</span>
            </div>
            <span className={`text-xs font-code font-bold ${systemState.isLedOn ? 'text-amber-300' : 'text-slate-400'}`}>
              {systemState.isLedOn ? '● 已点亮 (ON)' : '○ 已熄灭 (OFF)'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              disabled={loadingLed}
              onClick={() => requireAuth(() => handleToggleLed(true))}
              className={`py-1.5 px-3 rounded-lg text-xs font-hud font-bold transition-all border flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 ${
                systemState.isLedOn
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-amber-500/50 hover:text-amber-300'
              }`}
            >
              {loadingLed ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3 text-amber-400" />}
              点亮照明 (ON)
            </button>

            <button
              disabled={loadingLed}
              onClick={() => requireAuth(() => handleToggleLed(false))}
              className={`py-1.5 px-3 rounded-lg text-xs font-hud font-bold transition-all border flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 ${
                !systemState.isLedOn
                  ? 'bg-slate-800/80 border-slate-600 text-slate-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {loadingLed ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="w-2 h-2 rounded-full bg-slate-600" />}
              熄灭照明 (OFF)
            </button>
          </div>
        </div>

        {/* 3. 紧急动作按钮组 */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => requireAuth(handleMute)}
            disabled={loadingMute}
            className="py-2 px-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-hud transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {loadingMute ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellOff className="w-3.5 h-3.5" />}
            应急消警 (K3 MUTE)
          </button>

          <button
            onClick={() => requireAuth(handleReboot)}
            disabled={loadingReboot}
            className="py-2 px-2.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs font-hud transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {loadingReboot ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            远程系统重启
          </button>
        </div>
      </div>

      {/* PIN Security Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl glass-panel p-5 border border-cyan-500/40 shadow-2xl flex flex-col gap-4 bg-[#0A1628]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-300 font-hud text-sm font-bold">
                <Lock className="w-4 h-4" /> 控制台安全验证
              </div>
              <button 
                onClick={() => setShowPinModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              当前为受控操作模式，请输入操作员安全密码（默认 <span className="font-mono text-cyan-300 font-bold">123456</span>）
            </p>

            <form onSubmit={handleVerifyPin} className="flex flex-col gap-3">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={e => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="请输入 6 位 PIN 码"
                className={`w-full px-3 py-2 rounded-lg bg-slate-950 border font-mono text-center tracking-widest text-lg focus:outline-none ${
                  pinError ? 'border-rose-500 text-rose-400' : 'border-slate-700 text-cyan-300 focus:border-cyan-400'
                }`}
                autoFocus
              />

              {pinError && (
                <span className="text-rose-400 text-xs text-center font-mono">
                  密码错误，请重试
                </span>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 font-bold text-xs shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                >
                  确认授权
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
