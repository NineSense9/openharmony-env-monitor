#ifndef LAB09_HTTP_CLIENT_H
#define LAB09_HTTP_CLIENT_H

#include <stdint.h>

// 遥测数据结构
typedef struct {
    char device_id[32];
    float temperature;
    float humidity;
    float lux;
    float gas_ppm;
    int motor_on;
    int alarm_on;
    float accel_x;
    float accel_y;
    float accel_z;
    float pitch;
    float roll;
    int fan_speed;
    int wdt_alive;
    char i2c_devices[64];
    char last_key[16];
} TelemetryData;

// 远程指令结构
typedef struct {
    int command_id;
    char target[16];   // "motor", "led", "alarm"
    char action[16];   // "on", "off", "ack"
} RemoteCommand;

// 初始化 HTTP Client 模块
void HttpClient_Init(void);

// 上报遥测数据至云端
// 返回值: 0 表示成功，非 0 表示失败
int HttpClient_PostTelemetry(const TelemetryData *data);

// 轮询拉取云端待执行命令
// 返回值: 1 表示有待执行命令，0 表示无待执行命令，负数表示网络错误
int HttpClient_GetPendingCommand(RemoteCommand *cmd);

// 上报命令执行回执
// 返回值: 0 表示成功，非 0 表示失败
int HttpClient_AckCommand(int command_id, const char *status, const char *note);

#endif // LAB09_HTTP_CLIENT_H
