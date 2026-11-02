"use client";

import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { Button } from "@/components/ui/button";
import { invoiceQrPayload } from "@/lib/calc/invoice";
import type { Client, CompanySettings, Invoice } from "@/lib/types";
import { pdf } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import QRCode from "qrcode";

export async function downloadInvoicePdf(invoice: Invoice, company: CompanySettings, client: Client) {
  const qrDataUrl = await QRCode.toDataURL(invoiceQrPayload(invoice, company, client), {
    margin: 0,
    width: 256,
    color: { dark: "#161a20", light: "#ffffff" },
  });
  const blob = await pdf(
    <InvoiceDocument invoice={invoice} company={company} client={client} qrDataUrl={qrDataUrl} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoice.number}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function InvoiceDownloadButton({
  invoice,
  company,
  client,
}: {
  invoice: Invoice;
  company: CompanySettings;
  client: Client;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        void downloadInvoicePdf(invoice, company, client);
      }}
    >
      <Download className="size-4" />
      PDF
    </Button>
  );
}
