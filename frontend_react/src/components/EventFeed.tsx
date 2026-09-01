import React from 'react';
import { Terminal } from 'lucide-react';

interface EventFeedProps {
  logs: { id: string; time: string; msg: string; type: 'info' | 'alarm' | 'cmd' }[];
}

export const EventFeed: React.FC<EventFeedProps> = ({ logs }) => {
  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col flex-1 min-h-[220px]">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#00F0FF]" />
          <span className="font-hud text-sm font-bold text-slate-200 tracking-wider">
            实时任务与告警流水
          </span>
        </div>
        <span className="text-[10px] font-code px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
          LIVE FEED
        </span>
      </div>

      <div className="flex-1 overflow-y-auto mt-2 space-y-1.5 pr-1 max-h-[240px]">
        {logs.map(log => {
          let borderCol = 'border-l-[#00F0FF] bg-slate-900/30';
          if (log.type === 'alarm') borderCol = 'border-l-rose-500 bg-rose-950/20 text-rose-300';
          if (log.type === 'cmd') borderCol = 'border-l-purple-500 bg-purple-950/20 text-purple-300';

          return (
            <div 
              key={log.id} 
              className={`p-2 rounded-r border-l-2 font-code text-xs flex flex-col gap-0.5 ${borderCol}`}
            >
              <span className="text-[10px] text-slate-500">[{log.time}]</span>
              <span className="text-slate-200">{log.msg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
