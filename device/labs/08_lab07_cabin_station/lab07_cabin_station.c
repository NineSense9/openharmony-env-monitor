#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

#include "los_task.h"
#include "ohos_init.h"
#include "lz_hardware.h"

#include "board_pins.h"
#include "lcd.h"
#include "tx_key.h"
#include "tx_light.h"
#include "mq2.h"
#include "smart_home.h"

#define LAB07_SAMPLE_STACK_SIZE 0x2000
#define LAB07_SAMPLE_PRIORITY   25
#define LAB07_SAMPLE_PERIOD_MS  800

#define LAB07_CTRL_STACK_SIZE   0x2000
#define LAB07_CTRL_PRIORITY     25
#define LAB07_CTRL_PERIOD_MS    100

/* 告警阈值定义（更贴合实际环境测试） */
#define TH_LIGHT_LOW  20.0f   /* 遮光测试：暗于 20 Lux 触发环境告警 */
#define TH_GAS_HIGH   80.0f   /* 气体测试：高于 80 ppm 触发环境告警 */
#define TH_TEMP_HIGH  35.0f   /* 温度测试：高于 35.0 C 触发热湿告警 */
#define TH_HUMI_HIGH  75.0f   /* 湿度测试：高于 75.0 % 触发热湿告警 */

#define TITLE_ROW_Y    25
#define TH_ROW_Y       55
#define TH_CLEAR_TOP    47
#define TH_CLEAR_BOTTOM 75
#define LUX_GAS_ROW_Y   85
#define LG_CLEAR_TOP    77
#define LG_CLEAR_BOTTOM 105
#define ENV_ROW_Y       115
#define ENV_CLEAR_TOP   107
#define ENV_CLEAR_BOTTOM 135
#define THERMAL_ROW_Y   145
#define THM_CLEAR_TOP   137
#define THM_CLEAR_BOTTOM 165
#define ACT_ROW_Y       175
#define ACT_CLEAR_TOP   167
#define ACT_CLEAR_BOTTOM 195
#define STATUS_ROW_Y    205
#define STATUS_CLEAR_TOP 197
#define STATUS_CLEAR_BOTTOM 225

/* 全局监测变量与告警状态 */
static volatile double g_temp = 25.0;
static volatile double g_humi = 50.0;
static volatile float  g_lux = 100.0f;
static volatile float  g_ppm = 20.0f;
static volatile bool   g_alarm_ack = false;
static volatile int    g_sensors_ready = 0;

static void lab07_draw_initial_screen(void)
{
    lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE);
    lcd_show_string(10, TITLE_ROW_Y, "TX-SMART-R Lab07 Cabin", LCD_BLUE, LCD_WHITE, 16, 0);
    lcd_show_string(10, TH_ROW_Y, "T: --.- C  H: --.- %", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, LUX_GAS_ROW_Y, "Lux: ---.-  Gas: --.- ppm", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, ENV_ROW_Y, "Env: NORMAL", LCD_GREEN, LCD_WHITE, 16, 0);
    lcd_show_string(10, THERMAL_ROW_Y, "Thermal: NORMAL", LCD_GREEN, LCD_WHITE, 16, 0);
    lcd_show_string(10, ACT_ROW_Y, "Act: OFF", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, STATUS_ROW_Y, "Status: RUNNING", LCD_BLUE, LCD_WHITE, 16, 0);
}

/* 环境告警判定：光照过暗 或 气体过高 */
static bool env_alarm_active(void)
{
    return (g_lux < TH_LIGHT_LOW) || (g_ppm > TH_GAS_HIGH);
}

/* 热湿告警判定：温度过高 或 湿度过高 */
static bool thermal_alarm_active(void)
{
    return (g_temp > TH_TEMP_HIGH) || (g_humi > TH_HUMI_HIGH);
}

/* 任务 A：多传感器采样任务（约 800ms 周期） */
static void *lab07_sample_task(void *arg)
{
    double t = 0.0, h = 0.0;

    (void)arg;

    printf("lab07_cabin_station: sample_task start\n");

    smart_home_init();
    mq2_dev_init();
    LOS_Msleep(500);
    mq2_ppm_calibration();

    g_sensors_ready = 1;

    while (1) {
        sht30_read_temp_humi(&t, &h);
        g_temp = t;
        g_humi = h;
        g_lux = bh1750_read_lux();
        g_ppm = get_mq2_ppm();

        printf("lab07_cabin_station: [sample] T=%.1f C, H=%.1f %%, Lux=%.1f, Gas=%.1f ppm\n",
               g_temp, g_humi, g_lux, g_ppm);

        LOS_Msleep(LAB07_SAMPLE_PERIOD_MS);
    }

    return NULL;
}

/* 任务 B：控制与 UI 任务（约 100ms 周期） */
static void *lab07_control_ui_task(void *arg)
{
    int was = 0;
    int blink_count = 0;
    int alarm_light_state = 0;
    char buf[48];
    unsigned int ret;

    (void)arg;

    printf("lab07_cabin_station: control_ui_task start\n");

    ret = lcd_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab07_cabin_station: lcd_init failed ret=%u\n", ret);
        return NULL;
    }

    lab07_draw_initial_screen();

    tx_key_init();
    tx_light_init(TX_GPIO_ALARM_LIGHT);

    while (1) {
        bool env = env_alarm_active();
        bool thermal = thermal_alarm_active();

        /* 1. K3 消警处理 */
        if (tx_key_click(TX_KEY_K3, &was)) {
            g_alarm_ack = true;
            outputs_all_off();
            printf("lab07_cabin_station: K3 clicked -> ALARM ACK (all outputs muted)\n");
        } else if (g_alarm_ack && !env && !thermal) {
            /* 全部指标恢复正常后，自动退出消警，允许下一次再次超限报警 */
            g_alarm_ack = false;
            printf("lab07_cabin_station: all sensors normalized -> re-armed\n");
        }

        /* 2. 执行器驱动逻辑 */
        if (!g_alarm_ack && (env || thermal)) {
            /* 电机转动 (超限时开启) */
            motor_set_state(1);

            /* 环境报警 -> PA5 报警灯闪烁 */
            if (env) {
                blink_count++;
                if (blink_count % 3 == 0) {
                    alarm_light_state = !alarm_light_state;
                    tx_light_set(TX_GPIO_ALARM_LIGHT, alarm_light_state);
                }
            } else {
                tx_light_set(TX_GPIO_ALARM_LIGHT, 0);
            }
        } else {
            outputs_all_off();
            alarm_light_state = 0;
        }

        /* 3. 屏幕实时渲染：NORMAL 显式用绿色 LCD_GREEN，ALARM 显式用红色 LCD_RED */
        if (g_sensors_ready) {
            /* T & H */
            snprintf(buf, sizeof(buf), "T: %.1f C  H: %.1f %%", g_temp, g_humi);
            lcd_fill(10, TH_CLEAR_TOP, 300, TH_CLEAR_BOTTOM, LCD_WHITE);
            lcd_show_string(10, TH_ROW_Y, buf, LCD_BLACK, LCD_WHITE, 16, 0);

            /* Lux & Gas */
            snprintf(buf, sizeof(buf), "Lux: %.1f  Gas: %.1f ppm", g_lux, g_ppm);
            lcd_fill(10, LG_CLEAR_TOP, 300, LG_CLEAR_BOTTOM, LCD_WHITE);
            lcd_show_string(10, LUX_GAS_ROW_Y, buf, LCD_BLACK, LCD_WHITE, 16, 0);

            /* Env Status: 正常绿字 NORMAL, 报警红字 ALARM */
            snprintf(buf, sizeof(buf), "Env: %s", env ? "ALARM (Light/Gas)" : "NORMAL (Safe)");
            lcd_fill(10, ENV_CLEAR_TOP, 300, ENV_CLEAR_BOTTOM, LCD_WHITE);
            lcd_show_string(10, ENV_ROW_Y, buf, env ? LCD_RED : LCD_GREEN, LCD_WHITE, 16, 0);

            /* Thermal Status: 正常绿字 NORMAL, 报警红字 ALARM */
            snprintf(buf, sizeof(buf), "Thermal: %s", thermal ? "ALARM (Temp/Humi)" : "NORMAL (Safe)");
            lcd_fill(10, THM_CLEAR_TOP, 300, THM_CLEAR_BOTTOM, LCD_WHITE);
            lcd_show_string(10, THERMAL_ROW_Y, buf, thermal ? LCD_RED : LCD_GREEN, LCD_WHITE, 16, 0);

            /* Actuators */
            if (!g_alarm_ack && (env || thermal)) {
                snprintf(buf, sizeof(buf), "Act: %sMOTOR_RUN", env ? "PA5_BLINK " : "");
            } else {
                snprintf(buf, sizeof(buf), "Act: OFF (STANDBY)");
            }
            lcd_fill(10, ACT_CLEAR_TOP, 300, ACT_CLEAR_BOTTOM, LCD_WHITE);
            lcd_show_string(10, ACT_ROW_Y, buf, (!g_alarm_ack && (env || thermal)) ? LCD_RED : LCD_BLACK, LCD_WHITE, 16, 0);

            /* Overall Status */
            snprintf(buf, sizeof(buf), "Status: %s", g_alarm_ack ? "ACK (MUTED)" : "ARMED / RUNNING");
            lcd_fill(10, STATUS_CLEAR_TOP, 300, STATUS_CLEAR_BOTTOM, LCD_WHITE);
            lcd_show_string(10, STATUS_ROW_Y, buf, g_alarm_ack ? LCD_RED : LCD_BLUE, LCD_WHITE, 16, 0);
        }

        LOS_Msleep(LAB07_CTRL_PERIOD_MS);
    }

    return NULL;
}

static void lab07_cabin_station_example(void)
{
    unsigned int sample_tid;
    unsigned int ctrl_tid;
    TSK_INIT_PARAM_S sample_param = {0};
    TSK_INIT_PARAM_S ctrl_param = {0};
    unsigned int ret;

    sample_param.pfnTaskEntry = (TSK_ENTRY_FUNC)lab07_sample_task;
    sample_param.uwStackSize = LAB07_SAMPLE_STACK_SIZE;
    sample_param.pcName = "lab07_sample";
    sample_param.usTaskPrio = LAB07_SAMPLE_PRIORITY;

    ret = LOS_TaskCreate(&sample_tid, &sample_param);
    if (ret != LOS_OK) {
        printf("lab07_cabin_station: create sample task failed ret=0x%x\n", ret);
        return;
    }

    ctrl_param.pfnTaskEntry = (TSK_ENTRY_FUNC)lab07_control_ui_task;
    ctrl_param.uwStackSize = LAB07_CTRL_STACK_SIZE;
    ctrl_param.pcName = "lab07_ctrl_ui";
    ctrl_param.usTaskPrio = LAB07_CTRL_PRIORITY;

    ret = LOS_TaskCreate(&ctrl_tid, &ctrl_param);
    if (ret != LOS_OK) {
        printf("lab07_cabin_station: create ctrl_ui task failed ret=0x%x\n", ret);
        return;
    }

    printf("lab07_cabin_station: created sample(tid=%u) and ctrl_ui(tid=%u)\n", sample_tid, ctrl_tid);
}

SYS_RUN(lab07_cabin_station_example);
