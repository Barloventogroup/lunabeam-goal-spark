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
    }
}
