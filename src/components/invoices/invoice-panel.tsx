"use client";

import { InvoiceDownloadButton } from "@/components/invoices/invoice-actions";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatDate, formatEUR, todayISO } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { FileText } from "lucide-react";
import { useMemo, useState } from "react";

export function InvoicePanel() {
  const invoices = useAppStore((s) => s.invoices);
  const trips = useAppStore((s) => s.trips);
  const clients = useAppStore((s) => s.clients);
  const company = useAppStore((s) => s.company);
  const issueInvoice = useAppStore((s) => s.issueInvoice);
  const markPaid = useAppStore((s) => s.markInvoicePaid);
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [selected, setSelected] = useState<string[]>([]);

  const pending = useMemo(
    () => trips.filter((trip) => trip.status === "completed" && trip.clientId === clientId),
    [trips, clientId],
  );

  const sorted = [...invoices].sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Facturación</h1>
          <p className="text-sm text-muted">Base + IVA 21% - IRPF si aplica. PDF con membrete y QR.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          Emitir factura
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {sorted.map((invoice) => {
          const client = clients.find((item) => item.id === invoice.clientId);
          return (
            <Card key={invoice.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold">{invoice.number}</p>
                  <p className="text-xs text-muted">
                    {formatDate(invoice.issueDate)} · {client?.name}
                  </p>
                </div>
                <Badge tone={invoice.status === "paid" ? "success" : "warning"}>
                  {invoice.status === "paid" ? "Cobrada" : "Emitida"}
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-sm tabular-nums">{formatEUR(invoice.total)}</span>
                {client ? <InvoiceDownloadButton invoice={invoice} company={company} client={client} /> : null}
              </div>
            </Card>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-card-2 text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Número</th>
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Base</th>
              <th className="px-3 py-2 font-medium">IVA</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((invoice) => {
              const client = clients.find((item) => item.id === invoice.clientId);
              return (
                <tr key={invoice.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{invoice.number}</td>
                  <td className="px-3 py-2">{formatDate(invoice.issueDate)}</td>
                  <td className="px-3 py-2">{client?.name ?? "Cliente"}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{formatEUR(invoice.base)}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{formatEUR(invoice.iva)}</td>
                  <td className="px-3 py-2 font-mono font-semibold tabular-nums">{formatEUR(invoice.total)}</td>
                  <td className="px-3 py-2">
                    <Badge tone={invoice.status === "paid" ? "success" : "warning"}>
                      {invoice.status === "paid" ? "Cobrada" : "Emitida"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      {client ? <InvoiceDownloadButton invoice={invoice} company={company} client={client} /> : null}
                      {invoice.status !== "paid" ? (
                        <Button variant="ghost" size="sm" onClick={() => markPaid(invoice.id)}>
                          Cobrar
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Nueva factura" onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-3">
          <Field label="Cliente">
            <Select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setSelected([]);
              }}
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </Field>
          {pending.length === 0 ? (
            <Card className="flex items-center gap-3 px-3 py-4 text-sm text-muted">
              <FileText className="size-4" />
              No hay rutas completadas pendientes de este cliente.
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {pending.map((trip) => (
                <li key={trip.id}>
                  <label className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(trip.id)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked ? [...current, trip.id] : current.filter((id) => id !== trip.id),
                        )
                      }
                    />
                    <span className="flex-1">
                      {formatDate(trip.date)} · {trip.reference}
                    </span>
                    <span className="font-mono tabular-nums">{formatEUR(trip.margin.sale)}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <Button
            disabled={selected.length === 0}
            onClick={() => {
              const invoice = issueInvoice(clientId, selected, todayISO());
              if (invoice) {
                setOpen(false);
                setSelected([]);
              }
            }}
          >
            Generar factura
          </Button>
        </div>
      </Modal>
    </div>
  );
}
