import Foundation

struct DailyHealthPayload: Codable {
    let generatedAt: Date
    let timeZone: String
    let dateKey: String
    let source: SourceInfo
    let window: ExportWindow
    let permissions: PermissionSummary
    let summary: DailySummary
    let sleepSessions: [SleepSession]
    let heartRateSamples: [QuantitySampleRecord]
    let restingHeartRateSamples: [QuantitySampleRecord]
    let hrvSamples: [QuantitySampleRecord]
    let stepCountSamples: [QuantitySampleRecord]
    let activeEnergySamples: [QuantitySampleRecord]
    let workouts: [WorkoutRecord]

    struct SourceInfo: Codable {
        let app: String
        let appVersion: String
        let platform: String
        let deviceName: String
        let systemVersion: String
    }

    struct ExportWindow: Codable {
        let start: Date
        let end: Date
    }

    struct PermissionSummary: Codable {
        let healthKitAvailable: Bool
        let allTypesAuthorized: Bool
        let authorizedTypes: [String]
        let deniedTypes: [String]
    }

    struct DailySummary: Codable {
        let totalSteps: Double
        let totalActiveEnergyKCal: Double
        let totalSleepHours: Double
        let workoutMinutes: Double
        let workoutCount: Int
        let latestRestingHeartRateBpm: Double?
        let latestHRVMilliseconds: Double?
    }
}

struct QuantitySampleRecord: Codable, Identifiable {
    let id: String
    let type: String
    let unit: String
    let value: Double
    let startDate: Date
    let endDate: Date
    let sourceBundle: String?
    let metadata: [String: JSONValue]?
}

struct SleepSession: Codable, Identifiable {
    let id: String
    let stage: String
    let startDate: Date
    let endDate: Date
    let sourceBundle: String?
    let metadata: [String: JSONValue]?
}

struct WorkoutRecord: Codable, Identifiable {
    let id: String
    let activityType: String
    let startDate: Date
    let endDate: Date
    let durationMinutes: Double
    let totalEnergyBurnedKCal: Double?
    let totalDistanceMeters: Double?
    let sourceBundle: String?
    let metadata: [String: JSONValue]?
}

struct SupabaseInsertRequest: Codable {
    let data: DailyHealthPayload
}
