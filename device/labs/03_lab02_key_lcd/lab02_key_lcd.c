#include <stdio.h>

#include "los_task.h"
#include "ohos_init.h"
#include "lz_hardware.h"
#include "lcd.h"
#include "tx_key.h"

#define LCD_TEXT_X 10
#define LCD_TITLE_TEXT_Y 40
#define LCD_OK_TEXT_Y 80
#define LCD_OPENHARMONY_TEXT_Y 120
#define LCD_K3_STATUS_TEXT_Y 160
#define LCD_STATUS_CLEAR_Y0 152
#define LCD_STATUS_CLEAR_Y1 184

static void lab02_key_lcd_task(void *arg)
{
    unsigned int ret;
    uint32_t pressed;
    uint32_t last_pressed;
    uint32_t diagnostic_elapsed_ms;
    LzGpioValue raw_level;

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
    lcd_show_string(LCD_TEXT_X, LCD_TITLE_TEXT_Y, "TX-SMART-R Lab01", LCD_RED, LCD_WHITE, 16, 0);
    lcd_show_string(LCD_TEXT_X, LCD_OK_TEXT_Y, "LCD OK", LCD_BLUE, LCD_WHITE, 16, 0);
    lcd_show_string(LCD_TEXT_X, LCD_OPENHARMONY_TEXT_Y, "OpenHarmony", LCD_BLACK, LCD_WHITE, 16, 0);

    ret = tx_key_read_level(&raw_level);
    if (ret != LZ_HARDWARE_SUCCESS) {
        /* Keep the task alive so a transient GPIO read failure is observable. */
        last_pressed = 2U;
        diagnostic_elapsed_ms = 0U;
        lcd_show_string(LCD_TEXT_X, LCD_K3_STATUS_TEXT_Y, "K3: READ ERR", LCD_RED, LCD_WHITE, 16, 0);
        printf("lab02_key_lcd: initial K3 read failed(%u)\r\n", ret);
    } else {
        pressed = (raw_level == LZGPIO_LEVEL_LOW) ? 1U : 0U;
        last_pressed = pressed;
        diagnostic_elapsed_ms = 0U;
        lcd_show_string(LCD_TEXT_X, LCD_K3_STATUS_TEXT_Y, pressed ? "K3: PRESSED" : "K3: RELEASED",
                        LCD_BLUE, LCD_WHITE, 16, 0);
        printf("lab02_key_lcd: K3 raw=%u pressed=%u\r\n",
               (unsigned int)raw_level, (unsigned int)pressed);
        printf("lab02_key_lcd: K3=%s\r\n", pressed ? "PRESSED" : "RELEASED");
    }

    while (1) {
        ret = tx_key_read_level(&raw_level);
        if (ret != LZ_HARDWARE_SUCCESS) {
            if (last_pressed != 2U) {
                lcd_fill(LCD_TEXT_X, LCD_STATUS_CLEAR_Y0, 300, LCD_STATUS_CLEAR_Y1, LCD_WHITE);
                lcd_show_string(LCD_TEXT_X, LCD_K3_STATUS_TEXT_Y, "K3: READ ERR", LCD_RED, LCD_WHITE, 16, 0);
                last_pressed = 2U;
            }
            printf("lab02_key_lcd: K3 read failed(%u)\r\n", ret);
            LOS_Msleep(100);
            continue;
        }

        pressed = (raw_level == LZGPIO_LEVEL_LOW) ? 1U : 0U;
        if (pressed != last_pressed) {
            last_pressed = pressed;
            lcd_fill(LCD_TEXT_X, LCD_STATUS_CLEAR_Y0, 300, LCD_STATUS_CLEAR_Y1, LCD_WHITE);
            lcd_show_string(LCD_TEXT_X, LCD_K3_STATUS_TEXT_Y, pressed ? "K3: PRESSED" : "K3: RELEASED",
                            LCD_BLUE, LCD_WHITE, 16, 0);
            printf("lab02_key_lcd: K3=%s\r\n",
                   pressed ? "PRESSED" : "RELEASED");
        }

        diagnostic_elapsed_ms += 30U;
        if (diagnostic_elapsed_ms >= 500U) {
            printf("lab02_key_lcd: K3 raw=%u pressed=%u\r\n",
                   (unsigned int)raw_level, (unsigned int)pressed);
            diagnostic_elapsed_ms = 0U;
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
