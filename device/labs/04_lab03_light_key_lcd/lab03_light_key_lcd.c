#include <stdio.h>
#include <stdint.h>

#include "los_task.h"
#include "ohos_init.h"
#include "lz_hardware.h"

#include "board_pins.h"
#include "lcd.h"
#include "tx_key.h"
#include "tx_light.h"

#define LAB03_TASK_STACK_SIZE 0x2000
#define LAB03_TASK_PRIORITY   25
#define LAB03_POLL_INTERVAL_MS 20

#define TITLE_ROW_Y 40
#define LCD_OK_ROW_Y 80
#define OHOS_ROW_Y 120
#define LIGHT_STATUS_ROW_Y 160
#define LIGHT_STATUS_CLEAR_TOP 152
#define LIGHT_STATUS_CLEAR_BOTTOM 184

static void lab03_draw_initial_screen(void)
{
    lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE);
    lcd_show_string(10, TITLE_ROW_Y, "TX-SMART-R Lab03", LCD_BLUE, LCD_WHITE, 16, 0);
    lcd_show_string(10, LCD_OK_ROW_Y, "LCD OK", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, OHOS_ROW_Y, "OpenHarmony", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, LIGHT_STATUS_ROW_Y, "Light: OFF", LCD_BLACK, LCD_WHITE, 16, 0);
}

static void lab03_render_light_state(int light_on)
{
    lcd_fill(10, LIGHT_STATUS_CLEAR_TOP, 300, LIGHT_STATUS_CLEAR_BOTTOM, LCD_WHITE);
    if (light_on) {
        lcd_show_string(10, LIGHT_STATUS_ROW_Y, "Light: ON", LCD_RED, LCD_WHITE, 16, 0);
    } else {
        lcd_show_string(10, LIGHT_STATUS_ROW_Y, "Light: OFF", LCD_BLACK, LCD_WHITE, 16, 0);
    }
}

static void *lab03_light_key_lcd_process(void *arg)
{
    int was = 0;
    int light_on = 0;
    unsigned int ret;

    (void)arg;

    printf("lab03_light_key_lcd: process start\r\n");

    ret = lcd_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab03_light_key_lcd: lcd_init failed ret=%u\r\n", ret);
        return NULL;
    }

    lab03_draw_initial_screen();

    ret = tx_key_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab03_light_key_lcd: tx_key_init failed ret=%u\r\n", ret);
    }

    ret = tx_light_init(TX_GPIO_ALARM_LIGHT);
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab03_light_key_lcd: tx_light_init failed ret=%u\r\n", ret);
    }

    printf("lab03_light_key_lcd: loop ready, K3 toggles Alarm Light (PA5)\r\n");

    while (1) {
        if (tx_key_click(TX_KEY_K3, &was)) {
            light_on = !light_on;
            tx_light_set(TX_GPIO_ALARM_LIGHT, light_on);
            printf("lab03_light_key_lcd: K3 clicked -> Light: %s\r\n", light_on ? "ON" : "OFF");
            lab03_render_light_state(light_on);
        }
        LOS_Msleep(LAB03_POLL_INTERVAL_MS);
    }

    return NULL;
}

static void lab03_light_key_lcd_example(void)
{
    unsigned int thread_id;
    TSK_INIT_PARAM_S task = {0};
    unsigned int ret;

    task.pfnTaskEntry = (TSK_ENTRY_FUNC)lab03_light_key_lcd_process;
    task.uwStackSize = LAB03_TASK_STACK_SIZE;
    task.pcName = "lab03_light_key_lcd";
    task.usTaskPrio = LAB03_TASK_PRIORITY;

    ret = LOS_TaskCreate(&thread_id, &task);
    if (ret != LOS_OK) {
        printf("lab03_light_key_lcd: create task failed ret=0x%x\r\n", ret);
        return;
    }

    printf("lab03_light_key_lcd: create task success tid=%u\r\n", thread_id);
}

SYS_RUN(lab03_light_key_lcd_example);
