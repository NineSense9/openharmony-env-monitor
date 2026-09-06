import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Activity, Radio } from 'lucide-react';
import { TelemetryHistoryItem } from '../types/telemetry';

interface TelemetryChartProps {
  history: TelemetryHistoryItem[];
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ history }) => {
  const [mode, setMode] = useState<'temp_humi' | 'gas_lux'>('temp_humi');

  const times = history.map(h => h.time);

  const getOption = () => {
    let series = [];
    let yAxis = [];

    if (mode === 'temp_humi') {
      yAxis = [
        {
          type: 'value',
          name: '温度 (°C)',
          scale: true,
          min: (val: { min: number }) => Math.max(10, Math.floor(val.min - 1.2)),
          max: (val: { max: number }) => Math.ceil(val.max + 1.2),
          axisLabel: { color: '#64748B', formatter: '{value}°C', fontSize: 9, fontFamily: 'JetBrains Mono' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
        },
        {
          type: 'value',
          name: '湿度 (%)',
          scale: true,
          min: (val: { min: number }) => Math.max(0, Math.floor(val.min - 2.5)),
          max: (val: { max: number }) => Math.min(100, Math.ceil(val.max + 2.5)),
          axisLabel: { color: '#64748B', formatter: '{value}%', fontSize: 9, fontFamily: 'JetBrains Mono' },
          splitLine: { show: false }
        }
      ];

      series = [
        {
          name: '舱内温度',
          type: 'line',
          smooth: 0.35,
          showSymbol: history.length < 5,
          symbolSize: 4,
          data: history.map(h => h.temperature),
          yAxisIndex: 0,
          itemStyle: { color: '#00F0FF' },
          lineStyle: { width: 2, shadowColor: 'rgba(0, 240, 255, 0.4)', shadowBlur: 6 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 240, 255, 0.3)' },
              { offset: 1, color: 'rgba(0, 240, 255, 0.0)' }
            ])
          }
        },
        {
          name: '相对湿度',
          type: 'line',
          smooth: 0.35,
          showSymbol: history.length < 5,
          symbolSize: 4,
          data: history.map(h => h.humidity),
          yAxisIndex: 1,
          itemStyle: { color: '#3A86FF' },
          lineStyle: { width: 2, shadowColor: 'rgba(58, 134, 255, 0.4)', shadowBlur: 6 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(58, 134, 255, 0.25)' },
              { offset: 1, color: 'rgba(58, 134, 255, 0.0)' }
            ])
          }
        }
      ];
    } else {
      yAxis = [
        {
          type: 'value',
          name: '烟雾 (PPM)',
          scale: true,
          min: (val: { min: number }) => Math.max(0, Math.floor(val.min - 1.0)),
          max: (val: { max: number }) => Math.ceil(Math.max(val.max + 3.0, 15)),
          axisLabel: { color: '#64748B', formatter: '{value}p', fontSize: 9, fontFamily: 'JetBrains Mono' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
        },
        {
          type: 'value',
          name: '光照 (Lux)',
          scale: true,
          min: (val: { min: number }) => Math.max(0, Math.floor(val.min - 25)),
          max: (val: { max: number }) => Math.ceil(Math.max(val.max + 35, 120)),
          axisLabel: { color: '#64748B', formatter: '{value}lx', fontSize: 9, fontFamily: 'JetBrains Mono' },
          splitLine: { show: false }
        }
      ];

      series = [
        {
          name: '烟雾毒气',
          type: 'line',
          smooth: 0.35,
          showSymbol: history.length < 5,
          symbolSize: 4,
          data: history.map(h => h.gas_ppm),
          yAxisIndex: 0,
          itemStyle: { color: '#F43F5E' },
          lineStyle: { width: 2, shadowColor: 'rgba(244, 63, 94, 0.4)', shadowBlur: 6 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(244, 63, 94, 0.3)' },
              { offset: 1, color: 'rgba(244, 63, 94, 0.0)' }
            ])
          }
        },
        {
          name: '光照强度',
          type: 'line',
          smooth: 0.35,
          showSymbol: history.length < 5,
          symbolSize: 4,
          data: history.map(h => h.lux),
          yAxisIndex: 1,
          itemStyle: { color: '#FF9900' },
          lineStyle: { width: 2, shadowColor: 'rgba(255, 153, 0, 0.4)', shadowBlur: 6 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 153, 0, 0.25)' },
              { offset: 1, color: 'rgba(255, 153, 0, 0.0)' }
            ])
          }
        }
      ];
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(6, 13, 26, 0.95)',
        borderColor: '#00F0FF',
        borderWidth: 1,
        textStyle: { color: '#F1F5F9', fontFamily: 'JetBrains Mono', fontSize: 10 }
      },
      legend: {
        data: series.map(s => s.name),
        textStyle: { color: '#94A3B8', fontFamily: 'Rajdhani', fontSize: 10 },
        top: 0,
        right: 0
      },
      grid: {
        top: 22,
        left: 40,
        right: 40,
        bottom: 18
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLabel: { color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: 8 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
      },
      yAxis: yAxis,
      series: series
    };
  };

  return (
    <div className="glass-panel rounded-lg p-2 flex flex-col h-[165px] bg-[#060D1A]/90 border border-cyan-500/30 shrink-0">
      <div className="flex items-center justify-between pb-1 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse" />
          <span className="font-hud text-xs font-bold text-slate-100 tracking-wider">
            多维遥测示波器
          </span>
          <span className="text-[8px] font-mono px-1 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-500/30 rounded flex items-center gap-0.5">
            <Radio className="w-2 h-2 animate-ping text-cyan-300" />
            2.0s 采样
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setMode('temp_humi')}
            className={`px-2 py-0.2 rounded text-[10px] font-hud transition-all ${
              mode === 'temp_humi'
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_6px_rgba(0,240,255,0.25)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            温湿度走势
          </button>
          <button
            onClick={() => setMode('gas_lux')}
            className={`px-2 py-0.2 rounded text-[10px] font-hud transition-all ${
              mode === 'gas_lux'
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_6px_rgba(0,240,255,0.25)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            烟雾/光照走势
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ReactECharts option={getOption()} style={{ height: '100%', width: '100%' }} notMerge={true} />
      </div>
    </div>
  );
};
