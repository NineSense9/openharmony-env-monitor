#include <stdio.h>
#include <string.h>

#include "ohos_init.h"
#include "los_task.h"
#include "wifi_device.h"

#include "board_pins.h"
#include "smart_home.h"
#include "http_client.h"
#include "lcd.h"

static SensorReport g_report = {
    .temperature = 25.0f,
    .humidity = 50.0f,
    .lux = 100.0f,
    .gas_ppm = 10.0f,
    .alarm_active = false
};

static char g_ip_str[32] = "connecting...";
static int g_cloud_upload_count = 0;
static int g_cloud_fail_count = 0;
static bool g_wifi_ready = false;

// 1. 传感器周期采集任务 (2s 周期)
static void *SensorTask(void *arg)
{
    (void)arg;
    while (1) {
        SmartHome_ReadSensors(&g_report);
        if (g_report.alarm_active) {
            SmartHome_SetAlarmLight(true);
            SmartHome_SetMotor(true);
        }
        LOS_Msleep(SENSOR_SAMPLE_INTERVAL_MS);
    }
    return NULL;
}

// 2. UI 渲染刷新任务 (300ms 周期)
static void *UiTask(void *arg)
{
    (void)arg;
    char line_buf[64];

    lcd_init();
    lcd_fill(0, 0, LCD_W, LCD_H, LCD_BLACK);

    while (1) {
        // Line 1: Title
        lcd_show_string(10, 10, "Space Station Cloud", LCD_YELLOW, LCD_BLACK, 16, 0);

        // Line 2: WiFi IP
        snprintf(line_buf, sizeof(line_buf), "IP: %s", g_ip_str);
        lcd_show_string(10, 35, line_buf, g_wifi_ready ? LCD_GREEN : LCD_RED, LCD_BLACK, 16, 0);

        // Line 3: Temp & Humi
        snprintf(line_buf, sizeof(line_buf), "T:%.1f C  H:%.1f %%", g_report.temperature, g_report.humidity);
        uint16_t th_color = (g_report.temperature > ALARM_TEMP_THRESHOLD || g_report.humidity > ALARM_HUMI_THRESHOLD) ? LCD_RED : LCD_WHITE;
        lcd_show_string(10, 60, line_buf, th_color, LCD_BLACK, 16, 0);

        // Line 4: Lux & Gas
        snprintf(line_buf, sizeof(line_buf), "Lux:%.0f  Gas:%.1f", g_report.lux, g_report.gas_ppm);
        uint16_t lg_color = (g_report.lux < ALARM_LUX_THRESHOLD || g_report.gas_ppm > ALARM_GAS_THRESHOLD) ? LCD_RED : LCD_WHITE;
        lcd_show_string(10, 85, line_buf, lg_color, LCD_BLACK, 16, 0);

        // Line 5: Alarm Status
        if (g_report.alarm_active) {
            lcd_show_string(10, 110, "Status: [ALARM]", LCD_RED, LCD_BLACK, 16, 0);
        } else {
            lcd_show_string(10, 110, "Status: [NORMAL]", LCD_GREEN, LCD_BLACK, 16, 0);
        }

        // Line 6: Cloud Upload Stats
        snprintf(line_buf, sizeof(line_buf), "Cloud: OK=%d Err=%d", g_cloud_upload_count, g_cloud_fail_count);
        lcd_show_string(10, 135, line_buf, (g_cloud_upload_count > 0) ? LCD_GREEN : LCD_CYAN, LCD_BLACK, 16, 0);

        LOS_Msleep(UI_REFRESH_INTERVAL_MS);
    }
    return NULL;
}

// 3. 云端遥测上报与指令拉取任务 (3s 周期)
static void *CloudTask(void *arg)
{
    (void)arg;

    // 等待 Wi-Fi 获取 IP
    WifiLinkedInfo info;
    while (1) {
        memset(&info, 0, sizeof(info));
        if (GetLinkedInfo(&info) == WIFI_SUCCESS && info.connState == WIFI_CONNECTED && info.ipAddress != 0) {
            uint32_t ip = info.ipAddress;
            snprintf(g_ip_str, sizeof(g_ip_str), "%d.%d.%d.%d",
                     (int)(ip & 0xFF), (int)((ip >> 8) & 0xFF),
                     (int)((ip >> 16) & 0xFF), (int)((ip >> 24) & 0xFF));
            g_wifi_ready = true;
            printf("[cloud] wifi connected, ip=%s\n", g_ip_str);
            break;
        }
        LOS_Msleep(500);
    }

    while (1) {
        // 1. 上报遥测
        TelemetryData telem;
        strncpy(telem.device_id, CLOUD_DEVICE_ID, sizeof(telem.device_id) - 1);
        telem.temperature = g_report.temperature;
        telem.humidity = g_report.humidity;
        telem.lux = g_report.lux;
        telem.gas_ppm = g_report.gas_ppm;

        if (HttpClient_PostTelemetry(&telem) == 0) {
            g_cloud_upload_count++;
            printf("[cloud] telemetry upload ok (total=%d)\n", g_cloud_upload_count);
        } else {
            g_cloud_fail_count++;
            printf("[cloud] telemetry upload failed\n");
        }

        // 2. 拉取待执行指令
        RemoteCommand cmd;
        memset(&cmd, 0, sizeof(cmd));
        int cmd_ret = HttpClient_GetPendingCommand(&cmd);
        if (cmd_ret > 0) {
            printf("[cloud] execute command: target=%s, action=%s\n", cmd.target, cmd.action);
            if (strcmp(cmd.target, "motor") == 0) {
                SmartHome_SetMotor(strcmp(cmd.action, "on") == 0);
            } else if (strcmp(cmd.target, "led") == 0) {
                SmartHome_SetAlarmLight(strcmp(cmd.action, "on") == 0);
            } else if (strcmp(cmd.target, "alarm") == 0 && strcmp(cmd.action, "ack") == 0) {
                SmartHome_ResetAlarmState();
            }
            HttpClient_AckCommand(cmd.command_id, "done", "executed on rk2206");
        }

        LOS_Msleep(CLOUD_UPLOAD_INTERVAL_MS);
    }
    return NULL;
}

// 4. K3 按键消警任务 (50ms 轮询)
static void *KeyTask(void *arg)
{
    (void)arg;
    while (1) {
        if (SmartHome_IsK3Pressed()) {
            LOS_Msleep(20); // 消抖
            if (SmartHome_IsK3Pressed()) {
                printf("[key] K3 pressed -> reset alarm & stop motor\n");
                SmartHome_ResetAlarmState();
                while (SmartHome_IsK3Pressed()) {
                    LOS_Msleep(50);
                }
            }
        }
        LOS_Msleep(50);
    }
    return NULL;
}

static void *MainStationTask(void *arg)
{
    (void)arg;
    printf("=========================================\n");
    printf("===== Space Station Cloud Telemetry =====\n");
    printf("=========================================\n");

    SmartHome_Init();
    HttpClient_Init();

    UINT32 task_id;
    TSK_INIT_PARAM_S task_param;

    // 启动 SensorTask
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)SensorTask;
    task_param.uwStackSize = 4096;
    task_param.pcName = "SensorTask";
    task_param.usTaskPrio = 6;
    LOS_TaskCreate(&task_id, &task_param);

    // 启动 UiTask
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)UiTask;
    task_param.uwStackSize = 4096;
    task_param.pcName = "UiTask";
    task_param.usTaskPrio = 7;
    LOS_TaskCreate(&task_id, &task_param);

    // 启动 CloudTask
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)CloudTask;
    task_param.uwStackSize = 8192;
    task_param.pcName = "CloudTask";
    task_param.usTaskPrio = 5;
    LOS_TaskCreate(&task_id, &task_param);

    // 启动 KeyTask
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)KeyTask;
    task_param.uwStackSize = 2048;
    task_param.pcName = "KeyTask";
    task_param.usTaskPrio = 8;
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
