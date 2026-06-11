import UIKit

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        Task {
            await AppContainer.shared.bootstrap()
            let summary = AppContainer.shared.healthKitService.authorizationSummary()
            if !summary.authorizedTypes.isEmpty {
                _ = await AppContainer.shared.syncEngine.performSync(reason: .appLaunch)
            }
        }
        return true
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        AppContainer.shared.backgroundTaskManager.scheduleRefresh()
    }
}
