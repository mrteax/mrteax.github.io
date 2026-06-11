import SwiftUI

@main
struct HealthAutoUploaderApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var viewModel = SettingsViewModel(container: .shared)
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            ContentView(viewModel: viewModel)
        }
        .onChange(of: scenePhase) { _, newValue in
            if newValue == .background {
                AppContainer.shared.backgroundTaskManager.scheduleRefresh()
            }
        }
    }
}
