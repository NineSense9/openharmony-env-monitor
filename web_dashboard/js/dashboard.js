/**
 * Space Station Environmental Digital Twin Dashboard Logic
 * Real-time API Client, ECharts Visualizer, Particle Engine & Actuator Driver
 */

const API_BASE = "http://180.76.137.117:8000";
const DEVICE_ID = "rk2206-station-01";

// State
let isConnected = false;
let isMotorRunning = false;
let isAlarmActive = false;
let isMuted = false;
let packetCount = 0;
let chartInstance = null;
let currentChartMode = 'temp_humi'; // 'temp_humi' or 'gas_lux'
let historyData = [];

// Audio Synth for Sci-Fi Feedback
class SoundFX {
    constructor() {
        this.ctx = null;
    }
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    playClick() {
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.05);
        } catch(e){}
    }
    playAlarm() {
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(600, this.ctx.currentTime);
            osc.frequency.setValueAtTime(900, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.25);
        } catch(e){}
    }
}
const sfx = new SoundFX();

// 1. Particle & Background Starfield Canvas
function initStarfield() {
    const canvas = document.getElementById('stars-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const stars = Array.from({ length: 90 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speed: Math.random() * 0.008 + 0.002
    }));

    function draw() {
        ctx.clearRect(0, 0, width, height);
        stars.forEach(star => {
            star.alpha += star.speed;
            if (star.alpha > 1 || star.alpha < 0) star.speed = -star.speed;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 240, 255, ${Math.abs(star.alpha) * 0.6})`;
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
}

// 2. Air Flow Particle Simulation in Space Cabin
function initAirflowParticles() {
    const canvas = document.getElementById('air-particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.parentElement.clientWidth;
    let height = canvas.height = canvas.parentElement.clientHeight;

    window.addEventListener('resize', () => {
        if (canvas.parentElement) {
            width = canvas.width = canvas.parentElement.clientWidth;
            height = canvas.height = canvas.parentElement.clientHeight;
        }
    });

    const particles = Array.from({ length: 45 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: -(Math.random() * 1.2 + 0.4),
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        color: 'rgba(0, 240, 255, 0.4)'
    }));

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const speedMultiplier = isMotorRunning ? 3.0 : 0.8;
        
        particles.forEach(p => {
            p.x += p.vx * speedMultiplier;
            p.y += p.vy;
            if (p.x < 20) {
                p.x = width - 20;
                p.y = Math.random() * height;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = isAlarmActive ? 'rgba(255, 0, 85, 0.5)' : (isMotorRunning ? 'rgba(0, 255, 136, 0.6)' : 'rgba(0, 240, 255, 0.3)');
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
}

// 3. ECharts Multi-Dimensional History Stream
function initChart() {
    const dom = document.getElementById('history-chart');
    if (!dom) return;
    chartInstance = echarts.init(dom, 'dark');

    updateChartOptions();
    window.addEventListener('resize', () => chartInstance && chartInstance.resize());
}

function updateChartOptions() {
    if (!chartInstance) return;

    const times = historyData.map(d => d.time);
    let series = [];
    let yAxis = [];

    if (currentChartMode === 'temp_humi') {
        const temps = historyData.map(d => d.temperature);
        const humis = historyData.map(d => d.humidity);

        yAxis = [
            {
                type: 'value',
                name: '温度 (°C)',
                min: 15,
                max: 45,
                axisLabel: { color: '#8B949E', formatter: '{value} °C' },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
            },
            {
                type: 'value',
                name: '湿度 (%)',
                min: 0,
                max: 100,
                axisLabel: { color: '#8B949E', formatter: '{value} %' },
                splitLine: { show: false }
            }
        ];

        series = [
            {
                name: '舱内温度',
                type: 'line',
                smooth: true,
                data: temps,
                yAxisIndex: 0,
                itemStyle: { color: '#00F0FF' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(0, 240, 255, 0.35)' },
                        { offset: 1, color: 'rgba(0, 240, 255, 0.0)' }
                    ])
                }
            },
            {
                name: '相对湿度',
                type: 'line',
                smooth: true,
                data: humis,
                yAxisIndex: 1,
                itemStyle: { color: '#3A86FF' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(58, 134, 255, 0.25)' },
                        { offset: 1, color: 'rgba(58, 134, 255, 0.0)' }
                    ])
                }
            }
        ];
    } else {
        const luxs = historyData.map(d => d.lux);
        const gases = historyData.map(d => d.gas_ppm);

        yAxis = [
            {
                type: 'value',
                name: '烟雾气体 (ppm)',
                min: 0,
                max: 150,
                axisLabel: { color: '#8B949E', formatter: '{value} ppm' },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
            },
            {
                type: 'value',
                name: '光照 (Lux)',
                min: 0,
                max: 1000,
                axisLabel: { color: '#8B949E', formatter: '{value} lx' },
                splitLine: { show: false }
            }
        ];

        series = [
            {
                name: '烟雾气体',
                type: 'line',
                smooth: true,
                data: gases,
                yAxisIndex: 0,
                itemStyle: { color: '#FF0055' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(255, 0, 85, 0.35)' },
                        { offset: 1, color: 'rgba(255, 0, 85, 0.0)' }
                    ])
                }
            },
            {
                name: '光照强度',
                type: 'line',
                smooth: true,
                data: luxs,
                yAxisIndex: 1,
                itemStyle: { color: '#FF9900' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(255, 153, 0, 0.25)' },
                        { offset: 1, color: 'rgba(255, 153, 0, 0.0)' }
                    ])
                }
            }
        ];
    }

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(11, 19, 43, 0.9)',
            borderColor: '#00F0FF',
            textStyle: { color: '#FFF' }
        },
        legend: {
            data: series.map(s => s.name),
            textStyle: { color: '#8B949E', fontFamily: 'Rajdhani' },
            top: 0
        },
        grid: {
            top: 40,
            left: 55,
            right: 55,
            bottom: 25
        },
        xAxis: {
            type: 'category',
            data: times,
            axisLabel: { color: '#8B949E', fontFamily: 'JetBrains Mono', fontSize: 10 },
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
        },
        yAxis: yAxis,
        series: series
    };

    chartInstance.setOption(option, true);
}

// 4. Toast Notification
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s reverse ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 5. Append Log
function appendLog(msg, type = 'info') {
    const feed = document.getElementById('log-feed');
    if (!feed) return;
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    const now = new Date().toTimeString().split(' ')[0];
    entry.innerHTML = `
        <span class="log-time">[${now}]</span>
        <span class="log-msg">${msg}</span>
    `;
    feed.insertBefore(entry, feed.firstChild);
    if (feed.children.length > 25) {
        feed.removeChild(feed.lastChild);
    }
}

// 6. Polling Telemetry Data from Cloud Server
async function fetchTelemetry() {
    try {
        const resp = await fetch(`${API_BASE}/api/telemetry/latest?device_id=${DEVICE_ID}`);
        if (!resp.ok) throw new Error("HTTP error");
        const data = await resp.json();

        if (data) {
            isConnected = true;
            packetCount = data.id || packetCount + 1;
            updateUIWithTelemetry(data);
        }
    } catch (e) {
        isConnected = false;
        document.getElementById('conn-status').innerHTML = `<span class="status-dot" style="background:#FF0055;box-shadow:0 0 8px #FF0055"></span> DISCONNECTED`;
        document.getElementById('conn-status').style.color = '#FF0055';
        document.getElementById('conn-status').style.borderColor = 'rgba(255,0,85,0.4)';
    }
}

// 7. Polling History
async function fetchHistory() {
    try {
        const resp = await fetch(`${API_BASE}/api/telemetry/history?device_id=${DEVICE_ID}&limit=20`);
        if (resp.ok) {
            const list = await resp.json();
            historyData = list.reverse().map(item => ({
                time: item.created_at ? item.created_at.split('T')[1].split('.')[0] : '--',
                temperature: item.temperature,
                humidity: item.humidity,
                lux: item.lux,
                gas_ppm: item.gas_ppm
            }));
            updateChartOptions();
        }
    } catch(e){}
}

// 8. Update UI with Telemetry Packet
function updateUIWithTelemetry(d) {
    // Top HUD
    document.getElementById('conn-status').innerHTML = `<span class="status-dot"></span> LIVE LINK`;
    document.getElementById('conn-status').style.color = '#00FF88';
    document.getElementById('conn-status').style.borderColor = 'rgba(0,255,136,0.4)';
    document.getElementById('packet-count').innerText = `${packetCount} PKTS`;
    document.getElementById('board-ip').innerText = `192.168.9.51`;

    // Sensor Cards
    document.getElementById('val-temp').innerText = d.temperature.toFixed(1);
    document.getElementById('val-humi').innerText = d.humidity.toFixed(1);
    document.getElementById('val-lux').innerText = Math.round(d.lux);
    document.getElementById('val-gas').innerText = d.gas_ppm.toFixed(1);

    // Range Bars
    const tempPct = Math.min(100, Math.max(0, ((d.temperature - 15) / 30) * 100));
    document.getElementById('bar-temp').style.width = `${tempPct}%`;
    document.getElementById('bar-humi').style.width = `${Math.min(100, d.humidity)}%`;
    document.getElementById('bar-lux').style.width = `${Math.min(100, (d.lux / 1000) * 100)}%`;
    document.getElementById('bar-gas').style.width = `${Math.min(100, (d.gas_ppm / 120) * 100)}%`;

    // Threshold Alarms Check
    let alarm = false;
    if (d.temperature > 38 || d.humidity > 85 || d.lux < 20 || d.gas_ppm > 100) {
        alarm = true;
    }

    if (alarm && !isAlarmActive) {
        isAlarmActive = true;
        document.body.classList.add('alarm-active');
        sfx.playAlarm();
        appendLog(`[CRITICAL] 环境指标越限触发告警 (T:${d.temperature} Gas:${d.gas_ppm})`, 'alarm');
        showToast("空间站环境告警触发！", "danger");
    } else if (!alarm && isAlarmActive) {
        isAlarmActive = false;
        document.body.classList.remove('alarm-active');
        appendLog(`[RECOVERY] 舱内环境恢复正常安全阈值`, 'info');
    }

    // Space Cabin Sensor Nodes Glow
    document.querySelectorAll('.blueprint-sensor-node').forEach(node => {
        node.style.fill = isAlarmActive ? '#FF0055' : '#00FF88';
        node.style.filter = `drop-shadow(0 0 6px ${isAlarmActive ? '#FF0055' : '#00FF88'})`;
    });
}

// 9. Remote Commands (Dispatch to Cloud FastAPI -> Board)
async function sendCommand(target, action, value = null) {
    sfx.playClick();
    appendLog(`[COMMAND] 下发远程指令: ${target} -> ${action}`, 'cmd');
    showToast(`正在发送指令: ${target} ${action}...`, 'info');

    try {
        const resp = await fetch(`${API_BASE}/api/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                device_id: DEVICE_ID,
                target: target,
                action: action,
                value: value
            })
        });

        if (resp.ok) {
            const res = await resp.json();
            showToast(`指令已下发 (ID: ${res.id})，开发板即将执行`, 'success');
            appendLog(`[ACK PENDING] 指令 ID:${res.id} 等待板端 ACK`, 'cmd');

            if (target === 'motor') {
                isMotorRunning = (action === 'on');
                updateMotorUI(isMotorRunning);
            }
        } else {
            showToast(`指令下发失败`, 'danger');
        }
    } catch(e) {
        showToast(`网络通信错误: ${e.message}`, 'danger');
    }
}

// 10. Update Motor Visuals
function updateMotorUI(running) {
    const fan = document.getElementById('twin-fan-element');
    const motorSwitch = document.getElementById('motor-toggle');
    if (fan) {
        if (running) fan.classList.add('running');
        else fan.classList.remove('running');
    }
    if (motorSwitch) {
        motorSwitch.checked = running;
    }
    document.getElementById('motor-status-text').innerText = running ? '运行中 (6000 RPM)' : '停转 (待机)';
    document.getElementById('motor-status-text').style.color = running ? '#00FF88' : '#8B949E';
}

// 11. Event Handlers
document.addEventListener('DOMContentLoaded', () => {
    initStarfield();
    initAirflowParticles();
    initChart();

    // Motor Switch
    const motorSwitch = document.getElementById('motor-toggle');
    if (motorSwitch) {
        motorSwitch.addEventListener('change', (e) => {
            sendCommand('motor', e.target.checked ? 'on' : 'off');
        });
    }

    // Chart Mode Tabs
    document.querySelectorAll('.chart-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            sfx.playClick();
            document.querySelectorAll('.chart-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentChartMode = e.target.dataset.mode;
            updateChartOptions();
        });
    });

    // Emergency Mute Button
    const muteBtn = document.getElementById('btn-emergency-mute');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            sendCommand('alarm', 'ack');
            showToast("已发送应急消警指令 (Mute Latch)", "info");
        });
    }

    // Start Polling Loops
    fetchTelemetry();
    fetchHistory();
    setInterval(fetchTelemetry, 1500); // 1.5s real-time poll
    setInterval(fetchHistory, 3500);   // 3.5s history poll

    // UTC Mission Time Clock
    setInterval(() => {
        const now = new Date();
        document.getElementById('clock-beijing').innerText = now.toTimeString().split(' ')[0];
        document.getElementById('clock-utc').innerText = now.toUTCString().split(' ')[4];
    }, 1000);
});
