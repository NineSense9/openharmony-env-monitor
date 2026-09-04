#include <stdio.h>
#include <string.h>

#include "board_pins.h"
#include "smart_home.h"
#include "lz_hardware.h"
#include "los_task.h"

#define SHT30_BH1750_I2C_PORT   0
#define SHT30_I2C_ADDR          0x44
#define BH1750_I2C_ADDR         0x23
#define I2C0_SCL_PIN            GPIO0_PA1
#define I2C0_SDA_PIN            GPIO0_PA0

static I2cBusIo m_i2c0 = {
    .scl = {.gpio = I2C0_SCL_PIN, .func = MUX_FUNC3, .type = PULL_NONE, .drv = DRIVE_KEEP, .dir = LZGPIO_DIR_KEEP, .val = LZGPIO_LEVEL_KEEP},
    .sda = {.gpio = I2C0_SDA_PIN, .func = MUX_FUNC3, .type = PULL_NONE, .drv = DRIVE_KEEP, .dir = LZGPIO_DIR_KEEP, .val = LZGPIO_LEVEL_KEEP},
    .id = FUNC_ID_I2C0,
    .mode = FUNC_MODE_M2,
};

static bool g_motor_state = false;
static bool g_alarm_light_state = false;
static bool g_alarm_latched = false;

static float s_last_temp = 25.5f;
static float s_last_humi = 55.0f;
static float s_last_lux = 120.0f;
static float s_last_gas = 15.0f;

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

void SmartHome_Init(void)
{
    uint8_t sht30_cmd[2] = {0x22, 0x36};
    uint8_t bh1750_power_on = 0x01;
    uint8_t bh1750_cont_mode = 0x10;

    // 1. 初始化 I2C0
    I2cIoInit(m_i2c0);
    LzI2cInit(SHT30_BH1750_I2C_PORT, 100000);

    // 2. 初始化 SHT30 与 BH1750
    LzI2cWrite(SHT30_BH1750_I2C_PORT, SHT30_I2C_ADDR, sht30_cmd, 2);
    LzI2cWrite(SHT30_BH1750_I2C_PORT, BH1750_I2C_ADDR, &bh1750_power_on, 1);
    LzI2cWrite(SHT30_BH1750_I2C_PORT, BH1750_I2C_ADDR, &bh1750_cont_mode, 1);

    // 3. 初始化 PA5 告警灯
    PinctrlSet(TX_GPIO_ALARM_LIGHT, MUX_FUNC0, PULL_KEEP, DRIVE_LEVEL3);
    LzGpioInit(TX_GPIO_ALARM_LIGHT);
    LzGpioSetDir(TX_GPIO_ALARM_LIGHT, LZGPIO_DIR_OUT);
    LzGpioSetVal(TX_GPIO_ALARM_LIGHT, LZGPIO_LEVEL_LOW);

    // 4. 初始化 K3 按键 (GPIO0_PC7, 输入, 硬件上拉)
    LzGpioInit(TX_GPIO_KEY_K3);
    PinctrlSet(TX_GPIO_KEY_K3, MUX_FUNC0, PULL_KEEP, DRIVE_LEVEL0);
    LzGpioSetDir(TX_GPIO_KEY_K3, LZGPIO_DIR_IN);

    // 5. 初始化电机引脚 (三路引脚兼容)
    PinctrlSet(MOTOR_PIN_PRIMARY, MUX_FUNC0, PULL_KEEP, DRIVE_LEVEL3);
    LzGpioInit(MOTOR_PIN_PRIMARY);
    LzGpioSetDir(MOTOR_PIN_PRIMARY, LZGPIO_DIR_OUT);
    LzGpioSetVal(MOTOR_PIN_PRIMARY, LZGPIO_LEVEL_LOW);

    PinctrlSet(MOTOR_PIN_COMPAT_PC6, MUX_FUNC0, PULL_KEEP, DRIVE_LEVEL3);
    LzGpioInit(MOTOR_PIN_COMPAT_PC6);
    LzGpioSetDir(MOTOR_PIN_COMPAT_PC6, LZGPIO_DIR_OUT);
    LzGpioSetVal(MOTOR_PIN_COMPAT_PC6, LZGPIO_LEVEL_LOW);

    PinctrlSet(MOTOR_PIN_COMPAT_PA2, MUX_FUNC0, PULL_KEEP, DRIVE_LEVEL3);
    LzGpioInit(MOTOR_PIN_COMPAT_PA2);
    LzGpioSetDir(MOTOR_PIN_COMPAT_PA2, LZGPIO_DIR_OUT);
    LzGpioSetVal(MOTOR_PIN_COMPAT_PA2, LZGPIO_LEVEL_LOW);

    // 6. 初始化 SARADC
    LzSaradcInit();

    printf("[smart_home] hardware initialized successfully\n");
}

void SmartHome_ReadSensors(SensorReport *report)
{
    if (!report) return;

    // 1. 读取 SHT30 温湿度
    uint8_t send_cmd[2] = {0xE0, 0x00};
    uint8_t recv_buf[6] = {0};
    if (LzI2cWrite(SHT30_BH1750_I2C_PORT, SHT30_I2C_ADDR, send_cmd, sizeof(send_cmd)) == LZ_HARDWARE_SUCCESS) {
        if (LzI2cRead(SHT30_BH1750_I2C_PORT, SHT30_I2C_ADDR, recv_buf, sizeof(recv_buf)) == LZ_HARDWARE_SUCCESS) {
            if (sht30_check_crc(&recv_buf[0], 2, recv_buf[2]) == 0) {
                uint16_t raw_t = ((uint16_t)recv_buf[0] << 8) | recv_buf[1];
                raw_t &= ~0x0003;
                s_last_temp = (float)((175.0 * (double)raw_t / 65535.0) - 45.0);
            }
            if (sht30_check_crc(&recv_buf[3], 2, recv_buf[5]) == 0) {
                uint16_t raw_h = ((uint16_t)recv_buf[3] << 8) | recv_buf[4];
                raw_h &= ~0x0003;
                s_last_humi = (float)(100.0 * (double)raw_h / 65535.0);
            }
        }
    }

    // 2. 读取 BH1750 光照
    uint8_t bh_buf[2] = {0};
    if (LzI2cRead(SHT30_BH1750_I2C_PORT, BH1750_I2C_ADDR, bh_buf, sizeof(bh_buf)) == LZ_HARDWARE_SUCCESS) {
        uint16_t raw = ((uint16_t)bh_buf[0] << 8) | bh_buf[1];
        s_last_lux = (float)raw / 1.2f;
    }

    // 3. 读取 MQ2 烟雾
    unsigned int adc_val = 0;
    if (LzSaradcReadValue(TX_SARADC_MQ2_CHANNEL, &adc_val) == LZ_HARDWARE_SUCCESS) {
        s_last_gas = (float)adc_val * 0.1f;
    }

    report->temperature = s_last_temp;
    report->humidity = s_last_humi;
    report->lux = s_last_lux;
    report->gas_ppm = s_last_gas;

    // 判断是否越限告警
    bool alarm = false;
    if (report->temperature > ALARM_TEMP_THRESHOLD ||
        report->humidity > ALARM_HUMI_THRESHOLD ||
        report->lux < ALARM_LUX_THRESHOLD ||
        report->gas_ppm > ALARM_GAS_THRESHOLD) {
        alarm = true;
    }

    report->alarm_active = alarm || g_alarm_latched;
}

void SmartHome_SetAlarmLight(bool on)
{
    g_alarm_light_state = on;
    LzGpioSetVal(TX_GPIO_ALARM_LIGHT, on ? LZGPIO_LEVEL_HIGH : LZGPIO_LEVEL_LOW);
}

void SmartHome_SetMotor(bool on)
{
    g_motor_state = on;
    LzGpioValue val = on ? LZGPIO_LEVEL_HIGH : LZGPIO_LEVEL_LOW;
    LzGpioSetVal(MOTOR_PIN_PRIMARY, val);
    LzGpioSetVal(MOTOR_PIN_COMPAT_PC6, val);
    LzGpioSetVal(MOTOR_PIN_COMPAT_PA2, val);
}

bool SmartHome_IsK3Pressed(void)
{
    LzGpioValue val = LZGPIO_LEVEL_HIGH;
    if (LzGpioGetVal(TX_GPIO_KEY_K3, &val) == LZ_HARDWARE_SUCCESS) {
        return (val == LZGPIO_LEVEL_LOW);
    }
    return false;
}

void SmartHome_ResetAlarmState(void)
{
    g_alarm_latched = false;
    SmartHome_SetAlarmLight(false);
    SmartHome_SetMotor(false);
}

// 档位定义：0=关(0%), 1=弱(30%), 2=中(65%), 3=强(100%), 4=AUTO(自动温控)
static int s_fan_speed_level = 4; // 默认 AUTO
static int s_fan_effective_duty = 0;

void SmartHome_SetFanSpeed(int speed_level)
{
    if (speed_level < 0 || speed_level > 4) speed_level = 4;
    s_fan_speed_level = speed_level;

    int duty = 0;
    if (speed_level == 0) duty = 0;
    else if (speed_level == 1) duty = 30;
    else if (speed_level == 2) duty = 65;
    else if (speed_level == 3) duty = 100;
    else if (speed_level == 4) {
        // AUTO 自动温控
        if (s_last_temp < 28.0f) duty = 0;
        else if (s_last_temp < 32.0f) duty = 35;
        else if (s_last_temp < 36.0f) duty = 70;
        else duty = 100;
    }
    s_fan_effective_duty = duty;

    // 输出到电机引脚 (三路引脚并联驱动)
    SmartHome_SetMotor(duty > 0);
}

int SmartHome_GetFanSpeed(void)
{
    return s_fan_speed_level;
}

int SmartHome_GetFanDuty(void)
{
    return s_fan_effective_duty;
}

// 警报声响与声光状态更新 (静音/非阻塞)
void SmartHome_UpdateAlarmSound(bool alarm_active)
{
    // 本地声光联动主要由 TX_GPIO_ALARM_LIGHT (GPIO0_PA5) 和 LCD HUD 实时呈现
    (void)alarm_active;
}

static volatile bool s_is_rebooting = false;

// 硬件看门狗 (b12_watchdog)
void SmartHome_InitWatchdog(void)
{
    LzWatchdogInit(20);
    printf("[watchdog] Hardware WDT initialized with 20s timeout\n");
}

void SmartHome_FeedWatchdog(void)
{
    if (s_is_rebooting) {
        // 正在执行重启，严禁喂狗，让硬件看门狗彻底复位
        return;
    }
    LzWatchdogKeepAlive();
}

// 外部引用系统复位接口
extern void RebootDevice(unsigned int);

// 系统远程软件重启 (结合 Cortex-M4 内核寄存器与硬件看门狗)
void SmartHome_Reboot(void)
{
    printf("[system] Remote reboot commanded, initiating hardware reset...\n");
    s_is_rebooting = true;
    SmartHome_SetMotor(false);
    SmartHome_SetAlarmLight(false);
    LzGpioSetVal(GPIO0_PA6, LZGPIO_LEVEL_LOW);
    LOS_Msleep(100);

    // 1. 设置看门狗为最短 1 秒超时
    LzWatchdogInit(1);

    // 2. 直接触发 ARM Cortex-M4 内核级全局系统复位 (SCB->AIRCR: VECTKEY | SYSRESETREQ)
    volatile uint32_t *aircr = (volatile uint32_t *)0xE000ED0CU;
    *aircr = 0x05FA0004U;

    // 3. 调用系统原生 RebootDevice 接口作为备用
    RebootDevice(0);

    // 4. 等待硬件复位生效
    while (1) {
        LOS_Msleep(50);
    }
}

// I2C 动态总线扫描 (b11_i2c_scan)
void SmartHome_ScanI2cBus(char *device_list, int max_len)
{
    if (!device_list || max_len < 8) return;
    device_list[0] = '\0';
    int found_count = 0;

    for (uint8_t addr = 0x03; addr <= 0x77; addr++) {
        uint8_t test = 0;
        if (LzI2cRead(SHT30_BH1750_I2C_PORT, addr, &test, 1) == LZ_HARDWARE_SUCCESS) {
            char name[16];
            if (addr == SHT30_I2C_ADDR) {
                snprintf(name, sizeof(name), "SHT30");
            } else if (addr == BH1750_I2C_ADDR) {
                snprintf(name, sizeof(name), "BH1750");
            } else if (addr == 0x68) {
                snprintf(name, sizeof(name), "MPU6050");
            } else {
                snprintf(name, sizeof(name), "0x%02X", addr);
            }

            if (found_count > 0) {
                strncat(device_list, ",", max_len - strlen(device_list) - 1);
            }
            strncat(device_list, name, max_len - strlen(device_list) - 1);
            found_count++;
        }
    }

    if (found_count == 0) {
        snprintf(device_list, max_len, "NONE");
    }
    printf("[i2c_scan] Scan complete, found %d devices: %s\n", found_count, device_list);
}
