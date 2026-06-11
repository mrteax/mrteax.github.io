import Foundation

@MainActor
final class AppContainer {
    static let shared = AppContainer()

    let healthKitService: HealthKitService
    let settingsStore: AppSettingsStore
    let uploadService: UploadService
    let syncStateStore: SyncStateStore
    let syncEngine: SyncEngine
    let backgroundTaskManager: BackgroundTaskManager

    private var didRegisterBackgroundTasks = false

    private init() {
        let healthKitService = HealthKitService()
        let settingsStore = AppSettingsStore()
        let uploadService = UploadService(settingsStore: settingsStore)
        let syncStateStore = SyncStateStore()
        let syncEngine = SyncEngine(healthKitService: healthKitService, uploadService: uploadService, stateStore: syncStateStore)

        self.healthKitService = healthKitService
        self.settingsStore = settingsStore
        self.uploadService = uploadService
        self.syncStateStore = syncStateStore
        self.syncEngine = syncEngine
        self.backgroundTaskManager = BackgroundTaskManager(syncEngine: syncEngine)
    }

    func bootstrap() async {
        if !didRegisterBackgroundTasks {
            backgroundTaskManager.register()
            didRegisterBackgroundTasks = true
        }

        backgroundTaskManager.scheduleRefresh()

        guard healthKitService.isHealthDataAvailable else {
            return
        }

        let summary = healthKitService.authorizationSummary()
        if !summary.authorizedTypes.isEmpty {
            activateHealthObservers()
        }
    }

    func activateHealthObservers() {
        guard healthKitService.isHealthDataAvailable else {
            return
        }

        healthKitService.setUpBackgroundDelivery { [weak self] in
            Task { [weak self] in
                guard let self else { return }
                await MainActor.run {
                    self.backgroundTaskManager.scheduleProcessing()
                }
                _ = await self.syncEngine.performSync(reason: .healthKitObserver)
            }
        }
    }
}
