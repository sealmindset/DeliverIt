"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Shield,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Package,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LogoutButton } from "./logout-button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requiredPermission?: { resource: string; action: string };
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Projects",
    path: "/projects",
    icon: <FolderKanban className="h-5 w-5" />,
  },
  {
    label: "Tasks",
    path: "/tasks",
    icon: <CheckSquare className="h-5 w-5" />,
  },
  {
    label: "Admin",
    path: "/admin",
    icon: <Shield className="h-5 w-5" />,
    requiredPermission: { resource: "users", action: "view" },
    children: [
      {
        label: "Users",
        path: "/admin/users",
        icon: <Users className="h-4 w-4" />,
        requiredPermission: { resource: "users", action: "view" },
      },
      {
        label: "Roles",
        path: "/admin/roles",
        icon: <Shield className="h-4 w-4" />,
        requiredPermission: { resource: "roles", action: "view" },
      },
    ],
  },
];

function NavLink({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
}) {
  const { hasPermission } = useAuth();
  const [expanded, setExpanded] = useState(pathname.startsWith(item.path));

  if (
    item.requiredPermission &&
    !hasPermission(item.requiredPermission.resource, item.requiredPermission.action)
  ) {
    return null;
  }

  const isActive =
    pathname === item.path || pathname.startsWith(item.path + "/");

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "text-[var(--foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          )}
        >
          {item.icon}
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </button>
        {expanded && !collapsed && (
          <div className="ml-4 mt-1 space-y-1 border-l border-[var(--border)] pl-3">
            {item.children.map((child) => (
              <NavLink
                key={child.path}
                item={child}
                collapsed={collapsed}
                pathname={pathname}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.path}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-[var(--accent)] text-[var(--foreground)]"
          : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
      )}
      title={collapsed ? item.label : undefined}
    >
      {item.icon}
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { authMe } = useAuth();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-[var(--border)] bg-[var(--card)] transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-[var(--border)] px-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Package className="h-6 w-6 text-[var(--primary)]" />
          {!collapsed && (
            <span className="text-lg font-bold text-[var(--foreground)]">
              DeliverIt
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
          />
        ))}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-[var(--border)] p-3">
        {!collapsed && authMe && (
          <div className="mb-2 truncate px-2 text-xs text-[var(--muted-foreground)]">
            {authMe.name}
          </div>
        )}
        <LogoutButton />
      </div>
    </aside>
  );
}

export function SidebarTrigger({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center justify-center rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] h-9 w-9"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? (
        <PanelLeft className="h-5 w-5" />
      ) : (
        <PanelLeftClose className="h-5 w-5" />
      )}
    </button>
  );
}
