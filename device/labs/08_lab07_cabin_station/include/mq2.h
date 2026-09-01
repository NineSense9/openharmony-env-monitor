#ifndef LAB04_MQ2_KEY_LCD_MQ2_H
#define LAB04_MQ2_KEY_LCD_MQ2_H

#include <stdint.h>
#include "lz_hardware.h"

unsigned int mq2_dev_init(void);
float mq2_get_voltage(void);
void mq2_ppm_calibration(void);
float get_mq2_ppm(void);

#endif
