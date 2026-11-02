"use client";

import { Stat } from "@/components/ui/card";
import { closeMonth } from "@/lib/calc/dashboard";
import { currentMonthKey, formatEUR, formatPct, monthLabel, monthKey } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { useMemo, useState } from "react";

export function TaxPanel() {
  const invoices = useAppStore((s) => s.invoices);
  const trips = useAppStore((s) => s.trips);
  const company = useAppStore((s) => s.company);
  const months = useMemo(() => {
    const keys = new Set<string>([currentMonthKey(), "2026-10", "2026-11"]);
    invoices.forEach((invoice) => keys.add(monthKey(invoice.issueDate)));
    trips.forEach((trip) => keys.add(monthKey(trip.date)));
    return [...keys].sort().reverse();
  }, [invoices, trips]);
  const [month, setMonth] = useState(months.includes("2026-10") ? "2026-10" : (months[0] ?? currentMonthKey()));
  const close = closeMonth(month, trips, invoices, company);
  const model = company.legalForm === "autonomo" ? "Modelo 130" : "Modelo 202 / IS";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Hucha fiscal</h1>
          <p className="text-sm text-muted">
            Reserva exacta para liquidaciones. IVA (303) y {model}.
          </p>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs text-muted">Periodo</span>
          <select
            className="h-10 rounded-md border border-border bg-card px-3"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {months.map((key) => (
              <option key={key} value={key}>
                {monthLabel(key)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-lg bg-sidebar px-5 py-6 text-sidebar-fg">
        <p className="text-xs font-medium tracking-wide text-sidebar-muted uppercase">
          Fondo de reserva tributaria recomendado
        </p>
        <p className="mt-2 font-mono text-4xl tabular-nums">{formatEUR(close.taxReserveTotal)}</p>
        <p className="mt-2 max-w-xl text-sm text-sidebar-muted">
          Esta cantidad debe quedar apartada en banco. No es beneficio distribuible.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="IVA repercutido" value={formatEUR(close.ivaRepercutido)} hint="Facturado 21%" />
        <Stat label="IVA soportado" value={formatEUR(close.ivaSoportado)} hint="Combustible, peajes, parking, AdBlue" />
        <Stat label="IVA a ingresar (303)" value={formatEUR(close.ivaAIngresar)} tone="warning" />
        <Stat
          label={company.legalForm === "autonomo" ? "Reserva IRPF 130" : "Reserva IS"}
          value={formatEUR(close.taxReserveIs)}
          hint={formatPct((company.legalForm === "autonomo" ? company.autonomoIrpfRate : company.isRate) * 100)}
        />
      </div>
      <p className="text-sm text-muted">
        El IVA soportado se calcula al 21% sobre combustible y extras deducibles de las rutas del mes. El desgaste
        imputado no genera factura, así que no entra en el 303.
      </p>
    </div>
  );
}
