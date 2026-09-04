import React, { useState } from 'react';
import { Cpu, Wind, BellOff, Loader2, ShieldCheck, Lock, X, RefreshCw } from 'lucide-react';
import { sendRemoteCommand } from '../services/api';
import { SystemState } from '../types/telemetry';
import { useAudioFeedback } from '../hooks/useAudioFeedback';

interface ControlPanelProps {
  systemState: SystemState;
  setSystemState: React.Dispatch<React.SetStateAction<SystemState>>;
  addLog: (msg: string, type?: 'info' | 'alarm' | 'cmd') => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ systemState, setSystemState, addLog }) => {
  const [loadingMotor, setLoadingMotor] = useState(false);
  const [loadingMute, setLoadingMute] = useState(false);
  const [loadingReboot, setLoadingReboot] = useState(false);
  
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
      addLog('[AUTH FAILED] 指令安全密钥错误，拒绝执行', 'alarm');
    }
  };

  const executeSetFanSpeed = async (speedLevel: number, actionName: string) => {
    setLoadingMotor(true);
    addLog(`[COMMAND] 发送风机档位调节指令 -> ${actionName}`, 'cmd');

    const res = await sendRemoteCommand({
      device_id: 'rk2206-station-01',
      target: 'fan',
      action: actionName as any
    });

    setLoadingMotor(false);
    if (res.ok) {
      setSystemState(prev => ({
        ...prev,
        fanSpeed: speedLevel,
        isMotorRunning: speedLevel > 0
      }));
      addLog(`[COMMAND ACK] 风机档位指令已生效 (ID: ${res.id})`, 'cmd');
    } else {
      addLog(`[COMMAND FAIL] 指令发送失败: ${res.msg}`, 'alarm');
    }
  };

  const executeEmergencyMute = async () => {
    setLoadingMute(true);
    addLog(`[COMMAND] 发送应急消警静音指令 (K3 Latch Mute)`, 'cmd');

    const res = await sendRemoteCommand({
      device_id: 'rk2206-station-01',
      target: 'alarm',
      action: 'ack'
    });

    setLoadingMute(false);
    if (res.ok) {
      setSystemState(prev => ({ ...prev, isMuted: true }));
      addLog(`[COMMAND ACK] 应急消警已生效，系统进入锁存静音`, 'cmd');
    } else {
      addLog(`[COMMAND FAIL] 消警指令发送失败: ${res.msg}`, 'alarm');
    }
  };

  const executeRemoteReboot = async () => {
    setLoadingReboot(true);
    addLog(`[COMMAND] 发送远程系统复位重启指令 (RebootDevice)`, 'cmd');

    const res = await sendRemoteCommand({
      device_id: 'rk2206-station-01',
      target: 'system',
      action: 'reboot'
    });

    setLoadingReboot(false);
    if (res.ok) {
      addLog(`[COMMAND ACK] 开发板系统重启指令已下发 (ID: ${res.id})，小凌派硬件重启中...`, 'alarm');
    } else {
      addLog(`[COMMAND FAIL] 重启指令发送失败: ${res.msg}`, 'alarm');
    }
  };

  const curSpeed = systemState.fanSpeed ?? (systemState.isMotorRunning ? 3 : 0);

  return (
    <>
      <div className="glass-panel rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#00F0FF]" />
            <span className="font-hud text-sm font-bold text-slate-200 tracking-wider">
              执行器与多档闭环控制台
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isAuthorized ? (
              <span className="text-[10px] font-code px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 已授权
              </span>
            ) : (
              <span className="text-[10px] font-code px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> PIN 保护
              </span>
            )}
          </div>
        </div>

        {/* 5-Speed Fan Selector */}
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#080E1E] border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-[#00F0FF]" />
              舱内排风风机档位 (PWM 硬件调速)
            </span>
            <span className="text-[10px] font-code text-cyan-400">
              {curSpeed === 4 ? 'AUTO 温控' : (curSpeed === 0 ? '停机 (0%)' : `L${curSpeed} 档`)}
            </span>
          </div>

          {/* 5 档微调胶囊 */}
          <div className="grid grid-cols-5 gap-1.5 mt-1">
            {[
              { id: 0, label: '0:停机', action: 'speed_0' },
              { id: 1, label: '1:30%', action: 'speed_1' },
              { id: 2, label: '2:65%', action: 'speed_2' },
              { id: 3, label: '3:100%', action: 'speed_3' },
              { id: 4, label: 'AUTO', action: 'auto' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => requireAuth(() => executeSetFanSpeed(item.id, item.action))}
                disabled={loadingMotor}
                className={`py-1.5 px-1 rounded text-center text-xs font-mono font-bold transition-all border ${
                  curSpeed === item.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 下排操作按钮：应急消警 + 远程重启 */}
        <div className="grid grid-cols-2 gap-2">
          {/* Emergency Mute Button */}
          <button
            onClick={() => requireAuth(executeEmergencyMute)}
            disabled={loadingMute}
            className="py-2.5 px-3 rounded-lg bg-rose-500/15 border border-rose-500/40 hover:bg-rose-500/25 text-rose-400 font-hud text-xs font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(244,63,94,0.15)] flex items-center justify-center gap-1.5"
          >
            {loadingMute ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellOff className="w-3.5 h-3.5" />}
            应急消警 (K3 MUTE)
          </button>

          {/* Remote Reboot Button */}
          <button
            onClick={() => requireAuth(executeRemoteReboot)}
            disabled={loadingReboot}
            className="py-2.5 px-3 rounded-lg bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-400 font-hud text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-1.5"
          >
            {loadingReboot ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            远程系统重启
          </button>
        </div>
      </div>

      {/* Security PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-[#080E1E] border border-[#00F0FF]/40 p-5 shadow-[0_0_30px_rgba(0,240,255,0.25)] flex flex-col gap-4 relative">
            <button 
              onClick={() => setShowPinModal(false)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-hud text-sm font-bold text-slate-100">指令安全授权验证</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">请输入空间站硬件控制安全 PIN 码 (默认: 123456)</p>
              </div>
            </div>

            <form onSubmit={handleVerifyPin} className="flex flex-col gap-3">
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={pinInput}
                onChange={e => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="••••••"
                className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border font-code text-center text-lg tracking-[0.3em] text-[#00F0FF] focus:outline-none placeholder:tracking-normal placeholder:text-slate-600 ${
                  pinError 
                    ? 'border-rose-500 bg-rose-950/20' 
                    : 'border-slate-700 focus:border-[#00F0FF]'
                }`}
              />

              {pinError && (
                <p className="text-xs text-rose-400 font-code text-center">
                  密钥错误，请重新输入
                </p>
              )}

              <div className="flex gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-hud text-slate-300"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/50 text-xs font-hud font-bold text-[#00F0FF]"
                >
                  验证并执行
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
