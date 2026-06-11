import Foundation

struct AppSettings {
    var supabaseURLString: String
    var supabaseAnonKey: String
    var targetTable: String

    var trimmedSupabaseURLString: String {
        supabaseURLString.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var trimmedSupabaseAnonKey: String {
        supabaseAnonKey.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var trimmedTargetTable: String {
        let value = targetTable.trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? AppConfig.defaultTargetTable : value
    }

    var supabaseURL: URL? {
        URL(string: trimmedSupabaseURLString)
    }

    var isComplete: Bool {
        !trimmedSupabaseURLString.isEmpty && !trimmedSupabaseAnonKey.isEmpty && supabaseURL != nil
    }

    static let empty = AppSettings(
        supabaseURLString: "",
        supabaseAnonKey: "",
        targetTable: AppConfig.defaultTargetTable
    )
}

final class AppSettingsStore {
    enum SettingsError: LocalizedError {
        case invalidURL
        case missingAnonKey

        var errorDescription: String? {
            switch self {
            case .invalidURL:
                return "Supabase URL 格式不正确，请输入完整的 https 地址。"
            case .missingAnonKey:
                return "请填写 Supabase Anon Key。"
            }
        }
    }

    private enum Keys {
        static let supabaseURL = "settings.supabase.url"
        static let supabaseAnonKey = "settings.supabase.anonKey"
        static let targetTable = "settings.supabase.targetTable"
    }

    private let defaults: UserDefaults
    private let keychain: KeychainService

    init(defaults: UserDefaults = .standard, keychain: KeychainService = KeychainService()) {
        self.defaults = defaults
        self.keychain = keychain
    }

    func load() -> AppSettings {
        let urlString = (try? keychain.string(for: Keys.supabaseURL)) ?? ""
        let anonKey = (try? keychain.string(for: Keys.supabaseAnonKey)) ?? ""
        let targetTable = defaults.string(forKey: Keys.targetTable) ?? AppConfig.defaultTargetTable

        return AppSettings(
            supabaseURLString: urlString,
            supabaseAnonKey: anonKey,
            targetTable: targetTable
        )
    }

    func save(_ settings: AppSettings) throws {
        guard let _ = URL(string: settings.trimmedSupabaseURLString) else {
            throw SettingsError.invalidURL
        }
        guard !settings.trimmedSupabaseAnonKey.isEmpty else {
            throw SettingsError.missingAnonKey
        }

        try keychain.set(settings.trimmedSupabaseURLString, for: Keys.supabaseURL)
        try keychain.set(settings.trimmedSupabaseAnonKey, for: Keys.supabaseAnonKey)
        defaults.set(settings.trimmedTargetTable, forKey: Keys.targetTable)
    }

    func clearSensitiveValues() throws {
        try keychain.removeValue(for: Keys.supabaseURL)
        try keychain.removeValue(for: Keys.supabaseAnonKey)
    }
}
