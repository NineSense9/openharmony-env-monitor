#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

#include "los_task.h"
#include "los_tick.h"
#include "lz_hardware.h"

#include "lwip/opt.h"
#include "lwip/ip_addr.h"
#include "lwip/sockets.h"
#include "lwip/inet.h"

#include "http_client.h"
#include "board_pins.h"

void HttpClient_Init(void)
{
}

static int create_connected_socket(void)
{
    int sfd = lwip_socket(AF_INET, SOCK_STREAM, 0);
    if (sfd < 0) {
        printf("[http] socket create failed\n");
        return -1;
    }

    struct timeval tv;
    tv.tv_sec = 4;
    tv.tv_usec = 0;
    lwip_setsockopt(sfd, SOL_SOCKET, SO_RCVTIMEO, (const char *)&tv, sizeof(tv));
    lwip_setsockopt(sfd, SOL_SOCKET, SO_SNDTIMEO, (const char *)&tv, sizeof(tv));

    struct sockaddr_in srv_addr;
    memset(&srv_addr, 0, sizeof(srv_addr));
    srv_addr.sin_family = AF_INET;
    srv_addr.sin_port = htons(CLOUD_SERVER_PORT);
    srv_addr.sin_addr.s_addr = inet_addr(CLOUD_SERVER_IP);

    if (lwip_connect(sfd, (struct sockaddr *)&srv_addr, sizeof(srv_addr)) < 0) {
        printf("[http] connect to %s:%d failed\n", CLOUD_SERVER_IP, CLOUD_SERVER_PORT);
        lwip_close(sfd);
        return -1;
    }

    return sfd;
}

// 循环读取完整的 HTTP 响应，避免 TCP 分包导致 JSON body 丢失
static int recv_full_http_response(int sfd, char *buf, int max_len)
{
    int total = 0;
    while (total < max_len - 1) {
        int n = lwip_recv(sfd, buf + total, max_len - 1 - total, 0);
        if (n <= 0) {
            break;
        }
        total += n;
        // 如果已经收到了完整的 JSON 结尾 '}' 并且在 headers 之后，可提前结束
        if (strstr(buf, "\r\n\r\n") != NULL && strchr(buf, '}') != NULL) {
            break;
        }
    }
    buf[total] = '\0';
    return total;
}

int HttpClient_PostTelemetry(const TelemetryData *data)
{
    if (!data) return -1;

    int sfd = create_connected_socket();
    if (sfd < 0) return -1;

    char body[192];
    snprintf(body, sizeof(body),
             "{\"device_id\":\"%s\",\"temperature\":%.1f,\"humidity\":%.1f,\"lux\":%.1f,\"gas_ppm\":%.1f}",
             data->device_id, data->temperature, data->humidity, data->lux, data->gas_ppm);

    char req[384];
    snprintf(req, sizeof(req),
             "POST /api/telemetry HTTP/1.1\r\n"
             "Host: %s:%d\r\n"
             "Content-Type: application/json\r\n"
             "Content-Length: %d\r\n"
             "Connection: close\r\n\r\n"
             "%s",
             CLOUD_SERVER_IP, CLOUD_SERVER_PORT, (int)strlen(body), body);

    int sent = lwip_send(sfd, req, strlen(req), 0);
    if (sent <= 0) {
        printf("[http] send telemetry failed\n");
        lwip_close(sfd);
        return -1;
    }

    char resp[256];
    int recvd = recv_full_http_response(sfd, resp, sizeof(resp));
    lwip_close(sfd);

    if (recvd > 0 && (strstr(resp, "200 OK") != NULL || strstr(resp, "HTTP/1.1 200") != NULL)) {
        return 0; // Success
    }

    return -1;
}

int HttpClient_GetPendingCommand(RemoteCommand *cmd)
{
    if (!cmd) return -1;

    int sfd = create_connected_socket();
    if (sfd < 0) return -1;

    char req[256];
    snprintf(req, sizeof(req),
             "GET /api/command/pending?device_id=%s HTTP/1.1\r\n"
             "Host: %s:%d\r\n"
             "Connection: close\r\n\r\n",
             CLOUD_DEVICE_ID, CLOUD_SERVER_IP, CLOUD_SERVER_PORT);

    lwip_send(sfd, req, strlen(req), 0);

    char resp[1024];
    int recvd = recv_full_http_response(sfd, resp, sizeof(resp));
    lwip_close(sfd);

    if (recvd <= 0) return -1;

    // 如果返回 null，说明当前没有待执行指令
    if (strstr(resp, "null") != NULL) {
        return 0;
    }

    // 寻找 JSON 正文起始位置
    char *json_body = strchr(resp, '{');
    if (!json_body) {
        return 0;
    }

    printf("[http] pending command raw: %s\n", json_body);

    // 解析 id、target、action
    char *id_ptr = strstr(json_body, "\"id\":");
    char *target_ptr = strstr(json_body, "\"target\":\"");
    char *action_ptr = strstr(json_body, "\"action\":\"");

    if (id_ptr && target_ptr && action_ptr) {
        cmd->command_id = atoi(id_ptr + 5);

        char *t_start = target_ptr + 10;
        char *t_end = strchr(t_start, '"');
        if (t_end) {
            int len = t_end - t_start;
            if (len > 15) len = 15;
            strncpy(cmd->target, t_start, len);
            cmd->target[len] = '\0';
        }

        char *a_start = action_ptr + 10;
        char *a_end = strchr(a_start, '"');
        if (a_end) {
            int len = a_end - a_start;
            if (len > 15) len = 15;
            strncpy(cmd->action, a_start, len);
            cmd->action[len] = '\0';
        }

        printf("[http] parsed command id=%d, target=%s, action=%s\n",
               cmd->command_id, cmd->target, cmd->action);
        return 1;
    }

    return 0;
}

int HttpClient_AckCommand(int command_id, const char *status, const char *note)
{
    int sfd = create_connected_socket();
    if (sfd < 0) return -1;

    char body[128];
    snprintf(body, sizeof(body),
             "{\"status\":\"%s\",\"note\":\"%s\"}",
             status ? status : "done", note ? note : "ok");

    char req[384];
    snprintf(req, sizeof(req),
             "POST /api/command/%d/ack HTTP/1.1\r\n"
             "Host: %s:%d\r\n"
             "Content-Type: application/json\r\n"
             "Content-Length: %d\r\n"
             "Connection: close\r\n\r\n"
             "%s",
             command_id, CLOUD_SERVER_IP, CLOUD_SERVER_PORT, (int)strlen(body), body);

    lwip_send(sfd, req, strlen(req), 0);

    char resp[256];
    int recvd = recv_full_http_response(sfd, resp, sizeof(resp));
    lwip_close(sfd);

    printf("[http] ack command id=%d response len=%d\n", command_id, recvd);
    return (recvd > 0) ? 0 : -1;
}
