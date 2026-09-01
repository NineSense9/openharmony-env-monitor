#include <stdio.h>
#include <string.h>

#include "board_pins.h"
#include "sht30.h"

static I2cBusIo m_sht30_i2c = {
    .scl = {.gpio = SHT30_SCL_PIN, .func = MUX_FUNC3, .type = PULL_NONE, .drv = DRIVE_KEEP, .dir = LZGPIO_DIR_KEEP, .val = LZGPIO_LEVEL_KEEP},
    .sda = {.gpio = SHT30_SDA_PIN, .func = MUX_FUNC3, .type = PULL_NONE, .drv = DRIVE_KEEP, .dir = LZGPIO_DIR_KEEP, .val = LZGPIO_LEVEL_KEEP},
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

unsigned int sht30_init(void)
{
    unsigned int ret;
    uint8_t send_cmd[2] = {0x22, 0x36};

    ret = I2cIoInit(m_sht30_i2c);
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("sht30: I2cIoInit failed ret=%u\n", ret);
    }

    ret = LzI2cInit(SHT30_I2C_PORT, 100000);
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("sht30: LzI2cInit failed ret=%u\n", ret);
        return ret;
    }

    ret = LzI2cWrite(SHT30_I2C_PORT, SHT30_I2C_ADDR, send_cmd, sizeof(send_cmd));
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("sht30: periodic meas cmd send warn ret=%u\n", ret);
    }

    printf("sht30: dev init success on I2C0 (0x44)\n");
    return LZ_HARDWARE_SUCCESS;
}

unsigned int sht30_read_data(double dat[2])
{
    uint8_t send_cmd[2] = {0xE0, 0x00};
    uint8_t recv_buf[6] = {0};
    unsigned int ret;
    uint16_t raw_t, raw_h;

    if (dat == NULL) {
        return LZ_HARDWARE_FAILURE;
    }

    ret = LzI2cWrite(SHT30_I2C_PORT, SHT30_I2C_ADDR, send_cmd, sizeof(send_cmd));
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("sht30: write fetch cmd failed ret=%u\n", ret);
        return ret;
    }

    ret = LzI2cRead(SHT30_I2C_PORT, SHT30_I2C_ADDR, recv_buf, sizeof(recv_buf));
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("sht30: read data failed ret=%u\n", ret);
        return ret;
    }

    if (sht30_check_crc(&recv_buf[0], 2, recv_buf[2]) == 0) {
        raw_t = ((uint16_t)recv_buf[0] << 8) | recv_buf[1];
        raw_t &= ~0x0003;
        dat[0] = (175.0 * (double)raw_t / 65535.0) - 45.0;
    } else {
        printf("sht30: temp crc check fail\n");
    }

    if (sht30_check_crc(&recv_buf[3], 2, recv_buf[5]) == 0) {
        raw_h = ((uint16_t)recv_buf[3] << 8) | recv_buf[4];
        raw_h &= ~0x0003;
        dat[1] = 100.0 * (double)raw_h / 65535.0;
    } else {
        printf("sht30: humi crc check fail\n");
    }

    return LZ_HARDWARE_SUCCESS;
}
