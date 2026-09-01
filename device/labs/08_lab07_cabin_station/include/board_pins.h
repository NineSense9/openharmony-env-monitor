#ifndef LAB07_CABIN_STATION_BOARD_PINS_H
#define LAB07_CABIN_STATION_BOARD_PINS_H

#include "lz_hardware.h"

/* K3 active-low key */
#define TX_KEY_K3               GPIO0_PC7

/* User Alarm LED (PA5) */
#define TX_GPIO_ALARM_LIGHT     GPIO0_PA5

/* E53 Intelligent Agriculture Motor pin on RK2206: GPIO0_PD0 */
#define MOTOR_PIN               GPIO0_PD0

/* SHT30 & BH1750 I2C0 */
#define SHT30_BH1750_I2C_PORT   0
#define SHT30_I2C_ADDR          0x44
#define BH1750_I2C_ADDR         0x23
#define I2C0_SCL_PIN            GPIO0_PA1
#define I2C0_SDA_PIN            GPIO0_PA0

/* MQ2 ADC CH4 (GPIO0_PC4) */
#define MQ2_ADC_PORT            4
#define MQ2_ADC_PIN             GPIO0_PC4

#endif
