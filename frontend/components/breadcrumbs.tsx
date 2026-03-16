"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  tasks: "Tasks",
  admin: "Admin",
  users: "Users",
  roles: "Roles",
};

// Cache for resolved entity names
const nameCache: Record<string, string> = {};

function useDynamicLabel(segment: string, fullPath: string): string | null {
  const [label, setLabel] = useState<string | null>(
    nameCache[fullPath] || null
  );

  useEffect(() => {
    // Only resolve UUIDs (skip known segment labels)
    if (SEGMENT_LABELS[segment] || !/^[0-9a-f-]{36}$/i.test(segment)) return;
    if (nameCache[fullPath]) {
      setLabel(nameCache[fullPath]);
      return;
    }

    // Determine which API to call based on path context
    const parts = fullPath.split("/").filter(Boolean);
    const parentSegment = parts[parts.length - 2];

    let apiPath = "";
    if (parentSegment === "projects") apiPath = `/projects/${segment}`;
    else if (parentSegment === "tasks") apiPath = `/tasks/${segment}`;

    if (!apiPath) return;

    apiGet<{ name?: string; title?: string }>(apiPath)
      .then((data) => {
        const name = data.name || data.title || segment;
        nameCache[fullPath] = name;
        setLabel(name);
      })
      .catch(() => {
        setLabel(segment.slice(0, 8) + "...");
      });
  }, [segment, fullPath]);

  return label;
}

interface BreadcrumbSegmentProps {
  segment: string;
  fullPath: string;
  isLast: boolean;
}

function BreadcrumbSegment({
  segment,
  fullPath,
  isLast,
}: BreadcrumbSegmentProps) {
  const dynamicLabel = useDynamicLabel(segment, fullPath);
  const staticLabel = SEGMENT_LABELS[segment];
  const displayLabel = staticLabel || dynamicLabel || segment;

  if (isLast) {
    return (
      <span className="text-sm font-medium text-[var(--foreground)]">
        {displayLabel}
      </span>
    );
  }

  return (
    <Link
      href={fullPath}
      className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
    >
      {displayLabel}
    </Link>
  );
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
      <Link
        href="/dashboard"
        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, index) => {
        const fullPath = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;

        return (
          <span key={fullPath} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <BreadcrumbSegment
              segment={segment}
              fullPath={fullPath}
              isLast={isLast}
            />
          </span>
        );
      })}
    </nav>
  );
}
