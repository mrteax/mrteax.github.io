import Foundation

enum SyncReason: String, Codable, CaseIterable, Identifiable {
    case appLaunch = "app_launch"
    case manual = "manual"
    case healthKitObserver = "healthkit_observer"
    case backgroundRefresh = "background_refresh"
    case backgroundProcessing = "background_processing"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .appLaunch: return "应用启动"
        case .manual: return "手动同步"
        case .healthKitObserver: return "健康数据变更"
        case .backgroundRefresh: return "后台刷新"
        case .backgroundProcessing: return "后台处理"
        }
    }
}

struct SyncResult {
    let status: Status
    let exportedAt: Date?
    let message: String

    enum Status {
        case success
        case skipped
        case failed
    }
}

struct SyncStatusSnapshot {
    var authorizationGranted: Bool
    var lastUploadedAt: Date?
    var lastReason: SyncReason?
    var lastErrorMessage: String?
    var isSyncing: Bool
}
