# HealthAutoUploader

一个原生 iOS SwiftUI App，用来直接读取 Apple Health / HealthKit 数据，并自动上传到 Supabase，目标效果接近 **Health Auto Export**，但数据链路更直接：

**Apple Watch / iPhone → HealthKit → 本 App → Supabase `health_imports`**

## 这版已经实现了什么

- 读取以下健康数据：
  - 睡眠（`sleepAnalysis`）
  - 心率（`heartRate`）
  - 静息心率（`restingHeartRate`）
  - HRV（`heartRateVariabilitySDNN`）
  - 步数（`stepCount`）
  - 活动能量（`activeEnergyBurned`）
  - 运动记录（`workout`）
- 支持首次授权后手动同步
- 支持应用启动时自动同步一次
- 支持 `HKObserverQuery + enableBackgroundDelivery` 监听健康数据更新
- 支持 `BGTaskScheduler` 作为后台补偿调度
- 自动把当天的原始样本 + 汇总信息打包成 JSON 上传到 Supabase 表 `health_imports`

## 目录结构

```text
HealthAutoUploader/
├── project.yml                     # 用 XcodeGen 生成 Xcode 工程
├── HealthAutoUploader/
│   ├── App/
│   ├── Config/
│   ├── Models/
│   ├── Services/
│   ├── ViewModels/
│   ├── Views/
│   └── Resources/
└── README.md
```

## 为什么没有直接给 `.xcodeproj`

当前环境无法运行 Xcode，所以我用 **XcodeGen** 提供了 `project.yml`。你在 Mac 上执行一次即可生成工程：

```bash
brew install xcodegen
cd HealthAutoUploader
xcodegen generate
open HealthAutoUploader.xcodeproj
```

## Supabase 配置

这版已经改成 **App 内填写 + 本机保存**：

- 首次打开后，在 App 的“Supabase 设置”中填写：
  - Supabase URL
  - Supabase Anon Key
  - 目标表名（默认 `health_imports`）
- 点击“保存本机配置”后，敏感信息会保存到 **iPhone 本地 Keychain**。
- 代码仓库里**不再硬编码任何真实 key**，后续可以放心同步到 GitHub。

相关代码位置：

- `HealthAutoUploader/HealthAutoUploader/Services/AppSettingsStore.swift`
- `HealthAutoUploader/HealthAutoUploader/Services/KeychainService.swift`
- `HealthAutoUploader/HealthAutoUploader/Views/ContentView.swift`

如果后面要切环境，直接在 App 设置页修改并重新保存即可。

## Supabase 表结构建议

如果你的表还没建，可以参考：

```sql
create table if not exists public.health_imports (
  id bigserial primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
```

如果你开启了 RLS，还需要允许插入策略。开发阶段最简单的做法是先确认 `anon` key 具备插入权限。

## Xcode 中需要检查的能力开关

生成工程后，请在 Xcode 里确认下面几项：

1. **Signing & Capabilities**
   - HealthKit
   - Background Modes
     - Background fetch
     - Background processing
2. **Entitlements**
   - 已提供 `HealthAutoUploader.entitlements`
3. **Info.plist**
   - 已写入 `BGTaskSchedulerPermittedIdentifiers`
   - 已写入 HealthKit 权限描述

## App 的工作方式

### 1) 首次使用

- 安装 App
- 打开 App
- 点击“申请 HealthKit 权限”
- 点击“立即同步一次”验证链路

### 2) 自动同步

- App 启动时会尝试同步一次
- App 会注册 HealthKit observer query
- 当睡眠 / 心率 / HRV / 步数 / workout 等数据变化时，系统会尝试唤醒 App
- App 收到回调后会执行上传，并额外安排后台任务补偿

## 重要限制

iOS 后台执行是 **best effort**，不是 crontab。

也就是说，这个项目已经按照 Apple 推荐方式同时接入：

- `HKObserverQuery`
- `enableBackgroundDelivery`
- `BGAppRefreshTask`
- `BGProcessingTask`

但仍然**不能保证绝对每分钟/每小时准点**。这是系统策略决定的，不是代码问题。Apple 官方文档也说明了：`enableBackgroundDelivery(for:frequency:withCompletion:)` 用于让应用在后台接收 HealthKit 更新通知；observer query 默认主要在前台返回，开启后台投递后才有后台机会::cite[4584]。HealthKit 后台更新还需要 `com.apple.developer.healthkit.background-delivery` entitlement::cite[4586]。另外，`BGTaskScheduler` 用于安排后台刷新或后台处理任务，适合作为 HealthKit 回调之外的补偿调度::cite[4572]。

## 上传 JSON 结构

每次会向 `health_imports` 插入一条记录：

```json
{
  "data": {
    "generatedAt": "2026-06-10T12:34:56Z",
    "dateKey": "2026-06-10",
    "summary": {
      "totalSteps": 12345,
      "totalActiveEnergyKCal": 456.7,
      "totalSleepHours": 6.8,
      "workoutMinutes": 72,
      "workoutCount": 2,
      "latestRestingHeartRateBpm": 56,
      "latestHRVMilliseconds": 48.2
    },
    "sleepSessions": [],
    "heartRateSamples": [],
    "restingHeartRateSamples": [],
    "hrvSamples": [],
    "stepCountSamples": [],
    "activeEnergySamples": [],
    "workouts": []
  }
}
```

## 我建议你下一步怎么做

### 方案 A：先跑通

如果你想尽快验证：

1. 在 Mac 上生成 Xcode 工程
2. 选真机运行（HealthKit 不建议只用模拟器验证）
3. 完成授权
4. 手动同步一次
5. 去 Supabase 看 `health_imports` 是否有新行

### 方案 B：我建议的下一轮增强

如果你要把这个 App 做成长期稳定使用版本，下一步建议继续补：

- Anchored Query 增量同步（避免每次都上传当天全量样本）
- 本地失败重试队列
- 电量 / 网络条件感知
- 更完整字段：血氧、呼吸频率、体温、VO2 Max、静息能量、站立小时
- 按天/按小时聚合结构
- Supabase 签名认证或服务端代理，减少 key 暴露
- 上传去重键（例如 `dateKey + exportBatchId`）

## 关联文件

核心文件：

- `HealthAutoUploader/project.yml`
- `HealthAutoUploader/HealthAutoUploader/App/HealthAutoUploaderApp.swift`
- `HealthAutoUploader/HealthAutoUploader/App/AppDelegate.swift`
- `HealthAutoUploader/HealthAutoUploader/App/AppContainer.swift`
- `HealthAutoUploader/HealthAutoUploader/Services/HealthKitService.swift`
- `HealthAutoUploader/HealthAutoUploader/Services/SyncEngine.swift`
- `HealthAutoUploader/HealthAutoUploader/Services/UploadService.swift`
- `HealthAutoUploader/HealthAutoUploader/Views/ContentView.swift`

如果你愿意，我下一步可以继续帮你把它补成 **可增量同步 + 可去重 + 更稳后台策略** 的版本。
