#include <stdio.h>

#include "los_task.h"
#include "ohos_init.h"
#include "lz_hardware.h"
#include "lcd.h"
#include "tx_key.h"

static void lab02_key_lcd_task(void *arg)
{
    unsigned int ret;
    uint32_t pressed;
    uint32_t last_pressed;

    (void)arg;
    printf("lab02_key_lcd: LCD_INIT_BEGIN\r\n");
    ret = lcd_init();
    if (ret != 0) {
        printf("lab02_key_lcd: lcd_init failed(%u)\r\n", ret);
        return;
    }

    ret = tx_key_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab02_key_lcd: tx_key_init failed(%u)\r\n", ret);
        return;
    }

    lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE);
    lcd_show_string(10, 40, "TX-SMART-R Lab01", LCD_RED, LCD_WHITE, 16, 0);
    lcd_show_string(10, 80, "LCD OK", LCD_BLUE, LCD_WHITE, 16, 0);
    lcd_show_string(10, 120, "OpenHarmony", LCD_BLACK, LCD_WHITE, 16, 0);

    ret = tx_key_is_pressed(&pressed);
    if (ret != LZ_HARDWARE_SUCCESS) {
        /* Keep the task alive so a transient GPIO read failure is observable. */
        last_pressed = 2U;
        lcd_show_string(10, 96, "K3: READ ERR", LCD_RED, LCD_WHITE, 16, 0);
        printf("lab02_key_lcd: initial K3 read failed(%u)\r\n", ret);
    } else {
        last_pressed = pressed;
        lcd_show_string(10, 96, pressed ? "K3: PRESSED" : "K3: RELEASED",
                        LCD_BLUE, LCD_WHITE, 16, 0);
        printf("lab02_key_lcd: K3=%s\r\n", pressed ? "PRESSED" : "RELEASED");
    }

    while (1) {
        ret = tx_key_is_pressed(&pressed);
        if (ret != LZ_HARDWARE_SUCCESS) {
            if (last_pressed != 2U) {
                lcd_fill(10, 90, 300, 120, LCD_WHITE);
                lcd_show_string(10, 96, "K3: READ ERR", LCD_RED, LCD_WHITE, 16, 0);
                last_pressed = 2U;
            }
            printf("lab02_key_lcd: K3 read failed(%u)\r\n", ret);
            LOS_Msleep(100);
            continue;
        }

        if (pressed != last_pressed) {
            last_pressed = pressed;
            lcd_fill(10, 90, 300, 120, LCD_WHITE);
            lcd_show_string(10, 96, pressed ? "K3: PRESSED" : "K3: RELEASED",
                            LCD_BLUE, LCD_WHITE, 16, 0);
            printf("lab02_key_lcd: K3=%s\r\n",
                   pressed ? "PRESSED" : "RELEASED");
        }

        LOS_Msleep(30);
    }
}

void lab02_key_lcd_example(void)
{
    unsigned int task_id;
    unsigned int ret;
    TSK_INIT_PARAM_S task = {0};

    task.pfnTaskEntry = (TSK_ENTRY_FUNC)lab02_key_lcd_task;
    task.uwStackSize = 20480;
    task.pcName = "lab02 key lcd";
    task.usTaskPrio = 24;
    ret = LOS_TaskCreate(&task_id, &task);
    if (ret != LOS_OK) {
        printf("lab02_key_lcd: task create failed ret=0x%x\r\n", ret);
    }
}

APP_FEATURE_INIT(lab02_key_lcd_example);
