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

    // 严谨按照 Lab02 可行基线初始化 PC7 板载物理按键
    LzGpioInit(TX_GPIO_KEY_K3);
    PinctrlSet(TX_GPIO_KEY_K3, MUX_FUNC0, PULL_KEEP, DRIVE_LEVEL0);
    LzGpioSetDir(TX_GPIO_KEY_K3, LZGPIO_DIR_IN);

    printf("[adc_key] SARADC5 & GPIO0_PC7 Key subsystem initialized\n");
}

float AdcKey_GetVoltage(void)
{
    return s_last_voltage;
}

static AdcKeyType adc_voltage_to_key(float v)
{
    // 重要：ADC5 悬空/未接梯形分压板时读数为 0.00V 或 3.3V
    // 0.00V ~ 0.30V 必须返回 KEY_NONE，绝不能判定为有效按键，否则会导致 K3 永久锁死！
    if (v >= 0.35f && v < 0.80f) {
        return KEY_K4;
    } else if (v >= 0.85f && v < 1.35f) {
        return KEY_K5;
    } else if (v >= 1.45f && v <= 2.20f) {
        return KEY_K6;
    }
    return KEY_NONE;
}

AdcKeyType AdcKey_Scan(void)
{
    AdcKeyType current_raw = KEY_NONE;

    // 1. 优先读取底板真实物理按键 (GPIO0_PC7 低电平有效)
    LzGpioValue pc7_val = LZGPIO_LEVEL_HIGH;
    if (LzGpioGetVal(TX_GPIO_KEY_K3, &pc7_val) == LZ_HARDWARE_SUCCESS) {
        if (pc7_val == LZGPIO_LEVEL_LOW) {
            current_raw = KEY_K3;
        }
    }

    // 2. 同时采集 SARADC5 分压电压；若检测到有效外接梯形分压按键，则细化具体键位
    unsigned int raw_data = 0;
    if (LzSaradcReadValue(ADC_KEY_CHANNEL, &raw_data) == LZ_HARDWARE_SUCCESS) {
        s_last_voltage = (float)(raw_data * 3.3f / 1024.0f);
        AdcKeyType k_adc = adc_voltage_to_key(s_last_voltage);
        if (k_adc != KEY_NONE) {
            current_raw = k_adc;
        }
    }

    // 消抖逻辑：连续 2 次周期 (10ms * 2 = 20ms) 保持同一按键，视为有效
    if (current_raw == s_last_detected_raw) {
        s_raw_stable_count++;
    } else {
        s_last_detected_raw = current_raw;
        s_raw_stable_count = 1;
    }

    AdcKeyType triggered = KEY_NONE;
    if (s_raw_stable_count >= 2) {
        if (current_raw != s_confirmed_key) {
            // 按键初次按下边沿触发 (Leading Edge Trigger) - 零延迟响应！
            if (current_raw != KEY_NONE && s_confirmed_key == KEY_NONE) {
                triggered = current_raw;
                printf("[adc_key] Press Triggered %s (voltage: %.2fV)\n", AdcKey_GetName(triggered), s_last_voltage);
            }
            s_confirmed_key = current_raw;
        }
    }

    return triggered;
}

const char *AdcKey_GetName(AdcKeyType key)
{
    switch (key) {
        case KEY_K3: return "K3";
        case KEY_K4: return "K4";
        case KEY_K5: return "K5";
        case KEY_K6: return "K6";
        default:     return "NONE";
    }
}
