"use client";

import { useAppStore } from "@/lib/store/app-store";
import { loadWorkspace, seedWorkspace } from "@/lib/supabase/sync";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

function BootScreen() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-background">
      <div className="flex size-12 items-center justify-center rounded-md bg-sidebar text-accent">
        <span className="font-mono text-lg font-semibold">TN</span>
      </div>
      <p className="font-medium tracking-tight">TransNOX</p>
      <p className="text-sm text-muted">Sincronizando con Supabase</p>
    </div>
  );
}

function HydrationGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const publicRoute = pathname.startsWith("/login") || pathname.startsWith("/auth");

  useEffect(() => {
    if (publicRoute) {
      setReady(true);
      return;
    }
    let cancelled = false;
    async function boot() {
      const workspace = await loadWorkspace();
      if (cancelled) return;
      if (!workspace) {
        setReady(true);
        return;
      }
      if (workspace.data.vehicles.length === 0) {
        const seeded = await seedWorkspace(workspace.orgId);
        if (cancelled) return;
        useAppStore.getState().hydrateCloud(workspace.orgId, seeded);
      } else {
        useAppStore.getState().hydrateCloud(workspace.orgId, workspace.data);
      }
      setReady(true);
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [publicRoute]);

  if (!ready) return <BootScreen />;
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <HydrationGate>{children}</HydrationGate>
    </ThemeProvider>
  );
}
