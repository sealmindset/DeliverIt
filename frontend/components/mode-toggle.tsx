"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium hover:bg-[var(--accent)] h-9 w-9">
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  const icon =
    theme === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : theme === "light" ? (
      <Sun className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium hover:bg-[var(--accent)] h-9 w-9"
        aria-label="Toggle theme"
      >
        {icon}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-md border border-[var(--border)] bg-[var(--popover)] p-1 shadow-md">
            {[
              { value: "light", label: "Light", Icon: Sun },
              { value: "dark", label: "Dark", Icon: Moon },
              { value: "system", label: "System", Icon: Monitor },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-[var(--accent)] ${
                  theme === value
                    ? "text-[var(--foreground)] font-medium"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
