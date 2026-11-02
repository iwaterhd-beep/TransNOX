"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { monthlyFixedCosts, monthlyVehicleBurden, vehicleHourlyFixed } from "@/lib/calc/costs";
import { createId, formatEUR, formatEUR3 } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import type { FuelType, Vehicle } from "@/lib/types";
import { Plus, Truck } from "lucide-react";
import { useState } from "react";

const emptyVehicle = (): Vehicle => ({
  id: createId("veh"),
  plate: "",
  brand: "",
  model: "",
  fuelType: "diesel",
  consumptionPer100: 9.5,
  monthlyAmortization: 600,
  annualInsurance: 1800,
  annualTransportCard: 400,
  annualItv: 48,
  annualMaintenance: 1200,
  annualTaxes: 240,
  wearCostPerKm: 0.08,
  palletCapacity: 8,
  active: true,
});

export function VehiclePanel() {
  const vehicles = useAppStore((s) => s.vehicles);
  const company = useAppStore((s) => s.company);
  const upsert = useAppStore((s) => s.upsertVehicle);
  const remove = useAppStore((s) => s.removeVehicle);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Header
        title="Flota"
        description="Vehículos hasta 3.5 t MMA con plataforma elevadora."
        onAdd={() => setEditing(emptyVehicle())}
      />
      {vehicles.length === 0 ? (
        <Card>
          <EmptyState
            icon={Truck}
            title="Sin vehículos"
            description="Da de alta la flota para imputar combustible, desgaste y costes fijos."
            actionLabel="Alta de vehículo"
            onAction={() => setEditing(emptyVehicle())}
          />
        </Card>
      ) : (
        <>
        <div className="flex flex-col gap-3 md:hidden">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold">{vehicle.plate}</p>
                  <p className="text-sm">
                    {vehicle.brand} {vehicle.model}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {vehicle.consumptionPer100} /100 · Fijo {formatEUR(monthlyVehicleBurden(vehicle))}/mes · {formatEUR(vehicleHourlyFixed(vehicle, company))}/h
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(vehicle)}>
                  Editar
                </Button>
              </div>
            </Card>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-card-2 text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Matrícula</th>
                <th className="px-3 py-2 font-medium">Modelo</th>
                <th className="px-3 py-2 font-medium">Comb.</th>
                <th className="px-3 py-2 font-medium">L/100</th>
                <th className="px-3 py-2 font-medium">Fijo mes</th>
                <th className="px-3 py-2 font-medium">€/h fijo</th>
                <th className="px-3 py-2 font-medium">Desgaste</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{vehicle.plate}</td>
                  <td className="px-3 py-2">
                    {vehicle.brand} {vehicle.model}
                  </td>
                  <td className="px-3 py-2 capitalize">{vehicle.fuelType}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{vehicle.consumptionPer100}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{formatEUR(monthlyVehicleBurden(vehicle))}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">
                    {formatEUR(vehicleHourlyFixed(vehicle, company))}
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums">{formatEUR3(vehicle.wearCostPerKm)}/km</td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(vehicle)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      <Modal open={Boolean(editing)} title={editing?.plate ? `Vehículo ${editing.plate}` : "Alta de vehículo"} onClose={() => setEditing(null)} wide>
        {editing ? (
          <VehicleForm
            vehicle={editing}
            onChange={setEditing}
            onSave={() => {
              upsert(editing);
              setEditing(null);
            }}
            onDelete={() => {
              remove(editing.id);
              setEditing(null);
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function Header({ title, description, onAdd }: { title: string; description: string; onAdd: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <Button onClick={onAdd} size="sm">
        <Plus className="size-4" />
        Alta
      </Button>
    </div>
  );
}

function VehicleForm({
  vehicle,
  onChange,
  onSave,
  onDelete,
}: {
  vehicle: Vehicle;
  onChange: (vehicle: Vehicle) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const company = useAppStore((s) => s.company);
  const set = (patch: Partial<Vehicle>) => onChange({ ...vehicle, ...patch });
  const annual = vehicle.annualInsurance + vehicle.annualTransportCard + vehicle.annualItv + vehicle.annualMaintenance + vehicle.annualTaxes;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Matrícula">
          <Input value={vehicle.plate} onChange={(e) => set({ plate: e.target.value.toUpperCase() })} required />
        </Field>
        <Field label="Tipo de combustible">
          <Select value={vehicle.fuelType} onChange={(e) => set({ fuelType: e.target.value as FuelType })}>
            <option value="diesel">Diésel</option>
            <option value="gasolina">Gasolina</option>
            <option value="electrico">Eléctrico</option>
          </Select>
        </Field>
        <Field label="Marca">
          <Input value={vehicle.brand} onChange={(e) => set({ brand: e.target.value })} required />
        </Field>
        <Field label="Modelo">
          <Input value={vehicle.model} onChange={(e) => set({ model: e.target.value })} required />
        </Field>
        <Field label={vehicle.fuelType === "electrico" ? "kWh / 100 km" : "Consumo medio real (L/100 km)"}>
          <Input type="number" step="0.1" value={vehicle.consumptionPer100} onChange={(e) => set({ consumptionPer100: Number(e.target.value) })} />
        </Field>
        <Field label="Palets máximos">
          <Input type="number" value={vehicle.palletCapacity} onChange={(e) => set({ palletCapacity: Number(e.target.value) })} />
        </Field>
        <Field label="Amortización / renting (€/mes)">
          <Input type="number" step="0.01" value={vehicle.monthlyAmortization} onChange={(e) => set({ monthlyAmortization: Number(e.target.value) })} />
        </Field>
        <Field label="Desgaste variable (€/km)" hint="Neumáticos, aceite, frenos, AdBlue">
          <Input type="number" step="0.001" value={vehicle.wearCostPerKm} onChange={(e) => set({ wearCostPerKm: Number(e.target.value) })} />
        </Field>
        <Field label="Seguro de flota (€/año)">
          <Input type="number" value={vehicle.annualInsurance} onChange={(e) => set({ annualInsurance: Number(e.target.value) })} />
        </Field>
        <Field label="Tarjeta de transporte (€/año)">
          <Input type="number" value={vehicle.annualTransportCard} onChange={(e) => set({ annualTransportCard: Number(e.target.value) })} />
        </Field>
        <Field label="ITV (€/año)">
          <Input type="number" value={vehicle.annualItv} onChange={(e) => set({ annualItv: Number(e.target.value) })} />
        </Field>
        <Field label="Mantenimientos anuales (€/año)">
          <Input type="number" value={vehicle.annualMaintenance} onChange={(e) => set({ annualMaintenance: Number(e.target.value) })} />
        </Field>
        <Field label="Tasas (€/año)">
          <Input type="number" value={vehicle.annualTaxes} onChange={(e) => set({ annualTaxes: Number(e.target.value) })} />
        </Field>
      </div>
      <div className="rounded-md bg-card-2 px-3 py-2 text-sm">
        Fijos anuales prorrateados: {formatEUR(monthlyFixedCosts(vehicle))}/mes · Carga mensual total: {formatEUR(monthlyVehicleBurden(vehicle))} · Imputación: {formatEUR(vehicleHourlyFixed(vehicle, company))}/h ({company.workingDaysPerMonth} días × {company.workingHoursPerDay} h)
      </div>
      <p className="text-xs text-muted">Total anual de fijos: {formatEUR(annual)}</p>
      <div className="flex justify-between gap-2 pt-2">
        <Button type="button" variant="danger" onClick={onDelete}>
          Eliminar
        </Button>
        <Button type="submit">Guardar vehículo</Button>
      </div>
    </form>
  );
}
