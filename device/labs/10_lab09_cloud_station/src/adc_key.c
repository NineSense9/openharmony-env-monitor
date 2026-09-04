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

static uint32_t s_k3_press_ticks = 0;

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

    // 消抖逻辑：
    // 按下时连续 2 次采样 (20ms) 保持有效电平，视为真实按下，防电磁杂波
    // 松开时只要引脚恢复高电平，立即判决释放，绝不拖泥带水！
    if (current_raw == s_last_detected_raw) {
        s_raw_stable_count++;
    } else {
        s_last_detected_raw = current_raw;
        s_raw_stable_count = 1;
    }

    AdcKeyType triggered = KEY_NONE;

    // 当物理按键松开时 (从 KEY_K3 变为 KEY_NONE)，立即裁定手势，无需再等 20ms 消抖
    if (s_confirmed_key == KEY_K3 && current_raw == KEY_NONE) {
        uint32_t ticks = s_k3_press_ticks;
        if (ticks >= 2 && ticks < 100) {
            // 20ms ~ 1.0秒：短按单击 -> 切换风机档位 / 消除当前告警
            triggered = KEY_K3;
            printf("[adc_key] Released after %.2fs -> Trigger K3 (Fan/Mute)!\n", ticks * 0.01f);
        } else if (ticks >= 100 && ticks < 250) {
            // 1.0秒 ~ 2.5秒：长按自检 -> 启动/停止声光自检测试 (原K5功能)
            triggered = KEY_K5;
            printf("[adc_key] Released after %.2fs -> Trigger K5 (Alarm Test)!\n", ticks * 0.01f);
        } else if (ticks >= 250 && ticks <= 500) {
            // 2.5秒 ~ 5.0秒：超长按重扫 -> 启动 I2C 传感器拓扑重扫 (原K6功能)
            triggered = KEY_K6;
            printf("[adc_key] Released after %.2fs -> Trigger K6 (I2C Rescan)!\n", ticks * 0.01f);
        } else if (ticks > 500) {
            // > 5.0秒：超长按防误触取消操作
            printf("[adc_key] Released after %.2fs -> Action Cancelled (>5s)!\n", ticks * 0.01f);
        }
        s_k3_press_ticks = 0;
        s_confirmed_key = KEY_NONE;
        s_raw_stable_count = 0;
    } else if (s_raw_stable_count >= 2) {
        if (current_raw != s_confirmed_key) {
            if (current_raw == KEY_K3 && s_confirmed_key == KEY_NONE) {
                // 物理按键按下瞬间：开启精准计时
                s_k3_press_ticks = 0;
            } else if (current_raw != KEY_NONE && current_raw != KEY_K3 && s_confirmed_key == KEY_NONE) {
                // 外接分压按键直接边沿触发
                triggered = current_raw;
                printf("[adc_key] External ADC Key Triggered %s\n", AdcKey_GetName(triggered));
            }
            s_confirmed_key = current_raw;
        }
    }

    // 按住期间连续累计计时 (仅用于 UI 实时显示进度条与倒计时，严禁在按住期间提前早触发)
    if (s_confirmed_key == KEY_K3) {
        s_k3_press_ticks++;
    }

    return triggered;
}

bool AdcKey_IsPhysicalPressed(void)
{
    return (s_confirmed_key == KEY_K3);
}

uint32_t AdcKey_GetHoldDurationMs(void)
{
    if (s_confirmed_key != KEY_K3) return 0;
    return s_k3_press_ticks * 10;
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
