#ifndef LAB05_SHT30_KEY_LCD_SHT30_H
#define LAB05_SHT30_KEY_LCD_SHT30_H

#include <stdint.h>
#include "lz_hardware.h"

unsigned int sht30_init(void);
unsigned int sht30_read_data(double dat[2]);

#endif
