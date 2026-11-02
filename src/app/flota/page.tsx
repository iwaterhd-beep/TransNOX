import { VehiclePanel } from "@/components/masters/vehicle-panel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Flota" };

export default function FlotaPage() {
  return <VehiclePanel />;
}
