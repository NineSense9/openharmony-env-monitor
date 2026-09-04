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

// 多档位风扇控制 (0=关, 1=30%, 2=65%, 3=100%, 4=AUTO自动温控)
void SmartHome_SetFanSpeed(int speed_level);
int SmartHome_GetFanSpeed(void);
int SmartHome_GetFanDuty(void);

// 警报声响与指示更新
void SmartHome_UpdateAlarmSound(bool alarm_active);

// 硬件看门狗 WDT (b12_watchdog)
void SmartHome_InitWatchdog(void);
void SmartHome_FeedWatchdog(void);

// 系统远程软件重启 (b13_reboot)
void SmartHome_Reboot(void);

// I2C 动态总线扫描 (b11_i2c_scan)
void SmartHome_ScanI2cBus(char *device_list, int max_len);

// 按键与消警
bool SmartHome_IsK3Pressed(void);
void SmartHome_ResetAlarmState(void);

#endif // LAB09_SMART_HOME_H
