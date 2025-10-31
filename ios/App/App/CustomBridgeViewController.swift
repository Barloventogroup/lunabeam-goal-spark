import Capacitor
import UIKit
import WebKit

class CustomBridgeViewController: CAPBridgeViewController {
    // Remote preview URL for Lovable live reload
    private let remotePreviewURLString = "https://bcbbec97-94c4-45c1-9f35-6ed8dcd5b3b6.lovableproject.com?forceHideBadge=true&debug=safearea"

    override func viewDidLoad() {
        super.viewDidLoad()
        
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
        
        // Force load remote URL after a delay to ensure WebView is ready
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            guard let self = self else { return }
            
            let currentURL = self.webView?.url?.absoluteString ?? "nil"
            let currentScheme = self.webView?.url?.scheme ?? "nil"
            
            print("🔍 Current WebView URL:", currentURL)
            print("🔍 Current URL scheme:", currentScheme)
            
            // Force remote URL if we're on capacitor:// or file://
            if currentScheme == "capacitor" || currentScheme == "file" || currentURL == "nil" {
                if let remoteURL = URL(string: self.remotePreviewURLString) {
                    print("🔧 FORCING remote server URL:", remoteURL.absoluteString)
                    self.webView?.load(URLRequest(url: remoteURL))
                } else {
                    print("❌ Invalid remote URL string")
                }
            } else {
                print("✅ Remote URL already loaded, no override needed")
            }
        }
    }
}
