import Capacitor
import UIKit

class CustomBridgeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // CRITICAL FIX: Tell WKWebView to NOT adjust content insets automatically
        // This allows CSS env(safe-area-inset-*) to work correctly
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
        
        // Optional: Ensure WebView extends to screen edges
        if let webView = webView {
            webView.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                webView.topAnchor.constraint(equalTo: view.topAnchor),
                webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
                webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
            ])
        }
        
        print("✅ CustomBridgeViewController: contentInsetAdjustmentBehavior set to .never")
        print("✅ CustomBridgeViewController: WebView should now respect env(safe-area-inset-*)")
        
        // Debug: Print Capacitor server URL and app location to verify config
        if let bridge = self.bridge {
            print("ℹ️ Capacitor serverURL =", bridge.config.serverURL.absoluteString)
            print("ℹ️ Capacitor appLocation =", bridge.config.appLocation.absoluteString)
            
            // Force remote preview if config didn't pick it up
            let remoteURLString = "https://bcbbec97-94c4-45c1-9f35-6ed8dcd5b3b6.lovableproject.com?forceHideBadge=true&debug=safearea"
            if bridge.config.serverURL.scheme != "http" && bridge.config.serverURL.scheme != "https" {
                if let remoteURL = URL(string: remoteURLString) {
                    print("🔧 Forcing remote server URL:", remoteURL.absoluteString)
                    webView?.load(URLRequest(url: remoteURL))
                } else {
                    print("❌ Invalid remote URL string:", remoteURLString)
                }
            }
        } else {
            print("⚠️ CustomBridgeViewController: bridge not ready yet to read config")
        }
    }
}

