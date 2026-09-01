#ifndef LAB07_CABIN_STATION_BOARD_PINS_H
#define LAB07_CABIN_STATION_BOARD_PINS_H

#include "lz_hardware.h"

/* K3 active-low key */
#define TX_KEY_K3               GPIO0_PC7

/* User Alarm LED (PA5) */
#define TX_GPIO_ALARM_LIGHT     GPIO0_PA5

/* E53 Intelligent Agriculture & Smart Home Motor pins:
 * 1. E53_IA Motor Pin: GPIO1_PD0 (active high)
 * 2. PWM6 / Smart Home Motor Pin: GPIO0_PC6
 * 3. Auxiliary Fan/Light Pin: GPIO0_PA2
 */
#define MOTOR_PIN_PD0           GPIO1_PD0
#define MOTOR_PIN_PC6           GPIO0_PC6
#define MOTOR_PIN_PA2           GPIO0_PA2

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
