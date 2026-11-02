"use client";

import { Badge, Card, Stat } from "@/components/ui/card";
import { clientRanking, closeMonth, vehicleRanking } from "@/lib/calc/dashboard";
import { currentMonthKey, formatEUR, formatKm, formatNum, formatPct, monthLabel, monthKey } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function OpsDashboard() {
  const trips = useAppStore((s) => s.trips);
  const invoices = useAppStore((s) => s.invoices);
  const clients = useAppStore((s) => s.clients);
  const vehicles = useAppStore((s) => s.vehicles);
  const company = useAppStore((s) => s.company);

  const months = useMemo(() => {
    const keys = new Set<string>([currentMonthKey(), "2026-10"]);
    invoices.forEach((invoice) => keys.add(monthKey(invoice.issueDate)));
    trips.forEach((trip) => keys.add(monthKey(trip.date)));
    return [...keys].sort().reverse();
  }, [invoices, trips]);
  const [month, setMonth] = useState(months.includes("2026-10") ? "2026-10" : months[0]);
  const close = closeMonth(month, trips, invoices, company);
  const clientsRank = clientRanking(month, trips, clients);
  const vehiclesRank = vehicleRanking(month, trips, vehicles);

  const chartData = [
    { name: "Ingresos", value: close.taxableIncome },
    { name: "Combustible", value: close.fuel },
    { name: "Nómina", value: close.payroll },
    { name: "Desgaste", value: close.maintenance },
    { name: "Extras", value: close.extras },
    { name: "Impuestos", value: close.taxReserveTotal },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Cierre operativo</h1>
          <p className="text-sm text-muted">{company.tradeName} · {monthLabel(month)}</p>
        </div>
        <select
          className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          {months.map((key) => (
            <option key={key} value={key}>
              {monthLabel(key)}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg bg-sidebar px-5 py-6 text-sidebar-fg">
        <p className="text-xs font-medium tracking-wide text-sidebar-muted uppercase">
          Beneficio neto real limpio
        </p>
        <p className="mt-2 font-mono text-4xl tabular-nums">{formatEUR(close.netCleanProfit)}</p>
        <p className="mt-2 text-sm text-sidebar-muted">
          Base imponible menos costes operativos e impuesto de sociedades / IRPF estimado. El IVA a ingresar va a la hucha, no al P&L.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Facturación bruta" value={formatEUR(close.invoicedGross)} hint="Con IVA y retenciones" />
        <Stat label="Ingresos netos" value={formatEUR(close.taxableIncome)} hint="Base imponible" />
        <Stat label="Gastos operativos" value={formatEUR(close.operatingCosts)} tone="danger" />
        <Stat label="Reserva Hacienda" value={formatEUR(close.taxReserveTotal)} tone="warning" />
        <Stat label="€ / km" value={formatEUR(close.profitPerKm)} tone="accent" hint="Beneficio limpio por km" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Desglose del mes</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <Tooltip
                  formatter={(value) => formatEUR(Number(value ?? 0))}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
                />
                <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>Combustible <span className="float-right font-mono tabular-nums">{formatEUR(close.fuel)}</span></div>
            <div>Nómina / SS <span className="float-right font-mono tabular-nums">{formatEUR(close.payroll)}</span></div>
            <div>Mantenimiento <span className="float-right font-mono tabular-nums">{formatEUR(close.maintenance)}</span></div>
            <div>Gastos extra <span className="float-right font-mono tabular-nums">{formatEUR(close.extras)}</span></div>
          </dl>
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-semibold">KPIs logísticos</h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Rutas del mes</dt>
              <dd className="font-mono tabular-nums">{close.routeCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Kilómetros</dt>
              <dd className="font-mono tabular-nums">{formatKm(close.km)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Km en vacío</dt>
              <dd className="font-mono tabular-nums">{formatKm(close.emptyKm)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Ratio vacío</dt>
              <dd className="font-mono tabular-nums">
                {close.km > 0 ? formatPct((close.emptyKm / close.km) * 100) : "0,00 %"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Ocupación palets</dt>
              <dd className="font-mono tabular-nums">{formatNum(close.occupancyAvg, 0)}%</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Ranking de clientes</h2>
            <p className="text-xs text-muted">Por margen bruto real del mes</p>
          </div>
          <ul>
            {clientsRank.map((row) => (
              <li key={row.client.id} className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 last:border-0">
                <div>
                  <p className="text-sm">{row.client.name}</p>
                  <p className="text-xs text-muted">{row.trips} rutas · {formatEUR(row.sale)}</p>
                </div>
                <Badge tone={row.marginPct < 15 ? "danger" : row.marginPct <= 25 ? "warning" : "success"}>
                  {formatPct(row.marginPct)}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Ranking de vehículos</h2>
            <p className="text-xs text-muted">Menor coste operativo por km primero</p>
          </div>
          <ul>
            {vehiclesRank.map((row) => (
              <li key={row.vehicle.id} className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 last:border-0">
                <div>
                  <p className="font-mono text-sm">{row.vehicle.plate}</p>
                  <p className="text-xs text-muted">
                    {row.vehicle.brand} {row.vehicle.model} · {formatKm(row.km)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm tabular-nums">{formatEUR(row.costPerKm)}/km</p>
                  <p className="text-xs text-muted">{formatPct(row.marginPct)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
