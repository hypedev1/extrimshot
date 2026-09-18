import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Analytics } from "@vercel/analytics/react";
import { trackPageView } from "@/lib/fbPixel";
import { trackTtPageView } from "@/lib/tiktokPixel";

// Eagerly loaded — these are on the critical path for all visitors
import ProductPage from "./pages/ProductPage";
import NotFound from "./pages/NotFound";
import ThankYou from "./pages/ThankYou";

// PageView tracking for the initial load and every SPA navigation.
// index.html only calls fbq('init'), never fbq('track', 'PageView'), so the
// first PageView is fired here too. That way the browser event and the CAPI
// event always share one eventID and Meta deduplicates them correctly.
const RouteTracker = () => {
  const location = useLocation();
  // index.html already calls ttq.page() for the initial load, so the TikTok
  // page view is only fired from the second navigation onwards. Firing it here
  // too would double-count the landing page.
  const ttInitialPageViewSkipped = useRef(false);

  useEffect(() => {
    trackPageView(window.location.href);

    if (ttInitialPageViewSkipped.current) {
      trackTtPageView();
    } else {
      ttInitialPageViewSkipped.current = true;
    }
  }, [location.pathname, location.search]);

  return null;
};

// Lazily loaded — admin-only pages: not needed by public visitors at all
const Home = lazy(() => import("./pages/Home"));
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminIncompleteOrders = lazy(() => import("./pages/AdminIncompleteOrders"));
const AdminFraudAttempts = lazy(() => import("./pages/AdminFraudAttempts"));
const AdminBlockedAttempts = lazy(() => import("./pages/AdminBlockedAttempts"));
const AdminBlockedNumbers = lazy(() => import("./pages/AdminBlockedNumbers"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminHeadsUp = lazy(() => import("./pages/AdminHeadsUp"));

// Minimal fallback shown while lazy chunks load
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteTracker />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<ProductPage />} />
              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="/admin/auth" element={<AdminAuth />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/heads-up" element={<AdminHeadsUp />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/incomplete-orders" element={<AdminIncompleteOrders />} />
              <Route path="/admin/fraud-attempts" element={<AdminFraudAttempts />} />
              <Route path="/admin/blocked-attempts" element={<AdminBlockedAttempts />} />
              <Route path="/admin/blocked-numbers" element={<AdminBlockedNumbers />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
    <Analytics />
  </QueryClientProvider>
);

export default App;
