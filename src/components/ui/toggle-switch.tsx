import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
}

export function ToggleSwitch({ checked, onChange, label, description, className }: ToggleSwitchProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {(label || description) && (
        <div className="flex-1">
          {label && <p className="font-medium text-foreground">{label}</p>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          checked ? "bg-forest" : "bg-muted"
        )}
      >
        <motion.div
          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
          animate={{ left: checked ? 28 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
