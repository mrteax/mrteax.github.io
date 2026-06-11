import Foundation

enum AppConfig {
    static let defaultTargetTable = "health_imports"
    static let keychainServiceName = "com.xiongjiannan.healthautouploader.settings"

    static let refreshTaskIdentifier = "com.xiongjiannan.healthautouploader.refresh"
    static let processingTaskIdentifier = "com.xiongjiannan.healthautouploader.processing"

    static let minimumUploadInterval: TimeInterval = 30 * 60
    static let backgroundRefreshLeadTime: TimeInterval = 15 * 60
    static let backgroundProcessingLeadTime: TimeInterval = 5 * 60
    static let networkTimeout: TimeInterval = 30

    static let appName = "Health Auto Uploader"
    static let appVersion = "1.0.0"
}
