import BackgroundTasks
import Foundation

@MainActor
final class BackgroundTaskManager {
    private let syncEngine: SyncEngine

    init(syncEngine: SyncEngine) {
        self.syncEngine = syncEngine
    }

    func register() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: AppConfig.refreshTaskIdentifier, using: nil) { [weak self] task in
            guard let task = task as? BGAppRefreshTask else {
                task.setTaskCompleted(success: false)
                return
            }
            self?.handleAppRefresh(task)
        }

        BGTaskScheduler.shared.register(forTaskWithIdentifier: AppConfig.processingTaskIdentifier, using: nil) { [weak self] task in
            guard let task = task as? BGProcessingTask else {
                task.setTaskCompleted(success: false)
                return
            }
            self?.handleProcessing(task)
        }
    }

    func scheduleRefresh(after delay: TimeInterval = AppConfig.backgroundRefreshLeadTime) {
        let request = BGAppRefreshTaskRequest(identifier: AppConfig.refreshTaskIdentifier)
        request.earliestBeginDate = Date().addingTimeInterval(delay)
        submit(request)
    }

    func scheduleProcessing(after delay: TimeInterval = AppConfig.backgroundProcessingLeadTime) {
        let request = BGProcessingTaskRequest(identifier: AppConfig.processingTaskIdentifier)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        request.earliestBeginDate = Date().addingTimeInterval(delay)
        submit(request)
    }

    private func handleAppRefresh(_ task: BGAppRefreshTask) {
        scheduleRefresh()

        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }

        Task {
            let result = await syncEngine.performSync(reason: .backgroundRefresh)
            task.setTaskCompleted(success: result.status == .success || result.status == .skipped)
        }
    }

    private func handleProcessing(_ task: BGProcessingTask) {
        scheduleProcessing(after: 60 * 60)

        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }

        Task {
            let result = await syncEngine.performSync(reason: .backgroundProcessing)
            task.setTaskCompleted(success: result.status == .success || result.status == .skipped)
        }
    }

    private func submit(_ request: BGTaskRequest) {
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Failed to submit background task \(request.identifier): \(error.localizedDescription)")
        }
    }
}
