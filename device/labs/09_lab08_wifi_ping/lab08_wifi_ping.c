#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>

#include "ohos_init.h"
#include "los_task.h"
#include "lz_hardware.h"
#include "config_network.h"

#include "lwip/sockets.h"
#include "lwip/inet.h"

#include "board_pins.h"
#include "lcd.h"
#include "ping.h"

#define LOG_TAG          "lab08_wifi"
#define LAB08_STACK_SIZE 0x4000
#define LAB08_PRIORITY   24

#define TITLE_ROW_Y      40
#define WIFI_ROW_Y       80
#define WIFI_CLEAR_TOP   72
#define WIFI_CLEAR_BOT   105
#define PING_ROW_Y       120
#define PING_CLEAR_TOP   112
#define PING_CLEAR_BOT   145
#define SUMM_ROW_Y       160
#define SUMM_CLEAR_TOP   152
#define SUMM_CLEAR_BOT   185

static void lab08_draw_initial_screen(void)
{
    lcd_fill(0, 0, LCD_W, LCD_H, LCD_WHITE);
    lcd_show_string(10, TITLE_ROW_Y, "Lab08 WiFi+Ping", LCD_BLUE, LCD_WHITE, 16, 0);
    lcd_show_string(10, WIFI_ROW_Y, "WiFi: connecting...", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, PING_ROW_Y, "Ping: waiting...", LCD_BLACK, LCD_WHITE, 16, 0);
    lcd_show_string(10, SUMM_ROW_Y, "Summary: waiting...", LCD_BLACK, LCD_WHITE, 16, 0);
}

static void *lab08_main_task(void *arg)
{
    WifiLinkedInfo info;
    char buf[64];
    bool wifi_ok = false;
    int succ_cnt = 0;
    int rtt = 0;
    int seq;
    int wait_sec = 0;
    unsigned int ret;

    (void)arg;

    printf("lab08_wifi_ping: process start\n");

    ret = lcd_init();
    if (ret != LZ_HARDWARE_SUCCESS) {
        printf("lab08_wifi_ping: lcd_init failed ret=%u\n", ret);
        return NULL;
    }

    lab08_draw_initial_screen();

    /* 1. 等待 Wi-Fi 联网获取 IP (最多轮询 30 秒) */
    while (wait_sec < 30) {
        memset(&info, 0, sizeof(info));
        if (GetLinkedInfo(&info) == WIFI_SUCCESS) {
            if (info.connState == WIFI_CONNECTED && info.ipAddress != 0) {
                wifi_ok = true;
                break;
            }
        }
        wait_sec++;
        LOS_Msleep(1000);
    }

    if (!wifi_ok) {
        printf("[wifi] connect timeout\n");
        lcd_fill(10, WIFI_CLEAR_TOP, 300, WIFI_CLEAR_BOT, LCD_WHITE);
        lcd_show_string(10, WIFI_ROW_Y, "WiFi: timeout", LCD_RED, LCD_WHITE, 16, 0);
    } else {
        uint8_t *ip = (uint8_t *)&info.ipAddress;
        snprintf(buf, sizeof(buf), "WiFi: %u.%u.%u.%u", ip[0], ip[1], ip[2], ip[3]);
        printf("[wifi] connected, IP=%u.%u.%u.%u\n", ip[0], ip[1], ip[2], ip[3]);

        lcd_fill(10, WIFI_CLEAR_TOP, 300, WIFI_CLEAR_BOT, LCD_WHITE);
        lcd_show_string(10, WIFI_ROW_Y, buf, LCD_GREEN, LCD_WHITE, 16, 0);
    }

    /* 2. 执行 4 次 ICMP Ping */
    LOS_Msleep(1500);
    for (seq = 1; seq <= PING_COUNT; seq++) {
        int ok = ping_single_packet(DEFAULT_PING_TARGET_IP, seq, 2000, &rtt);
        if (ok) {
            succ_cnt++;
            printf("[ping] reply from %s seq=%d\n", DEFAULT_PING_TARGET_IP, seq);
            snprintf(buf, sizeof(buf), "Ping: OK seq=%d", seq);
            lcd_fill(10, PING_CLEAR_TOP, 300, PING_CLEAR_BOT, LCD_WHITE);
            lcd_show_string(10, PING_ROW_Y, buf, LCD_GREEN, LCD_WHITE, 16, 0);
        } else {
            printf("[ping] timeout seq=%d\n", seq);
            snprintf(buf, sizeof(buf), "Ping: timeout seq=%d", seq);
            lcd_fill(10, PING_CLEAR_TOP, 300, PING_CLEAR_BOT, LCD_WHITE);
            lcd_show_string(10, PING_ROW_Y, buf, LCD_RED, LCD_WHITE, 16, 0);
        }
        LOS_Msleep(1000);
    }

    /* 3. 统计汇总 */
    snprintf(buf, sizeof(buf), "Summary: %d/%d OK", succ_cnt, PING_COUNT);
    lcd_fill(10, SUMM_CLEAR_TOP, 300, SUMM_CLEAR_BOT, LCD_WHITE);
    if (succ_cnt > 0) {
        lcd_show_string(10, SUMM_ROW_Y, buf, LCD_GREEN, LCD_WHITE, 16, 0);
        printf("===== lab08_wifi_ping OK =====\n");
    } else {
        lcd_show_string(10, SUMM_ROW_Y, "Summary: FAIL", LCD_RED, LCD_WHITE, 16, 0);
        printf("===== lab08_wifi_ping FAIL =====\n");
    }

    return NULL;
}

static void lab08_wifi_ping_example(void)
{
    unsigned int task_id;
    TSK_INIT_PARAM_S param = {0};
    unsigned int ret;

    param.pfnTaskEntry = (TSK_ENTRY_FUNC)lab08_main_task;
    param.uwStackSize = LAB08_STACK_SIZE;
    param.pcName = "lab08_wifi_ping";
    param.usTaskPrio = LAB08_PRIORITY;

    ret = LOS_TaskCreate(&task_id, &param);
    if (ret != LOS_OK) {
        printf("lab08_wifi_ping: create task failed ret=0x%x\n", ret);
        return;
    }
    printf("lab08_wifi_ping: create task success tid=%u\n", task_id);
}

APP_FEATURE_INIT(lab08_wifi_ping_example);
