import SwiftUI

struct ContentView: View {
    @ObservedObject var viewModel: SettingsViewModel

    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "zh_CN")
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        return formatter
    }()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    statusCard
                    settingsCard
                    capabilityCard
                    actionsCard
                    notesCard
                }
                .padding(16)
            }
            .navigationTitle("健康自动同步")
            .task {
                await viewModel.refreshStatus()
            }
        }
    }

    private var statusCard: some View {
        card(title: "当前状态") {
            VStack(alignment: .leading, spacing: 10) {
                statusRow(title: "HealthKit 授权", value: viewModel.authorizationGranted ? "已授权" : "未完整授权")
                statusRow(title: "Supabase 配置", value: viewModel.settingsSaved ? "已保存到本机" : "未完成")
                statusRow(title: "最近上传时间", value: formatted(date: viewModel.lastUploadedAt))
                statusRow(title: "最近触发来源", value: viewModel.lastReasonTitle)
                if let error = viewModel.lastErrorMessage, !error.isEmpty {
                    statusRow(title: "最近错误", value: error, valueColor: .red)
                }
                Text(viewModel.bannerMessage)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var settingsCard: some View {
        card(title: "Supabase 设置") {
            VStack(alignment: .leading, spacing: 12) {
                Text("配置仅保存在当前 iPhone 本地，不会写入代码仓库。")
                    .font(.footnote)
                    .foregroundStyle(.secondary)

                VStack(alignment: .leading, spacing: 6) {
                    Text("Supabase URL")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    TextField("https://your-project.supabase.co", text: $viewModel.supabaseURLString)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Supabase Anon Key")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    SecureField("请输入 anon key", text: $viewModel.supabaseAnonKey)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("目标表名")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    TextField("health_imports", text: $viewModel.targetTable)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)
                }

                Button {
                    viewModel.saveSettings()
                } label: {
                    Label("保存本机配置", systemImage: "internaldrive")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }

    private var capabilityCard: some View {
        card(title: "本次实现包含") {
            VStack(alignment: .leading, spacing: 8) {
                bullet("读取睡眠、心率、静息心率、HRV、步数、活动能量、Workout")
                bullet("应用启动后自动注册 HealthKit observer query")
                bullet("收到健康数据更新后，触发后台上传和补偿调度")
                bullet("上传到 Supabase 的 health_imports.data 字段")
                bullet("Supabase URL / Anon Key 可在 App 内填写，并保存在本机")
                bullet("仓库代码不再硬编码真实 key")
            }
        }
    }

    private var actionsCard: some View {
        card(title: "操作") {
            VStack(spacing: 12) {
                Button {
                    Task { await viewModel.requestPermission() }
                } label: {
                    Label("申请 HealthKit 权限", systemImage: "heart.text.square")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)

                Button {
                    Task { await viewModel.manualSync() }
                } label: {
                    if viewModel.isSyncing {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Label("立即同步一次", systemImage: "arrow.triangle.2.circlepath")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.bordered)
                .disabled(viewModel.isSyncing || !viewModel.isConfigurationReady)
            }
        }
    }

    private var notesCard: some View {
        card(title: "注意事项") {
            VStack(alignment: .leading, spacing: 8) {
                bullet("iOS 后台执行是系统调度，不保证绝对准点，但本项目已同时接入 HealthKit 后台回调 + BGTaskScheduler 兜底。")
                bullet("首次安装后，请先填写 Supabase 配置，再手动打开一次 App 完成授权。")
                bullet("如果更换 Supabase 项目，直接在设置页修改并重新保存即可。")
            }
        }
    }

    private func card<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
            content()
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func statusRow(title: String, value: String, valueColor: Color = .primary) -> some View {
        HStack(alignment: .top) {
            Text(title)
                .foregroundStyle(.secondary)
            Spacer(minLength: 12)
            Text(value)
                .foregroundStyle(valueColor)
                .multilineTextAlignment(.trailing)
        }
        .font(.subheadline)
    }

    private func bullet(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "circle.fill")
                .font(.system(size: 6))
                .padding(.top, 6)
            Text(text)
        }
        .font(.subheadline)
    }

    private func formatted(date: Date?) -> String {
        guard let date else { return "-" }
        return dateFormatter.string(from: date)
    }
}

#Preview {
    ContentView(viewModel: SettingsViewModel(container: .shared))
}
