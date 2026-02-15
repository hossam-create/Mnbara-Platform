
import SwiftUI

@main
struct TravBuyConsentApp: App {
    @StateObject var vm = ConsentViewModel()

    var body: some Scene {
        WindowGroup {
            Group {
                if vm.accepted {
                    HomeView()
                } else {
                    ConsentView().environmentObject(vm)
                }
            }.task { await vm.loadPolicy() }
        }
    }
}
