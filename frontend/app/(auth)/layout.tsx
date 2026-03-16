"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Sidebar, SidebarTrigger } from "@/components/sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { QuickSearch } from "@/components/quick-search";
import { ModeToggle } from "@/components/mode-toggle";

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { authMe, loading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !authMe) {
      router.replace("/");
    }
  }, [loading, authMe, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!authMe) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header bar */}
        <header className="flex h-14 items-center gap-4 border-b border-[var(--border)] bg-[var(--card)] px-4">
          <SidebarTrigger
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <Breadcrumbs />
          <div className="flex-1" />
          <QuickSearch />
          <ModeToggle />
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </AuthProvider>
  );
}
