
import Foundation

struct Policy: Codable {
    let version: String
    let updatedAt: String
    let ar: Lang
    let en: Lang
    struct Lang: Codable { let summary: String; let fullText: String }
}

let POLICY_URL = URL(string: "http://localhost:8080/policy.json")!

@MainActor
class ConsentViewModel: ObservableObject {
    @Published var policy: Policy?
    @Published var accepted = false

    func loadPolicy() async {
        do {
            let (data, _) = try await URLSession.shared.data(from: POLICY_URL)
            let p = try JSONDecoder().decode(Policy.self, from: data)
            self.policy = p
            self.accepted = UserDefaults.standard.string(forKey: "consent_version") == p.version
        } catch {
            // fallback
            let fallback = Policy(version: "1.0.0", updatedAt: "2025-08-01",
                                  ar: .init(summary: "باستخدامك للتطبيق فأنت توافق على سياسة الخصوصية.",
                                            fullText: "نص مختصر للاستخدام دون إنترنت."),
                                  en: .init(summary: "By using the app you accept the privacy policy.",
                                            fullText: "Offline short policy text."))
            self.policy = fallback
            self.accepted = UserDefaults.standard.string(forKey: "consent_version") == fallback.version
        }
    }

    func accept() {
        let v = policy?.version ?? "1.0.0"
        UserDefaults.standard.set(v, forKey: "consent_version")
        accepted = true
    }

    func decline() { accepted = false }
}
