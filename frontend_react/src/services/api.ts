import { TelemetryData, RemoteCommand, AlertEvent } from '../types/telemetry';

export const API_BASE = "http://180.76.137.117:8000";
export const DEVICE_ID = "rk2206-station-01";

export async function fetchLatestTelemetry(deviceId = DEVICE_ID): Promise<TelemetryData | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const resp = await fetch(`${API_BASE}/api/telemetry/latest?device_id=${deviceId}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (err) {
    return null;
  }
}

export async function fetchTelemetryHistory(deviceId = DEVICE_ID, limit = 30): Promise<TelemetryData[]> {
  try {
    const resp = await fetch(`${API_BASE}/api/telemetry/history?device_id=${deviceId}&limit=${limit}`);
    if (!resp.ok) return [];
    return await resp.json();
  } catch {
    return [];
  }
}

export async function sendRemoteCommand(cmd: RemoteCommand): Promise<{ ok: boolean; id?: number; msg?: string }> {
  try {
    const resp = await fetch(`${API_BASE}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd)
    });
    if (resp.ok) {
      const data = await resp.json();
      return { ok: true, id: data.id };
    }
    return { ok: false, msg: 'Server error' };
  } catch (err: any) {
    return { ok: false, msg: err.message || 'Network error' };
  }
}

export async function fetchAlerts(limit = 10): Promise<AlertEvent[]> {
  try {
    const resp = await fetch(`${API_BASE}/api/alerts?limit=${limit}`);
    if (!resp.ok) return [];
    return await resp.json();
  } catch {
    return [];
  }
}
