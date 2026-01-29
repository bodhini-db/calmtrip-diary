import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Journal from "./pages/Journal";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import MapView from "./pages/MapView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Onboarding - shown first */}
          <Route path="/" element={<Onboarding />} />
          
          {/* Main App with Bottom Navigation */}
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* Map View - Full Screen */}
          <Route path="/map" element={<MapView />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
