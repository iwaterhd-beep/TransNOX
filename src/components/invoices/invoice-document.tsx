import type { Client, CompanySettings, Invoice } from "@/lib/types";
import { formatEUR, formatDate } from "@/lib/format";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#161a20",
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#c48a12" },
  muted: { color: "#5e6874" },
  box: { border: "1pt solid #d7dde5", padding: 10, width: "48%" },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 8 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#161a20",
    color: "#ffffff",
    padding: 6,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: { flexDirection: "row", borderBottom: "1pt solid #d7dde5", padding: 6 },
  colDesc: { width: "54%" },
  colQty: { width: "12%", textAlign: "right" },
  colPrice: { width: "17%", textAlign: "right" },
  colAmt: { width: "17%", textAlign: "right" },
  totals: { marginTop: 16, marginLeft: "auto", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  grand: { fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 6 },
  footer: { position: "absolute", bottom: 28, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
});

export function InvoiceDocument({
  invoice,
  company,
  client,
  qrDataUrl,
}: {
  invoice: Invoice;
  company: CompanySettings;
  client: Client;
  qrDataUrl?: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.row}>
          <View>
            <Text style={styles.brand}>{company.tradeName}</Text>
            <Text>{company.name}</Text>
            <Text style={styles.muted}>{company.address}</Text>
            <Text style={styles.muted}>
              {company.postalCode} {company.city} ({company.province})
            </Text>
            <Text>NIF {company.nif}</Text>
            <Text>{company.email} · {company.phone}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold" }}>FACTURA</Text>
            <Text>{invoice.number}</Text>
            <Text>Fecha {formatDate(invoice.issueDate)}</Text>
          </View>
        </View>

        <View style={[styles.row, { marginTop: 20 }]}>
          <View style={styles.box}>
            <Text style={styles.muted}>Emisor</Text>
            <Text>{company.name}</Text>
            <Text>NIF {company.nif}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.muted}>Receptor</Text>
            <Text>{client.name}</Text>
            <Text>NIF {client.nif}</Text>
            <Text>{client.address}</Text>
            <Text>{client.city}</Text>
          </View>
        </View>

        <Text style={styles.title}>Desglose de servicios</Text>
        <View style={styles.tableHead}>
          <Text style={styles.colDesc}>Descripción</Text>
          <Text style={styles.colQty}>Uds</Text>
          <Text style={styles.colPrice}>Precio</Text>
          <Text style={styles.colAmt}>Importe</Text>
        </View>
        {invoice.lines.map((line) => (
          <View key={line.tripId} style={styles.tableRow}>
            <Text style={styles.colDesc}>{line.description}</Text>
            <Text style={styles.colQty}>{line.quantity}</Text>
            <Text style={styles.colPrice}>{formatEUR(line.unitPrice)}</Text>
            <Text style={styles.colAmt}>{formatEUR(line.amount)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Base imponible</Text>
            <Text>{formatEUR(invoice.base)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>IVA {(invoice.ivaRate * 100).toFixed(0)}%</Text>
            <Text>{formatEUR(invoice.iva)}</Text>
          </View>
          {invoice.irpf > 0 ? (
            <View style={styles.totalRow}>
              <Text>IRPF {(invoice.irpfRate * 100).toFixed(0)}%</Text>
              <Text>-{formatEUR(invoice.irpf)}</Text>
            </View>
          ) : null}
          <View style={[styles.totalRow, styles.grand]}>
            <Text>Total a cobrar</Text>
            <Text>{formatEUR(invoice.total)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.muted}>Forma de pago</Text>
            <Text>Transferencia {company.iban}</Text>
            <Text style={styles.muted}>QR de verificación interna TransNOX</Text>
          </View>
          {qrDataUrl ? <Image src={qrDataUrl} style={{ width: 72, height: 72 }} /> : null}
        </View>
      </Page>
    </Document>
  );
}
