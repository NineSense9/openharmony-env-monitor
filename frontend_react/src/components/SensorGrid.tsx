import React from 'react';
import { Thermometer, Droplets, Sun, Flame } from 'lucide-react';
import { TelemetryData, SystemState } from '../types/telemetry';
import { SensorCard } from './SensorCard';

interface SensorGridProps {
  telemetry: TelemetryData;
  systemState: SystemState;
}

export const SensorGrid: React.FC<SensorGridProps> = ({ telemetry, systemState }) => {
  return (
    <section className="flex flex-col gap-1.5 w-full shrink-0">
      {/* 1. SHT30 Temperature */}
      <SensorCard
        title="舱内核心温度"
        hardwareTag="SHT30 0x44"
        icon={Thermometer}
        value={telemetry.temperature}
        unit="°C"
        min={15}
        max={45}
        nominalRange="18~28°C"
        alarmNote=">38°C"
        accentColor="#00F0FF"
        isAlarm={telemetry.temperature > 38.0}
        isCached={systemState.isCachedSnapshot}
      />

      {/* 2. SHT30 Humidity */}
      <SensorCard
        title="舱内相对湿度"
        hardwareTag="SHT30 0x44"
        icon={Droplets}
        value={telemetry.humidity}
        unit="% RH"
        min={0}
        max={100}
        nominalRange="40~65%"
        alarmNote=">85%"
        accentColor="#3A86FF"
        isAlarm={telemetry.humidity > 85.0}
        isCached={systemState.isCachedSnapshot}
      />

      {/* 3. BH1750 Lux */}
      <SensorCard
        title="舱内光照强度"
        hardwareTag="BH1750 0x23"
        icon={Sun}
        value={Math.round(telemetry.lux)}
        unit="Lux"
        min={0}
        max={1000}
        nominalRange="100~800"
        alarmNote="<20"
        accentColor="#FF9900"
        isAlarm={telemetry.lux < 20.0}
        isCached={systemState.isCachedSnapshot}
      />

      {/* 4. MQ2 Gas PPM */}
      <SensorCard
        title="烟雾毒气浓度"
        hardwareTag="MQ2 ADC:CH2"
        icon={Flame}
        value={telemetry.gas_ppm}
        unit="PPM"
        min={0}
        max={120}
        nominalRange="<50"
        alarmNote=">100"
        accentColor="#F43F5E"
        isAlarm={telemetry.gas_ppm > 100.0}
        isCached={systemState.isCachedSnapshot}
      />
    </section>
  );
};
