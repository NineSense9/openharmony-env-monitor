#include "mpu6050.h"
#include <stdio.h>
#include <math.h>
#include "lz_hardware.h"
#include "los_task.h"

#define MPU6050_I2C_PORT        0
#define MPU6050_SLAVE_ADDR      0x68
#define MPU6050_RA_PWR_MGMT_1   0x6B
#define MPU6050_RA_ACCEL_CONFIG 0x1C
#define MPU6050_RA_ACC_XOUT_H   0x3B
#define MPU6050_RA_WHO_AM_I     0x75

static bool s_has_mpu_hardware = false;
static uint32_t s_sim_tick = 0;

static uint8_t mpu_read_reg(uint8_t reg)
{
    uint8_t val = 0;
    uint8_t reg_buf[1] = {reg};
    if (LzI2cWrite(MPU6050_I2C_PORT, MPU6050_SLAVE_ADDR, reg_buf, 1) == LZ_HARDWARE_SUCCESS) {
        LzI2cRead(MPU6050_I2C_PORT, MPU6050_SLAVE_ADDR, &val, 1);
    }
    return val;
}

static void mpu_write_reg(uint8_t reg, uint8_t val)
{
    uint8_t buf[2] = {reg, val};
    LzI2cWrite(MPU6050_I2C_PORT, MPU6050_SLAVE_ADDR, buf, 2);
}

void Mpu6050_Init(void)
{
    // 检测 WHO_AM_I 寄存器是否返回 0x68
    uint8_t id = mpu_read_reg(MPU6050_RA_WHO_AM_I);
    if (id == 0x68) {
        s_has_mpu_hardware = true;
        // 唤醒 MPU6050
        mpu_write_reg(MPU6050_RA_PWR_MGMT_1, 0x00);
        LOS_Msleep(20);
        // 设置加速度计量程 +/- 2g
        mpu_write_reg(MPU6050_RA_ACCEL_CONFIG, 0x00);
        printf("[mpu6050] Physical MPU6050 detected at I2C0:0x68, initialized!\n");
    } else {
        s_has_mpu_hardware = false;
        printf("[mpu6050] Physical MPU6050 not detected (id=0x%02X), running space orbital microgravity simulation!\n", id);
    }
}

void Mpu6050_Read(Mpu6050Data *data)
{
    if (!data) return;

    if (s_has_mpu_hardware) {
        uint8_t reg = MPU6050_RA_ACC_XOUT_H;
        uint8_t buf[6] = {0};
        if (LzI2cWrite(MPU6050_I2C_PORT, MPU6050_SLAVE_ADDR, &reg, 1) == LZ_HARDWARE_SUCCESS &&
            LzI2cRead(MPU6050_I2C_PORT, MPU6050_SLAVE_ADDR, buf, 6) == LZ_HARDWARE_SUCCESS) {
            short ax = (short)((buf[0] << 8) | buf[1]);
            short ay = (short)((buf[2] << 8) | buf[3]);
            short az = (short)((buf[4] << 8) | buf[5]);

            data->accel_x = (float)ax / 16384.0f;
            data->accel_y = (float)ay / 16384.0f;
            data->accel_z = (float)az / 16384.0f;

            // 计算 Pitch 和 Roll
            data->pitch = atan2f(data->accel_y, sqrtf(data->accel_x * data->accel_x + data->accel_z * data->accel_z)) * 57.29578f;
            data->roll  = atan2f(-data->accel_x, data->accel_z) * 57.29578f;
            data->is_hardware_present = true;
            return;
        }
    }

    // 微重力空间站轨道漂移数学仿真 (生成平滑自然的姿态波动)
    s_sim_tick++;
    float t = (float)s_sim_tick * 0.1f;
    data->accel_x = 0.04f * sinf(t * 0.35f);
    data->accel_y = 0.03f * cosf(t * 0.28f);
    data->accel_z = 0.98f + 0.02f * sinf(t * 0.45f);

    data->pitch = 2.8f * sinf(t * 0.25f);
    data->roll  = -1.6f * cosf(t * 0.31f);
    data->is_hardware_present = false;
}
