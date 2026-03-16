"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { LoginButton } from "@/components/login-button";
import type { AuthMe } from "@/lib/types";
import { Package, CheckSquare, FolderKanban, BarChart3 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    apiGet<AuthMe>("/auth/me")
      .then(() => {
        router.replace("/dashboard");
      })
      .catch(() => {
        setChecking(false);
      });
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-md space-y-8 px-4">
        {/* Logo / Brand */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]">
            <Package className="h-8 w-8 text-[var(--primary-foreground)]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            DeliverIt
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Keep your team focused and accountable
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 py-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--secondary)]">
              <CheckSquare className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">
              Readiness Checklists
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--secondary)]">
              <FolderKanban className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">
              Multi-Project
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--secondary)]">
              <BarChart3 className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">
              Dashboards
            </span>
          </div>
        </div>

        {/* Login */}
        <div className="flex flex-col items-center gap-4">
          <LoginButton />
          <p className="text-xs text-[var(--muted-foreground)]">
            Sign in with your organization account
          </p>
        </div>
      </div>
    </div>
  );
}
