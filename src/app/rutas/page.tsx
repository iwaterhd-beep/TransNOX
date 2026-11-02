import { TripList } from "@/components/trips/trip-list";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rutas" };

export default function RutasPage() {
  return <TripList />;
}
