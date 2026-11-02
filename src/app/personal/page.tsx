import { DriverPanel } from "@/components/masters/driver-panel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Personal" };

export default function PersonalPage() {
  return <DriverPanel />;
}
