"use client";

import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
