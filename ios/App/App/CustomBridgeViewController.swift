import Capacitor
import UIKit
import WebKit

class CustomBridgeViewController: CAPBridgeViewController {
    // Remote preview URL for Lovable live reload
    private let remotePreviewURLString = "https://bcbbec97-94c4-45c1-9f35-6ed8dcd5b3b6.lovableproject.com?forceHideBadge=true&debug=safearea"

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
        
        // Best effort: If the bridge is ready here, log its config and try forcing remote
        if let bridge = self.bridge {
            print("ℹ️ Capacitor serverURL =", bridge.config.serverURL.absoluteString)
            print("ℹ️ Capacitor appLocation =", bridge.config.appLocation.absoluteString)
            
            if bridge.config.serverURL.scheme != "http" && bridge.config.serverURL.scheme != "https" {
                if let remoteURL = URL(string: remotePreviewURLString) {
                    print("🔧 Forcing remote server URL (viewDidLoad):", remoteURL.absoluteString)
                    webView?.load(URLRequest(url: remoteURL))
                } else {
                    print("❌ Invalid remote URL string:", remotePreviewURLString)
                }
            }
        } else {
            print("⚠️ CustomBridgeViewController: bridge not ready yet to read config")
        }
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        
        // If we're still at capacitor:// or file:// after initial load, force the remote URL.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
            guard let self = self else { return }
            let current = self.webView?.url?.absoluteString ?? "nil"
            let scheme = self.webView?.url?.scheme ?? "nil"
            print("ℹ️ CustomBridgeViewController: current webView URL =", current)
            
            if scheme == "capacitor" || scheme == "file" || current == "nil" {
                if let remoteURL = URL(string: self.remotePreviewURLString) {
                    print("🔧 Forcing remote server URL (viewDidAppear):", remoteURL.absoluteString)
                    self.webView?.load(URLRequest(url: remoteURL))
                } else {
                    print("❌ Invalid remote URL string:", self.remotePreviewURLString)
                }
            } else {
                print("✅ CustomBridgeViewController: Non-capacitor URL already loaded — no override needed")
            }
        }
    }
}
