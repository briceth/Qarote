import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

const NavItem = ({ href, label, icon, onClick }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <NavLink
      to={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "hover:bg-secondary hover:text-secondary-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

interface NavProps {
  onNavItemClick?: () => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavProps> = ({
  onNavItemClick,
  onLogout,
}) => {
  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      href: "/feedback",
      label: "Feedback",
      icon: <MessageSquare size={18} />,
    },
    {
      href: "/users",
      label: "Users",
      icon: <Users size={18} />,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings size={18} />,
    },
  ];

  return (
    <nav className="space-y-2 px-2 py-5">
      <div className="mb-10 px-2">
        <h2 className="mb-2 px-2 text-lg font-semibold">Rabbit Scout Admin</h2>
      </div>

      <div className="space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            onClick={onNavItemClick}
          />
        ))}
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </nav>
  );
};
