import Foundation
import HealthKit
import UIKit

final class HealthKitService {
    private let healthStore = HKHealthStore()
    private let calendar = Calendar.current
    private var observerQueries: [HKObserverQuery] = []

    var isHealthDataAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        [
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis),
            HKObjectType.quantityType(forIdentifier: .heartRate),
            HKObjectType.quantityType(forIdentifier: .restingHeartRate),
            HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN),
            HKObjectType.quantityType(forIdentifier: .stepCount),
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned),
            HKObjectType.workoutType()
        ].forEach {
            if let type = $0 {
                types.insert(type)
            }
        }
        return types
    }

    func requestAuthorizationIfNeeded() async throws {
        guard isHealthDataAvailable else {
            throw HealthKitServiceError.healthDataUnavailable
        }

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            healthStore.requestAuthorization(toShare: [], read: readTypes) { success, error in
                if let error {
                    continuation.resume(throwing: error)
                } else if success {
                    continuation.resume(returning: ())
                } else {
                    continuation.resume(throwing: HealthKitServiceError.authorizationDenied)
                }
            }
        }
    }

    func authorizationSummary() -> DailyHealthPayload.PermissionSummary {
        let types = trackedTypes
        let authorized = types.filter { healthStore.authorizationStatus(for: $0) == .sharingAuthorized }
        let denied = types.filter { healthStore.authorizationStatus(for: $0) == .sharingDenied }

        return .init(
            healthKitAvailable: isHealthDataAvailable,
            allTypesAuthorized: denied.isEmpty && authorized.count == types.count,
            authorizedTypes: authorized.map(typeName).sorted(),
            deniedTypes: denied.map(typeName).sorted()
        )
    }

    func setUpBackgroundDelivery(onUpdate: @escaping @Sendable () -> Void) {
        observerQueries.forEach(healthStore.stop)
        observerQueries.removeAll()

        trackedSampleTypes.forEach { sampleType in
            let query = HKObserverQuery(sampleType: sampleType, predicate: nil) { [weak self] _, completionHandler, error in
                defer { completionHandler() }

                if let error {
                    print("HealthKit observer query error for \(sampleType.identifier): \(error.localizedDescription)")
                    return
                }

                self?.enableImmediateBackgroundDelivery(for: sampleType)
                onUpdate()
            }

            observerQueries.append(query)
            healthStore.execute(query)
            enableImmediateBackgroundDelivery(for: sampleType)
        }
    }

    func makeTodayPayload() async throws -> DailyHealthPayload {
        guard isHealthDataAvailable else {
            throw HealthKitServiceError.healthDataUnavailable
        }

        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)

        async let sleepSessions = fetchSleepSessions(predicate: predicate)
        async let heartRateSamples = fetchQuantitySamples(type: .heartRate, predicate: predicate, unit: HKUnit.count().unitDivided(by: .minute()), unitLabel: "count/min")
        async let restingHeartRateSamples = fetchQuantitySamples(type: .restingHeartRate, predicate: predicate, unit: HKUnit.count().unitDivided(by: .minute()), unitLabel: "count/min")
        async let hrvSamples = fetchQuantitySamples(type: .heartRateVariabilitySDNN, predicate: predicate, unit: .secondUnit(with: .milli), unitLabel: "ms")
        async let stepCountSamples = fetchQuantitySamples(type: .stepCount, predicate: predicate, unit: .count(), unitLabel: "count")
        async let activeEnergySamples = fetchQuantitySamples(type: .activeEnergyBurned, predicate: predicate, unit: .kilocalorie(), unitLabel: "kcal")
        async let workouts = fetchWorkouts(predicate: predicate)

        let sleep = try await sleepSessions
        let heart = try await heartRateSamples
        let resting = try await restingHeartRateSamples
        let hrv = try await hrvSamples
        let steps = try await stepCountSamples
        let energy = try await activeEnergySamples
        let workoutItems = try await workouts

        let totalSleepHours = sleep
            .filter { $0.stage != "inBed" && $0.stage != "awake" }
            .reduce(0.0) { partial, item in
                partial + item.endDate.timeIntervalSince(item.startDate) / 3600
            }

        let totalWorkoutMinutes = workoutItems.reduce(0.0) { $0 + $1.durationMinutes }
        let latestResting = resting.sorted { $0.endDate < $1.endDate }.last?.value
        let latestHRV = hrv.sorted { $0.endDate < $1.endDate }.last?.value

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]

        let payload = DailyHealthPayload(
            generatedAt: now,
            timeZone: TimeZone.current.identifier,
            dateKey: formatter.string(from: startOfDay),
            source: .init(
                app: AppConfig.appName,
                appVersion: AppConfig.appVersion,
                platform: "iOS",
                deviceName: UIDevice.current.name,
                systemVersion: UIDevice.current.systemVersion
            ),
            window: .init(start: startOfDay, end: now),
            permissions: authorizationSummary(),
            summary: .init(
                totalSteps: steps.reduce(0.0) { $0 + $1.value },
                totalActiveEnergyKCal: energy.reduce(0.0) { $0 + $1.value },
                totalSleepHours: totalSleepHours,
                workoutMinutes: totalWorkoutMinutes,
                workoutCount: workoutItems.count,
                latestRestingHeartRateBpm: latestResting,
                latestHRVMilliseconds: latestHRV
            ),
            sleepSessions: sleep,
            heartRateSamples: heart,
            restingHeartRateSamples: resting,
            hrvSamples: hrv,
            stepCountSamples: steps,
            activeEnergySamples: energy,
            workouts: workoutItems
        )
        return payload
    }

    private var trackedTypes: [HKObjectType] {
        Array(readTypes)
    }

    private var trackedSampleTypes: [HKSampleType] {
        trackedTypes.compactMap { $0 as? HKSampleType }
    }

    private func enableImmediateBackgroundDelivery(for type: HKSampleType) {
        healthStore.enableBackgroundDelivery(for: type, frequency: .immediate) { success, error in
            if let error {
                print("Failed to enable background delivery for \(type.identifier): \(error.localizedDescription)")
                return
            }

            if !success {
                print("Background delivery was not enabled for \(type.identifier)")
            }
        }
    }

    private func fetchSleepSessions(predicate: NSPredicate?) async throws -> [SleepSession] {
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            return []
        }

        let sortDescriptors = [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
        let samples = try await fetchSamples(sampleType: sleepType, predicate: predicate, sortDescriptors: sortDescriptors)
        let sessions = samples.compactMap { $0 as? HKCategorySample }

        return sessions.map { sample in
            SleepSession(
                id: sample.uuid.uuidString,
                stage: sleepStageName(for: sample.value),
                startDate: sample.startDate,
                endDate: sample.endDate,
                sourceBundle: sample.sourceRevision.source.bundleIdentifier,
                metadata: convertMetadata(sample.metadata)
            )
        }
    }

    private func fetchQuantitySamples(type identifier: HKQuantityTypeIdentifier, predicate: NSPredicate?, unit: HKUnit, unitLabel: String) async throws -> [QuantitySampleRecord] {
        guard let quantityType = HKObjectType.quantityType(forIdentifier: identifier) else {
            return []
        }

        let sortDescriptors = [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
        let samples = try await fetchSamples(sampleType: quantityType, predicate: predicate, sortDescriptors: sortDescriptors)
        let quantitySamples = samples.compactMap { $0 as? HKQuantitySample }

        return quantitySamples.map { sample in
            QuantitySampleRecord(
                id: sample.uuid.uuidString,
                type: identifier.rawValue,
                unit: unitLabel,
                value: sample.quantity.doubleValue(for: unit),
                startDate: sample.startDate,
                endDate: sample.endDate,
                sourceBundle: sample.sourceRevision.source.bundleIdentifier,
                metadata: convertMetadata(sample.metadata)
            )
        }
    }

    private func fetchWorkouts(predicate: NSPredicate?) async throws -> [WorkoutRecord] {
        let sortDescriptors = [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
        let samples = try await fetchSamples(sampleType: .workoutType(), predicate: predicate, sortDescriptors: sortDescriptors)
        let workouts = samples.compactMap { $0 as? HKWorkout }

        return workouts.map { workout in
            WorkoutRecord(
                id: workout.uuid.uuidString,
                activityType: workoutActivityName(workout.workoutActivityType),
                startDate: workout.startDate,
                endDate: workout.endDate,
                durationMinutes: workout.duration / 60,
                totalEnergyBurnedKCal: workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()),
                totalDistanceMeters: workout.totalDistance?.doubleValue(for: .meter()),
                sourceBundle: workout.sourceRevision.source.bundleIdentifier,
                metadata: convertMetadata(workout.metadata)
            )
        }
    }

    private func fetchSamples(sampleType: HKSampleType, predicate: NSPredicate?, sortDescriptors: [NSSortDescriptor]) async throws -> [HKSample] {
        try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(sampleType: sampleType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: sortDescriptors) { _, samples, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: samples ?? [])
                }
            }
            healthStore.execute(query)
        }
    }

    private func typeName(_ type: HKObjectType) -> String {
        if let quantityType = type as? HKQuantityType {
            return quantityType.identifier
        }
        if let categoryType = type as? HKCategoryType {
            return categoryType.identifier
        }
        if type == HKObjectType.workoutType() {
            return HKObjectType.workoutType().identifier
        }
        return type.identifier
    }

    private func sleepStageName(for rawValue: Int) -> String {
        switch rawValue {
        case HKCategoryValueSleepAnalysis.inBed.rawValue:
            return "inBed"
        case HKCategoryValueSleepAnalysis.awake.rawValue:
            return "awake"
        case HKCategoryValueSleepAnalysis.asleepCore.rawValue:
            return "asleepCore"
        case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
            return "asleepDeep"
        case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
            return "asleepREM"
        case HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue:
            return "asleep"
        default:
            return "unknown_\(rawValue)"
        }
    }

    private func workoutActivityName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running: return "running"
        case .walking: return "walking"
        case .cycling: return "cycling"
        case .traditionalStrengthTraining: return "traditionalStrengthTraining"
        case .functionalStrengthTraining: return "functionalStrengthTraining"
        case .tennis: return "tennis"
        case .basketball: return "basketball"
        case .soccer: return "soccer"
        case .swimming: return "swimming"
        case .yoga: return "yoga"
        default:
            return String(describing: type)
        }
    }

    private func convertMetadata(_ metadata: [String: Any]?) -> [String: JSONValue]? {
        guard let metadata, !metadata.isEmpty else {
            return nil
        }

        var result: [String: JSONValue] = [:]
        metadata.forEach { key, value in
            result[key] = convertToJSONValue(value)
        }
        return result.isEmpty ? nil : result
    }

    private func convertToJSONValue(_ value: Any) -> JSONValue {
        switch value {
        case let string as String:
            return .string(string)
        case let number as NSNumber:
            if CFGetTypeID(number) == CFBooleanGetTypeID() {
                return .bool(number.boolValue)
            }
            let doubleValue = number.doubleValue
            if floor(doubleValue) == doubleValue {
                return .integer(number.intValue)
            }
            return .number(doubleValue)
        case let date as Date:
            return .string(ISO8601DateFormatter().string(from: date))
        case let array as [Any]:
            return .array(array.map(convertToJSONValue))
        case let dictionary as [String: Any]:
            return .object(dictionary.mapValues(convertToJSONValue))
        default:
            return .string(String(describing: value))
        }
    }
}

enum HealthKitServiceError: LocalizedError {
    case healthDataUnavailable
    case authorizationDenied

    var errorDescription: String? {
        switch self {
        case .healthDataUnavailable:
            return "当前设备不支持 HealthKit。"
        case .authorizationDenied:
            return "HealthKit 授权未通过。"
        }
    }
}
