"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutDashboard, FolderKanban, CheckSquare, Users, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface NavigationItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  keywords: string[];
  requiredPermission?: { resource: string; action: string };
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    keywords: ["dashboard", "home", "overview"],
  },
  {
    label: "Projects",
    path: "/projects",
    icon: <FolderKanban className="h-4 w-4" />,
    keywords: ["projects", "project"],
  },
  {
    label: "Tasks",
    path: "/tasks",
    icon: <CheckSquare className="h-4 w-4" />,
    keywords: ["tasks", "task", "todo"],
  },
  {
    label: "Users",
    path: "/admin/users",
    icon: <Users className="h-4 w-4" />,
    keywords: ["users", "user", "admin", "manage"],
    requiredPermission: { resource: "users", action: "view" },
  },
  {
    label: "Roles",
    path: "/admin/roles",
    icon: <Shield className="h-4 w-4" />,
    keywords: ["roles", "role", "permissions", "admin"],
    requiredPermission: { resource: "roles", action: "view" },
  },
];

export function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { hasPermission } = useAuth();

  const filteredItems = NAVIGATION_ITEMS.filter((item) => {
    if (
      item.requiredPermission &&
      !hasPermission(item.requiredPermission.resource, item.requiredPermission.action)
    ) {
      return false;
    }
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q))
    );
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const navigate = (path: string) => {
    setOpen(false);
    setQuery("");
    router.push(path);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      navigate(filteredItems[selectedIndex].path);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setQuery("");
          setSelectedIndex(0);
        }}
        className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--muted-foreground)]">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--popover)] shadow-lg">
            <div className="flex items-center border-b border-[var(--border)] px-3">
              <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)]"
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {filteredItems.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-[var(--muted-foreground)]">
                  No results found.
                </div>
              ) : (
                filteredItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm ${
                      index === selectedIndex
                        ? "bg-[var(--accent)] text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
