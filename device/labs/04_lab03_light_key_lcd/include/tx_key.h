#ifndef LAB03_LIGHT_KEY_LCD_TX_KEY_H
#define LAB03_LIGHT_KEY_LCD_TX_KEY_H

#include <stdint.h>
#include "lz_hardware.h"

unsigned int tx_key_init(void);
unsigned int tx_key_read_level(LzGpioValue *level);
unsigned int tx_key_is_pressed(uint32_t *pressed);
int tx_key_click(unsigned int key_gpio, int *was_pressed);

#endif
