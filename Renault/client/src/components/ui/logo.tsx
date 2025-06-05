import React from "react";
import { cn } from "@/lib/utils";
import logo2 from '@/assets/logo2.png';

export interface LogoProps {
  className?: string;
  darkMode?: boolean;
}

export function Logo({ className, darkMode = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img src={logo2} alt="Logo" className="h-20 w-20" />
      <span 
        className={cn(
          "font-bold text-xl tracking-tight",
          darkMode ? "text-white" : "text-primary"
        )}
      >
        RenaultPro
      </span>
    </div>
  );
}
