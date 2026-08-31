#ifndef LAB02_KEY_LCD_TX_KEY_H
#define LAB02_KEY_LCD_TX_KEY_H

#include <stdint.h>

unsigned int tx_key_init(void);
unsigned int tx_key_is_pressed(uint32_t *pressed);

#endif
