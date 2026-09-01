#include <stddef.h>
#include <stdio.h>

#include "board_pins.h"
#include "tx_light.h"

unsigned int tx_light_init(unsigned int light_gpio)
{
    unsigned int ret;
    unsigned int pinctrl_ret;

    ret = LzGpioInit(light_gpio);
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab03_light_key_lcd: light gpio %u init failed ret=%u\r\n", light_gpio, ret);
        return ret;
    }

    pinctrl_ret = PinctrlSet(light_gpio, MUX_FUNC0, PULL_KEEP, DRIVE_LEVEL0);
    if (pinctrl_ret != LZ_HARDWARE_SUCCESS) {
        printf("lab03_light_key_lcd: light gpio %u pinctrl warn ret=%u\r\n", light_gpio, pinctrl_ret);
    }

    ret = LzGpioSetDir(light_gpio, LZGPIO_DIR_OUT);
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab03_light_key_lcd: light gpio %u set dir out failed ret=%u\r\n", light_gpio, ret);
        return ret;
    }

    /* Default OFF (low level) */
    LzGpioSetVal(light_gpio, LZGPIO_LEVEL_LOW);
    return LZ_HARDWARE_SUCCESS;
}

unsigned int tx_light_set(unsigned int light_gpio, int on)
{
    LzGpioValue val = on ? LZGPIO_LEVEL_HIGH : LZGPIO_LEVEL_LOW;
    return LzGpioSetVal(light_gpio, val);
}
