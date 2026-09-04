#include <stdint.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#include "los_task.h"
#include "ohos_init.h"
#include "lz_hardware.h"
#include "lcd.h"

#define ARRAY_SIZE(a) (sizeof(a) / sizeof((a)[0]))

typedef struct {
    const char *name;
    GpioID id;
    LzGpioValue raw_val;
    LzGpioValue stable_val;
    uint8_t stable_count;
    uint32_t press_count;
} SniffGpio;

typedef struct {
    uint8_t ch;
    unsigned int raw;
    float volt;
    float last_volt;
    uint32_t press_count;
} SniffAdc;

// Candidate GPIOs (Excluding LCD PC0..PC3, PA4, UART PA6..PA7, and ADC5 PC5)
static SniffGpio g_gpios[] = {
    {"PC7(K3)",  GPIO0_PC7, LZGPIO_LEVEL_HIGH, LZGPIO_LEVEL_HIGH, 0, 0},
    {"PA3",      GPIO0_PA3, LZGPIO_LEVEL_HIGH, LZGPIO_LEVEL_HIGH, 0, 0},
    {"PA2",      GPIO0_PA2, LZGPIO_LEVEL_HIGH, LZGPIO_LEVEL_HIGH, 0, 0},
    {"PC6",      GPIO0_PC6, LZGPIO_LEVEL_HIGH, LZGPIO_LEVEL_HIGH, 0, 0},
    {"PA5",      GPIO0_PA5, LZGPIO_LEVEL_HIGH, LZGPIO_LEVEL_HIGH, 0, 0},
    {"PB5",      GPIO0_PB5, LZGPIO_LEVEL_HIGH, LZGPIO_LEVEL_HIGH, 0, 0},
    {"PB6",      GPIO0_PB6, LZGPIO_LEVEL_HIGH, LZGPIO_LEVEL_HIGH, 0, 0},
    {"PD0",      GPIO0_PD0, LZGPIO_LEVEL_HIGH, LZGPIO_LEVEL_HIGH, 0, 0},
};

static SniffAdc g_adcs[6];

static char g_last_event[64] = "Ready. Press K3/K4/K5/K6...";
static uint32_t g_event_count = 0;
static uint32_t g_system_ticks = 0;

static void init_all_hardware(void)
{
    printf("[SNIFFER] 1. Initializing LCD...\r\n");
    lcd_init();
    lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE);

    printf("[SNIFFER] 2. Initializing candidate GPIOs (PULL_UP)...\r\n");
    for (size_t i = 0; i < ARRAY_SIZE(g_gpios); i++) {
        LzGpioInit(g_gpios[i].id);
        PinctrlSet(g_gpios[i].id, MUX_FUNC0, PULL_UP, DRIVE_LEVEL0);
        LzGpioSetDir(g_gpios[i].id, LZGPIO_DIR_IN);
        LzGpioGetVal(g_gpios[i].id, &g_gpios[i].raw_val);
        g_gpios[i].stable_val = g_gpios[i].raw_val;
        g_gpios[i].stable_count = 0;
    }

    printf("[SNIFFER] 3. Initializing SARADC5 (GPIO0_PC5 MUX_FUNC1)...\r\n");
    DevIo adcIo = {
        .isr = {.gpio = INVALID_GPIO},
        .rst = {.gpio = INVALID_GPIO},
        .ctrl1 = {.gpio = GPIO0_PC5, .func = MUX_FUNC1, .type = PULL_NONE, .drv = DRIVE_KEEP, .dir = LZGPIO_DIR_IN, .val = LZGPIO_LEVEL_KEEP},
        .ctrl2 = {.gpio = INVALID_GPIO},
    };
    DevIoInit(adcIo);
    LzSaradcInit();

    uint32_t *pGrfSocCon29 = (uint32_t *)(0x41050000U + 0x274U);
    uint32_t ulValue = *pGrfSocCon29;
    ulValue &= ~(0x1 << 4);
    ulValue |= ((0x1 << 4) << 16);
    *pGrfSocCon29 = ulValue;

    for (uint8_t ch = 0; ch < 6; ch++) {
        g_adcs[ch].ch = ch;
        unsigned int raw = 0;
        if (LzSaradcReadValue(ch, &raw) == LZ_HARDWARE_SUCCESS) {
            g_adcs[ch].raw = raw;
            g_adcs[ch].volt = (float)(raw * 3.3f / 1024.0f);
        } else {
            g_adcs[ch].raw = 0;
            g_adcs[ch].volt = 0.0f;
        }
        g_adcs[ch].last_volt = g_adcs[ch].volt;
        g_adcs[ch].press_count = 0;
    }

    printf("[SNIFFER] Hardware init complete! Safe config, no LCD pin conflicts.\r\n");
}

static void draw_static_ui(void)
{
    lcd_fill(0, 0, LCD_W, 24, LCD_DARKBLUE);
    lcd_show_string(6, 4, "RK2206 PIN & KEY SNIFFER", LCD_WHITE, LCD_DARKBLUE, 16, 0);

    lcd_fill(0, 24, LCD_W, 40, LCD_LIGHTBLUE);
    lcd_show_string(6, 26, "PRESS K3, K4, K5, K6 TO TEST", LCD_BLACK, LCD_LIGHTBLUE, 12, 0);

    lcd_draw_line(158, 40, 158, 196, LCD_GRAY);

    lcd_show_string(6, 42, "GPIO (RED=DOWN)", LCD_DARKBLUE, LCD_WHITE, 12, 0);
    lcd_show_string(164, 42, "SARADC VOLTAGE", LCD_DARKBLUE, LCD_WHITE, 12, 0);

    lcd_fill(0, 198, LCD_W, LCD_H, LCD_BLACK);
}

static void *SnifferTask(void *arg)
{
    (void)arg;
    char text_buf[48];
    uint32_t loop_count = 0;

    init_all_hardware();
    draw_static_ui();

    while (1) {
        g_system_ticks++;
        loop_count++;

        // 1. Scan GPIOs with 40ms debouncing
        for (size_t i = 0; i < ARRAY_SIZE(g_gpios); i++) {
            LzGpioValue val = LZGPIO_LEVEL_HIGH;
            if (LzGpioGetVal(g_gpios[i].id, &val) == LZ_HARDWARE_SUCCESS) {
                g_gpios[i].raw_val = val;

                if (g_gpios[i].raw_val != g_gpios[i].stable_val) {
                    g_gpios[i].stable_count++;
                    if (g_gpios[i].stable_count >= 2) {
                        g_gpios[i].stable_val = g_gpios[i].raw_val;
                        g_gpios[i].stable_count = 0;

                        if (g_gpios[i].stable_val == LZGPIO_LEVEL_LOW) {
                            g_gpios[i].press_count++;
                            g_event_count++;
                            snprintf(g_last_event, sizeof(g_last_event), "PRESS: %s (x%u)",
                                     g_gpios[i].name, g_gpios[i].press_count);

                            printf("\r\n========================================\r\n");
                            printf(">>> [KEY PRESSED] %s (id=%u) count=%u <<<\r\n",
                                   g_gpios[i].name, g_gpios[i].id, g_gpios[i].press_count);
                            printf("========================================\r\n");
                        } else {
                            printf("--- [KEY RELEASED] %s (id=%u) ---\r\n",
                                   g_gpios[i].name, g_gpios[i].id);
                        }
                    }
                } else {
                    g_gpios[i].stable_count = 0;
                }
            }
        }

        // 2. Scan SARADC channels
        for (uint8_t ch = 0; ch < 6; ch++) {
            unsigned int raw = 0;
            if (LzSaradcReadValue(ch, &raw) == LZ_HARDWARE_SUCCESS) {
                g_adcs[ch].raw = raw;
                g_adcs[ch].volt = (float)(raw * 3.3f / 1024.0f);

                if (g_adcs[ch].volt < 2.80f && g_adcs[ch].last_volt >= 2.80f) {
                    g_adcs[ch].press_count++;
                    g_event_count++;
                    snprintf(g_last_event, sizeof(g_last_event), "ADC CH%u: %.2fV (x%u)",
                             ch, g_adcs[ch].volt, g_adcs[ch].press_count);

                    printf("\r\n****************************************\r\n");
                    printf(">>> [ADC PRESSED] CH%u volt=%.2fV (raw=%u) count=%u <<<\r\n",
                           ch, g_adcs[ch].volt, g_adcs[ch].raw, g_adcs[ch].press_count);
                    printf("****************************************\r\n");
                }
                g_adcs[ch].last_volt = g_adcs[ch].volt;
            }
        }

        // 3. LCD refresh (every 60ms)
        if (loop_count % 3 == 0) {
            for (size_t i = 0; i < ARRAY_SIZE(g_gpios); i++) {
                uint16_t y = 58 + (uint16_t)(i * 16);
                if (g_gpios[i].stable_val == LZGPIO_LEVEL_LOW) {
                    lcd_fill(6, y, 154, y + 14, LCD_RED);
                    snprintf(text_buf, sizeof(text_buf), "%-7s: LOW [DOWN]", g_gpios[i].name);
                    lcd_show_string(8, y + 1, text_buf, LCD_WHITE, LCD_RED, 12, 0);
                } else {
                    lcd_fill(6, y, 154, y + 14, LCD_WHITE);
                    if (g_gpios[i].press_count > 0) {
                        snprintf(text_buf, sizeof(text_buf), "%-7s: 1 (x%u)", g_gpios[i].name, g_gpios[i].press_count);
                        lcd_show_string(8, y + 1, text_buf, LCD_BLUE, LCD_WHITE, 12, 0);
                    } else {
                        snprintf(text_buf, sizeof(text_buf), "%-7s: HIGH(1)", g_gpios[i].name);
                        lcd_show_string(8, y + 1, text_buf, LCD_GRAY, LCD_WHITE, 12, 0);
                    }
                }
            }

            for (uint8_t ch = 0; ch < 6; ch++) {
                uint16_t y = 58 + (uint16_t)(ch * 20);
                if (g_adcs[ch].volt < 2.80f) {
                    lcd_fill(164, y, 314, y + 16, LCD_GREEN);
                    snprintf(text_buf, sizeof(text_buf), "CH%u: %.2fV (%u)", ch, g_adcs[ch].volt, g_adcs[ch].raw);
                    lcd_show_string(166, y + 2, text_buf, LCD_BLACK, LCD_GREEN, 12, 0);
                } else {
                    lcd_fill(164, y, 314, y + 16, LCD_WHITE);
                    snprintf(text_buf, sizeof(text_buf), "CH%u: %.2fV (%u)", ch, g_adcs[ch].volt, g_adcs[ch].raw);
                    lcd_show_string(166, y + 2, text_buf, LCD_GRAY, LCD_WHITE, 12, 0);
                }
            }

            lcd_fill(0, 198, LCD_W, LCD_H, LCD_BLACK);
            lcd_show_string(6, 202, g_last_event, LCD_YELLOW, LCD_BLACK, 16, 0);
            snprintf(text_buf, sizeof(text_buf), "EVENTS: %u | TICKS: %u | PC7:%u PA3:%u",
                     g_event_count, g_system_ticks, g_gpios[0].press_count, g_gpios[1].press_count);
            lcd_show_string(6, 222, text_buf, LCD_CYAN, LCD_BLACK, 12, 0);
        }

        // 4. Heartbeat (every 2 seconds)
        if (loop_count % 100 == 0) {
            printf("[SNIFFER HEARTBEAT] PC7=%u, PA3=%u, PA2=%u, PC6=%u | ADC5=%.2fV (raw=%u)\r\n",
                   g_gpios[0].stable_val, g_gpios[1].stable_val, g_gpios[2].stable_val, g_gpios[3].stable_val,
                   g_adcs[5].volt, g_adcs[5].raw);
        }

        LOS_Msleep(20);
    }
    return NULL;
}

static void ButtonSniffer_Entry(void)
{
    TSK_INIT_PARAM_S task;
    unsigned int ret;
    UINT32 task_id;

    memset(&task, 0, sizeof(task));
    task.pfnTaskEntry = (TSK_ENTRY_FUNC)SnifferTask;
    task.pcName = "SnifferTask";
    task.uwStackSize = 0x2000;
    task.usTaskPrio = 20;

    ret = LOS_TaskCreate(&task_id, &task);
    if (ret != LOS_OK) {
        printf("[SNIFFER] Create SnifferTask failed: %u\r\n", ret);
    } else {
        printf("[SNIFFER] SnifferTask started successfully!\r\n");
    }
}

APP_FEATURE_INIT(ButtonSniffer_Entry);
