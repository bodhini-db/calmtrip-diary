import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ icon, label, value, trend, trendUp, className }: StatCardProps) {
  return (
    <div className={cn("stat-card flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-forest">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold font-display text-foreground">{value}</span>
        {trend && (
          <span className={cn(
            "text-xs font-medium flex items-center gap-1",
            trendUp ? "text-forest" : "text-muted-foreground"
          )}>
            {trendUp && "↑"} {trend}
          </span>
        )}
      </div>
    </div>
  );
}
