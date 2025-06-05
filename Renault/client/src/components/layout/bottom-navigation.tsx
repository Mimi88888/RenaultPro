import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, MapPin, Calendar, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

type BottomNavigationProps = {
  className?: string;
};

export function BottomNavigation({ className }: BottomNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string): boolean => location.pathname === path;

  const navItems: { icon: React.ComponentType; label: string; path: string }[] = [
    { icon: Home, label: "Home", path: "/" },
    { icon: MapPin, label: "Map", path: "/map" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <>
      {/* 📱 Mobile Navigation (Bottom) */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around py-2 z-10 md:hidden",
        className
      )}>
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            size="sm"
            className={cn(
              "flex flex-col items-center px-3 py-2 h-auto rounded-none",
              isActive(item.path) ? "text-primary" : "text-muted-foreground"
            )}
            onClick={() => navigate(item.path)}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </Button>
        ))}

        {/* Appointment button centered */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-5">
          <Button
            className="rounded-full h-12 w-12 p-0 shadow-lg"
            onClick={() => navigate("/appointment")}
          >
            <Calendar className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 🖥️ Desktop Sidebar Navigation */}
      <div className={cn(
        "hidden md:fixed md:mr-4 md:top-0 md:left-0 md:h-full md:w-64 bg-background border-r border-border md:flex md:flex-col z-10",
        className
      )}>
        {/* Logo or brand section */}
        <div className="flex items-center justify-center h-20 border-b border-border">
          <span className="font-bold text-xl">RenaultPro</span>
        </div>
        
        {/* Top navigation items with icons and text side by side */}
        <div className="flex flex-col mt-12 px-4">
          {navItems.map((item, index) => (
            <Button
              key={item.path}
              variant="ghost"
              size="default"
              className={cn(
                "flex flex-row items-center justify-start gap-3 w-full mb-2 h-10 px-3",
                index === 0 && "mt-3",
                isActive(item.path) ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          ))}
        </div>

        {/* Appointment button at the bottom */}
        <div className="mt-auto mb-8 px-4">
          <Button
            className="flex items-center justify-center gap-2 w-full"
            onClick={() => navigate("/appointment")}
          >
            <Calendar className="h-5 w-5" />
            <span>Appointment</span>
          </Button>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="md:ml-64 p-4">
        {/* Your main content goes here */}
      </div>
    </>
  );
}
