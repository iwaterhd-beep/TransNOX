"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { driverHourlyCost, employerSsFromGross } from "@/lib/calc/costs";
import { createId, formatEUR } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import type { Driver } from "@/lib/types";
import { Plus, Users } from "lucide-react";
import { useState } from "react";

const emptyDriver = (ssRate: number): Driver => {
  const gross = 1650;
  return {
    id: createId("drv"),
    name: "",
    dni: "",
    phone: "",
    monthlyGrossSalary: gross,
    employerSs: employerSsFromGross(gross, ssRate),
    ssManual: false,
    monthlyHours: 160,
    active: true,
  };
};

export function DriverPanel() {
  const drivers = useAppStore((s) => s.drivers);
  const ssRate = useAppStore((s) => s.company.employerSsRate);
  const upsert = useAppStore((s) => s.upsertDriver);
  const remove = useAppStore((s) => s.removeDriver);
  const [editing, setEditing] = useState<Driver | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Personal</h1>
          <p className="text-sm text-muted">Coste hora empresa = (bruto + SS empresa) / horas mes.</p>
        </div>
        <Button size="sm" onClick={() => setEditing(emptyDriver(ssRate))}>
          <Plus className="size-4" />
          Alta
        </Button>
      </div>
      {drivers.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Sin conductores" description="Da de alta la plantilla para imputar el coste hora." actionLabel="Alta" onAction={() => setEditing(emptyDriver(ssRate))} />
        </Card>
      ) : (
        <>
        <div className="flex flex-col gap-3 md:hidden">
          {drivers.map((driver) => (
            <Card key={driver.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{driver.name}</p>
                  <p className="font-mono text-xs text-muted">{driver.dni}</p>
                  <p className="mt-1 font-mono text-sm tabular-nums">
                    {formatEUR(driverHourlyCost(driver))}/h
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(driver)}>
                  Editar
                </Button>
              </div>
            </Card>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-card-2 text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">DNI</th>
                <th className="px-3 py-2 font-medium">Bruto</th>
                <th className="px-3 py-2 font-medium">SS empresa</th>
                <th className="px-3 py-2 font-medium">Horas</th>
                <th className="px-3 py-2 font-medium">Coste hora</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id} className="border-t border-border">
                  <td className="px-3 py-2">{driver.name}</td>
                  <td className="px-3 py-2 font-mono">{driver.dni}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{formatEUR(driver.monthlyGrossSalary)}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{formatEUR(driver.employerSs)}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{driver.monthlyHours} h</td>
                  <td className="px-3 py-2 font-mono font-semibold tabular-nums">{formatEUR(driverHourlyCost(driver))}</td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(driver)}>
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
      <Modal open={Boolean(editing)} title="Conductor" onClose={() => setEditing(null)}>
        {editing ? (
          <DriverForm
            driver={editing}
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

function DriverForm({
  driver,
  onChange,
  onSave,
  onDelete,
}: {
  driver: Driver;
  onChange: (driver: Driver) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const ssRate = useAppStore((s) => s.company.employerSsRate);
  const setGross = (monthlyGrossSalary: number) => {
    onChange({
      ...driver,
      monthlyGrossSalary,
      employerSs: driver.ssManual ? driver.employerSs : employerSsFromGross(monthlyGrossSalary, ssRate),
    });
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <Field label="Nombre">
        <Input value={driver.name} onChange={(e) => onChange({ ...driver, name: e.target.value })} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="DNI / NIE">
          <Input value={driver.dni} onChange={(e) => onChange({ ...driver, dni: e.target.value.toUpperCase() })} required />
        </Field>
        <Field label="Teléfono">
          <Input value={driver.phone} onChange={(e) => onChange({ ...driver, phone: e.target.value })} />
        </Field>
        <Field label="Salario bruto mensual (€)">
          <Input type="number" step="0.01" value={driver.monthlyGrossSalary} onChange={(e) => setGross(Number(e.target.value))} />
        </Field>
        <Field label="SS empresa (€/mes)" hint={`Auto ${(ssRate * 100).toFixed(1)}% si no se bloquea`}>
          <Input
            type="number"
            step="0.01"
            value={driver.employerSs}
            onChange={(e) => onChange({ ...driver, employerSs: Number(e.target.value), ssManual: true })}
          />
        </Field>
        <Field label="Horas mensuales de contrato">
          <Input type="number" value={driver.monthlyHours} onChange={(e) => onChange({ ...driver, monthlyHours: Number(e.target.value) })} />
        </Field>
      </div>
      <div className="rounded-md bg-card-2 px-3 py-3">
        <p className="text-xs text-muted">Coste hora empresa</p>
        <p className="font-mono text-2xl tabular-nums">{formatEUR(driverHourlyCost(driver))}</p>
      </div>
      <div className="flex justify-between gap-2 pt-2">
        <Button type="button" variant="danger" onClick={onDelete}>
          Eliminar
        </Button>
        <Button type="submit">Guardar conductor</Button>
      </div>
    </form>
  );
}
