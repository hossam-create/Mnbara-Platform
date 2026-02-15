import Foundation
let PRIVACY_VERSION = "1.0.0"
let POLICY_URL = URL(string: "http://localhost:8080/policy.json")!
struct Policy: Codable { let version:String; let updated_at:String?; let languages:[String]; let title:[String:String]; let content:[String:String] }
final class ConsentModel: ObservableObject {
    @Published var policy: Policy?
    @Published var isAccepted: Bool = UserDefaults.standard.string(forKey: "accepted_privacy_version") == PRIVACY_VERSION
    var isArabic: Bool { Locale.current.language.languageCode?.identifier.lowercased().hasPrefix("ar") ?? false }
    func loadPolicy(){
        URLSession.shared.dataTask(with: POLICY_URL){ data,_,_ in
            if let d=data, let p = try? JSONDecoder().decode(Policy.self, from:d){
                DispatchQueue.main.async{ self.policy = p }
            } else {
                let fb = Policy(version: PRIVACY_VERSION, updated_at: nil, languages: ["ar","en"], title: ["ar":"سياسة الخصوصية","en":"Privacy Policy"], content: ["ar":PolicyTexts.arabic,"en":PolicyTexts.english])
                DispatchQueue.main.async{ self.policy = fb }
            }
        }.resume()
    }
    func accept(){ UserDefaults.standard.setValue(PRIVACY_VERSION, forKey:"accepted_privacy_version"); isAccepted = true }
    func reset(){ UserDefaults.standard.removeObject(forKey:"accepted_privacy_version"); isAccepted = false }
}
enum PolicyTexts{
    static let arabic = """مقدمة...\nهذه نسخة محلية بديلة."""
    static let english = """Introduction...\nThis is a local fallback."""
}
