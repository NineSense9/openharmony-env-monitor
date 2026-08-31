/*
 * SMART-R Lab01 LCD experiment.
 *
 * This is the project-owned entry point. The LCD driver is kept as a separate
 * hardware adapter so the experiment focuses on task startup and display flow.
 */

#include <stdio.h>

#include "los_task.h"
#include "ohos_init.h"
#include "lcd.h"

static void lab01_lcd_task(void *arg)
{
    unsigned int ret;

    (void)arg;
    ret = lcd_init();
    if (ret != 0) {
        printf("lab01_lcd: lcd_init failed(%u)\r\n", ret);
        return;
    }

    lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE);
    lcd_show_string(10, 40, "TX-SMART-R Lab01", LCD_RED, LCD_WHITE, 16, 0);
    lcd_show_string(10, 80, "LCD OK", LCD_BLUE, LCD_WHITE, 16, 0);
    lcd_show_string(10, 120, "OpenHarmony", LCD_BLACK, LCD_WHITE, 16, 0);
    printf("lab01_lcd: LCD OK\r\n");

    while (1) {
        LOS_Msleep(1000);
    }
}

void lab01_lcd_example(void)
{
    unsigned int task_id;
    unsigned int ret;
    TSK_INIT_PARAM_S task = {0};

    task.pfnTaskEntry = (TSK_ENTRY_FUNC)lab01_lcd_task;
    task.uwStackSize = 20480;
    task.pcName = "lab01 lcd";
    task.usTaskPrio = 24;
    ret = LOS_TaskCreate(&task_id, &task);
    if (ret != LOS_OK) {
        printf("lab01_lcd: task create failed ret=0x%x\r\n", ret);
    }
}

APP_FEATURE_INIT(lab01_lcd_example);
