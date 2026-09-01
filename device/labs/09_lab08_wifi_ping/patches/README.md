# lab08_wifi_ping 集成说明

## 1. 目标位置
- `vendor/lockzhiner/rk2206/samples/lab08_wifi_ping`

## 2. samples/BUILD.gn 修改
```gn
lite_component("samples") {
    features = [
        "./lab08_wifi_ping:lab08_wifi_ping",
    ]
}
```

## 3. sdk_liteos/Makefile 链接库修改
```makefile
hardware_LIBS = -lhal_iothardware -lhardware -llab08_wifi_ping
```
