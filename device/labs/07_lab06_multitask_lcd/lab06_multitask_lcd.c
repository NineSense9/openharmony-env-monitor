#include <stdio.h>
#include <stdint.h>

#include "los_task.h"
#include "ohos_init.h"
#include "lz_hardware.h"

#include "board_pins.h"
#include "lcd.h"
#include "tx_key.h"
#include "sht30.h"

#define LAB06_SAMPLE_STACK_SIZE 0x2000
#define LAB06_SAMPLE_PRIORITY   25
#define LAB06_SAMPLE_PERIOD_MS  3000

#define LAB06_UI_STACK_SIZE     0x2000
#define LAB06_UI_PRIORITY       25
#define LAB06_UI_PERIOD_MS      200

#define TITLE_ROW_Y 40
#define TICK_ROW_Y 75
#define TICK_CLEAR_TOP 67
#define TICK_CLEAR_BOTTOM 95
#define OHOS_ROW_Y 110
#define TEMP_ROW_Y 145
#define TEMP_CLEAR_TOP 137
#define TEMP_CLEAR_BOTTOM 165
#define HUMI_ROW_Y 175
#define HUMI_CLEAR_TOP 167
#define HUMI_CLEAR_BOTTOM 195
#define FREEZE_ROW_Y 205
#define FREEZE_CLEAR_TOP 197
#define FREEZE_CLEAR_BOTTOM 225

/* 全局共享变量，两任务并行访问必须用 volatile */
static volatile double g_temp = 0.0;
static volatile double g_humi = 0.0;
static volatile unsigned int g_tick = 0;
static volatile int g_freeze = 0;
static volatile int g_sys_ready = 0;

static void lab06_draw_initial_screen(void)
{
    lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE);
    lcd_show_string(10, TITLE_ROW_Y, "TX-SMART-R Lab06", LCD_BLUE, LCD_WHITE, 16, 0);
    lcd_show_string(10, TICK_ROW_Y, "Tick: 0", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, OHOS_ROW_Y, "OpenHarmony", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, TEMP_ROW_Y, "Temp: --.- C", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, HUMI_ROW_Y, "Humi: --.- %", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, FREEZE_ROW_Y, "Freeze: OFF", LCD_BLUE, LCD_WHITE, 16, 0);
}

/* 任务 A：慢速传感器采样任务（约 3s 执行一次） */
static void *lab06_sample_task(void *arg)
{
    double dat[2] = {0.0, 0.0};
    unsigned int ret;

    (void)arg;

    printf("lab06_multitask_lcd: sample_task started\n");

    ret = sht30_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab06_multitask_lcd: sht30_init warn ret=%u\n", ret);
    }

    g_sys_ready = 1;

    while (1) {
        if (!g_freeze) {
            ret = sht30_read_data(dat);
            if (ret == LZ_HARDWARE_SUCCESS) {
                g_temp = dat[0];
                g_humi = dat[1];
                printf("lab06_multitask_lcd: [sample_task 3s] Temp=%.1f C, Humi=%.1f %%\n", g_temp, g_humi);
            }
        } else {
            printf("lab06_multitask_lcd: [sample_task] paused by freeze\n");
        }

        LOS_Msleep(LAB06_SAMPLE_PERIOD_MS);
    }

    return NULL;
}

/* 任务 B：快速 UI 渲染与按键响应任务（约 200ms 执行一次） */
static void *lab06_ui_task(void *arg)
{
    int was = 0;
    char buf[32];
    unsigned int ret;

    (void)arg;

    printf("lab06_multitask_lcd: ui_task started\n");

    ret = lcd_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab06_multitask_lcd: lcd_init failed ret=%u\n", ret);
        return NULL;
    }

    lab06_draw_initial_screen();

    ret = tx_key_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab06_multitask_lcd: tx_key_init warn ret=%u\n", ret);
    }

    while (1) {
        g_tick++;

        /* 1. 处理 K3 短按切换冻结 */
        if (tx_key_click(TX_KEY_K3, &was)) {
            g_freeze = !g_freeze;
            printf("lab06_multitask_lcd: [ui_task] K3 clicked -> Freeze: %s\n", g_freeze ? "ON" : "OFF");
        }

        /* 2. 刷新 Tick 计数行 */
        snprintf(buf, sizeof(buf), "Tick: %u", g_tick);
        lcd_fill(10, TICK_CLEAR_TOP, 300, TICK_CLEAR_BOTTOM, LCD_WHITE);
        lcd_show_string(10, TICK_ROW_Y, buf, LCD_BLACK, LCD_WHITE, 16, 0);

        /* 3. 刷新温湿度数据行 */
        if (g_sys_ready) {
            snprintf(buf, sizeof(buf), "Temp: %.1f C", g_temp);
            lcd_fill(10, TEMP_CLEAR_TOP, 300, TEMP_CLEAR_BOTTOM, LCD_WHITE);
            lcd_show_string(10, TEMP_ROW_Y, buf, LCD_BLACK, LCD_WHITE, 16, 0);

            snprintf(buf, sizeof(buf), "Humi: %.1f %%", g_humi);
            lcd_fill(10, HUMI_CLEAR_TOP, 300, HUMI_CLEAR_BOTTOM, LCD_WHITE);
            lcd_show_string(10, HUMI_ROW_Y, buf, LCD_BLACK, LCD_WHITE, 16, 0);
        }

        /* 4. 刷新 Freeze 状态行 */
        snprintf(buf, sizeof(buf), "Freeze: %s", g_freeze ? "ON" : "OFF");
        lcd_fill(10, FREEZE_CLEAR_TOP, 300, FREEZE_CLEAR_BOTTOM, LCD_WHITE);
        lcd_show_string(10, FREEZE_ROW_Y, buf, g_freeze ? LCD_RED : LCD_BLUE, LCD_WHITE, 16, 0);

        LOS_Msleep(LAB06_UI_PERIOD_MS);
    }

    return NULL;
}

static void lab06_multitask_lcd_example(void)
{
    unsigned int sample_tid;
    unsigned int ui_tid;
    TSK_INIT_PARAM_S sample_param = {0};
    TSK_INIT_PARAM_S ui_param = {0};
    unsigned int ret;

    /* 1. 创建采样任务 */
    sample_param.pfnTaskEntry = (TSK_ENTRY_FUNC)lab06_sample_task;
    sample_param.uwStackSize = LAB06_SAMPLE_STACK_SIZE;
    sample_param.pcName = "lab06_sample";
    sample_param.usTaskPrio = LAB06_SAMPLE_PRIORITY;

    ret = LOS_TaskCreate(&sample_tid, &sample_param);
    if (ret != LOS_OK) {
        printf("lab06_multitask_lcd: create sample_task failed ret=0x%x\n", ret);
        return;
    }
    printf("lab06_multitask_lcd: create sample_task success tid=%u\n", sample_tid);

    /* 2. 创建 UI 渲染与按键任务 */
    ui_param.pfnTaskEntry = (TSK_ENTRY_FUNC)lab06_ui_task;
    ui_param.uwStackSize = LAB06_UI_STACK_SIZE;
    ui_param.pcName = "lab06_ui";
    ui_param.usTaskPrio = LAB06_UI_PRIORITY;

    ret = LOS_TaskCreate(&ui_tid, &ui_param);
    if (ret != LOS_OK) {
        printf("lab06_multitask_lcd: create ui_task failed ret=0x%x\n", ret);
        return;
    }
    printf("lab06_multitask_lcd: create ui_task success tid=%u\n", ui_tid);
}

SYS_RUN(lab06_multitask_lcd_example);
