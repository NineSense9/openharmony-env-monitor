#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>

#include "los_task.h"
#include "los_tick.h"
#include "lz_hardware.h"

#include "lwip/opt.h"
#include "lwip/ip_addr.h"
#include "lwip/icmp.h"
#include "lwip/inet_chksum.h"
#include "lwip/sockets.h"
#include "lwip/inet.h"

#include "ping.h"

#ifndef IPPROTO_ICMP
#define IPPROTO_ICMP 1
#endif

#define PING_DATA_SIZE 32

int ping_single_packet(const char *target_ip, int seq, int timeout_ms, int *rtt_ms)
{
    int sfd;
    struct sockaddr_in to;
    struct icmp_echo_hdr *iecho;
    uint8_t packet[sizeof(struct icmp_echo_hdr) + PING_DATA_SIZE];
    uint8_t recv_buf[128];
    struct timeval tv;
    uint32_t start_tick, end_tick;
    int ret;

    memset(&to, 0, sizeof(to));
    to.sin_family = AF_INET;
    to.sin_addr.s_addr = inet_addr(target_ip);

    sfd = lwip_socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);
    if (sfd < 0) {
        printf("ping: create raw socket failed (sfd=%d)\n", sfd);
        return 0;
    }

    tv.tv_sec = timeout_ms / 1000;
    tv.tv_usec = (timeout_ms % 1000) * 1000;
    lwip_setsockopt(sfd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));

    iecho = (struct icmp_echo_hdr *)packet;
    ICMPH_TYPE_SET(iecho, ICMP_ECHO);
    ICMPH_CODE_SET(iecho, 0);
    iecho->chksum = 0;
    iecho->id = htons(0x2206);
    iecho->seqno = htons((uint16_t)seq);

    memset(packet + sizeof(struct icmp_echo_hdr), 'A' + (seq % 26), PING_DATA_SIZE);
    iecho->chksum = inet_chksum(packet, sizeof(packet));

    start_tick = LOS_TickCountGet();

    ret = lwip_sendto(sfd, packet, sizeof(packet), 0, (struct sockaddr *)&to, (socklen_t)sizeof(to));
    if (ret < 0) {
        printf("ping: lwip_sendto failed ret=%d\n", ret);
        lwip_close(sfd);
        return 0;
    }

    ret = lwip_recv(sfd, recv_buf, sizeof(recv_buf), 0);
    end_tick = LOS_TickCountGet();

    lwip_close(sfd);

    if (ret > 0) {
        if (rtt_ms) {
            *rtt_ms = (int)((end_tick - start_tick) * (1000 / LOSCFG_BASE_CORE_TICK_PER_SECOND));
        }
        return 1;
    }

    return 0;
}
