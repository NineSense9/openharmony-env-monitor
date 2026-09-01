#include <stdio.h>
#include <string.h>

#include "board_pins.h"
#include "tx_light.h"
#include "smart_home.h"

static I2cBusIo m_i2c0 = {
    .scl = {.gpio = I2C0_SCL_PIN, .func = MUX_FUNC3, .type = PULL_NONE, .drv = DRIVE_KEEP, .dir = LZGPIO_DIR_KEEP, .val = LZGPIO_LEVEL_KEEP},
    .sda = {.gpio = I2C0_SDA_PIN, .func = MUX_FUNC3, .type = PULL_NONE, .drv = DRIVE_KEEP, .dir = LZGPIO_DIR_KEEP, .val = LZGPIO_LEVEL_KEEP},
    .id = FUNC_ID_I2C0,
    .mode = FUNC_MODE_M2,
};

static uint8_t sht30_check_crc(uint8_t *data, uint8_t nbrOfBytes, uint8_t checksum)
{
    uint8_t crc = 0xFF;
    uint8_t bit = 0;
    uint8_t byteCtr;
    const int16_t POLYNOMIAL = 0x131;

    for (byteCtr = 0; byteCtr < nbrOfBytes; ++byteCtr) {
        crc ^= data[byteCtr];
        for (bit = 8; bit > 0; --bit) {
            if (crc & 0x80) {
                crc = (crc << 1) ^ POLYNOMIAL;
            } else {
                crc = (crc << 1);
            }
        }
    }

    return (crc == checksum) ? 0 : 1;
}

unsigned int smart_home_init(void)
{
    uint8_t sht30_cmd[2] = {0x22, 0x36};
    uint8_t bh1750_power_on = 0x01;
    uint8_t bh1750_cont_mode = 0x10;

    /* 1. 初始化 I2C0 */
    I2cIoInit(m_i2c0);
    LzI2cInit(SHT30_BH1750_I2C_PORT, 100000);

    /* 2. 初始化 SHT30 与 BH1750 (持续测量模式 0x10) */
    LzI2cWrite(SHT30_BH1750_I2C_PORT, SHT30_I2C_ADDR, sht30_cmd, 2);
    LzI2cWrite(SHT30_BH1750_I2C_PORT, BH1750_I2C_ADDR, &bh1750_power_on, 1);
    LzI2cWrite(SHT30_BH1750_I2C_PORT, BH1750_I2C_ADDR, &bh1750_cont_mode, 1);

    /* 3. 初始化 电机 (GPIO0_PD0) */
    PinctrlSet(MOTOR_PIN, MUX_FUNC0, PULL_KEEP, DRIVE_LEVEL3);
    LzGpioInit(MOTOR_PIN);
    LzGpioSetDir(MOTOR_PIN, LZGPIO_DIR_OUT);
    LzGpioSetVal(MOTOR_PIN, LZGPIO_LEVEL_LOW);

    printf("smart_home: init complete (I2C sensors, Motor on GPIO0_PD0)\n");
    return LZ_HARDWARE_SUCCESS;
}

unsigned int sht30_read_temp_humi(double *temp, double *humi)
{
    uint8_t send_cmd[2] = {0xE0, 0x00};
    uint8_t recv_buf[6] = {0};
    unsigned int ret;
    uint16_t raw_t, raw_h;

    ret = LzI2cWrite(SHT30_BH1750_I2C_PORT, SHT30_I2C_ADDR, send_cmd, sizeof(send_cmd));
    if (ret != LZ_HARDWARE_SUCCESS) {
        return ret;
    }

    ret = LzI2cRead(SHT30_BH1750_I2C_PORT, SHT30_I2C_ADDR, recv_buf, sizeof(recv_buf));
    if (ret != LZ_HARDWARE_SUCCESS) {
        return ret;
    }

    if (sht30_check_crc(&recv_buf[0], 2, recv_buf[2]) == 0) {
        raw_t = ((uint16_t)recv_buf[0] << 8) | recv_buf[1];
        raw_t &= ~0x0003;
        *temp = (175.0 * (double)raw_t / 65535.0) - 45.0;
    }

    if (sht30_check_crc(&recv_buf[3], 2, recv_buf[5]) == 0) {
        raw_h = ((uint16_t)recv_buf[3] << 8) | recv_buf[4];
        raw_h &= ~0x0003;
        *humi = 100.0 * (double)raw_h / 65535.0;
    }

    return LZ_HARDWARE_SUCCESS;
}

float bh1750_read_lux(void)
{
    uint8_t recv_buf[2] = {0};
    unsigned int ret;
    uint16_t raw;

    ret = LzI2cRead(SHT30_BH1750_I2C_PORT, BH1750_I2C_ADDR, recv_buf, sizeof(recv_buf));
    if (ret != LZ_HARDWARE_SUCCESS) {
        return 0.0f;
    }

    raw = ((uint16_t)recv_buf[0] << 8) | recv_buf[1];
    return (float)raw / 1.2f;
}

void motor_set_state(int on)
{
    LzGpioValue val = on ? LZGPIO_LEVEL_HIGH : LZGPIO_LEVEL_LOW;
    LzGpioSetVal(MOTOR_PIN, val);
}

void outputs_all_off(void)
{
    tx_light_set(TX_GPIO_ALARM_LIGHT, 0);
    motor_set_state(0);
}
