import { InvoicePanel } from "@/components/invoices/invoice-panel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Facturación" };

export default function FacturacionPage() {
  return <InvoicePanel />;
}
