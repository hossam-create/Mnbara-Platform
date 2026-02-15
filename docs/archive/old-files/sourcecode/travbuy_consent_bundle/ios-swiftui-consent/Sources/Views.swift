import SwiftUI
struct ConsentView: View {
    @EnvironmentObject var consent: ConsentModel
    @State private var showFull = false
    var body: some View {
        NavigationView{
            VStack(alignment: .leading, spacing: 16){
                Text(consent.isArabic ? "الخصوصية والأمان" : "Privacy & Security").font(.title2).bold()
                Text(summary).font(.body)
                Button(action:{ showFull.toggle() }){
                    Label(showFull ? (consent.isArabic ? "إخفاء التفاصيل" : "Hide details")
                                   : (consent.isArabic ? "عرض التفاصيل" : "Show details"),
                          systemImage: showFull ? "chevron.up" : "chevron.down")
                }
                if showFull {
                    ScrollView{ Text(fullBody).frame(maxWidth:.infinity, alignment:.leading) }.frame(maxHeight: 240)
                } else { Spacer() }
                HStack{
                    Button(role:.cancel){ exit(0) } label: {
                        Label(consent.isArabic ? "لا أوافق" : "Decline", systemImage: "xmark.circle").frame(maxWidth:.infinity)
                    }.buttonStyle(.bordered)
                    Button{ consent.accept() } label: {
                        Label(consent.isArabic ? "أوافق" : "Accept", systemImage: "checkmark.circle.fill").frame(maxWidth:.infinity)
                    }.buttonStyle(.borderedProminent)
                }
            }
            .padding()
            .toolbar{
                ToolbarItem(placement: .navigationBarTrailing){
                    NavigationLink(destination: PolicyView().environmentObject(consent)){
                        Label(consent.isArabic ? "قراءة السياسة" : "View Policy", systemImage: "doc.text")
                    }
                }
            }
            .onAppear{ consent.loadPolicy() }
        }
    }
    var summary: String {
        if let p = consent.policy {
            let lang = consent.isArabic ? "ar" : "en"
            return p.content[lang]?.split(separator: "\n").first.map(String.init) ?? defaultSummary
        }
        return defaultSummary
    }
    var fullBody: String {
        if let p = consent.policy {
            let lang = consent.isArabic ? "ar" : "en"
            return p.content[lang] ?? defaultSummary
        }
        return defaultSummary
    }
    var defaultSummary: String { consent.isArabic ? "باستخدامك TravBuy، أنت توافق على سياسة الخصوصية." : "By using TravBuy, you agree to our privacy policy." }
}
struct PolicyView: View {
    @EnvironmentObject var consent: ConsentModel
    var body: some View {
        ScrollView{
            VStack(alignment:.leading, spacing:12){
                Text(consent.isArabic ? "سياسة الخصوصية الكاملة" : "Full Privacy Policy").font(.title3).bold()
                if let p = consent.policy {
                    Text(consent.isArabic ? "آخر تحديث: \(p.updated_at ?? "-")" : "Last updated: \(p.updated_at ?? "-")").foregroundStyle(.secondary)
                    let lang = consent.isArabic ? "ar" : "en"
                    Text(p.content[lang] ?? "")
                } else { Text(consent.isArabic ? "جارٍ التحميل..." : "Loading...") }
            }.padding()
        }.navigationTitle(consent.isArabic ? "سياسة الخصوصية" : "Privacy Policy")
    }
}
struct HomeView: View {
    @EnvironmentObject var consent: ConsentModel
    var body: some View {
        NavigationView{
            VStack(spacing:16){
                Text(consent.isArabic ? "مرحبًا بك في TravBuy" : "Welcome to TravBuy").font(.title2).bold()
                Button(consent.isArabic ? "عرض السياسة" : "View Policy"){}.buttonStyle(.bordered)
                Button(consent.isArabic ? "إعادة طلب الموافقة (اختبار)" : "Reset Consent (Test)"){ consent.reset() }.buttonStyle(.borderedProminent)
            }.padding()
        }
    }
}
