#ifndef LAB06_MULTITASK_LCD_BOARD_PINS_H
#define LAB06_MULTITASK_LCD_BOARD_PINS_H

#include "lz_hardware.h"

/* PDF 4.6, 4.9 & 4.10: K3 active-low key and SHT30 I2C0 pins */
#define TX_KEY_K3 GPIO0_PC7

#define SHT30_I2C_PORT  0
#define SHT30_I2C_ADDR  0x44
#define SHT30_SCL_PIN   GPIO0_PA1
#define SHT30_SDA_PIN   GPIO0_PA0

#endif
