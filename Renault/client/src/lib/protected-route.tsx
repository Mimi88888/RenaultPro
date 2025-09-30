import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return React.createElement(
      "div",
      { className: "flex items-center justify-center min-h-screen bg-background" },
      React.createElement(Loader2, { className: "h-8 w-8 animate-spin text-primary" })
    );
  }

  if (!user) {
    return React.createElement(Navigate, {
      to: `/auth?redirect=${encodeURIComponent(location.pathname)}`,
      replace: true,
    });
  }

  return React.createElement(Component);
}
