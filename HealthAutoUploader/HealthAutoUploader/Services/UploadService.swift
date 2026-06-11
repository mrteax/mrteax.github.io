import Foundation

final class UploadService {
    private let session: URLSession
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder
    private let settingsStore: AppSettingsStore

    init(settingsStore: AppSettingsStore, session: URLSession = .shared) {
        self.settingsStore = settingsStore

        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = AppConfig.networkTimeout
        configuration.timeoutIntervalForResource = AppConfig.networkTimeout
        self.session = URLSession(configuration: configuration)

        self.encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.sortedKeys]

        self.decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
    }

    func upload(_ payload: DailyHealthPayload) async throws {
        let settings = settingsStore.load()
        guard settings.isComplete, let baseURL = settings.supabaseURL else {
            throw UploadServiceError.missingConfiguration
        }

        let endpoint = baseURL
            .appendingPathComponent("rest")
            .appendingPathComponent("v1")
            .appendingPathComponent(settings.trimmedTargetTable)

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(settings.trimmedSupabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(settings.trimmedSupabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.setValue("return=minimal", forHTTPHeaderField: "Prefer")
        request.httpBody = try encoder.encode(SupabaseInsertRequest(data: payload))

        let (_, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw UploadServiceError.invalidResponse
        }

        guard 200..<300 ~= httpResponse.statusCode else {
            throw UploadServiceError.serverStatus(httpResponse.statusCode)
        }
    }
}

enum UploadServiceError: LocalizedError {
    case missingConfiguration
    case invalidResponse
    case serverStatus(Int)

    var errorDescription: String? {
        switch self {
        case .missingConfiguration:
            return "请先在设置页填写 Supabase URL 和 Anon Key，再执行同步。"
        case .invalidResponse:
            return "Supabase 返回了不可识别的响应。"
        case .serverStatus(let code):
            return "Supabase 上传失败，HTTP 状态码：\(code)。"
        }
    }
}
