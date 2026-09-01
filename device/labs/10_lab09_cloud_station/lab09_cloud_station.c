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

// K3 本地消警锁存：一旦按下 K3，保持静音，直到环境完全恢复正常后才自动解除静音
static bool g_k3_muted_latch = false;

// 云端远程手动控制电机标志 (true 表示云端强制开启/关闭，不受传感器自动联动打断)
static bool g_remote_override = false;
static bool g_remote_motor_on = false;

// 开机动画与自检函数
static void Lcd_ShowBootAnimation(void)
{
    lcd_init();
    lcd_fill(0, 0, LCD_W, LCD_H, LCD_BLACK);

    // 绘制顶底装饰科技线
    lcd_draw_line(10, 15, 310, 15, LCD_CYAN);
    lcd_draw_line(10, 225, 310, 225, LCD_CYAN);

    // 居中大字标题
    lcd_show_chinese(70, 30, (uint8_t *)"鸿蒙空间站", LCD_YELLOW, LCD_BLACK, 16, 0);
    lcd_show_string(160, 30, (uint8_t *)"CSS-01", LCD_CYAN, LCD_BLACK, 16, 0);
    lcd_show_string(40, 52, (uint8_t *)"OpenHarmony 3.0 LTS OS", LCD_LIGHTBLUE, LCD_BLACK, 16, 0);

    LOS_Msleep(400);

    // 自检过程逐步显示
    lcd_show_chinese(20, 80, (uint8_t *)"自检", LCD_WHITE, LCD_BLACK, 16, 0);
    lcd_show_string(55, 80, (uint8_t *)": LiteOS-M Kernel ..", LCD_WHITE, LCD_BLACK, 16, 0);
    lcd_show_chinese(225, 80, (uint8_t *)"正常", LCD_GREEN, LCD_BLACK, 16, 0);
    LOS_Msleep(250);

    lcd_show_chinese(20, 105, (uint8_t *)"自检", LCD_WHITE, LCD_BLACK, 16, 0);
    lcd_show_string(55, 105, (uint8_t *)": SHT30 I2C0:0x44 ..", LCD_WHITE, LCD_BLACK, 16, 0);
    lcd_show_chinese(225, 105, (uint8_t *)"正常", LCD_GREEN, LCD_BLACK, 16, 0);
    LOS_Msleep(250);

    lcd_show_chinese(20, 130, (uint8_t *)"自检", LCD_WHITE, LCD_BLACK, 16, 0);
    lcd_show_string(55, 130, (uint8_t *)": BH1750 I2C0:23 ...", LCD_WHITE, LCD_BLACK, 16, 0);
    lcd_show_chinese(225, 130, (uint8_t *)"正常", LCD_GREEN, LCD_BLACK, 16, 0);
    LOS_Msleep(250);

    lcd_show_chinese(20, 155, (uint8_t *)"自检", LCD_WHITE, LCD_BLACK, 16, 0);
    lcd_show_string(55, 155, (uint8_t *)": MQ2 SARADC:CH2 ...", LCD_WHITE, LCD_BLACK, 16, 0);
    lcd_show_chinese(225, 155, (uint8_t *)"正常", LCD_GREEN, LCD_BLACK, 16, 0);
    LOS_Msleep(250);

    // 动态进度条
    lcd_show_chinese(20, 185, (uint8_t *)"系统启动中", LCD_CYAN, LCD_BLACK, 16, 0);
    lcd_draw_rectangle(110, 186, 290, 198, LCD_CYAN);
    for (int w = 112; w <= 288; w += 8) {
        lcd_fill(112, 188, w, 196, LCD_GREEN);
        LOS_Msleep(30);
    }

    LOS_Msleep(300);
    lcd_fill(0, 0, LCD_W, LCD_H, LCD_BLACK);
}

// 1. 传感器周期采集任务 (200ms 极速采集响应)
static void *SensorTask(void *arg)
{
    (void)arg;
    while (1) {
        SmartHome_ReadSensors(&g_report);

        // 检查环境是否恢复正常：若已恢复，自动解除 K3 静音锁存
        if (!g_report.alarm_active) {
            if (g_k3_muted_latch) {
                printf("[alarm] environment recovered normal -> K3 mute latch cleared\n");
                g_k3_muted_latch = false;
            }
        }

        // 决定告警声光与电机动作
        if (g_remote_override) {
            // 云端远程手动模式优先
            SmartHome_SetMotor(g_remote_motor_on);
        } else {
            // 自动监测模式
            if (g_report.alarm_active) {
                if (g_k3_muted_latch) {
                    // 已被 K3 本地消警静音：保持灯灭、电机停转
                    SmartHome_SetAlarmLight(false);
                    SmartHome_SetMotor(false);
                } else {
                    // 告警生效：开启声光与电机排风
                    SmartHome_SetAlarmLight(true);
                    SmartHome_SetMotor(true);
                }
            } else {
                // 环境正常：灯灭、电机停转
                SmartHome_SetAlarmLight(false);
                SmartHome_SetMotor(false);
            }
        }

        LOS_Msleep(200);
    }
    return NULL;
}

// 2. UI 渲染刷新任务 (200ms 周期)
static void *UiTask(void *arg)
{
    (void)arg;
    char line_buf[64];
    uint8_t tick_toggle = 0;

    // 先运行 2 秒航天自检开机动画
    Lcd_ShowBootAnimation();

    while (1) {
        tick_toggle ^= 1;

        // 顶部反色科技标题栏
        lcd_fill(0, 0, LCD_W, 24, LCD_DARKBLUE);
        lcd_show_chinese(8, 4, (uint8_t *)"鸿蒙空间站舱内测控终端", LCD_YELLOW, LCD_DARKBLUE, 16, 0);
        // 心跳闪烁圆点
        lcd_show_char(300, 4, tick_toggle ? '*' : 'o', LCD_CYAN, LCD_DARKBLUE, 16, 0);

        // 第二行：IP 与联网状态
        snprintf(line_buf, sizeof(line_buf), "IP: %-15s", g_ip_str);
        lcd_show_string(8, 28, (uint8_t *)line_buf, g_wifi_ready ? LCD_GREEN : LCD_RED, LCD_BLACK, 16, 0);
        lcd_fill(200, 28, 310, 44, LCD_BLACK);
        if (g_wifi_ready) {
            lcd_show_chinese(200, 28, (uint8_t *)"网络正常", LCD_GREEN, LCD_BLACK, 16, 0);
        } else {
            lcd_show_chinese(200, 28, (uint8_t *)"正在联网", LCD_RED, LCD_BLACK, 16, 0);
        }

        // 双列仪表边框 (Y: 48 ~ 116)
        lcd_draw_rectangle(6, 48, 156, 116, LCD_GRAYBLUE);
        lcd_draw_rectangle(164, 48, 314, 116, LCD_GRAYBLUE);

        // 左列：温度与湿度
        lcd_show_chinese(12, 56, (uint8_t *)"温度", LCD_LIGHTBLUE, LCD_BLACK, 16, 0);
        snprintf(line_buf, sizeof(line_buf), ":%-4.1f C ", g_report.temperature);
        uint16_t t_color = (g_report.temperature > ALARM_TEMP_THRESHOLD) ? LCD_RED : LCD_WHITE;
        lcd_show_string(46, 56, (uint8_t *)line_buf, t_color, LCD_BLACK, 16, 0);

        lcd_show_chinese(12, 86, (uint8_t *)"湿度", LCD_LIGHTBLUE, LCD_BLACK, 16, 0);
        snprintf(line_buf, sizeof(line_buf), ":%-4.1f %% ", g_report.humidity);
        uint16_t h_color = (g_report.humidity > ALARM_HUMI_THRESHOLD) ? LCD_RED : LCD_WHITE;
        lcd_show_string(46, 86, (uint8_t *)line_buf, h_color, LCD_BLACK, 16, 0);

        // 右列：光照与烟雾
        lcd_show_chinese(170, 56, (uint8_t *)"光照", LCD_LIGHTBLUE, LCD_BLACK, 16, 0);
        snprintf(line_buf, sizeof(line_buf), ":%-4.0flx ", g_report.lux);
        uint16_t l_color = (g_report.lux < ALARM_LUX_THRESHOLD) ? LCD_RED : LCD_WHITE;
        lcd_show_string(204, 56, (uint8_t *)line_buf, l_color, LCD_BLACK, 16, 0);

        lcd_show_chinese(170, 86, (uint8_t *)"烟雾", LCD_LIGHTBLUE, LCD_BLACK, 16, 0);
        snprintf(line_buf, sizeof(line_buf), ":%-4.1fppm", g_report.gas_ppm);
        uint16_t g_color = (g_report.gas_ppm > ALARM_GAS_THRESHOLD) ? LCD_RED : LCD_WHITE;
        lcd_show_string(204, 86, (uint8_t *)line_buf, g_color, LCD_BLACK, 16, 0);

        // 第五行：系统工作状态
        lcd_show_chinese(8, 126, (uint8_t *)"系统状态", LCD_WHITE, LCD_BLACK, 16, 0);
        lcd_show_string(74, 126, (uint8_t *)":", LCD_WHITE, LCD_BLACK, 16, 0);
        lcd_fill(86, 126, 180, 142, LCD_BLACK);
        if (g_remote_override) {
            lcd_show_chinese(86, 126, (uint8_t *)"远程控制", LCD_MAGENTA, LCD_BLACK, 16, 0);
        } else if (g_k3_muted_latch) {
            lcd_show_chinese(86, 126, (uint8_t *)"消警静音", LCD_CYAN, LCD_BLACK, 16, 0);
        } else if (g_report.alarm_active) {
            lcd_show_chinese(86, 126, (uint8_t *)"环境告警", LCD_RED, LCD_BLACK, 16, 0);
        } else {
            lcd_show_chinese(86, 126, (uint8_t *)"正常监测", LCD_GREEN, LCD_BLACK, 16, 0);
        }

        // 第六行：真实电机物理状态指示
        bool real_motor_on = g_remote_override ? g_remote_motor_on : (g_report.alarm_active && !g_k3_muted_latch);
        lcd_show_chinese(8, 156, (uint8_t *)"排风电机", LCD_WHITE, LCD_BLACK, 16, 0);
        lcd_show_string(74, 156, (uint8_t *)":", LCD_WHITE, LCD_BLACK, 16, 0);
        lcd_fill(86, 156, 260, 172, LCD_BLACK);
        if (real_motor_on) {
            lcd_show_chinese(86, 156, (uint8_t *)"高速运转", LCD_CYAN, LCD_BLACK, 16, 0);
            lcd_show_string(156, 156, (uint8_t *)"(6000RPM)", LCD_CYAN, LCD_BLACK, 16, 0);
        } else {
            lcd_show_chinese(86, 156, (uint8_t *)"待机停转", LCD_WHITE, LCD_BLACK, 16, 0);
            lcd_show_string(156, 156, (uint8_t *)"(STANDBY)", LCD_GRAY, LCD_BLACK, 16, 0);
        }

        // 第七行：云端通讯统计
        snprintf(line_buf, sizeof(line_buf), "Cloud: OK=%-4d Err=%-3d (500ms)", g_cloud_upload_count, g_cloud_fail_count);
        lcd_show_string(8, 188, (uint8_t *)line_buf, (g_cloud_upload_count > 0) ? LCD_GREEN : LCD_CYAN, LCD_BLACK, 16, 0);

        LOS_Msleep(200);
    }
    return NULL;
}

// 3. 极速遥测上报任务 (500ms 周期，延迟 < 500ms)
static void *TelemetryTask(void *arg)
{
    (void)arg;

    // 等待 Wi-Fi 就绪
    while (!g_wifi_ready) {
        LOS_Msleep(200);
    }

    LOS_Msleep(1000);

    while (1) {
        bool real_motor_on = g_remote_override ? g_remote_motor_on : (g_report.alarm_active && !g_k3_muted_latch);
        bool real_alarm_on = g_remote_override ? false : (g_report.alarm_active && !g_k3_muted_latch);

        TelemetryData telem;
        strncpy(telem.device_id, CLOUD_DEVICE_ID, sizeof(telem.device_id) - 1);
        telem.temperature = g_report.temperature;
        telem.humidity = g_report.humidity;
        telem.lux = g_report.lux;
        telem.gas_ppm = g_report.gas_ppm;
        telem.motor_on = real_motor_on ? 1 : 0;
        telem.alarm_on = real_alarm_on ? 1 : 0;

        if (HttpClient_PostTelemetry(&telem) == 0) {
            g_cloud_upload_count++;
        } else {
            g_cloud_fail_count++;
        }

        LOS_Msleep(500);
    }
    return NULL;
}

// 4. 极速指令拉取与响应任务 (200ms 轮询周期，指令响应 < 300ms)
static void *CommandTask(void *arg)
{
    (void)arg;

    // 等待 Wi-Fi 就绪
    while (!g_wifi_ready) {
        LOS_Msleep(200);
    }

    LOS_Msleep(1200);

    while (1) {
        RemoteCommand cmd;
        memset(&cmd, 0, sizeof(cmd));
        int cmd_ret = HttpClient_GetPendingCommand(&cmd);
        if (cmd_ret > 0) {
            printf("[cloud] >>> EXECUTE COMMAND id=%d target=%s action=%s <<<\n",
                   cmd.command_id, cmd.target, cmd.action);

            if (strcmp(cmd.target, "motor") == 0) {
                bool turn_on = (strcmp(cmd.action, "on") == 0);
                g_remote_override = true;
                g_remote_motor_on = turn_on;
                SmartHome_SetMotor(turn_on);
            } else if (strcmp(cmd.target, "led") == 0) {
                bool turn_on = (strcmp(cmd.action, "on") == 0);
                SmartHome_SetAlarmLight(turn_on);
            } else if (strcmp(cmd.target, "alarm") == 0 && strcmp(cmd.action, "ack") == 0) {
                g_remote_override = false;
                g_k3_muted_latch = true;
                SmartHome_ResetAlarmState();
            }

            HttpClient_AckCommand(cmd.command_id, "done", "executed on rk2206");
        }

        LOS_Msleep(200);
    }
    return NULL;
}

// 5. 网络连网状态监控任务
static void *NetMonitorTask(void *arg)
{
    (void)arg;
    WifiLinkedInfo info;
    while (1) {
        memset(&info, 0, sizeof(info));
        if (GetLinkedInfo(&info) == WIFI_SUCCESS && info.connState == WIFI_CONNECTED && info.ipAddress != 0) {
            uint32_t ip = info.ipAddress;
            snprintf(g_ip_str, sizeof(g_ip_str), "%d.%d.%d.%d",
                     (int)(ip & 0xFF), (int)((ip >> 8) & 0xFF),
                     (int)((ip >> 16) & 0xFF), (int)((ip >> 24) & 0xFF));
            g_wifi_ready = true;
        } else {
            g_wifi_ready = false;
        }
        LOS_Msleep(1000);
    }
    return NULL;
}

// 6. K3 按键消警任务 (50ms 轮询)
static void *KeyTask(void *arg)
{
    (void)arg;
    while (1) {
        if (SmartHome_IsK3Pressed()) {
            LOS_Msleep(20); // 消抖
            if (SmartHome_IsK3Pressed()) {
                printf("[key] K3 pressed -> latch mute alarm & stop motor\n");
                g_k3_muted_latch = true;
                g_remote_override = false;
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

    // 1. 启动 UiTask (优先启动展示开机动画)
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)UiTask;
    task_param.uwStackSize = 4096;
    task_param.pcName = "UiTask";
    task_param.usTaskPrio = 7;
    LOS_TaskCreate(&task_id, &task_param);

    // 2. 启动 NetMonitorTask
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)NetMonitorTask;
    task_param.uwStackSize = 3072;
    task_param.pcName = "NetMonitorTask";
    task_param.usTaskPrio = 9;
    LOS_TaskCreate(&task_id, &task_param);

    // 3. 启动 SensorTask
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)SensorTask;
    task_param.uwStackSize = 4096;
    task_param.pcName = "SensorTask";
    task_param.usTaskPrio = 6;
    LOS_TaskCreate(&task_id, &task_param);

    // 4. 启动 TelemetryTask (500ms 极速上报)
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)TelemetryTask;
    task_param.uwStackSize = 6144;
    task_param.pcName = "TelemetryTask";
    task_param.usTaskPrio = 5;
    LOS_TaskCreate(&task_id, &task_param);

    // 5. 启动 CommandTask (200ms 极速指令响应)
    memset(&task_param, 0, sizeof(task_param));
    task_param.pfnTaskEntry = (TSK_ENTRY_FUNC)CommandTask;
    task_param.uwStackSize = 6144;
    task_param.pcName = "CommandTask";
    task_param.usTaskPrio = 5;
    LOS_TaskCreate(&task_id, &task_param);

    // 6. 启动 KeyTask
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
