import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SensorCardProps {
  title: string;
  hardwareTag: string;
  icon: LucideIcon;
  value: number | string;
  unit: string;
  min: number;
  max: number;
  nominalRange: string;
  alarmNote: string;
  accentColor: string;
  isAlarm: boolean;
  isCached?: boolean;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  title,
  hardwareTag,
  icon: Icon,
  value,
  unit,
  min,
  max,
  nominalRange,
  alarmNote,
  accentColor,
  isAlarm,
  isCached = false
}) => {
  const numVal = typeof value === 'number' ? value : parseFloat(value) || min;
  const pct = Math.min(100, Math.max(0, ((numVal - min) / (max - min)) * 100));

  return (
    <div 
      className={`relative p-4 rounded-lg bg-[#080E1E]/80 border transition-all duration-300 overflow-hidden ${
        isAlarm 
          ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.35)] bg-rose-950/20' 
          : 'border-slate-800 hover:border-slate-700 hover:shadow-lg'
      }`}
    >
      {/* Precision Left Edge Indicator */}
      <div 
        className="absolute top-0 left-0 w-1 h-full shadow-[0_0_8px]"
        style={{ backgroundColor: isAlarm ? '#F43F5E' : accentColor, boxShadow: `0 0 10px ${isAlarm ? '#F43F5E' : accentColor}` }}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between pl-2">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Icon className="w-4 h-4" style={{ color: isAlarm ? '#F43F5E' : accentColor }} />
          {title}
        </span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-code bg-slate-800/80 text-slate-400 border border-slate-700/50">
          {hardwareTag}
        </span>
      </div>

      {/* Value Display */}
      <div className="flex items-baseline gap-2 mt-2.5 pl-2">
        <span 
          className="font-hud text-3xl font-black tracking-tight text-slate-100"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        <span className="text-xs font-medium text-slate-400">{unit}</span>
        {isCached && (
          <span className="ml-auto text-[10px] font-code px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
            [CACHED]
          </span>
        )}
      </div>

      {/* Range Scale Bar */}
      <div className="w-full h-1.5 bg-slate-800/80 rounded-full mt-3 overflow-hidden ml-2">
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${pct}%`, 
            backgroundColor: isAlarm ? '#F43F5E' : accentColor,
            boxShadow: `0 0 8px ${isAlarm ? '#F43F5E' : accentColor}`
          }}
        />
      </div>

      {/* Threshold Annotations */}
      <div className="flex justify-between items-center text-[10px] font-code text-slate-500 mt-2 pl-2">
        <span>标称: {nominalRange}</span>
        <span className={isAlarm ? 'text-rose-400 font-bold' : ''}>{alarmNote}</span>
      </div>
    </div>
  );
};
