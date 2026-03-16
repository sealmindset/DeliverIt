"use client";

import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/lib/types";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  AlertTriangle,
} from "lucide-react";

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; className: string; icon: React.ReactNode }
> = {
  low: {
    label: "Low",
    className: "text-[var(--muted-foreground)]",
    icon: <ArrowDown className="h-3.5 w-3.5" />,
  },
  medium: {
    label: "Medium",
    className: "text-[var(--foreground)]",
    icon: <ArrowRight className="h-3.5 w-3.5" />,
  },
  high: {
    label: "High",
    className: "text-[var(--warning)]",
    icon: <ArrowUp className="h-3.5 w-3.5" />,
  },
  critical: {
    label: "Critical",
    className: "text-[var(--destructive)]",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        config.className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
