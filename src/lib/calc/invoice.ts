import { round2 } from "@/lib/format";
import type { Client, CompanySettings, Invoice, InvoiceLine, Trip } from "@/lib/types";

export function buildInvoiceNumber(series: string, n: number): string {
  return `${series}-${String(n).padStart(4, "0")}`;
}

export function invoiceFromTrips(
  trips: Trip[],
  client: Client,
  company: CompanySettings,
  issueDate: string,
): Omit<Invoice, "id"> & { nextNumber: number } {
  const lines: InvoiceLine[] = trips.map((trip) => ({
    tripId: trip.id,
    description: trip.reference || `Servicio de transporte ${trip.date}`,
    quantity: 1,
    unitPrice: trip.margin.sale,
    amount: trip.margin.sale,
  }));
  const base = round2(lines.reduce((sum, line) => sum + line.amount, 0));
  const iva = round2(base * company.ivaRate);
  const irpfRate = client.irpfRetention / 100;
  const irpf = round2(base * irpfRate);
  const total = round2(base + iva - irpf);
  return {
    number: buildInvoiceNumber(company.invoiceSeries, company.nextInvoiceNumber),
    clientId: client.id,
    issueDate,
    tripIds: trips.map((trip) => trip.id),
    lines,
    base,
    ivaRate: company.ivaRate,
    iva,
    irpfRate,
    irpf,
    total,
    status: "issued",
    nextNumber: company.nextInvoiceNumber + 1,
  };
}

export function invoiceQrPayload(invoice: Invoice, company: CompanySettings, client: Client): string {
  return [
    "TRANSNOX",
    invoice.number,
    invoice.issueDate,
    company.nif,
    client.nif,
    invoice.base.toFixed(2),
    invoice.iva.toFixed(2),
    invoice.total.toFixed(2),
    invoice.id,
  ].join("|");
}
