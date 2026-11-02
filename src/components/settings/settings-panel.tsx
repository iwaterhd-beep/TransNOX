"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/app-store";
import type { LegalForm } from "@/lib/types";
import { useRouter } from "next/navigation";

export function SettingsPanel() {
  const router = useRouter();
  const company = useAppStore((s) => s.company);
  const setCompany = useAppStore((s) => s.setCompany);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const set = (patch: Partial<typeof company>) => setCompany({ ...company, ...patch });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted">Datos fiscales del emisor y parámetros de imputación.</p>
      </div>
      <Card className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Apariencia</p>
          <p className="text-xs text-muted">Modo claro, oscuro o sistema. Pensado para cabina de noche.</p>
        </div>
        <ThemeToggle />
      </Card>
      <form className="grid gap-3 sm:grid-cols-2">
        <Field label="Razón social" className="sm:col-span-2">
          <Input value={company.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="Nombre comercial">
          <Input value={company.tradeName} onChange={(e) => set({ tradeName: e.target.value })} />
        </Field>
        <Field label="NIF">
          <Input value={company.nif} onChange={(e) => set({ nif: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Dirección" className="sm:col-span-2">
          <Input value={company.address} onChange={(e) => set({ address: e.target.value })} />
        </Field>
        <Field label="CP">
          <Input value={company.postalCode} onChange={(e) => set({ postalCode: e.target.value })} />
        </Field>
        <Field label="Ciudad">
          <Input value={company.city} onChange={(e) => set({ city: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input value={company.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Teléfono">
          <Input value={company.phone} onChange={(e) => set({ phone: e.target.value })} />
        </Field>
        <Field label="IBAN" className="sm:col-span-2">
          <Input value={company.iban} onChange={(e) => set({ iban: e.target.value })} />
        </Field>
        <Field label="Forma jurídica">
          <Select value={company.legalForm} onChange={(e) => set({ legalForm: e.target.value as LegalForm })}>
            <option value="sl">Sociedad Limitada</option>
            <option value="autonomo">Autónomo</option>
          </Select>
        </Field>
        <Field label="Serie de factura">
          <Input value={company.invoiceSeries} onChange={(e) => set({ invoiceSeries: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="IVA">
          <Input type="number" step="0.01" value={company.ivaRate} onChange={(e) => set({ ivaRate: Number(e.target.value) })} />
        </Field>
        <Field label="SS empresa (ratio)">
          <Input type="number" step="0.001" value={company.employerSsRate} onChange={(e) => set({ employerSsRate: Number(e.target.value) })} />
        </Field>
        <Field label="Días laborables / mes">
          <Input type="number" value={company.workingDaysPerMonth} onChange={(e) => set({ workingDaysPerMonth: Number(e.target.value) })} />
        </Field>
        <Field label="Horas / día para imputación">
          <Input type="number" value={company.workingHoursPerDay} onChange={(e) => set({ workingHoursPerDay: Number(e.target.value) })} />
        </Field>
        <Field label="IS / tipo de reserva">
          <Input type="number" step="0.01" value={company.isRate} onChange={(e) => set({ isRate: Number(e.target.value) })} />
        </Field>
        <Field label="IRPF autónomo (130)">
          <Input type="number" step="0.01" value={company.autonomoIrpfRate} onChange={(e) => set({ autonomoIrpfRate: Number(e.target.value) })} />
        </Field>
        <Field label="Diésel por defecto (€/L)">
          <Input type="number" step="0.001" value={company.defaultDieselPrice} onChange={(e) => set({ defaultDieselPrice: Number(e.target.value) })} />
        </Field>
        <Field label="Electricidad (€/kWh)">
          <Input type="number" step="0.001" value={company.electricityEurKwh} onChange={(e) => set({ electricityEurKwh: Number(e.target.value) })} />
        </Field>
      </form>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => void resetDemo()}>
          Restaurar datos de demostración
        </Button>
        <Button
          variant="danger"
          onClick={async () => {
            await createClient().auth.signOut();
            router.replace("/login");
            router.refresh();
          }}
        >
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
