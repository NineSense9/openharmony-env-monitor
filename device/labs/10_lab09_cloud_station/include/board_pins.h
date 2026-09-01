#ifndef LAB09_BOARD_PINS_H
#define LAB09_BOARD_PINS_H

#include "lz_hardware.h"

// 传感器引脚与外设定义
#define TX_GPIO_ALARM_LIGHT     GPIO0_PA5
#define TX_GPIO_KEY_K3          GPIO0_PC7
#define TX_SARADC_MQ2_CHANNEL   4
#define TX_SARADC_MQ2_PIN       GPIO0_PC4

// 电机引脚兼容定义
#define MOTOR_PIN_PRIMARY       GPIO1_PD0
#define MOTOR_PIN_COMPAT_PC6    GPIO0_PC6
#define MOTOR_PIN_COMPAT_PA2    GPIO0_PA2

// 告警阈值定义 (更适合真实室内环境，避免误报)
#define ALARM_TEMP_THRESHOLD    38.0f
#define ALARM_HUMI_THRESHOLD    85.0f
#define ALARM_LUX_THRESHOLD     20.0f
#define ALARM_GAS_THRESHOLD     100.0f

// 云端服务器配置
#define CLOUD_SERVER_IP         "180.76.137.117"
#define CLOUD_SERVER_PORT       8000
#define CLOUD_DEVICE_ID         "rk2206-station-01"

// 采样与上报周期配置 (毫秒)
#define SENSOR_SAMPLE_INTERVAL_MS 2000
#define UI_REFRESH_INTERVAL_MS    300
#define CLOUD_UPLOAD_INTERVAL_MS  3000

#endif // LAB09_BOARD_PINS_H
