import React from 'react';
import { useTelemetry } from './hooks/useTelemetry';
import { HudHeader } from './components/HudHeader';
import { SensorGrid } from './components/SensorGrid';
import { CabinTwin } from './components/CabinTwin';
import { TelemetryChart } from './components/TelemetryChart';
import { ControlPanel } from './components/ControlPanel';
import { EventFeed } from './components/EventFeed';

export function App() {
  const { telemetry, history, systemState, setSystemState, logs, addLog } = useTelemetry();

  return (
    <div className={`min-h-screen p-4 max-w-[1920px] mx-auto flex flex-col gap-4 transition-all duration-300 ${
      systemState.isAlarmActive ? 'border-rose-500/50 shadow-[inset_0_0_80px_rgba(244,63,94,0.15)]' : ''
    }`}>
      {/* 1. Top HUD Header */}
      <HudHeader systemState={systemState} />

      {/* 2. Main 3-Column Dashboard Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-[360px_1fr_380px] gap-4 flex-1">
        
        {/* Left Column: 4 Metric Cards */}
        <div className="flex flex-col gap-4">
          <SensorGrid telemetry={telemetry} systemState={systemState} />
        </div>

        {/* Center Column: Digital Twin Cabin & ECharts History */}
        <div className="flex flex-col gap-4">
          <CabinTwin systemState={systemState} />
          <TelemetryChart history={history} />
        </div>

        {/* Right Column: Actuator Controls & Live Event Feed */}
        <div className="flex flex-col gap-4">
          <ControlPanel 
            systemState={systemState} 
            setSystemState={setSystemState} 
            addLog={addLog} 
          />
          <EventFeed logs={logs} />
        </div>

      </main>
    </div>
  );
}

export default App;
