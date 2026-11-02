"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const options = [
  { value: "light", icon: Sun, label: "Claro" },
  { value: "dark", icon: Moon, label: "Oscuro" },
  { value: "system", icon: Monitor, label: "Sistema" },
] as const;

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-[108px] rounded-md bg-card-2" />;

  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5">
      {options.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={cn(
              "inline-flex h-8 items-center justify-center gap-1.5 rounded px-2 text-xs",
              active ? "bg-card-2 text-foreground" : "text-muted hover:text-foreground",
            )}
            aria-label={option.label}
            title={option.label}
          >
            <Icon className="size-3.5" />
            {compact ? null : option.label}
          </button>
        );
      })}
    </div>
  );
}
