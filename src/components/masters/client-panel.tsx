"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { createId } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import type { Client, IrpfRate } from "@/lib/types";
import { Plus, Warehouse } from "lucide-react";
import { useState } from "react";

const emptyClient = (): Client => ({
  id: createId("cli"),
  name: "",
  nif: "",
  address: "",
  city: "",
  email: "",
  phone: "",
  irpfRetention: 0,
  active: true,
});

export function ClientPanel() {
  const clients = useAppStore((s) => s.clients);
  const upsert = useAppStore((s) => s.upsertClient);
  const remove = useAppStore((s) => s.removeClient);
  const [editing, setEditing] = useState<Client | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted">Datos fiscales del receptor y retención IRPF si aplica.</p>
        </div>
        <Button size="sm" onClick={() => setEditing(emptyClient())}>
          <Plus className="size-4" />
          Alta
        </Button>
      </div>
      {clients.length === 0 ? (
        <Card>
          <EmptyState icon={Warehouse} title="Sin clientes" description="Necesitas receptores para facturar rutas." actionLabel="Alta" onAction={() => setEditing(emptyClient())} />
        </Card>
      ) : (
        <>
        <div className="flex flex-col gap-3 md:hidden">
          {clients.map((client) => (
            <Card key={client.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{client.name}</p>
                  <p className="font-mono text-xs text-muted">{client.nif} · {client.city}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(client)}>
                  Editar
                </Button>
              </div>
            </Card>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-card-2 text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">NIF</th>
                <th className="px-3 py-2 font-medium">Ciudad</th>
                <th className="px-3 py-2 font-medium">IRPF</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-t border-border">
                  <td className="px-3 py-2">{client.name}</td>
                  <td className="px-3 py-2 font-mono">{client.nif}</td>
                  <td className="px-3 py-2">{client.city}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{client.irpfRetention}%</td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(client)}>
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
      <Modal open={Boolean(editing)} title="Cliente" onClose={() => setEditing(null)}>
        {editing ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              upsert(editing);
              setEditing(null);
            }}
          >
            <Field label="Razón social / nombre comercial">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="NIF / CIF">
                <Input value={editing.nif} onChange={(e) => setEditing({ ...editing, nif: e.target.value.toUpperCase() })} required />
              </Field>
              <Field label="Ciudad">
                <Input value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
              </Field>
            </div>
            <Field label="Dirección fiscal">
              <Input value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </Field>
              <Field label="Teléfono">
                <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </Field>
            </div>
            <Field label="Retención IRPF" hint="Solo si el receptor es profesional obligado a retener">
              <Select
                value={String(editing.irpfRetention)}
                onChange={(e) => setEditing({ ...editing, irpfRetention: Number(e.target.value) as IrpfRate })}
              >
                <option value="0">Sin retención</option>
                <option value="1">1%</option>
                <option value="7">7%</option>
                <option value="15">15%</option>
              </Select>
            </Field>
            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="danger" onClick={() => { remove(editing.id); setEditing(null); }}>
                Eliminar
              </Button>
              <Button type="submit">Guardar cliente</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
