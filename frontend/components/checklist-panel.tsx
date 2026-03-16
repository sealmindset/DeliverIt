"use client";

import { useState, useCallback } from "react";
import { apiPut, apiPost, apiDelete } from "@/lib/api";
import type { ChecklistItem, ChecklistItemCreate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Plus, Trash2, GripVertical } from "lucide-react";

interface ChecklistPanelProps {
  taskId: string;
  items: ChecklistItem[];
  onUpdate: () => void;
  canEdit: boolean;
}

export function ChecklistPanel({
  taskId,
  items,
  onUpdate,
  canEdit,
}: ChecklistPanelProps) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const completed = items.filter((i) => i.is_completed).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const toggleItem = useCallback(
    async (item: ChecklistItem) => {
      await apiPut(`/checklists/${item.id}`, {
        is_completed: !item.is_completed,
      });
      onUpdate();
    },
    [taskId, onUpdate]
  );

  const addItem = useCallback(async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const body: ChecklistItemCreate = {
        title: newTitle.trim(),
        sort_order: items.length,
      };
      await apiPost(`/checklists`, { ...body, task_id: taskId });
      setNewTitle("");
      onUpdate();
    } finally {
      setAdding(false);
    }
  }, [newTitle, taskId, items.length, onUpdate]);

  const deleteItem = useCallback(
    async (itemId: string) => {
      await apiDelete(`/checklists/${itemId}`);
      onUpdate();
    },
    [taskId, onUpdate]
  );

  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[var(--card-foreground)]">
            Readiness Checklist
          </h3>
          <span className="text-sm text-[var(--muted-foreground)]">
            {completed}/{total}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              pct === 100
                ? "bg-[var(--success)]"
                : "bg-[var(--primary)]"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {sorted.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 px-4 py-3 group"
          >
            <GripVertical className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-50" />
            <button
              onClick={() => canEdit && toggleItem(item)}
              disabled={!canEdit}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                item.is_completed
                  ? "border-[var(--success)] bg-[var(--success)] text-[var(--success-foreground)]"
                  : "border-[var(--border)] hover:border-[var(--primary)]"
              )}
            >
              {item.is_completed && <Check className="h-3 w-3" />}
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                item.is_completed &&
                  "line-through text-[var(--muted-foreground)]"
              )}
            >
              {item.title}
            </span>
            {canEdit && (
              <button
                onClick={() => deleteItem(item.id)}
                className="text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 hover:text-[var(--destructive)] transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addItem();
              }}
              placeholder="Add checklist item..."
              className="flex-1 rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <button
              onClick={addItem}
              disabled={adding || !newTitle.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
