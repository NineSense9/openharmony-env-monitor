# lab07_cabin_station 集成说明

## 1. 目标位置
- `vendor/lockzhiner/rk2206/samples/lab07_cabin_station`

## 2. samples/BUILD.gn 修改
```gn
lite_component("samples") {
    features = [
        "./lab07_cabin_station:lab07_cabin_station",
    ]
}
```

## 3. sdk_liteos/Makefile 链接库修改
```makefile
hardware_LIBS = -lhal_iothardware -lhardware -llab07_cabin_station
```
