"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "error" | "agent" | "copilot";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, variant = "default", size = "sm", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        {
          "bg-cascade-surface text-cascade-textMuted border border-cascade-border": variant === "default",
          "bg-cascade-primary/20 text-cascade-primary": variant === "primary",
          "bg-cascade-success/20 text-cascade-success": variant === "success",
          "bg-cascade-warning/20 text-cascade-warning": variant === "warning",
          "bg-cascade-error/20 text-cascade-error": variant === "error",
          "bg-cascade-agent/20 text-cascade-agent": variant === "agent",
          "bg-cascade-copilot/20 text-cascade-copilot": variant === "copilot",
        },
        {
          "px-1.5 py-0.5 text-[10px]": size === "sm",
          "px-2 py-0.5 text-xs": size === "md",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
