#include <stdint.h>
#include <stdio.h>

#include "los_task.h"
#include "ohos_init.h"
#include "lz_hardware.h"

#define ARRAY_SIZE(a) (sizeof(a) / sizeof((a)[0]))
#define ADC_CHANNEL_COUNT 8
#define ADC_CHANGE_THRESHOLD 20
#define POLL_INTERVAL_MS 20
#define HEARTBEAT_TICKS 50

typedef struct {
    const char *name;
    GpioID id;
    uint8_t configure_mux;
    uint8_t active;
    LzGpioValue last;
} SniffGpio;

typedef struct {
    uint8_t active;
    unsigned int last;
} SniffAdc;

static SniffGpio g_gpio_candidates[] = {
    {"GPIO0_PA0", GPIO0_PA0, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PA1", GPIO0_PA1, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PA2", GPIO0_PA2, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PA3", GPIO0_PA3, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PA5", GPIO0_PA5, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PB0", GPIO0_PB0, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PB1", GPIO0_PB1, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PB2", GPIO0_PB2, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PB3", GPIO0_PB3, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PB4", GPIO0_PB4, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PB5", GPIO0_PB5, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PB6", GPIO0_PB6, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PB7", GPIO0_PB7, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PC4", GPIO0_PC4, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PC5", GPIO0_PC5, 0, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PC7", GPIO0_PC7, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PD0", GPIO0_PD0, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PD1", GPIO0_PD1, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PD2", GPIO0_PD2, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PD3", GPIO0_PD3, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PD4", GPIO0_PD4, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PD5", GPIO0_PD5, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PD6", GPIO0_PD6, 1, 0, LZGPIO_LEVEL_LOW},
    {"GPIO0_PD7", GPIO0_PD7, 1, 0, LZGPIO_LEVEL_LOW},
};

static SniffAdc g_adc_channels[ADC_CHANNEL_COUNT];

static DevIo g_adc5_io = {
    .isr = {.gpio = INVALID_GPIO},
    .rst = {.gpio = INVALID_GPIO},
    .ctrl1 = {
        .gpio = GPIO0_PC5,
        .func = MUX_FUNC1,
        .type = PULL_NONE,
        .drv = DRIVE_KEEP,
        .dir = LZGPIO_DIR_IN,
        .val = LZGPIO_LEVEL_KEEP,
    },
    .ctrl2 = {.gpio = INVALID_GPIO},
};

static unsigned int diff_u32(unsigned int a, unsigned int b)
{
    return (a > b) ? (a - b) : (b - a);
}

static unsigned int raw_to_mv(unsigned int raw)
{
    return (raw * 3300U) / 1024U;
}

static void init_adc_inputs(void)
{
    unsigned int ch;
    unsigned int raw = 0;
    unsigned int ret;
    uint32_t *grf_soc_con29 = (uint32_t *)(0x41050000U + 0x274U);
    uint32_t grf_value;

    ret = DevIoInit(g_adc5_io);
    printf("pin_sniffer: ADC5_IO_INIT ret=%u\r\n", ret);

    ret = LzSaradcInit();
    printf("pin_sniffer: ADC_INIT ret=%u\r\n", ret);
    if (ret != LZ_HARDWARE_SUCCESS) {
        return;
    }

    grf_value = *grf_soc_con29;
    grf_value &= ~(0x1U << 4);
    grf_value |= ((0x1U << 4) << 16);
    *grf_soc_con29 = grf_value;

    for (ch = 0; ch < ADC_CHANNEL_COUNT; ch++) {
        ret = LzSaradcReadValue(ch, &raw);
        g_adc_channels[ch].active = (ret == LZ_HARDWARE_SUCCESS) ? 1U : 0U;
        g_adc_channels[ch].last = raw;
        printf("pin_sniffer: ADC_BASE ch=%u ret=%u raw=%u mv=%u\r\n",
               ch, ret, raw, raw_to_mv(raw));
    }
}

static void init_gpio_inputs(void)
{
    size_t i;
    unsigned int init_ret;
    unsigned int mux_ret = LZ_HARDWARE_SUCCESS;
    unsigned int dir_ret;
    unsigned int read_ret;
    LzGpioValue value;

    for (i = 0; i < ARRAY_SIZE(g_gpio_candidates); i++) {
        value = LZGPIO_LEVEL_LOW;
        init_ret = LzGpioInit(g_gpio_candidates[i].id);
        if (g_gpio_candidates[i].configure_mux != 0U) {
            mux_ret = PinctrlSet(g_gpio_candidates[i].id, MUX_FUNC0,
                                 PULL_KEEP, DRIVE_LEVEL0);
        }
        dir_ret = LzGpioSetDir(g_gpio_candidates[i].id, LZGPIO_DIR_IN);
        read_ret = LzGpioGetVal(g_gpio_candidates[i].id, &value);

        g_gpio_candidates[i].active =
            (init_ret == LZ_HARDWARE_SUCCESS &&
             dir_ret == LZ_HARDWARE_SUCCESS &&
             read_ret == LZ_HARDWARE_SUCCESS) ? 1U : 0U;
        g_gpio_candidates[i].last = value;

        printf("pin_sniffer: GPIO_INIT name=%s id=%u init=%u mux=%u dir=%u read=%u val=%u\r\n",
               g_gpio_candidates[i].name, (unsigned int)g_gpio_candidates[i].id,
               init_ret, mux_ret, dir_ret, read_ret, (unsigned int)value);
    }
}

static void scan_gpio_inputs(unsigned int tick)
{
    size_t i;
    unsigned int ret;
    LzGpioValue value;

    for (i = 0; i < ARRAY_SIZE(g_gpio_candidates); i++) {
        if (g_gpio_candidates[i].active == 0U) {
            continue;
        }

        value = g_gpio_candidates[i].last;
        ret = LzGpioGetVal(g_gpio_candidates[i].id, &value);
        if (ret != LZ_HARDWARE_SUCCESS) {
            printf("pin_sniffer: GPIO_READ_FAIL name=%s id=%u ret=%u tick=%u\r\n",
                   g_gpio_candidates[i].name,
                   (unsigned int)g_gpio_candidates[i].id, ret, tick);
            continue;
        }

        if (value != g_gpio_candidates[i].last) {
            printf("pin_sniffer: GPIO_CHANGE name=%s id=%u %u->%u tick=%u\r\n",
                   g_gpio_candidates[i].name,
                   (unsigned int)g_gpio_candidates[i].id,
                   (unsigned int)g_gpio_candidates[i].last,
                   (unsigned int)value, tick);
            g_gpio_candidates[i].last = value;
        }
    }
}

static void scan_adc_inputs(unsigned int tick)
{
    unsigned int ch;
    unsigned int ret;
    unsigned int raw = 0;
    unsigned int old_raw;

    for (ch = 0; ch < ADC_CHANNEL_COUNT; ch++) {
        if (g_adc_channels[ch].active == 0U) {
            continue;
        }

        ret = LzSaradcReadValue(ch, &raw);
        if (ret != LZ_HARDWARE_SUCCESS) {
            printf("pin_sniffer: ADC_READ_FAIL ch=%u ret=%u tick=%u\r\n",
                   ch, ret, tick);
            continue;
        }

        old_raw = g_adc_channels[ch].last;
        if (diff_u32(raw, old_raw) >= ADC_CHANGE_THRESHOLD) {
            printf("pin_sniffer: ADC_CHANGE ch=%u raw=%u->%u mv=%u tick=%u\r\n",
                   ch, old_raw, raw, raw_to_mv(raw), tick);
            g_adc_channels[ch].last = raw;
        }
    }
}

static void pin_sniffer_task(void *arg)
{
    unsigned int tick = 0;

    (void)arg;
    printf("pin_sniffer: PIN_SNIFFER_READY poll=%ums adc_threshold=%u\r\n",
           POLL_INTERVAL_MS, ADC_CHANGE_THRESHOLD);
    init_adc_inputs();
    init_gpio_inputs();
    printf("pin_sniffer: PRESS_K3_NOW\r\n");

    while (1) {
        tick++;
        scan_gpio_inputs(tick);
        scan_adc_inputs(tick);
        if ((tick % HEARTBEAT_TICKS) == 0U) {
            printf("pin_sniffer: HEARTBEAT tick=%u\r\n", tick);
        }
        LOS_Msleep(POLL_INTERVAL_MS);
    }
}

void pin_sniffer_example(void)
{
    unsigned int task_id;
    unsigned int ret;
    TSK_INIT_PARAM_S task = {0};

    task.pfnTaskEntry = (TSK_ENTRY_FUNC)pin_sniffer_task;
    task.uwStackSize = 8192;
    task.pcName = "pin sniffer";
    task.usTaskPrio = 24;
    ret = LOS_TaskCreate(&task_id, &task);
    if (ret != LOS_OK) {
        printf("pin_sniffer: task create failed ret=0x%x\r\n", ret);
    }
}

APP_FEATURE_INIT(pin_sniffer_example);
