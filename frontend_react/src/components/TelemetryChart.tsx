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
          axisLabel: { color: '#64748B', formatter: '{value}°C', fontSize: 10, fontFamily: 'JetBrains Mono' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
        },
        {
          type: 'value',
          name: '湿度 (%)',
          scale: true,
          min: (val: { min: number }) => Math.max(0, Math.floor(val.min - 2.5)),
          max: (val: { max: number }) => Math.min(100, Math.ceil(val.max + 2.5)),
          axisLabel: { color: '#64748B', formatter: '{value}%', fontSize: 10, fontFamily: 'JetBrains Mono' },
          splitLine: { show: false }
        }
      ];

      series = [
        {
          name: '舱内温度',
          type: 'line',
          smooth: 0.35,
          showSymbol: history.length < 5,
          symbolSize: 6,
          data: history.map(h => h.temperature),
          yAxisIndex: 0,
          itemStyle: { color: '#00F0FF' },
          lineStyle: { width: 2.2, shadowColor: 'rgba(0, 240, 255, 0.4)', shadowBlur: 8 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 240, 255, 0.35)' },
              { offset: 0.7, color: 'rgba(0, 240, 255, 0.08)' },
              { offset: 1, color: 'rgba(0, 240, 255, 0.0)' }
            ])
          }
        },
        {
          name: '相对湿度',
          type: 'line',
          smooth: 0.35,
          showSymbol: history.length < 5,
          symbolSize: 6,
          data: history.map(h => h.humidity),
          yAxisIndex: 1,
          itemStyle: { color: '#3A86FF' },
          lineStyle: { width: 2.2, shadowColor: 'rgba(58, 134, 255, 0.4)', shadowBlur: 8 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(58, 134, 255, 0.3)' },
              { offset: 0.7, color: 'rgba(58, 134, 255, 0.06)' },
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
          axisLabel: { color: '#64748B', formatter: '{value}ppm', fontSize: 10, fontFamily: 'JetBrains Mono' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
        },
        {
          type: 'value',
          name: '光照 (Lux)',
          scale: true,
          min: (val: { min: number }) => Math.max(0, Math.floor(val.min - 25)),
          max: (val: { max: number }) => Math.ceil(Math.max(val.max + 35, 120)),
          axisLabel: { color: '#64748B', formatter: '{value}lx', fontSize: 10, fontFamily: 'JetBrains Mono' },
          splitLine: { show: false }
        }
      ];

      series = [
        {
          name: '烟雾毒气',
          type: 'line',
          smooth: 0.35,
          showSymbol: history.length < 5,
          symbolSize: 6,
          data: history.map(h => h.gas_ppm),
          yAxisIndex: 0,
          itemStyle: { color: '#F43F5E' },
          lineStyle: { width: 2.2, shadowColor: 'rgba(244, 63, 94, 0.4)', shadowBlur: 8 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(244, 63, 94, 0.35)' },
              { offset: 0.7, color: 'rgba(244, 63, 94, 0.08)' },
              { offset: 1, color: 'rgba(244, 63, 94, 0.0)' }
            ])
          }
        },
        {
          name: '光照强度',
          type: 'line',
          smooth: 0.35,
          showSymbol: history.length < 5,
          symbolSize: 6,
          data: history.map(h => h.lux),
          yAxisIndex: 1,
          itemStyle: { color: '#FF9900' },
          lineStyle: { width: 2.2, shadowColor: 'rgba(255, 153, 0, 0.4)', shadowBlur: 8 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 153, 0, 0.3)' },
              { offset: 0.7, color: 'rgba(255, 153, 0, 0.06)' },
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
        textStyle: { color: '#F1F5F9', fontFamily: 'JetBrains Mono', fontSize: 11 },
        axisPointer: {
          lineStyle: { color: 'rgba(0, 240, 255, 0.5)', type: 'dashed' }
        }
      },
      legend: {
        data: series.map(s => s.name),
        textStyle: { color: '#94A3B8', fontFamily: 'Rajdhani', fontSize: 11 },
        top: 2,
        right: 10
      },
      grid: {
        top: 32,
        left: 48,
        right: 48,
        bottom: 24
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLabel: { color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: 9 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } }
      },
      yAxis: yAxis,
      series: series
    };
  };

  return (
    <div className="glass-panel rounded-xl p-3 flex flex-col h-[270px] bg-[#060D1A]/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.06)]">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00F0FF] animate-pulse" />
          <span className="font-hud text-xs font-bold text-slate-100 tracking-wider">
            时序多维遥测示波器 (高精动态标尺)
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 rounded flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 animate-ping text-cyan-300" />
            2.0s 动态采样
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setMode('temp_humi')}
            className={`px-2.5 py-0.5 rounded text-xs font-hud transition-all ${
              mode === 'temp_humi'
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            温湿度走势
          </button>
          <button
            onClick={() => setMode('gas_lux')}
            className={`px-2.5 py-0.5 rounded text-xs font-hud transition-all ${
              mode === 'gas_lux'
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            烟雾/光照走势
          </button>
        </div>
      </div>

      <div className="flex-1 w-full pt-1">
        <ReactECharts option={getOption()} style={{ height: '100%', width: '100%' }} notMerge={true} />
      </div>
    </div>
  );
};
