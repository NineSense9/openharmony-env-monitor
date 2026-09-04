#ifndef LAB09_MPU6050_H
#define LAB09_MPU6050_H

#include <stdint.h>
#include <stdbool.h>

typedef struct {
    float accel_x; // G
    float accel_y; // G
    float accel_z; // G
    float pitch;   // 度 (deg)
    float roll;    // 度 (deg)
    bool is_hardware_present;
} Mpu6050Data;

// 初始化 MPU6050 (若未检测到实体芯片则无缝切入微重力仿真模式)
void Mpu6050_Init(void);

// 读取最新姿态与加速度数据
void Mpu6050_Read(Mpu6050Data *data);

#endif // LAB09_MPU6050_H
