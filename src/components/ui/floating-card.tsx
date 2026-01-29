import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import React from "react";

interface FloatingCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const FloatingCard = React.forwardRef<HTMLDivElement, FloatingCardProps>(
  ({ children, className, hover = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "bg-card rounded-2xl p-5 shadow-card border border-border/30",
          hover && "hover:shadow-float transition-shadow duration-300",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

FloatingCard.displayName = "FloatingCard";
