"use client";

import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import { CalendarDays, Home, Users, Building2, User } from "lucide-react";
import LogoutButton from "./LogoutButton";

const routes = [
  {
    label: "Tổng quan",
    icon: Home,
    href: "/dashboard",
    role: "user",
  },
  {
    label: "Phòng họp",
    icon: Building2,
    href: "/dashboard/rooms",
    role: "user",
  },
  {
    label: "Tài khoản",
    icon: Users,
    href: "/dashboard/accounts",
    role: "manager",
  },
  {
    label: "Cuộc họp",
    icon: CalendarDays,
    href: "/dashboard/meetings",
    role: "user",
  },
  {
    label: "Trang cá nhân",
    icon: User,
    href: "/dashboard/profile",
    role: "user",
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
                className={({ isActive }) =>
                  cn(
                    "flex items-center flex-col gap-3 rounded-lg py-2 text-muted-foreground text-gray-600 transition-all hover:text-black",
                    isActive && "bg-muted font-medium text-black"
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
