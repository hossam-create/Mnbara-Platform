
import SwiftUI

struct ConsentView: View {
    @EnvironmentObject var vm: ConsentViewModel
    @Environment(.locale) var locale

    var isAr: Bool { Locale.current.language.languageCode?.identifier.lowercased().hasPrefix("ar") ?? false }

    var body: some View {
        NavigationView {
            VStack(alignment: .leading, spacing: 12) {
                if let p = vm.policy {
                    Text("Version: \(p.version) • Updated: \(p.updatedAt)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Text(isAr ? p.ar.summary : p.en.summary)

                    ScrollView {
                        Text(isAr ? p.ar.fullText : p.en.fullText)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    HStack {
                        Button(role: .cancel) { vm.decline() } label: { Text(isAr ? "لا أوافق" : "Decline") }
                        Spacer()
                        Button { vm.accept() } label: { Text(isAr ? "أوافق" : "Accept") }
                            .buttonStyle(.borderedProminent)
                    }
                } else {
                    ProgressView()
                }
            }
            .padding()
            .navigationTitle(isAr ? "الخصوصية والأمان" : "Privacy & Security")
        }
    }
}

struct HomeView: View {
    var body: some View {
        VStack(spacing: 16) {
            Text("Consent accepted — Welcome to TravBuy")
                .font(.title3)
        }.padding()
    }
}
