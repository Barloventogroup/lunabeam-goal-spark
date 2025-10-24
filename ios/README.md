# iOS Native Setup for Safe Area Handling

## Problem
If your app's content overlaps the notch/home indicator despite correct CSS, the native iOS WKWebView configuration may be overriding your styles.

## Solution: Disable Native Content Inset Adjustment

### Step 1: Create Custom Bridge View Controller

Create a new Swift file at `ios/App/App/CustomBridgeViewController.swift`:

```swift
import Capacitor
import UIKit

class CustomBridgeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Critical: Disable automatic safe area content inset adjustment
        // This allows CSS env(safe-area-inset-*) to handle padding manually
        if #available(iOS 11.0, *) {
            self.webView?.scrollView.contentInsetAdjustmentBehavior = .never
            print("✅ WebView contentInsetAdjustmentBehavior set to .never")
        }
        
        // Optional: Verify WebView constraints extend to screen edges
        if let webView = self.webView {
            webView.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                webView.topAnchor.constraint(equalTo: view.topAnchor),
                webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
                webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
            ])
        }
    }
}
```

### Step 2: Update AppDelegate

Modify `ios/App/App/AppDelegate.swift` to use the custom view controller:

```swift
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, etc.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url.
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // CUSTOM: Use our custom bridge view controller
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let sceneConfig = UISceneConfiguration(name: nil, sessionRole: connectingSceneSession.role)
        sceneConfig.delegateClass = SceneDelegate.self
        return sceneConfig
    }
}
```

### Step 3: Update SceneDelegate

Modify `ios/App/App/SceneDelegate.swift` to use `CustomBridgeViewController`:

```swift
import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        
        let window = UIWindow(windowScene: windowScene)
        
        // CUSTOM: Use our custom view controller instead of CAPBridgeViewController
        let rootViewController = CustomBridgeViewController()
        
        window.rootViewController = rootViewController
        self.window = window
        window.makeKeyAndVisible()
    }
}
```

## Testing

After implementing these changes:

1. Rebuild the app: `npx cap sync ios`
2. Run on device: `npx cap run ios`
3. Add `?debug=safearea` to the URL to see visual overlays and measured inset values
4. Check console for: `✅ WebView contentInsetAdjustmentBehavior set to .never`
5. Verify env(safe-area-inset-*) values are non-zero on devices with notches

## Expected Console Output

```
✅ iOS StatusBar configured: overlay=true, style=dark
📱 Platform: ios
✅ WebView contentInsetAdjustmentBehavior set to .never
🔍 Safe Area Probe Results:
  env(safe-area-inset-top):    47px
  env(safe-area-inset-bottom): 34px
```

## Troubleshooting

- If insets are still 0px, verify `viewport-fit=cover` is in index.html
- If content still overlaps, check that StatusBar.setOverlaysWebView is called
- Run the SafeAreaProbe (?debug=safearea) to confirm measured values
