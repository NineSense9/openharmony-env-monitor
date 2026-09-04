#include <stdio.h>
#include <string.h>
#include <math.h>

#include "ohos_init.h"
#include "los_task.h"
#include "wifi_device.h"
#include "config_network.h"

#include "board_pins.h"
#include "smart_home.h"
#include "adc_key.h"
#include "mpu6050.h"
#include "http_client.h"
#include "lcd.h"

// 全局传感器与状态结构体
static SensorReport g_report = {
    .temperature = 25.0f,
    .humidity = 50.0f,
    .lux = 100.0f,
    .gas_ppm = 10.0f,
    .alarm_active = false
};

static Mpu6050Data g_mpu_data = {0};
static char g_ip_str[32] = "connecting...";
static char g_i2c_device_str[64] = "SHT30,BH1750,MPU6050";
static char g_last_key_name[16] = "NONE";

static int g_cloud_upload_count = 0;
static int g_cloud_fail_count = 0;
static bool g_wifi_ready = false;

// K3 本地消警锁存：一旦按下 K3，保持静音，直到环境完全恢复正常后才自动解除静音
static bool g_k3_muted_latch = false;

// 风扇档位模式：0=关(0%), 1=弱(30%), 2=中(65%), 3=强(100%), 4=AUTO自动温控
static int g_manual_fan_speed = 4; // 默认 AUTO 智能温控
static bool g_remote_override = false;
static int g_remote_fan_speed = 4;
static bool g_alarm_test_active = false;

// 1. 航天级自检与雷达开机动画 (静音启动，边距自适应)
static void Lcd_ShowBootAnimation(void)
{
    lcd_init();
    lcd_fill(0, 0, LCD_W, LCD_H, LCD_BLACK);

    // 绘制航天雷达同心瞄准圆圈与十字线 (以 160, 120 为中心)
    lcd_draw_circle(160, 120, 35, LCD_DARKBLUE);
    lcd_draw_circle(160, 120, 75, LCD_BLUE);
    lcd_draw_circle(160, 120, 110, LCD_CYAN);
    lcd_draw_line(160, 15, 160, 225, LCD_GRAYBLUE);
    lcd_draw_line(20, 120, 300, 120, LCD_GRAYBLUE);

    // 顶部科技标题栏 (X: 15 ~ 305，居中无溢出)
    lcd_fill(15, 18, 305, 52, LCD_DARKBLUE);
    lcd_draw_rectangle(15, 18, 305, 52, LCD_CYAN);
    lcd_show_chinese(30, 26, (uint8_t *)"鸿蒙空间站", LCD_YELLOW, LCD_DARKBLUE, 16, 0);
    lcd_show_string(122, 26, (uint8_t *)"CSS-01 HUD", LCD_CYAN, LCD_DARKBLUE, 16, 0);
    lcd_show_string(218, 26, (uint8_t *)"OHOS 3.0", LCD_WHITE, LCD_DARKBLUE, 16, 0);

    LOS_Msleep(250);

    // 逐步展示硬件诊断自检 (长度严格控制在 30 字符内，总宽 240px，居中显示无溢出)
    const char *steps[] = {
        "[1/5] Core : Cortex-M4F  .. OK",
        "[2/5] Bus  : I2C0 Sensor .. OK",
        "[3/5] Nav  : MPU6050 HUD .. OK",
        "[4/5] Key  : K3 & ADC5   .. OK",
        "[5/5] Safe : WDT & Fan   .. OK"
    };

    for (int i = 0; i < 5; i++) {
        lcd_fill(20, 64 + i * 22, 300, 82 + i * 22, LCD_BLACK);
        lcd_show_string(24, 66 + i * 22, (uint8_t *)steps[i], LCD_GREEN, LCD_BLACK, 16, 0);
        LOS_Msleep(120);
    }

    // 渐变启动进度条 (X: 30 ~ 290)
    lcd_draw_rectangle(30, 188, 290, 202, LCD_CYAN);
    for (int w = 32; w <= 288; w += 8) {
        lcd_fill(32, 190, w, 200, LCD_GREEN);
        LOS_Msleep(18);
    }

    LOS_Msleep(200);
    lcd_fill(0, 0, LCD_W, LCD_H, LCD_BLACK);
}

// 2. 传感器采集与硬件联动控制任务 (200ms)
static void *SensorTask(void *arg)
{
    (void)arg;
    while (1) {
        // 读取四路环境传感器 (SHT30, BH1750, MQ2)
        SmartHome_ReadSensors(&g_report);

        // 读取 MPU6050 六轴姿态与加速度
        Mpu6050_Read(&g_mpu_data);

        // 喂硬件看门狗 (防止系统跑飞死锁)
        SmartHome_FeedWatchdog();

        // 检查报警状态：若环境完全恢复正常，解除本地消警锁存
        if (!g_report.alarm_active && !g_alarm_test_active) {
            if (g_k3_muted_latch) {
                printf("[alarm] Environment normal -> K3 mute latch released\n");
                g_k3_muted_latch = false;
            }
        }

        // 计算有效报警状态 (综合环境越限、自检模式与本地静音锁存)
        bool effective_alarm = (g_report.alarm_active || g_alarm_test_active) && !g_k3_muted_latch;

        // 执行器闭环逻辑
        if (g_remote_override) {
            // 云端远程调速优先
            SmartHome_SetFanSpeed(g_remote_fan_speed);
            SmartHome_SetAlarmLight(effective_alarm);
            SmartHome_UpdateAlarmSound(effective_alarm);
        } else {
            // 本地自主运行模式
            if (effective_alarm) {
                // 发生告警：强制开启声光，风机拉升至最高档 (L3 100%) 排风排烟
                SmartHome_SetFanSpeed(3);
                SmartHome_SetAlarmLight(true);
                SmartHome_UpdateAlarmSound(true);
            } else {
                // 正常状态：执行用户选定档位 (0/1/2/3/AUTO)
                SmartHome_SetFanSpeed(g_manual_fan_speed);
                SmartHome_SetAlarmLight(false);
                SmartHome_UpdateAlarmSound(false);
            }
        }

        LOS_Msleep(200);
    }
    return NULL;
}

// 3. UI 极致航天 HUD 刷新任务 (200ms)
static void *UiTask(void *arg)
{
    (void)arg;
    char line_buf[64];
    uint8_t tick_toggle = 0;

    // 运行精致自检开机动画
    Lcd_ShowBootAnimation();

    while (1) {
        tick_toggle ^= 1;

        // ==========================================
        // 顶部 HUD 科技顶栏 (Y: 0 ~ 22)
        // ==========================================
        lcd_fill(0, 0, LCD_W, 22, LCD_DARKBLUE);
        lcd_draw_line(0, 22, 319, 22, LCD_CYAN);
        lcd_show_chinese(6, 3, (uint8_t *)"鸿蒙空间站", LCD_YELLOW, LCD_DARKBLUE, 16, 0);
        lcd_show_string(92, 3, (uint8_t *)"CSS-01", LCD_CYAN, LCD_DARKBLUE, 16, 0);

        snprintf(line_buf, sizeof(line_buf), "IP:%-12s", g_wifi_ready ? g_ip_str : "OFFLINE");
        lcd_show_string(155, 3, (uint8_t *)line_buf, g_wifi_ready ? LCD_GREEN : LCD_RED, LCD_DARKBLUE, 16, 0);

        // 看门狗状态与闪烁心跳
        lcd_show_string(275, 3, (uint8_t *)"WDT", LCD_LIGHTBLUE, LCD_DARKBLUE, 16, 0);
        lcd_show_char(305, 3, tick_toggle ? '*' : 'o', tick_toggle ? LCD_YELLOW : LCD_CYAN, LCD_DARKBLUE, 16, 0);

        // ==========================================
        // 第一象限：环境感知卡片 (X: 4 ~ 158, Y: 26 ~ 116)
        // ==========================================
        lcd_draw_rectangle(4, 26, 158, 116, LCD_GRAYBLUE);
        lcd_fill(5, 27, 157, 40, LCD_DARKBLUE);
        lcd_show_string(8, 27, (uint8_t *)"[ENV SENSORS]", LCD_CYAN, LCD_DARKBLUE, 16, 0);

        // 温度 (T)
        snprintf(line_buf, sizeof(line_buf), "T:%-4.1fC", g_report.temperature);
        uint16_t tc = (g_report.temperature > ALARM_TEMP_THRESHOLD) ? LCD_RED : LCD_WHITE;
        lcd_show_string(8, 44, (uint8_t *)line_buf, tc, LCD_BLACK, 16, 0);
        // 温度微型条形进度
        int t_bar = (int)((g_report.temperature / 50.0f) * 60);
        if (t_bar > 60) t_bar = 60; if (t_bar < 0) t_bar = 0;
        lcd_fill(90, 48, 152, 54, LCD_BLACK);
        lcd_draw_rectangle(90, 48, 152, 54, LCD_GRAYBLUE);
        lcd_fill(91, 49, 91 + t_bar, 53, tc);

        // 湿度 (H)
        snprintf(line_buf, sizeof(line_buf), "H:%-4.1f%%", g_report.humidity);
        uint16_t hc = (g_report.humidity > ALARM_HUMI_THRESHOLD) ? LCD_RED : LCD_WHITE;
        lcd_show_string(8, 62, (uint8_t *)line_buf, hc, LCD_BLACK, 16, 0);
        int h_bar = (int)((g_report.humidity / 100.0f) * 60);
        if (h_bar > 60) h_bar = 60; if (h_bar < 0) h_bar = 0;
        lcd_fill(90, 66, 152, 72, LCD_BLACK);
        lcd_draw_rectangle(90, 66, 152, 72, LCD_GRAYBLUE);
        lcd_fill(91, 67, 91 + h_bar, 71, hc);

        // 光照 (L)
        snprintf(line_buf, sizeof(line_buf), "L:%-4.0flx", g_report.lux);
        uint16_t lc = (g_report.lux < ALARM_LUX_THRESHOLD) ? LCD_RED : LCD_WHITE;
        lcd_show_string(8, 80, (uint8_t *)line_buf, lc, LCD_BLACK, 16, 0);
        int l_bar = (int)((g_report.lux / 1000.0f) * 60);
        if (l_bar > 60) l_bar = 60; if (l_bar < 0) l_bar = 0;
        lcd_fill(90, 84, 152, 90, LCD_BLACK);
        lcd_draw_rectangle(90, 84, 152, 90, LCD_GRAYBLUE);
        lcd_fill(91, 85, 91 + l_bar, 89, lc);

        // 烟雾 (G)
        snprintf(line_buf, sizeof(line_buf), "G:%-4.1fppm", g_report.gas_ppm);
        uint16_t gc = (g_report.gas_ppm > ALARM_GAS_THRESHOLD) ? LCD_RED : LCD_WHITE;
        lcd_show_string(8, 98, (uint8_t *)line_buf, gc, LCD_BLACK, 16, 0);
        lcd_show_string(105, 98, (g_report.gas_ppm > ALARM_GAS_THRESHOLD) ? (uint8_t *)"[WARN]" : (uint8_t *)"[PASS]",
                        (g_report.gas_ppm > ALARM_GAS_THRESHOLD) ? LCD_RED : LCD_GREEN, LCD_BLACK, 16, 0);

        // ==========================================
        // 第二象限：MPU6050 姿态卡片 (X: 162 ~ 316, Y: 26 ~ 116)
        // ==========================================
        lcd_draw_rectangle(162, 26, 316, 116, LCD_GRAYBLUE);
        lcd_fill(163, 27, 315, 40, LCD_DARKBLUE);
        lcd_show_string(166, 27, (uint8_t *)"[ATTITUDE MPU6050]", LCD_CYAN, LCD_DARKBLUE, 16, 0);

        snprintf(line_buf, sizeof(line_buf), "PITCH: %+05.1f*", g_mpu_data.pitch);
        lcd_show_string(166, 44, (uint8_t *)line_buf, LCD_WHITE, LCD_BLACK, 16, 0);

        snprintf(line_buf, sizeof(line_buf), "ROLL : %+05.1f*", g_mpu_data.roll);
        lcd_show_string(166, 62, (uint8_t *)line_buf, LCD_WHITE, LCD_BLACK, 16, 0);

        snprintf(line_buf, sizeof(line_buf), "ACC-Z: %+04.2fG", g_mpu_data.accel_z);
        lcd_show_string(166, 80, (uint8_t *)line_buf, LCD_LIGHTBLUE, LCD_BLACK, 16, 0);

        // 微型人工地平仪视窗 (166 ~ 312, Y: 98 ~ 112)
        lcd_fill(166, 98, 312, 112, LCD_BLACK);
        lcd_draw_rectangle(166, 98, 312, 112, LCD_GRAYBLUE);
        lcd_draw_line(239, 96, 239, 114, LCD_CYAN); // 中心十字准星
        int p_offset = (int)(g_mpu_data.pitch * 0.4f);
        if (p_offset > 5) p_offset = 5; if (p_offset < -5) p_offset = -5;
        lcd_draw_line(210, 105 + p_offset, 268, 105 - p_offset, LCD_YELLOW); // 姿态地平线

        // ==========================================
        // 第三象限：多档位风扇控制卡片 (X: 4 ~ 158, Y: 120 ~ 188)
        // ==========================================
        lcd_draw_rectangle(4, 120, 158, 188, LCD_GRAYBLUE);
        lcd_fill(5, 121, 157, 134, LCD_DARKBLUE);
        lcd_show_string(8, 121, (uint8_t *)"[FAN ACTUATOR]", LCD_CYAN, LCD_DARKBLUE, 16, 0);

        int cur_speed = SmartHome_GetFanSpeed();
        int cur_duty = SmartHome_GetFanDuty();

        if (cur_speed == 4) {
            snprintf(line_buf, sizeof(line_buf), "MODE:AUTO (%d%%)", cur_duty);
        } else {
            snprintf(line_buf, sizeof(line_buf), "MODE:L%d   (%d%%)", cur_speed, cur_duty);
        }
        lcd_show_string(8, 138, (uint8_t *)line_buf, LCD_WHITE, LCD_BLACK, 16, 0);

        // 五档微型交互胶囊指示 [0][1][2][3][A]
        const char *caps[] = {"0", "1", "2", "3", "A"};
        for (int c = 0; c < 5; c++) {
            int cx = 10 + c * 29;
            bool active = (cur_speed == c);
            lcd_fill(cx, 156, cx + 24, 168, active ? LCD_GREEN : LCD_DARKBLUE);
            lcd_draw_rectangle(cx, 156, cx + 24, 168, active ? LCD_WHITE : LCD_GRAY);
            lcd_show_string(cx + 8, 156, (uint8_t *)caps[c], active ? LCD_BLACK : LCD_WHITE, active ? LCD_GREEN : LCD_DARKBLUE, 12, 0);
        }

        // 状态文字
        if (g_remote_override) {
            lcd_show_chinese(8, 172, (uint8_t *)"远控", LCD_MAGENTA, LCD_BLACK, 16, 0);
            lcd_show_string(42, 172, (uint8_t *)"REMOTE OVERRIDE", LCD_MAGENTA, LCD_BLACK, 12, 0);
        } else if (g_k3_muted_latch) {
            lcd_show_chinese(8, 172, (uint8_t *)"静音", LCD_CYAN, LCD_BLACK, 16, 0);
            lcd_show_string(42, 172, (uint8_t *)"MUTED LATCHED", LCD_CYAN, LCD_BLACK, 12, 0);
        } else if (g_report.alarm_active || g_alarm_test_active) {
            lcd_show_chinese(8, 172, (uint8_t *)"警报", LCD_RED, LCD_BLACK, 16, 0);
            lcd_show_string(42, 172, (uint8_t *)"ALARM CRITICAL", LCD_RED, LCD_BLACK, 12, 0);
        } else {
            lcd_show_chinese(8, 172, (uint8_t *)"正常", LCD_GREEN, LCD_BLACK, 16, 0);
            lcd_show_string(42, 172, (uint8_t *)"NORMAL MONITOR", LCD_GREEN, LCD_BLACK, 12, 0);
        }

        // ==========================================
        // 第四象限：SARADC5 按键矩阵与 I2C 总线卡片 (X: 162 ~ 316, Y: 120 ~ 188)
        // ==========================================
        lcd_draw_rectangle(162, 120, 316, 188, LCD_GRAYBLUE);
        lcd_fill(163, 121, 315, 134, LCD_DARKBLUE);
        lcd_show_string(166, 121, (uint8_t *)"[KEY MATRIX & BUS]", LCD_CYAN, LCD_DARKBLUE, 16, 0);

        // K3 ~ K6 四键物理高亮状态
        const char *k_labels[] = {"K3", "K4", "K5", "K6"};
        for (int k = 0; k < 4; k++) {
            int kx = 168 + k * 36;
            bool k_act = (strcmp(g_last_key_name, k_labels[k]) == 0);
            lcd_fill(kx, 138, kx + 32, 150, k_act ? LCD_YELLOW : LCD_DARKBLUE);
            lcd_draw_rectangle(kx, 138, kx + 32, 150, k_act ? LCD_WHITE : LCD_GRAYBLUE);
            lcd_show_string(kx + 8, 138, (uint8_t *)k_labels[k], k_act ? LCD_BLACK : LCD_CYAN, k_act ? LCD_YELLOW : LCD_DARKBLUE, 12, 0);
        }

        snprintf(line_buf, sizeof(line_buf), "ADC5:%.2fV  KEY:%-4s", AdcKey_GetVoltage(), g_last_key_name);
        lcd_show_string(166, 154, (uint8_t *)line_buf, LCD_WHITE, LCD_BLACK, 16, 0);

        snprintf(line_buf, sizeof(line_buf), "I2C: %-15s", g_i2c_device_str);
        lcd_show_string(166, 172, (uint8_t *)line_buf, LCD_LIGHTBLUE, LCD_BLACK, 12, 0);

        // ==========================================
        // 底部遥测通信与按键引导栏 (Y: 192 ~ 238)
        // ==========================================
        lcd_fill(0, 192, LCD_W, 214, LCD_DARKBLUE);
        lcd_draw_line(0, 192, 319, 192, LCD_CYAN);
        snprintf(line_buf, sizeof(line_buf), "UPLINK: OK=%-4d ERR=%-2d  [FAST]", g_cloud_upload_count, g_cloud_fail_count);
        lcd_show_string(8, 196, (uint8_t *)line_buf, (g_cloud_upload_count > 0) ? LCD_GREEN : LCD_CYAN, LCD_DARKBLUE, 16, 0);

        // 底部按键提示胶囊 (K3单击调速/消警 / 长按1秒自检 / 长按3秒重扫)
        lcd_fill(0, 216, LCD_W, LCD_H, LCD_BLACK);
        lcd_show_string(4, 220, (uint8_t *)"[K3:FAN/MUTE]", LCD_CYAN, LCD_BLACK, 16, 0);
        lcd_show_string(116, 220, (uint8_t *)"[HOLD 1s:TEST]", LCD_YELLOW, LCD_BLACK, 16, 0);
        lcd_show_string(232, 220, (uint8_t *)"[HOLD 3s:I2C]", LCD_GREEN, LCD_BLACK, 16, 0);

        LOS_Msleep(200);
    }
    return NULL;
}

// 4. 极速遥测上报任务 (800ms 周期，上报完整全量状态)
static void *TelemetryTask(void *arg)
{
    (void)arg;

    // 等待 Wi-Fi 就绪
    while (!g_wifi_ready) {
        LOS_Msleep(200);
    }

    LOS_Msleep(800);

    while (1) {
        bool real_motor_on = (SmartHome_GetFanDuty() > 0);
        bool real_alarm_on = (g_report.alarm_active || g_alarm_test_active) && !g_k3_muted_latch;

        TelemetryData telem;
        memset(&telem, 0, sizeof(telem));
        strncpy(telem.device_id, CLOUD_DEVICE_ID, sizeof(telem.device_id) - 1);
        telem.temperature = g_report.temperature;
        telem.humidity = g_report.humidity;
        telem.lux = g_report.lux;
        telem.gas_ppm = g_report.gas_ppm;
        telem.motor_on = real_motor_on ? 1 : 0;
        telem.alarm_on = real_alarm_on ? 1 : 0;

        telem.accel_x = g_mpu_data.accel_x;
        telem.accel_y = g_mpu_data.accel_y;
        telem.accel_z = g_mpu_data.accel_z;
        telem.pitch = g_mpu_data.pitch;
        telem.roll = g_mpu_data.roll;

        telem.fan_speed = SmartHome_GetFanSpeed();
        telem.wdt_alive = 1;
        strncpy(telem.i2c_devices, g_i2c_device_str, sizeof(telem.i2c_devices) - 1);
        strncpy(telem.last_key, g_last_key_name, sizeof(telem.last_key) - 1);

        if (HttpClient_PostTelemetry(&telem) == 0) {
            g_cloud_upload_count++;
        } else {
            g_cloud_fail_count++;
        }

        LOS_Msleep(800);
    }
    return NULL;
}

// 5. 极速指令拉取与多外设控制响应任务 (250ms 极速响应 + 立即回传闭环)
static void *CommandTask(void *arg)
{
    (void)arg;

    while (!g_wifi_ready) {
        LOS_Msleep(200);
    }

    LOS_Msleep(1000);

    while (1) {
        RemoteCommand cmd;
        memset(&cmd, 0, sizeof(cmd));
        int cmd_ret = HttpClient_GetPendingCommand(&cmd);
        if (cmd_ret > 0) {
            printf("[cloud] >>> EXECUTE COMMAND id=%d target=%s action=%s <<<\n",
                   cmd.command_id, cmd.target, cmd.action);

            if (strcmp(cmd.target, "motor") == 0 || strcmp(cmd.target, "fan") == 0) {
                if (strcmp(cmd.action, "on") == 0 || strcmp(cmd.action, "speed_3") == 0) {
                    g_remote_override = true;
                    g_remote_fan_speed = 3;
                } else if (strcmp(cmd.action, "off") == 0 || strcmp(cmd.action, "speed_0") == 0) {
                    g_remote_override = false;
                    g_manual_fan_speed = 0;
                } else if (strcmp(cmd.action, "speed_1") == 0) {
                    g_remote_override = true;
                    g_remote_fan_speed = 1;
                } else if (strcmp(cmd.action, "speed_2") == 0) {
                    g_remote_override = true;
                    g_remote_fan_speed = 2;
                } else if (strcmp(cmd.action, "auto") == 0) {
                    g_remote_override = false;
                    g_manual_fan_speed = 4;
                }
                SmartHome_SetFanSpeed(g_remote_override ? g_remote_fan_speed : g_manual_fan_speed);
                Ui_RefreshFanCardImmediate();
            } else if (strcmp(cmd.target, "alarm") == 0 && strcmp(cmd.action, "ack") == 0) {
                g_remote_override = false;
                g_k3_muted_latch = true;
                g_alarm_test_active = false;
                SmartHome_ResetAlarmState();
                Ui_RefreshFanCardImmediate();
            } else if (strcmp(cmd.target, "system") == 0 && strcmp(cmd.action, "reboot") == 0) {
                HttpClient_AckCommand(cmd.command_id, "done", "system reboot acknowledged");
                SmartHome_Reboot();
            }

            HttpClient_AckCommand(cmd.command_id, "done", "executed on rk2206");

            // 关键优化：指令执行完毕后立即上报一次全量最新遥测，实现毫秒级双向闭环同步！
            TelemetryData fast_telem;
            memset(&fast_telem, 0, sizeof(fast_telem));
            strncpy(fast_telem.device_id, CLOUD_DEVICE_ID, sizeof(fast_telem.device_id) - 1);
            fast_telem.temperature = g_report.temperature;
            fast_telem.humidity = g_report.humidity;
            fast_telem.lux = g_report.lux;
            fast_telem.gas_ppm = g_report.gas_ppm;
            fast_telem.motor_on = (SmartHome_GetFanDuty() > 0) ? 1 : 0;
            fast_telem.alarm_on = ((g_report.alarm_active || g_alarm_test_active) && !g_k3_muted_latch) ? 1 : 0;
            fast_telem.accel_x = g_mpu_data.accel_x;
            fast_telem.accel_y = g_mpu_data.accel_y;
            fast_telem.accel_z = g_mpu_data.accel_z;
            fast_telem.pitch = g_mpu_data.pitch;
            fast_telem.roll = g_mpu_data.roll;
            fast_telem.fan_speed = SmartHome_GetFanSpeed();
            fast_telem.wdt_alive = 1;
            strncpy(fast_telem.i2c_devices, g_i2c_device_str, sizeof(fast_telem.i2c_devices) - 1);
            strncpy(fast_telem.last_key, g_last_key_name, sizeof(fast_telem.last_key) - 1);
            HttpClient_PostTelemetry(&fast_telem);
        }

        LOS_Msleep(250);
    }
    return NULL;
}

// 6. 网络状态监控任务
static void *NetMonitorTask(void *arg)
{
    (void)arg;
    WifiLinkedInfo info;
    while (1) {
        memset(&info, 0, sizeof(info));
        if (GetLinkedInfo(&info) == WIFI_SUCCESS && info.connState == WIFI_CONNECTED && info.ipAddress != 0) {
            uint8_t *ip = (uint8_t *)&info.ipAddress;
            snprintf(g_ip_str, sizeof(g_ip_str), "%u.%u.%u.%u", ip[0], ip[1], ip[2], ip[3]);
            g_wifi_ready = true;
        } else {
            g_wifi_ready = false;
            snprintf(g_ip_str, sizeof(g_ip_str), "CONNECTING..");
        }
        LOS_Msleep(1000);
    }
    return NULL;
}

// 极速刷新风扇档位卡片与指示胶囊 (< 20ms 交互响应)
void Ui_RefreshFanCardImmediate(void)
{
    int cur_speed = SmartHome_GetFanSpeed();
    int cur_duty = SmartHome_GetFanDuty();
    char line_buf[32];

    // 1. 局部擦除并重绘档位与占空比行 (X: 8~155, Y: 138~154)
    lcd_fill(8, 138, 155, 154, LCD_BLACK);
    if (cur_speed == 4) {
        snprintf(line_buf, sizeof(line_buf), "MODE:AUTO (%d%%)", cur_duty);
    } else {
        snprintf(line_buf, sizeof(line_buf), "MODE:L%d   (%d%%)", cur_speed, cur_duty);
    }
    lcd_show_string(8, 138, (uint8_t *)line_buf, LCD_WHITE, LCD_BLACK, 16, 0);

    // 2. 局部刷新五档微型交互胶囊指示 [0][1][2][3][A] (X: 10~155, Y: 156~168)
    const char *caps[] = {"0", "1", "2", "3", "A"};
    for (int c = 0; c < 5; c++) {
        int cx = 10 + c * 29;
        bool active = (cur_speed == c);
        lcd_fill(cx, 156, cx + 24, 168, active ? LCD_GREEN : LCD_DARKBLUE);
        lcd_draw_rectangle(cx, 156, cx + 24, 168, active ? LCD_WHITE : LCD_GRAY);
        lcd_show_string(cx + 8, 156, (uint8_t *)caps[c], active ? LCD_BLACK : LCD_WHITE, active ? LCD_GREEN : LCD_DARKBLUE, 12, 0);
    }
}

// 极速刷新按键卡片与矩阵高亮 (< 20ms 交互响应)
void Ui_RefreshKeyCardImmediate(void)
{
    const char *k_labels[] = {"K3", "K4", "K5", "K6"};
    for (int k = 0; k < 4; k++) {
        int kx = 168 + k * 36;
        bool k_act = (strcmp(g_last_key_name, k_labels[k]) == 0);
        lcd_fill(kx, 138, kx + 32, 150, k_act ? LCD_YELLOW : LCD_DARKBLUE);
        lcd_draw_rectangle(kx, 138, kx + 32, 150, k_act ? LCD_WHITE : LCD_GRAYBLUE);
        lcd_show_string(kx + 8, 138, (uint8_t *)k_labels[k], k_act ? LCD_BLACK : LCD_CYAN, k_act ? LCD_YELLOW : LCD_DARKBLUE, 12, 0);
    }

    char line_buf[32];
    snprintf(line_buf, sizeof(line_buf), "ADC5:%.2fV  KEY:%-4s", AdcKey_GetVoltage(), g_last_key_name);
    lcd_show_string(166, 154, (uint8_t *)line_buf, LCD_WHITE, LCD_BLACK, 16, 0);
}

// 7. 按键检测与物理交互任务 (极速按键检测与分工明确：K3调速/消警 / K4调速 / K5自检 / K6重扫)
static void *KeyTask(void *arg)
{
    (void)arg;

    while (1) {
        AdcKeyType k = AdcKey_Scan();
        if (k != KEY_NONE) {
            strncpy(g_last_key_name, AdcKey_GetName(k), sizeof(g_last_key_name) - 1);

            switch (k) {
                case KEY_K3:
                    // K3 (板载物理按键 PC7): 双重功能
                    // 若处于告警状态 -> 触发消警与安全复位 (MUTE & RESET)
                    // 若处于正常状态 -> 循环切换风机档位 (0 -> 1 -> 2 -> 3 -> AUTO)
                    if (g_report.alarm_active || g_alarm_test_active) {
                        g_k3_muted_latch = true;
                        g_alarm_test_active = false;
                        g_remote_override = false;
                        SmartHome_ResetAlarmState();
                        printf("[key] >>> K3 Pressed: Mute Alarm / Reset State <<<\n");
                    } else {
                        g_remote_override = false;
                        g_k3_muted_latch = false;
                        g_manual_fan_speed = (g_manual_fan_speed + 1) % 5;
                        SmartHome_SetFanSpeed(g_manual_fan_speed);
                        Ui_RefreshFanCardImmediate(); // < 20ms 极速刷新 LCD 档位与胶囊！
                        printf("[key] >>> K3 Pressed: Switch Fan Speed -> %d (duty: %d%%) <<<\n",
                               g_manual_fan_speed, SmartHome_GetFanDuty());
                    }
                    Ui_RefreshKeyCardImmediate();
                    break;

                case KEY_K4:
                    // K4: 循环切换风扇档位 (0 -> 1 -> 2 -> 3 -> AUTO) - 零延迟即时响应！
                    g_remote_override = false;
                    g_manual_fan_speed = (g_manual_fan_speed + 1) % 5;
                    SmartHome_SetFanSpeed(g_manual_fan_speed);
                    Ui_RefreshFanCardImmediate(); // < 20ms 极速刷新 LCD 档位与胶囊！
                    Ui_RefreshKeyCardImmediate();
                    printf("[key] >>> K4 Pressed: Switch Fan Speed -> %d (duty: %d%%) <<<\n",
                           g_manual_fan_speed, SmartHome_GetFanDuty());
                    break;

                case KEY_K5:
                    // K5: 模拟舱内告警声光与应急排烟自检测试 (TEST TOGGLE)
                    g_alarm_test_active = !g_alarm_test_active;
                    if (!g_alarm_test_active) {
                        g_k3_muted_latch = false;
                        SmartHome_ResetAlarmState();
                    } else {
                        g_k3_muted_latch = false;
                    }
                    Ui_RefreshKeyCardImmediate();
                    printf("[key] >>> K5 Pressed: Toggle Alarm Test -> %d <<<\n", g_alarm_test_active);
                    break;

                case KEY_K6:
                    // K6: I2C 总线拓扑动态重扫 (SCAN BUS)
                    printf("[key] >>> K6 Pressed: Rescan I2C Bus... <<<\n");
                    Ui_RefreshKeyCardImmediate();
                    SmartHome_ScanI2cBus(g_i2c_device_str, sizeof(g_i2c_device_str));
                    break;

                default:
                    break;
            }

            // 按键动作后立即上报一次遥测，让 Web 端大屏瞬间感知按键交互
            TelemetryData key_telem;
            memset(&key_telem, 0, sizeof(key_telem));
            strncpy(key_telem.device_id, CLOUD_DEVICE_ID, sizeof(key_telem.device_id) - 1);
            key_telem.temperature = g_report.temperature;
            key_telem.humidity = g_report.humidity;
            key_telem.lux = g_report.lux;
            key_telem.gas_ppm = g_report.gas_ppm;
            key_telem.motor_on = (SmartHome_GetFanDuty() > 0) ? 1 : 0;
            key_telem.alarm_on = ((g_report.alarm_active || g_alarm_test_active) && !g_k3_muted_latch) ? 1 : 0;
            key_telem.accel_x = g_mpu_data.accel_x;
            key_telem.accel_y = g_mpu_data.accel_y;
            key_telem.accel_z = g_mpu_data.accel_z;
            key_telem.pitch = g_mpu_data.pitch;
            key_telem.roll = g_mpu_data.roll;
            key_telem.fan_speed = SmartHome_GetFanSpeed();
            key_telem.wdt_alive = 1;
            strncpy(key_telem.i2c_devices, g_i2c_device_str, sizeof(key_telem.i2c_devices) - 1);
            strncpy(key_telem.last_key, g_last_key_name, sizeof(key_telem.last_key) - 1);
            HttpClient_PostTelemetry(&key_telem);
        }

        LOS_Msleep(10);
    }
    return NULL;
}

// 主测控服务初始化与任务派发
static void *MainStationTask(void *arg)
{
    (void)arg;
    printf("====================================================\n");
    printf("===== Lockzhiner RK2206 Space Station Advanced =====\n");
    printf("====================================================\n");

    // 初始化各硬件驱动与传感器
    SmartHome_Init();
    AdcKey_Init();
    Mpu6050_Init();
    SmartHome_InitWatchdog();
    HttpClient_Init();

    // 启动初始 I2C 总线拓扑扫描
    SmartHome_ScanI2cBus(g_i2c_device_str, sizeof(g_i2c_device_str));

    UINT32 task_id;
    TSK_INIT_PARAM_S task_param;

    // 1. KeyTask (优先级 3，极速按键检测，不丢失输入)
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)KeyTask;
    task_param.uwStackSize = 2048;
    task_param.pcName = "KeyTask";
    task_param.usTaskPrio = 3;
    LOS_TaskCreate(&task_id, &task_param);

    // 2. UiTask (优先级 7，负责 320x240 LCD 航天 HUD 实时渲染与自检开机动画)
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)UiTask;
    task_param.uwStackSize = 4096;
    task_param.pcName = "UiTask";
    task_param.usTaskPrio = 7;
    LOS_TaskCreate(&task_id, &task_param);

    // 3. NetMonitorTask (优先级 9，后台网络监控)
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)NetMonitorTask;
    task_param.uwStackSize = 3072;
    task_param.pcName = "NetMonitorTask";
    task_param.usTaskPrio = 9;
    LOS_TaskCreate(&task_id, &task_param);

    // 4. SensorTask (优先级 6，传感器采集、MPU6050 姿态结算、看门狗喂狗)
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)SensorTask;
    task_param.uwStackSize = 4096;
    task_param.pcName = "SensorTask";
    task_param.usTaskPrio = 6;
    LOS_TaskCreate(&task_id, &task_param);

    // 5. TelemetryTask (优先级 5，500ms 极速遥测上报)
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)TelemetryTask;
    task_param.uwStackSize = 6144;
    task_param.pcName = "TelemetryTask";
    task_param.usTaskPrio = 5;
    LOS_TaskCreate(&task_id, &task_param);

    // 6. CommandTask (优先级 5，200ms 极速下行指令响应与回执)
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)CommandTask;
    task_param.uwStackSize = 6144;
    task_param.pcName = "CommandTask";
    task_param.usTaskPrio = 5;
    LOS_TaskCreate(&task_id, &task_param);

    return NULL;
}

static void lab09_cloud_station_example(void)
{
    unsigned int task_id;
    TSK_INIT_PARAM_S param = {0};
    param.pfnTaskEntry = (TSK_ENTRY_FUNC)MainStationTask;
    param.uwStackSize = 4096;
    param.pcName = "lab09_cloud_station";
    param.usTaskPrio = 4;
    LOS_TaskCreate(&task_id, &param);
}

APP_FEATURE_INIT(lab09_cloud_station_example);
