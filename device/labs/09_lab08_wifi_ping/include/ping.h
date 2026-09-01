#ifndef LAB08_WIFI_PING_PING_H
#define LAB08_WIFI_PING_PING_H

#include <stdint.h>
#include <stdbool.h>

int ping_single_packet(const char *target_ip, int seq, int timeout_ms, int *rtt_ms);

#endif
