"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cascade-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-cascade-primary text-cascade-bg hover:bg-cascade-primaryHover": variant === "primary",
            "bg-cascade-surface text-cascade-text border border-cascade-border hover:bg-cascade-surfaceHover": variant === "secondary",
            "text-cascade-text hover:bg-cascade-surfaceHover": variant === "ghost",
            "bg-cascade-error/20 text-cascade-error hover:bg-cascade-error/30": variant === "danger",
          },
          {
            "h-7 px-2 text-xs gap-1": size === "sm",
            "h-8 px-3 text-sm gap-1.5": size === "md",
            "h-10 px-4 text-base gap-2": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
