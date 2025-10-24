import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import RequestReset from "./pages/RequestReset";
import Invitations from "./pages/Invitations";
import Logout from "./pages/Logout";
import TestComponents from "./pages/TestComponents";
import { ProtectedRoute } from "./components/auth/protected-route";
import { Capacitor, registerPlugin } from "@capacitor/core";

// Use registerPlugin to avoid build-time dependency on plugin packages
const StatusBar = registerPlugin<any>('StatusBar');
const Keyboard = registerPlugin<any>('Keyboard');
const Style = { Dark: 'DARK', Light: 'LIGHT' } as const;
import BuildBadge from "./components/dev/BuildBadge";
import SafeAreaDebugger from "./components/dev/SafeAreaDebugger";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: true,
      refetchOnMount: 'always',
      retry: 1,
    },
  },
});

const App = () => {
  // Configure StatusBar and Keyboard on app mount
  useEffect(() => {
    const configureStatusBar = async () => {
      try {
        // Don't overlay the webview - this prevents notch overlap
        await StatusBar.setOverlaysWebView({ overlay: false });
        // Set style to dark icons on light background (adjust based on theme)
        await StatusBar.setStyle({ style: Style.Dark });
        console.log('StatusBar configured successfully');
      } catch (error) {
        // StatusBar not available (web) - silently ignore
        console.log('StatusBar not available:', error);
      }
    };
    configureStatusBar();
    console.log('Build ID:', import.meta.env.VITE_BUILD_ID);

    // Configure keyboard handling on iOS
    if (Capacitor.getPlatform() === 'ios') {
      const setupKeyboard = async () => {
        try {
          // Prevent WKWebView from auto-resizing when keyboard opens
          await Keyboard.setResizeMode({ mode: 'none' as any });
          
          const showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
            document.documentElement.style.setProperty('--kb-height', `${info.keyboardHeight}px`);
            document.body.classList.add('keyboard-open');
          });

          const hideListener = await Keyboard.addListener('keyboardWillHide', () => {
            document.documentElement.style.setProperty('--kb-height', '0px');
            document.body.classList.remove('keyboard-open');
          });

          return () => {
            showListener.remove();
            hideListener.remove();
          };
        } catch (error) {
          console.log('Keyboard listeners not available:', error);
        }
      };

      setupKeyboard();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SafeAreaDebugger />
        <BuildBadge />
        <BrowserRouter>
          <div className="app-shell min-h-[100dvh] flex flex-col">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/reset" element={<ResetPassword />} />
              <Route path="/auth/request-reset" element={<RequestReset />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/invitations" element={
                <ProtectedRoute>
                  <Invitations />
                </ProtectedRoute>
              } />
              <Route path="/test-components" element={<TestComponents />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
