import SwiftUI
@main
struct TravBuyConsentApp: App {
    @StateObject var consent = ConsentModel()
    var body: some Scene {
        WindowGroup {
            if consent.isAccepted { HomeView().environmentObject(consent) }
            else { ConsentView().environmentObject(consent) }
        }
    }
}
