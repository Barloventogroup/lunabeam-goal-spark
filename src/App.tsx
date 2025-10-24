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
import { StatusBar, Style } from "@capacitor/status-bar";

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
  // Configure StatusBar on app mount
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
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
