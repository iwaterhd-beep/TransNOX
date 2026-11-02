import { SettingsPanel } from "@/components/settings/settings-panel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ajustes" };

export default function AjustesPage() {
  return <SettingsPanel />;
}
