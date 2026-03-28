import { Home, BookOpen, BarChart3, Settings, Rss, Compass } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Rss, label: "Feed", path: "/feed" },
  { icon: Compass, label: "Discover", path: "/discover" },
  { icon: BookOpen, label: "Journal", path: "/journal" },
  { icon: BarChart3, label: "Stats", path: "/stats" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 safe-bottom z-50">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300",
                isActive ? "text-forest" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-forest"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
