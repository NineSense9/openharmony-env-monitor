#ifndef LAB09_SMART_HOME_H
#define LAB09_SMART_HOME_H

#include <stdint.h>
#include <stdbool.h>

// 传感器数据包
typedef struct {
    float temperature;
    float humidity;
    float lux;
    float gas_ppm;
    bool alarm_active;
} SensorReport;

// 硬件驱动初始化
void SmartHome_Init(void);

// 读取四路传感器综合数据
void SmartHome_ReadSensors(SensorReport *report);

// 执行器控制
void SmartHome_SetAlarmLight(bool on);
void SmartHome_SetMotor(bool on);

// 按键与消警
bool SmartHome_IsK3Pressed(void);
void SmartHome_ResetAlarmState(void);

#endif // LAB09_SMART_HOME_H
