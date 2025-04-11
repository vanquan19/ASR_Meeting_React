"use client";

import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import { Home, Users, Building2, Building } from "lucide-react";
import LogoutButton from "./LogoutButton";

const routes = [
  {
    label: "Tổng quan",
    icon: Home,
    href: "/dashboard",
    role: "ROLE_ADMIN",
  },
  {
    label: "Tài khoản",
    icon: Users,
    href: "/dashboard/accounts",
    role: "ROLE_ADMIN",
  },
  {
    label: "Phòng ban",
    icon: Building2,
    href: "/dashboard/rooms",
    role: "ROLE_ADMIN",
  },
  {
    label: "Phòng họp",
    icon: Building,
    href: "/dashboard/meeting-rooms",
    role: "ROLE_ADMIN",
  },
];

const Sidebar: React.FC = () => {
  const { hasPermission } = useAuth();

  return (
    <div className="flex h-full flex-col bg-white pt-7 z-10">
      <div className="flex-1 overflow-auto py-2 mt-16">
        <nav className="grid items-start px-2 text-sm">
          {routes.map((route) => {
            // Only show routes the user has permission to access
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!hasPermission(route.role as any)) return null;

            return (
              <NavLink
                key={route.href}
                to={route.href}
                end={true}
                className={({ isActive }) =>
                  cn(
                    "flex items-center flex-col gap-3 rounded-lg py-2 text-muted-foreground transition-all hover:text-blue-600",
                    isActive ? " text-blue-600" : "text-gray-600"
                  )
                }
              >
                <route.icon className="size-7" />
                {route.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <LogoutButton />
      </div>
    </div>
  );
};

export default Sidebar;
