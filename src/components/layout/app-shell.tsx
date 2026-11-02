"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/cn";
import {
  Calculator,
  FileText,
  Fuel,
  Landmark,
  LayoutDashboard,
  Map,
  MoreHorizontal,
  Settings,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const primary = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/planificador", label: "Ruta", icon: Map },
  { href: "/flota", label: "Flota", icon: Truck },
  { href: "/facturacion", label: "Facturas", icon: FileText },
];

const secondary = [
  { href: "/personal", label: "Personal", icon: Users },
  { href: "/combustible", label: "Combustible", icon: Fuel },
  { href: "/clientes", label: "Clientes", icon: Warehouse },
  { href: "/hacienda", label: "Hacienda", icon: Landmark },
  { href: "/rutas", label: "Rutas", icon: Calculator },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: typeof Map;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-white/10 text-sidebar-fg"
          : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-fg",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[100dvh] bg-background lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden bg-sidebar text-sidebar-fg lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:flex-col lg:px-3 lg:py-4">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-fg">
            <span className="font-mono text-sm font-bold">TN</span>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">TransNOX</p>
            <p className="text-[11px] text-sidebar-muted">Margen por ruta</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {primary.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
          <div className="my-3 h-px bg-white/10" />
          {secondary.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </nav>
        <div className="px-1 pt-3">
          <ThemeToggle compact />
        </div>
      </aside>

      <div className="flex min-h-[100dvh] flex-col pb-16 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-sidebar text-accent">
              <span className="font-mono text-xs font-bold">TN</span>
            </div>
            <span className="text-sm font-semibold">TransNOX</span>
          </div>
          <ThemeToggle compact />
        </header>
        <main className="flex-1 px-4 py-4 lg:px-6 lg:py-5">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card lg:hidden">
        <ul className="grid grid-cols-5">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 text-[11px]",
                    active ? "text-accent" : "text-muted",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex h-14 w-full flex-col items-center justify-center gap-1 text-[11px]",
                moreOpen || secondary.some((item) => isActive(item.href))
                  ? "text-accent"
                  : "text-muted",
              )}
            >
              <MoreHorizontal className="size-4" />
              Más
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar menú"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-lg border border-border bg-card p-4 pb-8">
            <p className="mb-3 text-sm font-semibold">Más módulos</p>
            <div className="grid grid-cols-2 gap-2">
              {secondary.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-3 text-sm"
                  >
                    <Icon className="size-4 text-muted" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
