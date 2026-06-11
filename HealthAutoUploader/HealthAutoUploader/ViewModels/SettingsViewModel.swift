import Foundation

@MainActor
final class SettingsViewModel: ObservableObject {
    @Published var authorizationGranted = false
    @Published var lastUploadedAt: Date?
    @Published var lastReasonTitle = "-"
    @Published var lastErrorMessage: String?
    @Published var isSyncing = false
    @Published var bannerMessage = "首次使用请先填写 Supabase 配置，再授权 HealthKit 并点一次手动同步。"

    @Published var supabaseURLString = ""
    @Published var supabaseAnonKey = ""
    @Published var targetTable = AppConfig.defaultTargetTable
    @Published var settingsSaved = false

    private let container: AppContainer

    var isConfigurationReady: Bool {
        currentSettings.isComplete
    }

    init(container: AppContainer) {
        self.container = container
        loadSettings()
    }

    func refreshStatus() async {
        loadSettings()
        let snapshot = await container.syncEngine.currentStatus()
        authorizationGranted = snapshot.authorizationGranted
        lastUploadedAt = snapshot.lastUploadedAt
        lastReasonTitle = snapshot.lastReason?.title ?? "-"
        lastErrorMessage = snapshot.lastErrorMessage
        isSyncing = snapshot.isSyncing
    }

    func requestPermission() async {
        do {
            try await container.healthKitService.requestAuthorizationIfNeeded()
            container.activateHealthObservers()
            if isConfigurationReady {
                let result = await container.syncEngine.performSync(reason: .manual, force: true)
                bannerMessage = "HealthKit 授权完成。\(result.message)"
            } else {
                bannerMessage = "HealthKit 授权完成。请先填写并保存 Supabase 配置，再执行同步。"
            }
            await refreshStatus()
        } catch {
            bannerMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            lastErrorMessage = bannerMessage
        }
    }

    func manualSync() async {
        guard isConfigurationReady else {
            bannerMessage = "请先填写并保存 Supabase URL 和 Anon Key。"
            lastErrorMessage = bannerMessage
            return
        }

        isSyncing = true
        let result = await container.syncEngine.performSync(reason: .manual, force: true)
        bannerMessage = result.message
        isSyncing = false
        await refreshStatus()
    }

    func saveSettings() {
        do {
            try container.settingsStore.save(currentSettings)
            loadSettings()
            settingsSaved = true
            lastErrorMessage = nil
            bannerMessage = "配置已保存在本机 Keychain，本地重装前都无需重复填写。"
        } catch {
            settingsSaved = false
            let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            bannerMessage = message
            lastErrorMessage = message
        }
    }

    private var currentSettings: AppSettings {
        AppSettings(
            supabaseURLString: supabaseURLString,
            supabaseAnonKey: supabaseAnonKey,
            targetTable: targetTable
        )
    }

    private func loadSettings() {
        let settings = container.settingsStore.load()
        supabaseURLString = settings.supabaseURLString
        supabaseAnonKey = settings.supabaseAnonKey
        targetTable = settings.targetTable
        settingsSaved = settings.isComplete
    }
}
