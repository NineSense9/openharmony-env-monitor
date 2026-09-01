#include <stdio.h>
#include <stdint.h>

#include "los_task.h"
#include "ohos_init.h"
#include "lz_hardware.h"

#include "board_pins.h"
#include "lcd.h"
#include "tx_key.h"
#include "mq2.h"

#define LAB04_TASK_STACK_SIZE 0x2000
#define LAB04_TASK_PRIORITY   25
#define LAB04_POLL_INTERVAL_MS 500

#define TITLE_ROW_Y 40
#define LCD_OK_ROW_Y 80
#define OHOS_ROW_Y 120
#define GAS_ROW_Y 160
#define GAS_CLEAR_TOP 152
#define GAS_CLEAR_BOTTOM 184
#define CAL_ROW_Y 200
#define CAL_CLEAR_TOP 192
#define CAL_CLEAR_BOTTOM 224

static void lab04_draw_initial_screen(void)
{
    lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE);
    lcd_show_string(10, TITLE_ROW_Y, "TX-SMART-R Lab04", LCD_BLUE, LCD_WHITE, 16, 0);
    lcd_show_string(10, LCD_OK_ROW_Y, "LCD OK", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, OHOS_ROW_Y, "OpenHarmony", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, GAS_ROW_Y, "Gas: --.- ppm", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, CAL_ROW_Y, "Cal: WAITING", LCD_BLACK, LCD_WHITE, 16, 0);
}

static void lab04_render_gas_ppm(float ppm)
{
    char buf[32];
    snprintf(buf, sizeof(buf), "Gas: %.1f ppm", ppm);
    lcd_fill(10, GAS_CLEAR_TOP, 300, GAS_CLEAR_BOTTOM, LCD_WHITE);
    lcd_show_string(10, GAS_ROW_Y, buf, LCD_BLACK, LCD_WHITE, 16, 0);
}

static void lab04_render_cal_status(const char *status, uint16_t color)
{
    char buf[32];
    snprintf(buf, sizeof(buf), "Cal: %s", status);
    lcd_fill(10, CAL_CLEAR_TOP, 300, CAL_CLEAR_BOTTOM, LCD_WHITE);
    lcd_show_string(10, CAL_ROW_Y, buf, color, LCD_WHITE, 16, 0);
}

static void *lab04_mq2_key_lcd_process(void *arg)
{
    int was = 0;
    unsigned int ret;

    (void)arg;

    printf("lab04_mq2_key_lcd: process start\n");

    ret = lcd_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab04_mq2_key_lcd: lcd_init failed ret=%u\n", ret);
        return NULL;
    }

    lab04_draw_initial_screen();

    ret = tx_key_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab04_mq2_key_lcd: tx_key_init failed ret=%u\n", ret);
    }

    /* PDF 4.8 规定调用顺序: init -> sleep 500ms -> calibration */
    mq2_dev_init();
    LOS_Msleep(500);
    mq2_ppm_calibration();
    lab04_render_cal_status("READY", LCD_BLUE);

    printf("lab04_mq2_key_lcd: loop ready, K3 recalibrates MQ2 gas baseline\n");

    while (1) {
        float ppm = get_mq2_ppm();
        printf("lab04_mq2_key_lcd: Gas PPM = %.2f\n", ppm);
        lab04_render_gas_ppm(ppm);

        if (tx_key_click(TX_KEY_K3, &was)) {
            printf("lab04_mq2_key_lcd: K3 clicked -> recalibrating...\n");
            lab04_render_cal_status("CALIBRATING", LCD_RED);
            mq2_ppm_calibration();
            lab04_render_cal_status("DONE", LCD_BLUE);
        }

        LOS_Msleep(LAB04_POLL_INTERVAL_MS);
    }

    return NULL;
}

static void lab04_mq2_key_lcd_example(void)
{
    unsigned int thread_id;
    TSK_INIT_PARAM_S task = {0};
    unsigned int ret;

    task.pfnTaskEntry = (TSK_ENTRY_FUNC)lab04_mq2_key_lcd_process;
    task.uwStackSize = LAB04_TASK_STACK_SIZE;
    task.pcName = "lab04_mq2_key_lcd";
    task.usTaskPrio = LAB04_TASK_PRIORITY;

    ret = LOS_TaskCreate(&thread_id, &task);
    if (ret != LOS_OK) {
        printf("lab04_mq2_key_lcd: create task failed ret=0x%x\n", ret);
        return;
    }

    printf("lab04_mq2_key_lcd: create task success tid=%u\n", thread_id);
}

SYS_RUN(lab04_mq2_key_lcd_example);
