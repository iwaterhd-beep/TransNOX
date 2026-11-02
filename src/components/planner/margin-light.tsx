import { MARGIN_COPY } from "@/lib/calc/costs";
import { cn } from "@/lib/cn";
import { formatEUR, formatPct } from "@/lib/format";
import type { MarginResult } from "@/lib/types";

export function MarginLight({ margin, compact = false }: { margin: MarginResult; compact?: boolean }) {
  const copy = MARGIN_COPY[margin.light];
  const tone = {
    red: "bg-danger text-white",
    yellow: "bg-warning text-accent-fg",
    green: "bg-success text-white",
    neutral: "bg-card-2 text-foreground",
  }[margin.light];

  if (compact) {
    return (
      <div className={cn("flex items-center justify-between gap-3 rounded-md px-3 py-2", tone)}>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">{copy.title}</p>
          <p className="font-mono text-lg tabular-nums">{formatPct(margin.pct)}</p>
        </div>
        <p className="font-mono text-lg tabular-nums">{formatEUR(margin.euros)}</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg px-4 py-5", tone)}>
      <p className="text-xs font-semibold tracking-wide uppercase opacity-80">Semáforo de margen</p>
      <p className="mt-2 font-mono text-4xl leading-none tabular-nums">{formatPct(margin.pct)}</p>
      <p className="mt-2 font-mono text-xl tabular-nums">{formatEUR(margin.euros)}</p>
      <p className="mt-3 max-w-sm text-sm opacity-90">{copy.detail}</p>
    </div>
  );
}
