"use client";

import { MarginLight } from "@/components/planner/margin-light";
import { AddressSearch } from "@/components/planner/address-search";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { evaluateTrip, liveFuelUnitPrice, netEnergyPrice } from "@/lib/calc/costs";
import { createId, formatEUR, formatEUR3, formatHoursMinutes, formatKm, todayISO } from "@/lib/format";
import { DEFAULT_DESTINATION, DEFAULT_ORIGIN } from "@/lib/store/seed";
import { useAppStore } from "@/lib/store/app-store";
import type { GeocodeHit, PricingMode, RouteStop, RoutingResult, Trip } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const RouteMap = dynamic(() => import("@/components/planner/route-map"), { ssr: false });

function stopFromHit(kind: RouteStop["kind"], hit: GeocodeHit, pallets = 0): RouteStop {
  return { id: createId("stop"), kind, pallets, ...hit };
}

export function RoutePlanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const trips = useAppStore((s) => s.trips);
  const vehiclesAll = useAppStore((s) => s.vehicles);
  const driversAll = useAppStore((s) => s.drivers);
  const clientsAll = useAppStore((s) => s.clients);
  const fuelProvidersAll = useAppStore((s) => s.fuelProviders);
  const vehicles = useMemo(() => vehiclesAll.filter((item) => item.active), [vehiclesAll]);
  const drivers = useMemo(() => driversAll.filter((item) => item.active), [driversAll]);
  const clients = useMemo(() => clientsAll.filter((item) => item.active), [clientsAll]);
  const fuelProviders = useMemo(
    () => fuelProvidersAll.filter((item) => item.active),
    [fuelProvidersAll],
  );
  const company = useAppStore((s) => s.company);
  const fuelMarket = useAppStore((s) => s.fuelMarket);
  const setFuelMarket = useAppStore((s) => s.setFuelMarket);
  const upsertTrip = useAppStore((s) => s.upsertTrip);

  const existing = trips.find((trip) => trip.id === editId);

  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [reference, setReference] = useState(existing?.reference ?? "Servicio paletería");
  const [vehicleId, setVehicleId] = useState(existing?.vehicleId ?? vehicles[0]?.id ?? "");
  const [driverId, setDriverId] = useState(existing?.driverId ?? drivers[0]?.id ?? "");
  const [clientId, setClientId] = useState(existing?.clientId ?? clients[0]?.id ?? "");
  const [fuelProviderId, setFuelProviderId] = useState(existing?.fuelProviderId ?? fuelProviders[0]?.id ?? "");
  const [roundTrip, setRoundTrip] = useState(existing?.roundTrip ?? true);
  const [origin, setOrigin] = useState<RouteStop>(
    existing?.stops.find((s) => s.kind === "origin") ?? stopFromHit("origin", DEFAULT_ORIGIN),
  );
  const [destination, setDestination] = useState<RouteStop>(
    existing?.stops.find((s) => s.kind === "destination") ?? stopFromHit("destination", DEFAULT_DESTINATION, 8),
  );
  const [waypoints, setWaypoints] = useState<RouteStop[]>(
    existing?.stops.filter((s) => s.kind === "waypoint") ?? [],
  );
  const [distanceKm, setDistanceKm] = useState(existing?.distanceKm ?? 0);
  const [drivingMinutes, setDrivingMinutes] = useState(existing?.drivingMinutes ?? 0);
  const [loadWaitMinutes, setLoadWaitMinutes] = useState(existing?.loadWaitMinutes ?? 90);
  const [geometry, setGeometry] = useState<[number, number][]>(existing?.geometry ?? []);
  const [routing, setRouting] = useState(false);
  const [extras, setExtras] = useState(existing?.extras ?? { tolls: 0, meals: 15, parking: 0, adblue: 8 });
  const [pricingMode, setPricingMode] = useState<PricingMode>(existing?.pricingMode ?? "closed");
  const [closedPrice, setClosedPrice] = useState(existing?.closedPrice ?? 245);
  const [pricePerPallet, setPricePerPallet] = useState(existing?.pricePerPallet ?? 32);
  const [pallets, setPallets] = useState(existing?.pallets ?? 8);
  const [pricePerKm, setPricePerKm] = useState(existing?.pricePerKm ?? 1.15);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saved, setSaved] = useState(false);

  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? vehicles[0];
  const driver = drivers.find((item) => item.id === driverId) ?? drivers[0];
  const provider = fuelProviders.find((item) => item.id === fuelProviderId) ?? fuelProviders[0];

  const stops = useMemo(() => [origin, ...waypoints, destination], [origin, waypoints, destination]);

  useEffect(() => {
    fetch("/api/fuel-prices")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.diesel) return;
        setFuelMarket({
          updatedAt: data.updatedAt,
          diesel: data.diesel,
          petrol: data.petrol,
          byBrand: data.byBrand ?? {},
          source: "miteco",
        });
      })
      .catch(() => undefined);
  }, [setFuelMarket]);

  useEffect(() => {
    const points = stops.filter((stop) => stop.lat && stop.lng).map((stop) => ({ lat: stop.lat, lng: stop.lng }));
    if (points.length < 2) return;
    const handle = window.setTimeout(async () => {
      setRouting(true);
      try {
        const response = await fetch("/api/routing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points, roundTrip }),
        });
        const data = (await response.json()) as RoutingResult;
        if (data.distanceKm) {
          setDistanceKm(data.distanceKm);
          setDrivingMinutes(data.drivingMinutes);
          setGeometry(data.geometry ?? []);
        }
      } finally {
        setRouting(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [stops, roundTrip]);

  const evaluated = useMemo(() => {
    if (!vehicle || !driver || !provider) return null;
    return evaluateTrip(
      {
        distanceKm,
        drivingMinutes,
        loadWaitMinutes,
        roundTrip,
        pallets,
        extras,
        pricingMode,
        closedPrice,
        pricePerPallet,
        pricePerKm,
      },
      vehicle,
      driver,
      provider,
      company,
      fuelMarket,
    );
  }, [
    vehicle,
    driver,
    provider,
    company,
    fuelMarket,
    distanceKm,
    drivingMinutes,
    loadWaitMinutes,
    roundTrip,
    pallets,
    extras,
    pricingMode,
    closedPrice,
    pricePerPallet,
    pricePerKm,
  ]);

  function save(status: Trip["status"]) {
    if (!vehicle || !driver || !provider || !evaluated) return;
    const trip: Trip = {
      id: existing?.id ?? createId("trip"),
      date,
      reference,
      vehicleId: vehicle.id,
      driverId: driver.id,
      clientId,
      fuelProviderId: provider.id,
      roundTrip,
      stops: stops.map((stop) => (stop.kind === "destination" ? { ...stop, pallets } : stop)),
      distanceKm,
      drivingMinutes,
      loadWaitMinutes,
      geometry,
      extras,
      pricingMode,
      closedPrice,
      pricePerPallet,
      pallets,
      pricePerKm,
      notes,
      status: existing?.status === "invoiced" ? "invoiced" : status,
      invoiceId: existing?.invoiceId ?? null,
      costs: evaluated.costs,
      margin: evaluated.margin,
    };
    upsertTrip(trip);
    setSaved(true);
    router.push("/rutas");
  }

  if (!vehicle || !driver || !provider || !evaluated) {
    return <p className="text-sm text-muted">Configura flota, personal y combustible antes de planificar.</p>;
  }

  const unitPrice = liveFuelUnitPrice(vehicle, provider, fuelMarket, company);
  const netPrice = netEnergyPrice(vehicle, provider, unitPrice);

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-6rem)] lg:grid lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)_minmax(280px,340px)]">
      <div className="sticky top-14 z-20 lg:hidden">
        <MarginLight margin={evaluated.margin} compact />
      </div>

      <section className="tn-scroll flex flex-col gap-3 overflow-y-auto lg:pr-1">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Planificador de ruta</h1>
          <p className="text-sm text-muted">Coste directo y margen en tiempo real.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Referencia">
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </Field>
        </div>
        <AddressSearch
          label="Origen"
          value={origin.address}
          placeholder="TWLOGISTIC Sevilla"
          onSelect={(hit) => setOrigin(stopFromHit("origin", hit))}
        />
        {waypoints.map((stop, index) => (
          <div key={stop.id} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <AddressSearch
                label={`Parada ${index + 1}`}
                value={stop.address}
                onSelect={(hit) =>
                  setWaypoints((current) =>
                    current.map((item) => (item.id === stop.id ? stopFromHit("waypoint", hit, item.pallets) : item)),
                  )
                }
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Quitar parada"
              onClick={() => setWaypoints((current) => current.filter((item) => item.id !== stop.id))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setWaypoints((current) => [...current, stopFromHit("waypoint", { label: "", address: "", lat: 0, lng: 0 })])
          }
        >
          <Plus className="size-4" />
          Añadir parada
        </Button>
        <AddressSearch
          label="Destino"
          value={destination.address}
          placeholder="LEFTIES Holea Huelva"
          onSelect={(hit) => setDestination(stopFromHit("destination", hit, pallets))}
        />
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <span className="text-sm">Ida y vuelta</span>
          <button
            type="button"
            role="switch"
            aria-label="Ida y vuelta"
            aria-checked={roundTrip}
            onClick={() => setRoundTrip((value) => !value)}
            className={`relative h-6 w-10 rounded-full ${roundTrip ? "bg-accent" : "bg-border"}`}
          >
            <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-card transition-transform ${roundTrip ? "translate-x-4" : ""}`} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Km totales" hint={routing ? "Calculando..." : "OSRM / mapa"}>
            <Input
              type="number"
              step="0.1"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
            />
          </Field>
          <Field label="Conducción">
            <Input
              type="number"
              value={drivingMinutes}
              onChange={(e) => setDrivingMinutes(Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Carga, descarga y esperas (min)">
          <Input
            type="number"
            value={loadWaitMinutes}
            onChange={(e) => setLoadWaitMinutes(Number(e.target.value))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vehículo">
            <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              {vehicles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.plate} · {item.model}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Conductor">
            <Select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              {drivers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cliente">
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {clients.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tarjeta combustible">
            <Select value={fuelProviderId} onChange={(e) => setFuelProviderId(e.target.value)}>
              {fuelProviders.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <p className="text-xs text-muted">
          Precio energía: {formatEUR3(unitPrice)}
          {vehicle.fuelType === "electrico" ? "/kWh" : "/L"} · Neto con descuento: {formatEUR3(netPrice)}
        </p>
      </section>

      <section className="h-[42vh] min-h-[240px] overflow-hidden rounded-lg border border-border lg:h-full">
        <RouteMap stops={stops.filter((stop) => stop.lat && stop.lng)} geometry={geometry} />
      </section>

      <section className="tn-scroll flex flex-col gap-3 overflow-y-auto pb-24 lg:pb-0">
        <div className="hidden lg:block">
          <MarginLight margin={evaluated.margin} />
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-medium text-muted">Imputación de la ruta</p>
          <dl className="mt-2 flex flex-col gap-1.5 text-sm">
            <Row label="Combustible" value={formatEUR(evaluated.costs.fuel)} />
            <Row label="Personal" value={formatEUR(evaluated.costs.personnel)} />
            <Row label="Desgaste" value={formatEUR(evaluated.costs.wear)} />
            <Row label="Fijo imputado" value={formatEUR(evaluated.costs.fixedImputed)} />
            <Row label="Gastos extra" value={formatEUR(evaluated.costs.extras)} />
            <div className="my-1 h-px bg-border" />
            <Row label="Coste directo total" value={formatEUR(evaluated.costs.total)} strong />
            <Row label="Distancia" value={formatKm(distanceKm)} />
            <Row label="Tiempo total" value={formatHoursMinutes(drivingMinutes + loadWaitMinutes)} />
          </dl>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Peajes">
            <Input type="number" step="0.01" value={extras.tolls} onChange={(e) => setExtras({ ...extras, tolls: Number(e.target.value) })} />
          </Field>
          <Field label="Dietas">
            <Input type="number" step="0.01" value={extras.meals} onChange={(e) => setExtras({ ...extras, meals: Number(e.target.value) })} />
          </Field>
          <Field label="Parking">
            <Input type="number" step="0.01" value={extras.parking} onChange={(e) => setExtras({ ...extras, parking: Number(e.target.value) })} />
          </Field>
          <Field label="AdBlue extra">
            <Input type="number" step="0.01" value={extras.adblue} onChange={(e) => setExtras({ ...extras, adblue: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="Modalidad de cobro">
          <Select value={pricingMode} onChange={(e) => setPricingMode(e.target.value as PricingMode)}>
            <option value="closed">Precio cerrado por ruta</option>
            <option value="per_pallet">Precio por palet cargado</option>
            <option value="per_km">Precio por kilómetro</option>
          </Select>
        </Field>
        {pricingMode === "closed" ? (
          <Field label="Precio cerrado (€)">
            <Input type="number" step="0.01" value={closedPrice} onChange={(e) => setClosedPrice(Number(e.target.value))} />
          </Field>
        ) : null}
        {pricingMode === "per_pallet" ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label="€ / palet">
              <Input type="number" step="0.01" value={pricePerPallet} onChange={(e) => setPricePerPallet(Number(e.target.value))} />
            </Field>
            <Field label="Palets">
              <Input type="number" value={pallets} onChange={(e) => setPallets(Number(e.target.value))} />
            </Field>
          </div>
        ) : (
          <Field label="Palets cargados">
            <Input type="number" value={pallets} onChange={(e) => setPallets(Number(e.target.value))} />
          </Field>
        )}
        {pricingMode === "per_km" ? (
          <Field label="€ / km">
            <Input type="number" step="0.01" value={pricePerKm} onChange={(e) => setPricePerKm(Number(e.target.value))} />
          </Field>
        ) : null}
        <Field label="Notas">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={() => save("completed")}>
            Guardar y completar
          </Button>
          <Button variant="outline" onClick={() => save("draft")}>
            Guardar borrador
          </Button>
          {saved ? <p className="text-xs text-success">Ruta guardada.</p> : null}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-card p-3 lg:hidden">
        <Button className="w-full" size="lg" onClick={() => save("completed")}>
          Guardar ruta · {formatEUR(evaluated.margin.euros)}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-mono tabular-nums ${strong ? "font-semibold" : ""}`}>{value}</dd>
    </div>
  );
}
