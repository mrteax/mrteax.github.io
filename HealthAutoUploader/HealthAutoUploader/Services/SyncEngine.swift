import Foundation

actor SyncEngine {
    private let healthKitService: HealthKitService
    private let uploadService: UploadService
    private let stateStore: SyncStateStore
    private var isSyncing = false

    init(healthKitService: HealthKitService, uploadService: UploadService, stateStore: SyncStateStore) {
        self.healthKitService = healthKitService
        self.uploadService = uploadService
        self.stateStore = stateStore
    }

    func performSync(reason: SyncReason, force: Bool = false) async -> SyncResult {
        if isSyncing {
            return SyncResult(status: .skipped, exportedAt: stateStore.lastUploadedAt, message: "已有同步任务在执行")
        }

        if !force,
           let lastUploadedAt = stateStore.lastUploadedAt,
           Date().timeIntervalSince(lastUploadedAt) < AppConfig.minimumUploadInterval {
            return SyncResult(status: .skipped, exportedAt: lastUploadedAt, message: "距离上次成功上传不足 30 分钟，已跳过")
        }

        isSyncing = true
        defer { isSyncing = false }

        do {
            let payload = try await healthKitService.makeTodayPayload()
            try await uploadService.upload(payload)

            stateStore.lastUploadedAt = payload.generatedAt
            stateStore.lastReason = reason
            stateStore.clearError()

            return SyncResult(status: .success, exportedAt: payload.generatedAt, message: "已上传 \(payload.dateKey) 的健康数据")
        } catch {
            let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            stateStore.lastErrorMessage = message
            stateStore.lastReason = reason
            return SyncResult(status: .failed, exportedAt: nil, message: message)
        }
    }

    func currentStatus() -> SyncStatusSnapshot {
        SyncStatusSnapshot(
            authorizationGranted: healthKitService.authorizationSummary().allTypesAuthorized,
            lastUploadedAt: stateStore.lastUploadedAt,
            lastReason: stateStore.lastReason,
            lastErrorMessage: stateStore.lastErrorMessage,
            isSyncing: isSyncing
        )
    }
}
