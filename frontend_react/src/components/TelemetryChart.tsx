import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Activity } from 'lucide-react';
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
          min: 15,
          max: 45,
          axisLabel: { color: '#64748B', formatter: '{value} °C' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } }
        },
        {
          type: 'value',
          name: '湿度 (%)',
          min: 0,
          max: 100,
          axisLabel: { color: '#64748B', formatter: '{value} %' },
          splitLine: { show: false }
        }
      ];

      series = [
        {
          name: '舱内温度',
          type: 'line',
          smooth: true,
          data: history.map(h => h.temperature),
          yAxisIndex: 0,
          itemStyle: { color: '#00F0FF' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 240, 255, 0.25)' },
              { offset: 1, color: 'rgba(0, 240, 255, 0.0)' }
            ])
          }
        },
        {
          name: '相对湿度',
          type: 'line',
          smooth: true,
          data: history.map(h => h.humidity),
          yAxisIndex: 1,
          itemStyle: { color: '#3A86FF' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(58, 134, 255, 0.2)' },
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
          min: 0,
          max: 120,
          axisLabel: { color: '#64748B', formatter: '{value} ppm' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } }
        },
        {
          type: 'value',
          name: '光照 (Lux)',
          min: 0,
          max: 1000,
          axisLabel: { color: '#64748B', formatter: '{value} lx' },
          splitLine: { show: false }
        }
      ];

      series = [
        {
          name: '烟雾毒气',
          type: 'line',
          smooth: true,
          data: history.map(h => h.gas_ppm),
          yAxisIndex: 0,
          itemStyle: { color: '#F43F5E' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(244, 63, 94, 0.25)' },
              { offset: 1, color: 'rgba(244, 63, 94, 0.0)' }
            ])
          }
        },
        {
          name: '光照强度',
          type: 'line',
          smooth: true,
          data: history.map(h => h.lux),
          yAxisIndex: 1,
          itemStyle: { color: '#FF9900' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 153, 0, 0.2)' },
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
        backgroundColor: 'rgba(8, 14, 30, 0.9)',
        borderColor: '#00F0FF',
        textStyle: { color: '#F1F5F9', fontFamily: 'JetBrains Mono', fontSize: 11 }
      },
      legend: {
        data: series.map(s => s.name),
        textStyle: { color: '#94A3B8', fontFamily: 'Rajdhani' },
        top: 0
      },
      grid: {
        top: 28,
        left: 45,
        right: 45,
        bottom: 20
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLabel: { color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: 10 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } }
      },
      yAxis: yAxis,
      series: series
    };
  };

  return (
    <div className="glass-panel rounded-xl p-3 flex flex-col h-[220px]">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00F0FF]" />
          <span className="font-hud text-sm font-bold text-slate-200 tracking-wider">
            时序环境遥测多维走势分析
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setMode('temp_humi')}
            className={`px-2.5 py-0.5 rounded text-xs font-hud transition-all ${
              mode === 'temp_humi'
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            温湿度趋势
          </button>
          <button
            onClick={() => setMode('gas_lux')}
            className={`px-2.5 py-0.5 rounded text-xs font-hud transition-all ${
              mode === 'gas_lux'
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
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
