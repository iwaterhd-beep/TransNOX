import { RoutePlanner } from "@/components/planner/route-planner";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Planificador" };

export default function PlannerPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Cargando planificador...</p>}>
      <RoutePlanner />
    </Suspense>
  );
}
