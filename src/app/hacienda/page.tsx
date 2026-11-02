import { TaxPanel } from "@/components/tax/tax-panel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hacienda" };

export default function HaciendaPage() {
  return <TaxPanel />;
}
