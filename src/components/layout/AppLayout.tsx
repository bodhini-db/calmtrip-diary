import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/navigation/BottomNav";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Outlet />
      <BottomNav />
    </div>
  );
}
