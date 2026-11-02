"use client";

import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { formatDate, formatEUR, formatPct } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { Map } from "lucide-react";
import Link from "next/link";

const tones = {
  red: "danger",
  yellow: "warning",
  green: "success",
  neutral: "neutral",
} as const;

const statusLabel = {
  draft: "Borrador",
  completed: "Completada",
  invoiced: "Facturada",
} as const;

export function TripList() {
  const trips = useAppStore((s) => s.trips);
  const clients = useAppStore((s) => s.clients);
  const vehicles = useAppStore((s) => s.vehicles);
  const completeTrip = useAppStore((s) => s.completeTrip);
  const removeTrip = useAppStore((s) => s.removeTrip);
  const sorted = [...trips].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Rutas</h1>
          <p className="text-sm text-muted">Historial con auditoría de margen congelada al guardar.</p>
        </div>
        <Link href="/planificador">
          <Button size="sm">Nueva ruta</Button>
        </Link>
      </div>
      {sorted.length === 0 ? (
        <EmptyState
          icon={Map}
          title="Sin rutas"
          description="Planifica la primera para ver km, coste directo y semáforo."
          actionLabel="Planificar"
          onAction={() => {
            window.location.href = "/planificador";
          }}
        />
      ) : (
        <>
        <div className="flex flex-col gap-3 md:hidden">
          {sorted.map((trip) => (
            <Card key={trip.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{trip.reference}</p>
                  <p className="text-xs text-muted">
                    {formatDate(trip.date)} · {clients.find((c) => c.id === trip.clientId)?.name}
                  </p>
                </div>
                <Badge tone={tones[trip.margin.light]}>{formatPct(trip.margin.pct)}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-mono tabular-nums">{formatEUR(trip.margin.euros)}</span>
                <Link href={`/planificador?id=${trip.id}`}>
                  <Button variant="ghost" size="sm">
                    Abrir
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-card-2 text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Servicio</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Vehículo</th>
                <th className="px-3 py-2 font-medium">Venta</th>
                <th className="px-3 py-2 font-medium">Coste</th>
                <th className="px-3 py-2 font-medium">Margen</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((trip) => (
                <tr key={trip.id} className="border-t border-border">
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(trip.date)}</td>
                  <td className="px-3 py-2">{trip.reference}</td>
                  <td className="px-3 py-2">{clients.find((c) => c.id === trip.clientId)?.name}</td>
                  <td className="px-3 py-2 font-mono">{vehicles.find((v) => v.id === trip.vehicleId)?.plate}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{formatEUR(trip.margin.sale)}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{formatEUR(trip.costs.total)}</td>
                  <td className="px-3 py-2">
                    <Badge tone={tones[trip.margin.light]}>
                      {formatPct(trip.margin.pct)} · {formatEUR(trip.margin.euros)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">{statusLabel[trip.status]}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Link href={`/planificador?id=${trip.id}`}>
                        <Button variant="ghost" size="sm">
                          Abrir
                        </Button>
                      </Link>
                      {trip.status === "draft" ? (
                        <Button variant="ghost" size="sm" onClick={() => completeTrip(trip.id)}>
                          Completar
                        </Button>
                      ) : null}
                      {trip.status !== "invoiced" ? (
                        <Button variant="ghost" size="sm" onClick={() => removeTrip(trip.id)}>
                          Borrar
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
