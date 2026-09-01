#ifndef LAB07_CABIN_STATION_BOARD_PINS_H
#define LAB07_CABIN_STATION_BOARD_PINS_H

#include "lz_hardware.h"

/* PDF 4.11: SMART-R pins */
#define TX_KEY_K3               GPIO0_PC7
#define TX_GPIO_ALARM_LIGHT     GPIO0_PA5

#define RGB_LED_R_PIN           GPIO0_PB5
#define RGB_LED_G_PIN           GPIO0_PB4
#define RGB_LED_B_PIN           GPIO0_PD0

#define MOTOR_PIN               GPIO1_PD0

#define SHT30_BH1750_I2C_PORT   0
#define SHT30_I2C_ADDR          0x44
#define BH1750_I2C_ADDR         0x23
#define I2C0_SCL_PIN            GPIO0_PA1
#define I2C0_SDA_PIN            GPIO0_PA0

#define MQ2_ADC_PORT            4
#define MQ2_ADC_PIN             GPIO0_PC4

#endif
