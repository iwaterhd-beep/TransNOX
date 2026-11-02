import { FuelPanel } from "@/components/masters/fuel-panel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Combustible" };

export default function CombustiblePage() {
  return <FuelPanel />;
}
