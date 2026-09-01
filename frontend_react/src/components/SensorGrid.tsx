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
    <section className="flex flex-col gap-3.5 w-full">
      {/* 1. SHT30 Temperature */}
      <SensorCard
        title="舱内核心温度"
        hardwareTag="SHT30 I2C0:0x44"
        icon={Thermometer}
        value={telemetry.temperature}
        unit="°C"
        min={15}
        max={45}
        nominalRange="18.0 ~ 28.0 °C"
        alarmNote="越限 >38.0 °C"
        accentColor="#00F0FF"
        isAlarm={telemetry.temperature > 38.0}
        isCached={systemState.isCachedSnapshot}
      />

      {/* 2. SHT30 Humidity */}
      <SensorCard
        title="舱内相对湿度"
        hardwareTag="SHT30 I2C0:0x44"
        icon={Droplets}
        value={telemetry.humidity}
        unit="% RH"
        min={0}
        max={100}
        nominalRange="40.0 ~ 65.0 %"
        alarmNote="越限 >85.0 %"
        accentColor="#3A86FF"
        isAlarm={telemetry.humidity > 85.0}
        isCached={systemState.isCachedSnapshot}
      />

      {/* 3. BH1750 Lux */}
      <SensorCard
        title="舱内光照强度"
        hardwareTag="BH1750 I2C0:0x23"
        icon={Sun}
        value={Math.round(telemetry.lux)}
        unit="Lux"
        min={0}
        max={1000}
        nominalRange="100 ~ 800 Lux"
        alarmNote="过暗 <20 Lux"
        accentColor="#FF9900"
        isAlarm={telemetry.lux < 20.0}
        isCached={systemState.isCachedSnapshot}
      />

      {/* 4. MQ2 Gas PPM */}
      <SensorCard
        title="烟雾毒气浓度"
        hardwareTag="MQ2 SARADC:CH2"
        icon={Flame}
        value={telemetry.gas_ppm}
        unit="PPM"
        min={0}
        max={120}
        nominalRange="<50.0 PPM"
        alarmNote="越限 >100.0 PPM"
        accentColor="#F43F5E"
        isAlarm={telemetry.gas_ppm > 100.0}
        isCached={systemState.isCachedSnapshot}
      />
    </section>
  );
};
