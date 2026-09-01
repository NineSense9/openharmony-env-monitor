# lab06_multitask_lcd 集成说明

## 1. 目标位置
- `vendor/lockzhiner/rk2206/samples/lab06_multitask_lcd`

## 2. samples/BUILD.gn 修改
```gn
lite_component("samples") {
    features = [
        "./lab06_multitask_lcd:lab06_multitask_lcd",
    ]
}
```

## 3. sdk_liteos/Makefile 链接库修改
```makefile
hardware_LIBS = -lhal_iothardware -lhardware -llab06_multitask_lcd
```
