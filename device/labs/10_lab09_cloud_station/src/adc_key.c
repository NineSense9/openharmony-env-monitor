#include "adc_key.h"
#include <stdio.h>
#include "lz_hardware.h"
#include "board_pins.h"

#define ADC_KEY_CHANNEL     5
#define ADC_KEY_PIN         GPIO0_PC5

static DevIo m_adcKeyIo = {
    .isr =   {.gpio = INVALID_GPIO},
    .rst =   {.gpio = INVALID_GPIO},
    .ctrl1 = {.gpio = ADC_KEY_PIN, .func = MUX_FUNC1, .type = PULL_NONE, .drv = DRIVE_KEEP, .dir = LZGPIO_DIR_IN, .val = LZGPIO_LEVEL_KEEP},
    .ctrl2 = {.gpio = INVALID_GPIO},
};

static float s_last_voltage = 3.3f;
static AdcKeyType s_last_detected_raw = KEY_NONE;
static int s_raw_stable_count = 0;
static AdcKeyType s_confirmed_key = KEY_NONE;

void AdcKey_Init(void)
{
    unsigned int ret = DevIoInit(m_adcKeyIo);
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("[adc_key] DevIoInit failed: %u\n", ret);
    }
    LzSaradcInit();

    // 配置 SARADC 基准电压选择 AVDD (SocCon29)
    uint32_t *pGrfSocCon29 = (uint32_t *)(0x41050000U + 0x274U);
    uint32_t ulValue = *pGrfSocCon29;
    ulValue &= ~(0x1 << 4);
    ulValue |= ((0x1 << 4) << 16);
    *pGrfSocCon29 = ulValue;

    // 兼容初始化 PC7 数字引脚
    PinctrlSet(TX_GPIO_KEY_K3, MUX_FUNC0, PULL_UP, DRIVE_LEVEL3);
    LzGpioInit(TX_GPIO_KEY_K3);
    LzGpioSetDir(TX_GPIO_KEY_K3, LZGPIO_DIR_IN);

    printf("[adc_key] SARADC5 Key Matrix & PC7 Compatibility initialized\n");
}

float AdcKey_GetVoltage(void)
{
    return s_last_voltage;
}

static AdcKeyType adc_voltage_to_key(float v)
{
    if (v >= 0.0f && v < 0.30f) {
        return KEY_K3;
    } else if (v >= 0.35f && v <= 0.75f) {
        return KEY_K4;
    } else if (v >= 0.80f && v <= 1.30f) {
        return KEY_K5;
    } else if (v >= 1.40f && v <= 2.00f) {
        return KEY_K6;
    }
    return KEY_NONE;
}

AdcKeyType AdcKey_Scan(void)
{
    unsigned int raw_data = 0;
    AdcKeyType current_raw = KEY_NONE;

    if (LzSaradcReadValue(ADC_KEY_CHANNEL, &raw_data) == LZ_HARDWARE_SUCCESS) {
        s_last_voltage = (float)(raw_data * 3.3f / 1024.0f);
        current_raw = adc_voltage_to_key(s_last_voltage);
    }

    // 若 ADC 未检测到按键，检查 PC7 是否低电平 (兼容旧接线 K3)
    if (current_raw == KEY_NONE) {
        LzGpioValue pc7_val = LZGPIO_LEVEL_HIGH;
        if (LzGpioGetVal(TX_GPIO_KEY_K3, &pc7_val) == LZ_HARDWARE_SUCCESS) {
            if (pc7_val == LZGPIO_LEVEL_LOW) {
                current_raw = KEY_K3;
            }
        }
    }

    // 消抖逻辑：连续 2 次采集一致视为稳定
    if (current_raw == s_last_detected_raw) {
        s_raw_stable_count++;
    } else {
        s_last_detected_raw = current_raw;
        s_raw_stable_count = 1;
    }

    AdcKeyType triggered = KEY_NONE;
    if (s_raw_stable_count >= 2) {
        if (current_raw != s_confirmed_key) {
            // 发生按键状态改变
            if (current_raw != KEY_NONE && s_confirmed_key == KEY_NONE) {
                // 单次按下上升沿触发
                triggered = current_raw;
                printf("[adc_key] Triggered %s (voltage: %.2fV)\n", AdcKey_GetName(triggered), s_last_voltage);
            }
            s_confirmed_key = current_raw;
        }
    }

    return triggered;
}

const char *AdcKey_GetName(AdcKeyType key)
{
    switch (key) {
        case KEY_K3: return "KEY3";
        case KEY_K4: return "KEY4";
        case KEY_K5: return "KEY5";
        case KEY_K6: return "KEY6";
        default:     return "NONE";
    }
}
