import React from "react";
import { cn } from "@/lib/utils";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function Heading({
  as: Component = "h2",
  className,
  children,
  ...props
}: HeadingProps) {
  return (
    <Component
      className={cn(
        "scroll-m-20 tracking-tight",
        Component === "h1" && "text-4xl font-extrabold lg:text-5xl",
        Component === "h2" && "text-3xl font-semibold",
        Component === "h3" && "text-2xl font-semibold",
        Component === "h4" && "text-xl font-semibold",
        Component === "h5" && "text-lg font-semibold",
        Component === "h6" && "text-base font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}