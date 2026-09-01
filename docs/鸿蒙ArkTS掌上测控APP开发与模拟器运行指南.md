# 📱 OpenHarmony ArkTS 太空空间站掌上测控终端 APP 运行指南

本文档指导如何在 **DevEco Studio** 中打开、实时预览（Previewer）及在鸿蒙模拟器中运行 **太空空间站掌上测控终端（ArkTS 原生 APP）**。

---

## 🌟 1. 项目核心特性

1. **标准 OpenHarmony Stage 模型**：
   - 兼容 OpenHarmony / HarmonyOS API 9 / 10 / 11 / 12，标准 `EntryAbility` 架构；
2. **沉浸式航天 Mission Control 视觉**：
   - 深空暗夜渐变黑底（`#0A0E1A`）、2x2 拟态毛玻璃环境数据卡片、航天青呼吸指示灯；
3. **极速端云低延迟通信（< 500ms）**：
   - 300ms 极速遥测轮询，支持失锁快照 `[CACHED]` 容错；
   - 200ms 远程控制下发与 ACK 确认闭环（端到端响应延迟 ~240ms）；
4. **原生 Canvas 多维时序走势图**：
   - 零第三方重型依赖，高性能 60fps 平滑曲线渲染；
5. **6 位安全 PIN 码（123456）授权弹窗**：
   - 杜绝误触，执行电机启停与消警前强制暗文验证。

---

## 🚀 2. DevEco Studio 打开与实时预览步骤

### 步骤 1：打开工程
1. 启动桌面上或安装目录下的 **DevEco Studio**（`D:\DevEco Studio\bin\devecostudio64.exe`）；
2. 点击顶部菜单栏 **【File】 $\rightarrow$ 【Open...】**（或启动页面的 **Open**）；
3. 浏览并选中本项目 APP 目录：
   ```text
   D:\实习\workspace\app
   ```
4. 点击 **OK**，DevEco Studio 将自动完成项目索引与依赖解析。

---

### 步骤 2：使用 ArkUI 实时预览器（Previewer 边看边调）
1. 在左侧工程树中依次展开：
   ```text
   entry -> src -> main -> ets -> pages -> Index.ets
   ```
2. 双击打开 `Index.ets`；
3. 点击编辑器右侧侧边栏的 **【Previewer】**（预览器标签页）；
4. 页面将立即秒级渲染出标准的 **HarmonyOS 手机竖屏航天测控界面**！
   - 您可以直接在预览器中查看温度、湿度、光照、烟雾卡片；
   - 点击“启动电机” $ightarrow$ 弹出 6 位安全 PIN 码验证弹窗输入 `123456` 测试交互！

---

### 步骤 3：在鸿蒙模拟器（Emulator）中完整运行

1. 点击顶部菜单栏 **【Tools】 $\rightarrow$ 【Device Manager】**；
2. 在 **Local Emulator** 标签页中，若已有 Phone 模拟器，直接点击启动；若无，点击 **New Emulator** 选择 **Phone**（如 Mate 60 / Pura 70 规格）并一键创建启动；
3. 模拟器启动后，在 DevEco Studio 右上角设备下拉框中选择该模拟器；
4. 点击右上角的 **绿色运行三角形按钮 ▶️（Run 'entry'）** 或快捷键 `Shift + F10`；
5. 系统将自动调用 `hvigor` 编译生成 `.hap` 安装包并自动安装到模拟器中启动！

---

## 🎯 3. 四端联动实测与答辩演示流程

1. **上电开发板**：RK2206 开发板连上 Wi-Fi 热点 `Patient.`，LCD 屏幕显示 `IP: 192.168.9.51` 和 `网络正常`；
2. **打开 Web 大屏**：在浏览器打开百度云线上大屏：`http://180.76.137.117:8000/dashboard/`；
3. **打开 DevEco Studio 模拟器 APP**：
   - 模拟器顶部立即亮起绿色 `[LIVE LINK]`；
   - 四路环境数据与桌上开发板 LCD 屏幕、Web 大屏 100% 同步跳动；
4. **演示远程控制闭环**：
   - 在模拟器 APP 上点击 **【启动电机】** $ightarrow$ 输入 PIN 码 `123456` 点击确认；
   - 桌上真实的 RK2206 开发板电机在 **~240ms** 内瞬间旋转；
   - Web 大屏上的核心舱风机动画与空气粒子瞬间加速旋转；
   - 模拟器 APP 状态立即切换为 `高速运转 (6000RPM)`（青色高亮）；
5. **演示应急消警静音**：
   - 在模拟器 APP 上点击 **【一键消警静音】** $ightarrow$ 输入 PIN 码确认；
   - 开发板声光告警与电机立即静音停转，Web 大屏风机平滑停止。
