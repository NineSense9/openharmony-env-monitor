#include <stdio.h>
#include <stdint.h>

#include "los_task.h"
#include "ohos_init.h"
#include "lz_hardware.h"

#include "board_pins.h"
#include "lcd.h"
#include "tx_key.h"
#include "sht30.h"

#define LAB05_TASK_STACK_SIZE 0x2000
#define LAB05_TASK_PRIORITY   25
#define LAB05_POLL_INTERVAL_MS 500

#define TITLE_ROW_Y 40
#define LCD_OK_ROW_Y 75
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

static void lab05_draw_initial_screen(void)
{
    lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE);
    lcd_show_string(10, TITLE_ROW_Y, "TX-SMART-R Lab05", LCD_BLUE, LCD_WHITE, 16, 0);
    lcd_show_string(10, LCD_OK_ROW_Y, "LCD OK", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, OHOS_ROW_Y, "OpenHarmony", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, TEMP_ROW_Y, "Temp: --.- C", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, HUMI_ROW_Y, "Humi: --.- %", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, FREEZE_ROW_Y, "Freeze: OFF", LCD_BLUE, LCD_WHITE, 16, 0);
}

static void lab05_render_environment(double temp, double humi)
{
    char buf[32];

    snprintf(buf, sizeof(buf), "Temp: %.1f C", temp);
    lcd_fill(10, TEMP_CLEAR_TOP, 300, TEMP_CLEAR_BOTTOM, LCD_WHITE);
    lcd_show_string(10, TEMP_ROW_Y, buf, LCD_BLACK, LCD_WHITE, 16, 0);

    snprintf(buf, sizeof(buf), "Humi: %.1f %%", humi);
    lcd_fill(10, HUMI_CLEAR_TOP, 300, HUMI_CLEAR_BOTTOM, LCD_WHITE);
    lcd_show_string(10, HUMI_ROW_Y, buf, LCD_BLACK, LCD_WHITE, 16, 0);
}

static void lab05_render_freeze_status(int freeze)
{
    char buf[32];
    uint16_t color = freeze ? LCD_RED : LCD_BLUE;
    snprintf(buf, sizeof(buf), "Freeze: %s", freeze ? "ON" : "OFF");
    lcd_fill(10, FREEZE_CLEAR_TOP, 300, FREEZE_CLEAR_BOTTOM, LCD_WHITE);
    lcd_show_string(10, FREEZE_ROW_Y, buf, color, LCD_WHITE, 16, 0);
}

static void *lab05_sht30_key_lcd_process(void *arg)
{
    int was = 0;
    int freeze = 0;
    double dat[2] = {0.0, 0.0};
    unsigned int ret;

    (void)arg;

    printf("lab05_sht30_key_lcd: process start\n");

    ret = lcd_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab05_sht30_key_lcd: lcd_init failed ret=%u\n", ret);
        return NULL;
    }

    lab05_draw_initial_screen();

    ret = tx_key_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab05_sht30_key_lcd: tx_key_init failed ret=%u\n", ret);
    }

    ret = sht30_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab05_sht30_key_lcd: sht30_init failed ret=%u\n", ret);
    }

    printf("lab05_sht30_key_lcd: loop ready, K3 toggles freeze\n");

    while (1) {
        if (tx_key_click(TX_KEY_K3, &was)) {
            freeze = !freeze;
            printf("lab05_sht30_key_lcd: K3 clicked -> Freeze: %s\n", freeze ? "ON" : "OFF");
            lab05_render_freeze_status(freeze);
        }

        if (!freeze) {
            sht30_read_data(dat);
            printf("lab05_sht30_key_lcd: Temp = %.1f C, Humi = %.1f %%\n", dat[0], dat[1]);
            lab05_render_environment(dat[0], dat[1]);
        }

        LOS_Msleep(LAB05_POLL_INTERVAL_MS);
    }

    return NULL;
}

static void lab05_sht30_key_lcd_example(void)
{
    unsigned int thread_id;
    TSK_INIT_PARAM_S task = {0};
    unsigned int ret;

    task.pfnTaskEntry = (TSK_ENTRY_FUNC)lab05_sht30_key_lcd_process;
    task.uwStackSize = LAB05_TASK_STACK_SIZE;
    task.pcName = "lab05_sht30_key_lcd";
    task.usTaskPrio = LAB05_TASK_PRIORITY;

    ret = LOS_TaskCreate(&thread_id, &task);
    if (ret != LOS_OK) {
        printf("lab05_sht30_key_lcd: create task failed ret=0x%x\n", ret);
        return;
    }

    printf("lab05_sht30_key_lcd: create task success tid=%u\n", thread_id);
}

SYS_RUN(lab05_sht30_key_lcd_example);
