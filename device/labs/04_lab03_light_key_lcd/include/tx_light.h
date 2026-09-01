#ifndef LAB03_LIGHT_KEY_LCD_TX_LIGHT_H
#define LAB03_LIGHT_KEY_LCD_TX_LIGHT_H

#include <stdint.h>
#include "lz_hardware.h"

unsigned int tx_light_init(unsigned int light_gpio);
unsigned int tx_light_set(unsigned int light_gpio, int on);

#endif
