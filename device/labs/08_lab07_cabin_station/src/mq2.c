#include <math.h>
#include <stdio.h>
#include <stdint.h>

#include "lz_hardware.h"
#include "board_pins.h"
#include "mq2.h"

#define CAL_PPM 20.0f
#define RL 1.0f
#define DEFAULT_R0 25.0f

static float m_r0 = DEFAULT_R0;
static int m_mq2_inited = 0;

static DevIo m_mq2_io = {
    .isr =   {.gpio = INVALID_GPIO},
    .rst =   {.gpio = INVALID_GPIO},
    .ctrl1 = {.gpio = MQ2_ADC_PIN, .func = MUX_FUNC1, .type = PULL_NONE, .drv = DRIVE_KEEP, .dir = LZGPIO_DIR_IN, .val = LZGPIO_LEVEL_KEEP},
    .ctrl2 = {.gpio = INVALID_GPIO},
};

unsigned int mq2_dev_init(void)
{
    unsigned int ret;
    uint32_t *pGrfSocCon29 = (uint32_t *)(0x41050000U + 0x274U);
    uint32_t ulValue;

    ret = DevIoInit(m_mq2_io);
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("mq2: DevIoInit failed ret=%u\n", ret);
    }

    ret = LzSaradcInit();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("mq2: LzSaradcInit failed ret=%u\n", ret);
        return ret;
    }

    /* 设 saradc 的参考电压信号，选择 AVDD */
    ulValue = *pGrfSocCon29;
    ulValue &= ~(0x1 << 4);
    ulValue |= ((0x1 << 4) << 16);
    *pGrfSocCon29 = ulValue;

    m_mq2_inited = 1;
    printf("mq2: dev init success on ADC port %d\n", MQ2_ADC_PORT);
    return LZ_HARDWARE_SUCCESS;
}

float mq2_get_voltage(void)
{
    unsigned int raw = 0;
    unsigned int ret;

    if (!m_mq2_inited) {
        return 0.0f;
    }

    ret = LzSaradcReadValue(MQ2_ADC_PORT, &raw);
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("mq2: read adc failed ret=%u\n", ret);
        return 0.0f;
    }

    return ((float)raw * 3.3f) / 1024.0f;
}

void mq2_ppm_calibration(void)
{
    float voltage = mq2_get_voltage();
    if (voltage <= 0.001f) {
        voltage = 0.001f;
    }

    float rs = (5.0f - voltage) / voltage * RL;
    m_r0 = rs / pow(CAL_PPM / 613.9f, 1.0f / -2.074f);
    if (m_r0 <= 0.001f) {
        m_r0 = DEFAULT_R0;
    }

    printf("mq2: calibrated v=%.3f V, rs=%.3f, r0=%.3f\n", voltage, rs, m_r0);
}

float get_mq2_ppm(void)
{
    float voltage = mq2_get_voltage();
    if (voltage <= 0.001f) {
        voltage = 0.001f;
    }

    float rs = (5.0f - voltage) / voltage * RL;
    if (m_r0 <= 0.001f) {
        m_r0 = DEFAULT_R0;
    }

    float ppm = 613.9f * pow(rs / m_r0, -2.074f);
    if (ppm < 0.0f) {
        ppm = 0.0f;
    }

    return ppm;
}
