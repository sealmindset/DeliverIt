"use client";

import { daysUntil, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface DeadlineIndicatorProps {
  deadline: string | null;
  status?: string;
}

export function DeadlineIndicator({ deadline, status }: DeadlineIndicatorProps) {
  if (!deadline) {
    return (
      <span className="text-sm text-[var(--muted-foreground)]">No deadline</span>
    );
  }

  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-[var(--success)]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {formatDate(deadline)}
      </span>
    );
  }

  const days = daysUntil(deadline);
  if (days === null) return <span className="text-sm">{formatDate(deadline)}</span>;

  let colorClass = "text-[var(--success)]";
  let Icon = CheckCircle2;
  let suffix = "";

  if (days < 0) {
    colorClass = "text-[var(--destructive)]";
    Icon = AlertCircle;
    suffix = `(${Math.abs(days)}d overdue)`;
  } else if (days <= 3) {
    colorClass = "text-[var(--warning)]";
    Icon = Clock;
    suffix = days === 0 ? "(today)" : `(${days}d left)`;
  } else {
    suffix = `(${days}d left)`;
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-sm", colorClass)}
    >
      <Icon className="h-3.5 w-3.5" />
      {formatDate(deadline)}
      <span className="text-xs">{suffix}</span>
    </span>
  );
}
