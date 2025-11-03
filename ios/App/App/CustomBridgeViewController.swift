import Capacitor
import UIKit
import WebKit

class CustomBridgeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()

        // WORKAROUND: Clear WKWebView caches to prevent showing stale builds
        let dataTypes = WKWebsiteDataStore.allWebsiteDataTypes()
        WKWebsiteDataStore.default().removeData(ofTypes: dataTypes, modifiedSince: Date(timeIntervalSince1970: 0)) { [weak self] in
            URLCache.shared.removeAllCachedResponses()
            print("🧹 Cleared WKWebView website data and URLCache")
            // Reload once after clearing to fetch fresh content
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
