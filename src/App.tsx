import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import Onboarding from "./pages/Onboarding";
import ConfirmPending from "./pages/ConfirmPending";
import AuthConfirm from "./pages/AuthConfirm";
import Feed from "./pages/Feed";
import Discover from "./pages/Discover";
import Home from "./pages/Home";
import Journal from "./pages/Journal";
import Profile from "./pages/Profile";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import MapView from "./pages/MapView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Redirects unauthenticated users to / and shows a spinner while loading. */
function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🧳</div>
          <p className="text-muted-foreground">Loading CalmTrip...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  // Render the matched child route (AppLayout uses <Outlet /> internally)
  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Onboarding / auth */}
          <Route path="/" element={<Onboarding />} />
          <Route path="/confirm-pending" element={<ConfirmPending />} />
          <Route path="/auth/confirm" element={<AuthConfirm />} />

          {/* Protected routes with bottom nav */}
          <Route element={<ProtectedLayout />}>
            <Route element={<AppLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/journal/:userId" element={<Journal />} />
              <Route path="/journal/:userId/:tripId" element={<Journal />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Map view — full screen, still protected */}
          <Route element={<ProtectedLayout />}>
            <Route path="/map" element={<MapView />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
