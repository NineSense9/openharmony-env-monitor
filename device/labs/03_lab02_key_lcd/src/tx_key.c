#include <stddef.h>
#include <stdio.h>

#include "board_pins.h"
#include "tx_key.h"

unsigned int tx_key_init(void)
{
    unsigned int ret;

    ret = LzGpioInit(TX_KEY_K3);
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab02_key_lcd: K3 init failed ret=%u\r\n", ret);
        return ret;
    }

    ret = LzGpioSetDir(TX_KEY_K3, LZGPIO_DIR_IN);
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab02_key_lcd: K3 input failed ret=%u\r\n", ret);
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

    /* The board pull-up makes a low GPIO level mean K3 is pressed. */
    *pressed = (value == LZGPIO_LEVEL_LOW) ? 1U : 0U;
    return LZ_HARDWARE_SUCCESS;
}
