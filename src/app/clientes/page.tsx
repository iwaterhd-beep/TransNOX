import { ClientPanel } from "@/components/masters/client-panel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clientes" };

export default function ClientesPage() {
  return <ClientPanel />;
}
