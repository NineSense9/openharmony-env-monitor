#ifndef LAB09_ADC_KEY_H
#define LAB09_ADC_KEY_H

#include <stdint.h>
#include <stdbool.h>

typedef enum {
    KEY_NONE = 0,
    KEY_K3   = 1,   // 消警与静音 / 恢复
    KEY_K4   = 2,   // 风机档位循环切换 (0 -> 1 -> 2 -> 3 -> AUTO)
    KEY_K5   = 3,   // 告警与声光自检测试
    KEY_K6   = 4    // I2C 总线动态重扫
} AdcKeyType;

// 初始化 ADC 按键检测 (SARADC5 / PC5 与 PC7 兼容)
void AdcKey_Init(void);

// 周期扫描按键 (带消抖和边沿触发，返回当前按下的按键类型)
AdcKeyType AdcKey_Scan(void);

// 获取最新采集的 SARADC5 电压值 (V)
float AdcKey_GetVoltage(void);

// 获取按键名称字符串
const char *AdcKey_GetName(AdcKeyType key);

#endif // LAB09_ADC_KEY_H
