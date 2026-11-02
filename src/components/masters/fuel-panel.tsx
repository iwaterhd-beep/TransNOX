"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Switch } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { createId, formatEUR3, formatDate } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import type { FuelProvider } from "@/lib/types";
import { Fuel, RefreshCw } from "lucide-react";
import { useState } from "react";

export function FuelPanel() {
  const providers = useAppStore((s) => s.fuelProviders);
  const market = useAppStore((s) => s.fuelMarket);
  const upsert = useAppStore((s) => s.upsertFuelProvider);
  const remove = useAppStore((s) => s.removeFuelProvider);
  const setFuelMarket = useAppStore((s) => s.setFuelMarket);
  const [editing, setEditing] = useState<FuelProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/fuel-prices");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setFuelMarket({
        updatedAt: data.updatedAt,
        diesel: data.diesel,
        petrol: data.petrol,
        byBrand: data.byBrand ?? {},
        source: "miteco",
      });
    } catch {
      setError("No se pudo leer MITEco. Usa precio manual.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Combustible</h1>
          <p className="text-sm text-muted">Precios MITEco (Andalucía / Sevilla) y descuento de tarjeta.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={() =>
              setEditing({
                id: createId("fuel"),
                name: "",
                discountPerLiter: 0.05,
                manualPricePerLiter: null,
                useLivePrice: true,
                brandQuery: "",
                active: true,
              })
            }
          >
            Alta
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="px-4 py-3">
          <p className="text-xs text-muted">Gasóleo A medio</p>
          <p className="font-mono text-2xl tabular-nums">{formatEUR3(market.diesel)}/L</p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs text-muted">Gasolina 95 media</p>
          <p className="font-mono text-2xl tabular-nums">{formatEUR3(market.petrol)}/L</p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs text-muted">Fuente</p>
          <p className="text-sm font-medium">{market.source === "miteco" ? "MITEco" : "Manual"}</p>
          <p className="text-xs text-muted">
            {market.updatedAt ? formatDate(market.updatedAt.slice(0, 10)) : "Sin actualizar"}
          </p>
        </Card>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {providers.map((provider) => {
          const branded = market.byBrand[provider.brandQuery.toLowerCase()];
          return (
            <Card key={provider.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Fuel className="size-4 text-accent" />
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-xs text-muted">Descuento {formatEUR3(provider.discountPerLiter)}/L</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(provider)}>
                  Editar
                </Button>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted">Precio live marca</dt>
                  <dd className="font-mono tabular-nums">{branded ? `${formatEUR3(branded.diesel)}/L` : "Media plaza"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Modo</dt>
                  <dd>{provider.useLivePrice ? "API MITEco" : `Manual ${formatEUR3(provider.manualPricePerLiter ?? 0)}/L`}</dd>
                </div>
              </dl>
            </Card>
          );
        })}
      </div>

      <Modal open={Boolean(editing)} title="Proveedor de combustible" onClose={() => setEditing(null)}>
        {editing ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              upsert(editing);
              setEditing(null);
            }}
          >
            <Field label="Proveedor">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            </Field>
            <Field label="Clave de marca (cepsa, repsol, plenoil, bp)">
              <Input value={editing.brandQuery} onChange={(e) => setEditing({ ...editing, brandQuery: e.target.value })} />
            </Field>
            <Field label="Descuento corporativo (€/L)">
              <Input type="number" step="0.001" value={editing.discountPerLiter} onChange={(e) => setEditing({ ...editing, discountPerLiter: Number(e.target.value) })} />
            </Field>
            <Switch
              checked={editing.useLivePrice}
              onChange={(useLivePrice) => setEditing({ ...editing, useLivePrice })}
              label="Usar precio MITEco"
            />
            {!editing.useLivePrice ? (
              <Field label="Precio manual (€/L)">
                <Input
                  type="number"
                  step="0.001"
                  value={editing.manualPricePerLiter ?? 0}
                  onChange={(e) => setEditing({ ...editing, manualPricePerLiter: Number(e.target.value) })}
                />
              </Field>
            ) : null}
            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="danger" onClick={() => { remove(editing.id); setEditing(null); }}>
                Eliminar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
