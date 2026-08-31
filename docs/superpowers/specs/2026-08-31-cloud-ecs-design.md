# 云端环境监测服务设计

## 1. 背景与目标

为太空空间站内部环境监测项目补齐云端服务。服务部署在独立的百度云 BCC 实例上，负责接收 RK2206 或模拟脚本上报的四路环境遥测，为 HarmonyOS APP 提供最新数据、历史数据和告警，并接收 APP 下发的执行器命令。

本次范围仅包含云端 API、SQLite 数据库、运行环境和 systemd 部署，不改动服务器上已有的 Nginx、PostgreSQL、Redis、其他应用或代理配置。

## 2. 依据与兼容约束

- 以 `doc/授课文档.pdf` 为当前课程实现依据。
- 传感器数据固定为温度、湿度、光照、气体四路，分别对应 SHT30、BH1750、MQ2 等板载实验资源。
- 云端技术栈为 Python 3.10、FastAPI、SQLAlchemy、SQLite。
- 课程阶段不做 API 鉴权；服务仍应避免记录密码、密钥等敏感信息。
- 公共 API 端口使用 `8000`，设备号由请求字段传入并由 APP/板端保持一致。

## 3. 架构

```text
RK2206 / mock uploader
        |
        | HTTP JSON
        v
FastAPI + Uvicorn :8000
        |
        v
SQLAlchemy
        |
        v
SQLite station.db
```

服务器部署约束：

- 服务目录：`/opt/openharmony-env-monitor/cloud_ecs`
- 运行用户：`envmonitor`
- Python 虚拟环境：服务目录下的 `.venv`
- 数据库文件：服务目录下的 `data/station.db`
- systemd 单元：`openharmony-env-monitor.service`
- Uvicorn 使用单进程，降低 2 vCPU / 2 GiB 实例的常驻开销。

## 4. 数据模型

### telemetry

保存一条环境采样：

- `id`: 自增主键
- `device_id`: 设备编号
- `temperature`: 摄氏温度，可为空
- `humidity`: 相对湿度，可为空
- `lux`: 光照 Lux，可为空
- `gas_ppm`: 气体 ppm，可为空
- `created_at`: 服务端写入时间

### alerts

写入遥测时按固定课程阈值自动生成告警：

- 温度大于 `35`
- 湿度大于 `80`
- 光照小于 `50`
- 气体浓度大于 `100`

告警记录不因远程消警而删除。

### commands

保存 APP 下发及板端回执：

- `id`
- `device_id`
- `target`: `led`、`motor`、`alarm`
- `action`: `on`、`off`、`ack`
- `value`: 可选字符串
- `status`: `pending`、`done`、`failed`
- `created_at`
- `finished_at`
- `note`

## 5. API 契约

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/health` | 检查服务与数据库是否可用 |
| POST | `/api/telemetry` | 南向或 mock 上报四路遥测 |
| GET | `/api/telemetry/latest` | 获取最新一条遥测，可按 `device_id` 过滤 |
| GET | `/api/telemetry/history` | 获取历史遥测，可按设备和时间区间过滤 |
| GET | `/api/alerts` | 获取告警记录，可按设备和时间区间过滤 |
| POST | `/api/command` | APP 下发灯、电机或远程消警命令 |
| GET | `/api/command/pending` | 板端获取一条待执行命令 |
| POST | `/api/command/{id}/ack` | 板端上报命令执行结果 |
| GET | `/api/commands` | APP 查看操作日志，可按设备和时间区间过滤 |

接口实现要求：

- 请求字段使用 Pydantic 校验。
- 时间区间参数采用 ISO 8601 字符串。
- 列表接口提供稳定的时间/ID 排序和 `limit` 上限。
- 数据库异常返回明确的 HTTP 错误，不泄漏堆栈。
- `/health` 必须实际执行一次数据库检查，不能只返回静态字符串。

## 6. 测试与验收

本地测试覆盖：

1. 数据库建表和健康检查。
2. 遥测上报、最新数据和历史查询。
3. 四类阈值告警生成。
4. 命令创建、待执行获取、成功/失败回执和操作日志。
5. 设备过滤、时间区间和空数据结果。

部署验收覆盖：

1. systemd 服务启动并保持 active。
2. `127.0.0.1:8000/health` 返回数据库正常。
3. 公网 `:8000/health` 和 `/docs` 可访问。
4. 上传一条测试遥测后，SQLite 中出现遥测和预期告警。
5. 创建命令后可被 pending 接口获取并通过 ack 更新。

不在本次范围内：

- API 鉴权、HTTPS 和生产级多进程扩展。
- 修改百度云安全组控制台配置。
- 伪造实际传感器采集结果作为正式数据。
- 修改服务器既有业务。

## 7. 协同交付规则

- 云端源代码进入仓库 `cloud_ecs/`，部署文件进入 `deploy/` 或 `cloud_ecs/deploy/`。
- 每次完成一组可验证的改动后提交并推送。
- commit 信息说明模块、行为和验证结果。
- 部署产生的数据库、虚拟环境、日志和服务器密码不得提交到 Git。
