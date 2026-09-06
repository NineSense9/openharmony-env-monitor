import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Activity, Radio, Sparkles } from 'lucide-react';
import { TelemetryHistoryItem } from '../types/telemetry';

interface TelemetryChartProps {
  history: TelemetryHistoryItem[];
}

type ChartMode = 'temp_humi' | 'temp_only' | 'humi_only' | 'gas_lux';

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ history }) => {
  const [mode, setMode] = useState<ChartMode>('temp_humi');
  const [autoScale, setAutoScale] = useState<boolean>(true);

  const times = history.map(h => h.time);

  // 动态高精自适应量程计算
  const ranges = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        temp: { min: 20, max: 35 },
        humi: { min: 30, max: 70 },
        gas: { min: 0, max: 20 },
        lux: { min: 0, max: 300 }
      };
    }

    const temps = history.map(h => h.temperature);
    const humis = history.map(h => h.humidity);
    const gases = history.map(h => h.gas_ppm);
    const luxes = history.map(h => h.lux);

    const getScale = (vals: number[], minMargin: number, defaultMinSpan: number, precision: number) => {
      const minVal = Math.min(...vals);
      const maxVal = Math.max(...vals);
      const span = maxVal - minVal;
      const margin = span < defaultMinSpan ? minMargin : span * 0.2;
      return {
        min: Number((minVal - margin).toFixed(precision)),
        max: Number((maxVal + margin).toFixed(precision))
      };
    };

    return {
      temp: getScale(temps, 0.4, 1.0, 1),
      humi: getScale(humis, 1.2, 3.0, 1),
      gas: getScale(gases, 0.6, 2.0, 1),
      lux: getScale(luxes, 15, 40, 0)
    };
  }, [history]);

  const getOption = () => {
    let series: any[] = [];
    let yAxis: any[] = [];

    if (mode === 'temp_humi') {
      yAxis = [
        {
          type: 'value',
          name: '温度 (°C)',
          scale: true,
          min: autoScale ? ranges.temp.min : 15,
          max: autoScale ? ranges.temp.max : 35,
          nameLocation: 'end',
          nameTextStyle: {
            color: '#00F0FF',
            fontSize: 10,
            fontWeight: 'bold',
            padding: [0, 0, 4, -10]
          },
          axisLine: { show: true, lineStyle: { color: 'rgba(0, 240, 255, 0.35)' } },
          axisLabel: { color: '#00F0FF', formatter: '{value}°C', fontSize: 10, fontFamily: 'JetBrains Mono' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
        },
        {
          type: 'value',
          name: '相对湿度 (%)',
          scale: true,
          min: autoScale ? ranges.humi.min : 20,
          max: autoScale ? ranges.humi.max : 80,
          nameLocation: 'end',
          nameTextStyle: {
            color: '#60A5FA',
            fontSize: 10,
            fontWeight: 'bold',
            padding: [0, -10, 4, 0]
          },
          axisLine: { show: true, lineStyle: { color: 'rgba(96, 165, 250, 0.35)' } },
          axisLabel: { color: '#60A5FA', formatter: '{value}%', fontSize: 10, fontFamily: 'JetBrains Mono' },
          splitLine: { show: false }
        }
      ];

      series = [
        {
          name: '舱内温度',
          type: 'line',
          smooth: 0.35,
          showSymbol: history.length < 5,
          symbolSize: 5,
          data: history.map(h => h.temperature),
          yAxisIndex: 0,
          itemStyle: { color: '#00F0FF' },
          lineStyle: { width: 2.2, shadowColor: 'rgba(0, 240, 255, 0.4)', shadowBlur: 8 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 240, 255, 0.28)' },
              { offset: 0.7, color: 'rgba(0, 240, 255, 0.05)' },
              { offset: 1, color: 'rgba(0, 240, 255, 0.0)' }
            ])
          }
        },
        {
          name: '相对湿度',
          type: 'line',
          smooth: 0.35,
          showSymbol: history.length < 5,
          symbolSize: 5,
          data: history.map(h => h.humidity),
          yAxisIndex: 1,
          itemStyle: { color: '#3A86FF' },
          lineStyle: { width: 2.2, shadowColor: 'rgba(58, 134, 255, 0.4)', shadowBlur: 8 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(58, 134, 255, 0.22)' },
              { offset: 0.7, color: 'rgba(58, 134, 255, 0.04)' },
              { offset: 1, color: 'rgba(58, 134, 255, 0.0)' }
            ])
          }
        }
      ];
    } else if (mode === 'temp_only') {
      yAxis = [
        {
          type: 'value',
          name: '舱内温度 (°C)',
          scale: true,
          min: autoScale ? ranges.temp.min : 15,
          max: autoScale ? ranges.temp.max : 35,
          nameLocation: 'end',
          nameTextStyle: { color: '#00F0FF', fontSize: 10, fontWeight: 'bold' },
          axisLine: { show: true, lineStyle: { color: 'rgba(0, 240, 255, 0.4)' } },
          axisLabel: { color: '#00F0FF', formatter: '{value}°C', fontSize: 10, fontFamily: 'JetBrains Mono' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
        }
      ];

      series = [
        {
          name: '舱内温度',
          type: 'line',
          smooth: 0.35,
          showSymbol: true,
          symbolSize: 6,
          data: history.map(h => h.temperature),
          yAxisIndex: 0,
          itemStyle: { color: '#00F0FF' },
          lineStyle: { width: 2.5, shadowColor: 'rgba(0, 240, 255, 0.5)', shadowBlur: 10 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 240, 255, 0.35)' },
              { offset: 1, color: 'rgba(0, 240, 255, 0.0)' }
            ])
          },
          markPoint: {
            data: [
              { type: 'max', name: '最高温' },
              { type: 'min', name: '最低温' }
            ],
            label: { color: '#0A1628', fontWeight: 'bold', fontSize: 9 }
          }
        }
      ];
    } else if (mode === 'humi_only') {
      yAxis = [
        {
          type: 'value',
          name: '相对湿度 (%RH)',
          scale: true,
          min: autoScale ? ranges.humi.min : 20,
          max: autoScale ? ranges.humi.max : 80,
          nameLocation: 'end',
          nameTextStyle: { color: '#60A5FA', fontSize: 10, fontWeight: 'bold' },
          axisLine: { show: true, lineStyle: { color: 'rgba(96, 165, 250, 0.4)' } },
          axisLabel: { color: '#60A5FA', formatter: '{value}%', fontSize: 10, fontFamily: 'JetBrains Mono' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
        }
      ];

      series = [
        {
          name: '相对湿度',
          type: 'line',
          smooth: 0.35,
          showSymbol: true,
          symbolSize: 6,
          data: history.map(h => h.humidity),
          yAxisIndex: 0,
          itemStyle: { color: '#3A86FF' },
          lineStyle: { width: 2.5, shadowColor: 'rgba(58, 134, 255, 0.5)', shadowBlur: 10 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(58, 134, 255, 0.35)' },
              { offset: 1, color: 'rgba(58, 134, 255, 0.0)' }
            ])
          },
          markPoint: {
            data: [
              { type: 'max', name: '最高湿' },
              { type: 'min', name: '最低湿' }
            ],
            label: { color: '#0A1628', fontWeight: 'bold', fontSize: 9 }
          }
        }
      ];
    } else {
      yAxis = [
        {
          type: 'value',
          name: '烟雾 (PPM)',
          scale: true,
          min: autoScale ? ranges.gas.min : 0,
          max: autoScale ? ranges.gas.max : 25,
          nameLocation: 'end',
          nameTextStyle: { color: '#F43F5E', fontSize: 10, fontWeight: 'bold', padding: [0, 0, 4, -10] },
          axisLine: { show: true, lineStyle: { color: 'rgba(244, 63, 94, 0.4)' } },
          axisLabel: { color: '#F43F5E', formatter: '{value}ppm', fontSize: 10, fontFamily: 'JetBrains Mono' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
        },
        {
          type: 'value',
          name: '光照 (Lux)',
          scale: true,
          min: autoScale ? ranges.lux.min : 0,
          max: autoScale ? ranges.lux.max : 300,
          nameLocation: 'end',
          nameTextStyle: { color: '#FF9900', fontSize: 10, fontWeight: 'bold', padding: [0, -10, 4, 0] },
          axisLine: { show: true, lineStyle: { color: 'rgba(255, 153, 0, 0.4)' } },
          axisLabel: { color: '#FF9900', formatter: '{value}lx', fontSize: 10, fontFamily: 'JetBrains Mono' },
          splitLine: { show: false }
        }
      ];

      series = [
        {
          name: '烟雾毒气',
          type: 'line',
          smooth: 0.35,
          showSymbol: history.length < 5,
          symbolSize: 5,
          data: history.map(h => h.gas_ppm),
          yAxisIndex: 0,
          itemStyle: { color: '#F43F5E' },
          lineStyle: { width: 2.2, shadowColor: 'rgba(244, 63, 94, 0.4)', shadowBlur: 8 },
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
          symbolSize: 5,
          data: history.map(h => h.lux),
          yAxisIndex: 1,
          itemStyle: { color: '#FF9900' },
          lineStyle: { width: 2.2, shadowColor: 'rgba(255, 153, 0, 0.4)', shadowBlur: 8 },
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
        textStyle: { color: '#F1F5F9', fontFamily: 'JetBrains Mono', fontSize: 11 }
      },
      // 图例居中展示，彻底与两侧坐标轴名称错开，零重叠！
      legend: {
        data: series.map(s => s.name),
        textStyle: { color: '#94A3B8', fontFamily: 'JetBrains Mono', fontSize: 11 },
        top: 2,
        left: 'center',
        itemGap: 28,
        icon: 'circle'
      },
      grid: {
        top: 34,
        left: 54,
        right: 54,
        bottom: 22
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
    <div className="glass-panel rounded-xl p-3 flex flex-col justify-between h-full w-full bg-[#060D1A]/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.06)]">
      {/* 示波器顶栏控制器 */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00F0FF] animate-pulse" />
          <span className="font-hud text-xs font-bold text-slate-100 tracking-wider">
            时序多维遥测示波器
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-500/30 rounded flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 animate-ping text-cyan-300" />
            2.0s 动态采样
          </span>
          
          {/* 动态自适应标尺开关 */}
          <button
            onClick={() => setAutoScale(prev => !prev)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all border flex items-center gap-1 cursor-pointer ${
              autoScale
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="点击切换：动态高精自适应坐标 / 标准全量程坐标"
          >
            <Sparkles className="w-3 h-3" />
            {autoScale ? '自适应动态坐标: 开启' : '固定全量程坐标'}
          </button>
        </div>

        {/* 4 档视图快速切换 */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setMode('temp_humi')}
            className={`px-2 py-0.5 rounded text-xs font-hud transition-all cursor-pointer ${
              mode === 'temp_humi'
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_8px_rgba(0,240,255,0.25)] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            温湿度双轨
          </button>
          <button
            onClick={() => setMode('temp_only')}
            className={`px-2 py-0.5 rounded text-xs font-hud transition-all cursor-pointer ${
              mode === 'temp_only'
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_8px_rgba(0,240,255,0.25)] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            单看温度
          </button>
          <button
            onClick={() => setMode('humi_only')}
            className={`px-2 py-0.5 rounded text-xs font-hud transition-all cursor-pointer ${
              mode === 'humi_only'
                ? 'bg-[#3A86FF]/25 text-[#60A5FA] border border-[#3A86FF]/40 shadow-[0_0_8px_rgba(58,134,255,0.25)] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            单看湿度
          </button>
          <button
            onClick={() => setMode('gas_lux')}
            className={`px-2 py-0.5 rounded text-xs font-hud transition-all cursor-pointer ${
              mode === 'gas_lux'
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_8px_rgba(0,240,255,0.25)] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            烟雾/光照
          </button>
        </div>
      </div>

      {/* 图表渲染容器 */}
      <div className="flex-1 w-full min-h-0 pt-1">
        <ReactECharts option={getOption()} style={{ height: '100%', width: '100%' }} notMerge={true} />
      </div>
    </div>
  );
};
