#include <stdio.h>

#include "los_task.h"
#include "ohos_init.h"
#include "lz_hardware.h"
#include "lcd.h"

#define ADC_CHANNEL 5
#define USER_KEY_ADC GPIO0_PC5
#define ADC_SAMPLE_INTERVAL_MS 100

static DevIo m_user_key_adc = {
    .isr = {.gpio = INVALID_GPIO},
    .rst = {.gpio = INVALID_GPIO},
    .ctrl1 = {
        .gpio = USER_KEY_ADC,
        .func = MUX_FUNC1,
        .type = PULL_NONE,
        .drv = DRIVE_KEEP,
        .dir = LZGPIO_DIR_IN,
        .val = LZGPIO_LEVEL_KEEP,
    },
    .ctrl2 = {.gpio = INVALID_GPIO},
};

static unsigned int adc5_key_init(void)
{
    unsigned int ret;
    uint32_t *grf_soc_con29 = (uint32_t *)(0x41050000U + 0x274U);
    uint32_t grf_value;

    ret = DevIoInit(m_user_key_adc);
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab02_key_lcd_adc: USER_KEY_ADC IO init failed ret=%u\r\n", ret);
        return ret;
    }

    ret = LzSaradcInit();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab02_key_lcd_adc: ADC init failed ret=%u\r\n", ret);
        return ret;
    }

    /* Match the board vendor ADC example: use AVDD as the SARADC reference. */
    grf_value = *grf_soc_con29;
    grf_value &= ~(0x1U << 4);
    grf_value |= ((0x1U << 4) << 16);
    *grf_soc_con29 = grf_value;

    return LZ_HARDWARE_SUCCESS;
}

static unsigned int adc5_key_read(unsigned int *raw, float *voltage)
{
    unsigned int ret;

    ret = LzSaradcReadValue(ADC_CHANNEL, raw);
    if (ret != LZ_HARDWARE_SUCCESS) {
        return ret;
    }

    *voltage = (float)(*raw * 3.3 / 1024.0);
    return LZ_HARDWARE_SUCCESS;
}

static void adc5_key_lcd_task(void *arg)
{
    unsigned int ret;
    unsigned int raw;
    float voltage;
    char raw_text[48];
    char voltage_text[48];

    (void)arg;
    printf("lab02_key_lcd_adc: LCD_INIT_BEGIN\r\n");
    ret = lcd_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab02_key_lcd_adc: LCD init failed ret=%u\r\n", ret);
        return;
    }

    ret = adc5_key_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        lcd_show_string(10, 40, "ADC INIT ERROR", LCD_RED, LCD_WHITE, 16, 0);
        return;
    }

    lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE);
    lcd_show_string(10, 40, "TX-SMART-R Lab02", LCD_RED, LCD_WHITE, 16, 0);
    lcd_show_string(10, 64, "ADC5 USER KEY", LCD_BLUE, LCD_WHITE, 16, 0);
    lcd_show_string(10, 88, "KEY_UNKNOWN", LCD_BLACK, LCD_WHITE, 16, 0);

    while (1) {
        ret = adc5_key_read(&raw, &voltage);
        lcd_fill(10, 112, 300, 152, LCD_WHITE);
        if (ret != LZ_HARDWARE_SUCCESS) {
            printf("lab02_key_lcd_adc: ADC read failed ret=%u\r\n", ret);
            lcd_show_string(10, 112, "ADC READ ERROR", LCD_RED, LCD_WHITE, 16, 0);
        } else {
            printf("lab02_key_lcd_adc: USER_KEY_ADC=GPIO0_PC5 raw=%u "
                   "voltage=%.3fV key=KEY_UNKNOWN\r\n",
                   raw, voltage);
            snprintf(raw_text, sizeof(raw_text), "RAW: %u", raw);
            snprintf(voltage_text, sizeof(voltage_text), "V: %.3fV", voltage);
            lcd_show_string(10, 112, raw_text, LCD_BLACK, LCD_WHITE, 16, 0);
            lcd_show_string(10, 136, voltage_text, LCD_BLACK, LCD_WHITE, 16, 0);
        }
        LOS_Msleep(ADC_SAMPLE_INTERVAL_MS);
    }
}

static void adc5_key_lcd_example(void)
{
    unsigned int task_id;
    unsigned int ret;
    TSK_INIT_PARAM_S task = {0};

    task.pfnTaskEntry = (TSK_ENTRY_FUNC)adc5_key_lcd_task;
    task.uwStackSize = 20480;
    task.pcName = "lab02 key lcd adc";
    task.usTaskPrio = 24;
    ret = LOS_TaskCreate(&task_id, &task);
    if (ret != LOS_OK) {
        printf("lab02_key_lcd_adc: task create failed ret=0x%x\r\n", ret);
    }
}

APP_FEATURE_INIT(adc5_key_lcd_example);
