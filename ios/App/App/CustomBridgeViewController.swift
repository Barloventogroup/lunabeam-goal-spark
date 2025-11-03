import Capacitor
import UIKit
import WebKit

class CustomBridgeViewController: CAPBridgeViewController {
    private let buildVersionKey = "lastAppBuildVersion"
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Get current build number
        let currentBuild = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "unknown"
        let lastBuild = UserDefaults.standard.string(forKey: buildVersionKey)
        let isFirstLaunchAfterBuild = (lastBuild != currentBuild)
        
        print("🔍 Current build: \(currentBuild), Last build: \(lastBuild ?? "none")")
        print("🔍 First launch after build: \(isFirstLaunchAfterBuild)")

        // PHASE 2: NUCLEAR WEBVIEW CACHE ELIMINATION
        // Define ALL data types including Service Worker specific ones
        var dataTypes = WKWebsiteDataStore.allWebsiteDataTypes()
        
        // Explicitly add Service Worker related types
        if #available(iOS 14.0, *) {
            dataTypes.insert(WKWebsiteDataTypeFetchCache)
            dataTypes.insert(WKWebsiteDataTypeServiceWorkerRegistrations)
        }
        
        print("🧨 Clearing WebView data types: \(dataTypes)")
        
        WKWebsiteDataStore.default().removeData(ofTypes: dataTypes, modifiedSince: Date(timeIntervalSince1970: 0)) { [weak self] in
            // Clear HTTP cookies explicitly
            HTTPCookieStorage.shared.removeCookies(since: .distantPast)
            
            // Clear URLCache
            URLCache.shared.removeAllCachedResponses()
            
            print("🧹 Cleared all WKWebView data, cookies, and URLCache")
            
            // Save current build version
            UserDefaults.standard.set(currentBuild, forKey: self?.buildVersionKey ?? "lastAppBuildVersion")
            
            // Reload to fetch fresh content
            self?.webView?.reload()
        }
        
        // CRITICAL FIX: Tell WKWebView to NOT adjust content insets automatically
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
        
        // Ensure WebView extends to screen edges
        if let webView = webView {
            webView.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                webView.topAnchor.constraint(equalTo: view.topAnchor),
                webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
                webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
            ])
        }
        
        print("✅ CustomBridgeViewController: Safe area inset behavior configured")
        print("📱 Using local files from capacitor://localhost")
    }
}
