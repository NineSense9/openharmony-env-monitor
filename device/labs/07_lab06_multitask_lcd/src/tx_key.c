#include <stddef.h>
#include <stdio.h>

#include "board_pins.h"
#include "tx_key.h"

unsigned int tx_key_init(void)
{
    unsigned int ret;
    unsigned int pinctrl_ret;

    ret = LzGpioInit(TX_KEY_K3);
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab03_light_key_lcd: K3 init failed ret=%u\r\n", ret);
        return ret;
    }

    pinctrl_ret = PinctrlSet(TX_KEY_K3, MUX_FUNC0, PULL_KEEP, DRIVE_LEVEL0);
    if (pinctrl_ret != LZ_HARDWARE_SUCCESS) {
        printf("lab03_light_key_lcd: K3 pinctrl warn ret=%u\r\n", pinctrl_ret);
    }

    ret = LzGpioSetDir(TX_KEY_K3, LZGPIO_DIR_IN);
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab03_light_key_lcd: K3 input failed ret=%u\r\n", ret);
        return ret;
    }

    return LZ_HARDWARE_SUCCESS;
}

unsigned int tx_key_read_level(LzGpioValue *level)
{
    if (level == NULL) {
        return LZ_HARDWARE_FAILURE;
    }

    return LzGpioGetVal(TX_KEY_K3, level);
}

unsigned int tx_key_is_pressed(uint32_t *pressed)
{
    LzGpioValue value = LZGPIO_LEVEL_HIGH;
    unsigned int ret;

    if (pressed == NULL) {
        return LZ_HARDWARE_FAILURE;
    }

    ret = tx_key_read_level(&value);
    if (ret != LZ_HARDWARE_SUCCESS) {
        return ret;
    }

    *pressed = (value == LZGPIO_LEVEL_LOW) ? 1U : 0U;
    return LZ_HARDWARE_SUCCESS;
}

int tx_key_click(unsigned int key_gpio, int *was_pressed)
{
    LzGpioValue val = LZGPIO_LEVEL_HIGH;
    int now_pressed = 0;
    int clicked = 0;

    if (was_pressed == NULL) {
        return 0;
    }

    if (LzGpioGetVal(key_gpio, &val) != LZ_HARDWARE_SUCCESS) {
        return 0;
    }

    now_pressed = (val == LZGPIO_LEVEL_LOW) ? 1 : 0;
    if (now_pressed && !(*was_pressed)) {
        clicked = 1;
    }
    *was_pressed = now_pressed;
    return clicked;
}
