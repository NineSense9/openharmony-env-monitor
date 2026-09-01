#ifndef LAB07_CABIN_STATION_SMART_HOME_H
#define LAB07_CABIN_STATION_SMART_HOME_H

#include <stdint.h>
#include "lz_hardware.h"

unsigned int smart_home_init(void);
unsigned int sht30_read_temp_humi(double *temp, double *humi);
float bh1750_read_lux(void);
void rgb_led_set_white(int on);
void motor_set_state(int on);
void outputs_all_off(void);

#endif
