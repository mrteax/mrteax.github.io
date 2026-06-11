import Foundation

final class SyncStateStore {
    private enum Keys {
        static let lastUploadedAt = "sync.lastUploadedAt"
        static let lastReason = "sync.lastReason"
        static let lastErrorMessage = "sync.lastErrorMessage"
    }

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    var lastUploadedAt: Date? {
        get { defaults.object(forKey: Keys.lastUploadedAt) as? Date }
        set { defaults.set(newValue, forKey: Keys.lastUploadedAt) }
    }

    var lastReason: SyncReason? {
        get {
            guard let rawValue = defaults.string(forKey: Keys.lastReason) else {
                return nil
            }
            return SyncReason(rawValue: rawValue)
        }
        set {
            defaults.set(newValue?.rawValue, forKey: Keys.lastReason)
        }
    }

    var lastErrorMessage: String? {
        get { defaults.string(forKey: Keys.lastErrorMessage) }
        set { defaults.set(newValue, forKey: Keys.lastErrorMessage) }
    }

    func clearError() {
        defaults.removeObject(forKey: Keys.lastErrorMessage)
    }
}
