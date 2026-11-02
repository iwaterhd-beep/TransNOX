"use client";

import { create } from "zustand";
import { evaluateTrip } from "@/lib/calc/costs";
import { invoiceFromTrips } from "@/lib/calc/invoice";
import { createId, todayISO } from "@/lib/format";
import { seedData } from "@/lib/store/seed";
import { clearWorkspace, persist, seedWorkspace } from "@/lib/supabase/sync";
import type {
  AppData,
  Client,
  CompanySettings,
  Driver,
  FuelMarket,
  FuelProvider,
  Invoice,
  Trip,
  Vehicle,
} from "@/lib/types";

type Upsert<T extends { id: string }> = (item: T) => void;

interface AppState extends AppData {
  orgId: string | null;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  hydrateCloud: (orgId: string, data: AppData) => void;
  setCompany: (company: CompanySettings) => void;
  upsertVehicle: Upsert<Vehicle>;
  removeVehicle: (id: string) => void;
  upsertDriver: Upsert<Driver>;
  removeDriver: (id: string) => void;
  upsertFuelProvider: Upsert<FuelProvider>;
  removeFuelProvider: (id: string) => void;
  upsertClient: Upsert<Client>;
  removeClient: (id: string) => void;
  upsertTrip: (trip: Trip) => void;
  removeTrip: (id: string) => void;
  completeTrip: (id: string) => void;
  setFuelMarket: (market: FuelMarket) => void;
  issueInvoice: (clientId: string, tripIds: string[], issueDate?: string) => Invoice | null;
  markInvoicePaid: (id: string) => void;
  resetDemo: () => Promise<void>;
}

function replaceById<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex((row) => row.id === item.id);
  if (index === -1) return [...list, item];
  const next = list.slice();
  next[index] = item;
  return next;
}

function refreshTrip(trip: Trip, state: AppData): Trip {
  const vehicle = state.vehicles.find((item) => item.id === trip.vehicleId);
  const driver = state.drivers.find((item) => item.id === trip.driverId);
  const provider = state.fuelProviders.find((item) => item.id === trip.fuelProviderId);
  if (!vehicle || !driver || !provider || trip.status === "invoiced") return trip;
  const evaluated = evaluateTrip(trip, vehicle, driver, provider, state.company, state.fuelMarket);
  return { ...trip, costs: evaluated.costs, margin: evaluated.margin };
}

function orgIdOf() {
  return useAppStore.getState().orgId;
}

export const useAppStore = create<AppState>()((set, get) => ({
  ...seedData,
  orgId: null,
  hydrated: false,
  setHydrated: (value) => set({ hydrated: value }),
  hydrateCloud: (orgId, data) => set({ orgId, ...data, hydrated: true }),
  setCompany: (company) => {
    set({ company });
    const orgId = orgIdOf();
    if (orgId) void persist.company(orgId, company, get().fuelMarket);
  },
  upsertVehicle: (item) => {
    set((state) => ({ vehicles: replaceById(state.vehicles, item) }));
    const orgId = orgIdOf();
    if (orgId) void persist.vehicle(orgId, item);
  },
  removeVehicle: (id) => {
    set((state) => ({ vehicles: state.vehicles.filter((item) => item.id !== id) }));
    void persist.removeVehicle(id);
  },
  upsertDriver: (item) => {
    set((state) => ({ drivers: replaceById(state.drivers, item) }));
    const orgId = orgIdOf();
    if (orgId) void persist.driver(orgId, item);
  },
  removeDriver: (id) => {
    set((state) => ({ drivers: state.drivers.filter((item) => item.id !== id) }));
    void persist.removeDriver(id);
  },
  upsertFuelProvider: (item) => {
    set((state) => ({ fuelProviders: replaceById(state.fuelProviders, item) }));
    const orgId = orgIdOf();
    if (orgId) void persist.fuel(orgId, item);
  },
  removeFuelProvider: (id) => {
    set((state) => ({ fuelProviders: state.fuelProviders.filter((item) => item.id !== id) }));
    void persist.removeFuel(id);
  },
  upsertClient: (item) => {
    set((state) => ({ clients: replaceById(state.clients, item) }));
    const orgId = orgIdOf();
    if (orgId) void persist.client(orgId, item);
  },
  removeClient: (id) => {
    set((state) => ({ clients: state.clients.filter((item) => item.id !== id) }));
    void persist.removeClient(id);
  },
  upsertTrip: (trip) => {
    const computed = refreshTrip(trip, get());
    set((state) => ({ trips: replaceById(state.trips, computed) }));
    const orgId = orgIdOf();
    if (orgId) void persist.trip(orgId, computed);
  },
  removeTrip: (id) => {
    set((state) => ({ trips: state.trips.filter((item) => item.id !== id) }));
    void persist.removeTrip(id);
  },
  completeTrip: (id) => {
    const trip = get().trips.find((item) => item.id === id);
    if (!trip || trip.status !== "draft") return;
    const next = { ...trip, status: "completed" as const };
    set((state) => ({
      trips: state.trips.map((item) => (item.id === id ? next : item)),
    }));
    const orgId = orgIdOf();
    if (orgId) void persist.trip(orgId, next);
  },
  setFuelMarket: (fuelMarket) => {
    set({ fuelMarket });
    const orgId = orgIdOf();
    if (orgId) void persist.company(orgId, get().company, fuelMarket);
  },
  issueInvoice: (clientId, tripIds, issueDate) => {
    const state = get();
    const client = state.clients.find((item) => item.id === clientId);
    if (!client) return null;
    const selected = state.trips.filter(
      (trip) => tripIds.includes(trip.id) && trip.clientId === clientId && trip.status === "completed",
    );
    if (selected.length === 0) return null;
    const built = invoiceFromTrips(selected, client, state.company, issueDate ?? todayISO());
    const invoice: Invoice = {
      id: createId("inv"),
      number: built.number,
      clientId: built.clientId,
      issueDate: built.issueDate,
      tripIds: built.tripIds,
      lines: built.lines,
      base: built.base,
      ivaRate: built.ivaRate,
      iva: built.iva,
      irpfRate: built.irpfRate,
      irpf: built.irpf,
      total: built.total,
      status: "issued",
    };
    const company = { ...state.company, nextInvoiceNumber: built.nextNumber };
    const trips = state.trips.map((trip) =>
      selected.some((row) => row.id === trip.id)
        ? { ...trip, status: "invoiced" as const, invoiceId: invoice.id }
        : trip,
    );
    set({ invoices: [...state.invoices, invoice], company, trips });
    const orgId = orgIdOf();
    if (orgId) {
      void persist.invoice(orgId, invoice);
      void persist.company(orgId, company, state.fuelMarket);
      trips
        .filter((trip) => trip.invoiceId === invoice.id)
        .forEach((trip) => void persist.trip(orgId, trip));
    }
    return invoice;
  },
  markInvoicePaid: (id) => {
    const invoice = get().invoices.find((item) => item.id === id);
    if (!invoice) return;
    const next = { ...invoice, status: "paid" as const };
    set((state) => ({
      invoices: state.invoices.map((item) => (item.id === id ? next : item)),
    }));
    const orgId = orgIdOf();
    if (orgId) void persist.invoice(orgId, next);
  },
  resetDemo: async () => {
    const orgId = orgIdOf();
    if (orgId) {
      await clearWorkspace(orgId);
      const data = await seedWorkspace(orgId);
      set({ ...data, orgId });
      return;
    }
    set({ ...seedData });
  },
}));
