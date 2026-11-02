"use client";

import { createClient } from "@/lib/supabase/client";
import { seedData } from "@/lib/store/seed";
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

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asCompany(row: Record<string, unknown>): CompanySettings {
  return {
    name: String(row.name ?? ""),
    tradeName: String(row.trade_name ?? ""),
    nif: String(row.nif ?? ""),
    address: String(row.address ?? ""),
    city: String(row.city ?? ""),
    postalCode: String(row.postal_code ?? ""),
    province: String(row.province ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    iban: String(row.iban ?? ""),
    legalForm: row.legal_form === "autonomo" ? "autonomo" : "sl",
    ivaRate: num(row.iva_rate, 0.21),
    employerSsRate: num(row.employer_ss_rate, 0.325),
    workingDaysPerMonth: num(row.working_days_per_month, 22),
    workingHoursPerDay: num(row.working_hours_per_day, 8),
    electricityEurKwh: num(row.electricity_eur_kwh, 0.18),
    defaultDieselPrice: num(row.default_diesel_price, 1.429),
    defaultPetrolPrice: num(row.default_petrol_price, 1.389),
    isRate: num(row.is_rate, 0.25),
    autonomoIrpfRate: num(row.autonomo_irpf_rate, 0.2),
    invoiceSeries: String(row.invoice_series ?? "TN"),
    nextInvoiceNumber: num(row.next_invoice_number, 1),
  };
}

function companyRow(orgId: string, company: CompanySettings, fuelMarket: FuelMarket) {
  return {
    org_id: orgId,
    name: company.name,
    trade_name: company.tradeName,
    nif: company.nif,
    address: company.address,
    city: company.city,
    postal_code: company.postalCode,
    province: company.province,
    email: company.email,
    phone: company.phone,
    iban: company.iban,
    legal_form: company.legalForm,
    iva_rate: company.ivaRate,
    employer_ss_rate: company.employerSsRate,
    working_days_per_month: company.workingDaysPerMonth,
    working_hours_per_day: company.workingHoursPerDay,
    electricity_eur_kwh: company.electricityEurKwh,
    default_diesel_price: company.defaultDieselPrice,
    default_petrol_price: company.defaultPetrolPrice,
    is_rate: company.isRate,
    autonomo_irpf_rate: company.autonomoIrpfRate,
    invoice_series: company.invoiceSeries,
    next_invoice_number: company.nextInvoiceNumber,
    fuel_market: fuelMarket,
  };
}

function asVehicle(row: Record<string, unknown>): Vehicle {
  return {
    id: String(row.id),
    plate: String(row.plate),
    brand: String(row.brand),
    model: String(row.model),
    fuelType: row.fuel_type as Vehicle["fuelType"],
    consumptionPer100: num(row.consumption_per_100),
    monthlyAmortization: num(row.monthly_amortization),
    annualInsurance: num(row.annual_insurance),
    annualTransportCard: num(row.annual_transport_card),
    annualItv: num(row.annual_itv),
    annualMaintenance: num(row.annual_maintenance),
    annualTaxes: num(row.annual_taxes),
    wearCostPerKm: num(row.wear_cost_per_km),
    palletCapacity: num(row.pallet_capacity, 8),
    active: Boolean(row.active),
  };
}

function vehicleRow(orgId: string, item: Vehicle) {
  return {
    id: item.id,
    org_id: orgId,
    plate: item.plate,
    brand: item.brand,
    model: item.model,
    fuel_type: item.fuelType,
    consumption_per_100: item.consumptionPer100,
    monthly_amortization: item.monthlyAmortization,
    annual_insurance: item.annualInsurance,
    annual_transport_card: item.annualTransportCard,
    annual_itv: item.annualItv,
    annual_maintenance: item.annualMaintenance,
    annual_taxes: item.annualTaxes,
    wear_cost_per_km: item.wearCostPerKm,
    pallet_capacity: item.palletCapacity,
    active: item.active,
  };
}

function asDriver(row: Record<string, unknown>): Driver {
  return {
    id: String(row.id),
    name: String(row.name),
    dni: String(row.dni),
    phone: String(row.phone ?? ""),
    monthlyGrossSalary: num(row.monthly_gross_salary),
    employerSs: num(row.employer_ss),
    ssManual: Boolean(row.ss_manual),
    monthlyHours: num(row.monthly_hours, 160),
    active: Boolean(row.active),
  };
}

function driverRow(orgId: string, item: Driver) {
  return {
    id: item.id,
    org_id: orgId,
    name: item.name,
    dni: item.dni,
    phone: item.phone,
    monthly_gross_salary: item.monthlyGrossSalary,
    employer_ss: item.employerSs,
    ss_manual: item.ssManual,
    monthly_hours: item.monthlyHours,
    active: item.active,
  };
}

function asFuel(row: Record<string, unknown>): FuelProvider {
  return {
    id: String(row.id),
    name: String(row.name),
    discountPerLiter: num(row.discount_per_liter),
    manualPricePerLiter: row.manual_price_per_liter == null ? null : num(row.manual_price_per_liter),
    useLivePrice: Boolean(row.use_live_price),
    brandQuery: String(row.brand_query ?? ""),
    active: Boolean(row.active),
  };
}

function fuelRow(orgId: string, item: FuelProvider) {
  return {
    id: item.id,
    org_id: orgId,
    name: item.name,
    discount_per_liter: item.discountPerLiter,
    manual_price_per_liter: item.manualPricePerLiter,
    use_live_price: item.useLivePrice,
    brand_query: item.brandQuery,
    active: item.active,
  };
}

function asClient(row: Record<string, unknown>): Client {
  const irpf = num(row.irpf_retention) as Client["irpfRetention"];
  return {
    id: String(row.id),
    name: String(row.name),
    nif: String(row.nif),
    address: String(row.address ?? ""),
    city: String(row.city ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    irpfRetention: irpf === 1 || irpf === 7 || irpf === 15 ? irpf : 0,
    active: Boolean(row.active),
  };
}

function clientRow(orgId: string, item: Client) {
  return {
    id: item.id,
    org_id: orgId,
    name: item.name,
    nif: item.nif,
    address: item.address,
    city: item.city,
    email: item.email,
    phone: item.phone,
    irpf_retention: item.irpfRetention,
    active: item.active,
  };
}

function asTrip(row: Record<string, unknown>): Trip {
  return {
    id: String(row.id),
    date: String(row.date),
    reference: String(row.reference),
    vehicleId: String(row.vehicle_id),
    driverId: String(row.driver_id),
    clientId: String(row.client_id),
    fuelProviderId: String(row.fuel_provider_id),
    roundTrip: Boolean(row.round_trip),
    stops: (row.stops as Trip["stops"]) ?? [],
    distanceKm: num(row.distance_km),
    drivingMinutes: num(row.driving_minutes),
    loadWaitMinutes: num(row.load_wait_minutes),
    geometry: (row.geometry as Trip["geometry"]) ?? [],
    extras: (row.extras as Trip["extras"]) ?? { tolls: 0, meals: 0, parking: 0, adblue: 0 },
    pricingMode: row.pricing_mode as Trip["pricingMode"],
    closedPrice: num(row.closed_price),
    pricePerPallet: num(row.price_per_pallet),
    pallets: num(row.pallets),
    pricePerKm: num(row.price_per_km),
    notes: String(row.notes ?? ""),
    status: row.status as Trip["status"],
    invoiceId: row.invoice_id ? String(row.invoice_id) : null,
    costs: row.costs as Trip["costs"],
    margin: row.margin as Trip["margin"],
  };
}

function tripRow(orgId: string, item: Trip) {
  return {
    id: item.id,
    org_id: orgId,
    date: item.date,
    reference: item.reference,
    vehicle_id: item.vehicleId,
    driver_id: item.driverId,
    client_id: item.clientId,
    fuel_provider_id: item.fuelProviderId,
    round_trip: item.roundTrip,
    stops: item.stops,
    distance_km: item.distanceKm,
    driving_minutes: item.drivingMinutes,
    load_wait_minutes: item.loadWaitMinutes,
    geometry: item.geometry,
    extras: item.extras,
    pricing_mode: item.pricingMode,
    closed_price: item.closedPrice,
    price_per_pallet: item.pricePerPallet,
    pallets: item.pallets,
    price_per_km: item.pricePerKm,
    notes: item.notes,
    status: item.status,
    invoice_id: item.invoiceId,
    costs: item.costs,
    margin: item.margin,
  };
}

function asInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: String(row.id),
    number: String(row.number),
    clientId: String(row.client_id),
    issueDate: String(row.issue_date),
    tripIds: (row.trip_ids as string[]) ?? [],
    lines: (row.lines as Invoice["lines"]) ?? [],
    base: num(row.base),
    ivaRate: num(row.iva_rate),
    iva: num(row.iva),
    irpfRate: num(row.irpf_rate),
    irpf: num(row.irpf),
    total: num(row.total),
    status: row.status as Invoice["status"],
  };
}

function invoiceRow(orgId: string, item: Invoice) {
  return {
    id: item.id,
    org_id: orgId,
    number: item.number,
    client_id: item.clientId,
    issue_date: item.issueDate,
    trip_ids: item.tripIds,
    lines: item.lines,
    base: item.base,
    iva_rate: item.ivaRate,
    iva: item.iva,
    irpf_rate: item.irpfRate,
    irpf: item.irpf,
    total: item.total,
    status: item.status,
  };
}

export async function loadWorkspace(): Promise<{ orgId: string; data: AppData } | null> {
  const supabase = createClient();
  const { data: membership, error: memError } = await supabase
    .from("memberships")
    .select("org_id")
    .limit(1)
    .maybeSingle();
  if (memError || !membership) return null;
  const orgId = membership.org_id as string;

  const [companyRes, vehiclesRes, driversRes, fuelRes, clientsRes, tripsRes, invoicesRes] =
    await Promise.all([
      supabase.from("companies").select("*").eq("org_id", orgId).maybeSingle(),
      supabase.from("vehicles").select("*").eq("org_id", orgId),
      supabase.from("drivers").select("*").eq("org_id", orgId),
      supabase.from("fuel_providers").select("*").eq("org_id", orgId),
      supabase.from("clients").select("*").eq("org_id", orgId),
      supabase.from("trips").select("*").eq("org_id", orgId),
      supabase.from("invoices").select("*").eq("org_id", orgId),
    ]);

  const companyRowData = companyRes.data as Record<string, unknown> | null;
  const fuelMarket = (companyRowData?.fuel_market as FuelMarket) ?? seedData.fuelMarket;

  return {
    orgId,
    data: {
      company: companyRowData ? asCompany(companyRowData) : seedData.company,
      vehicles: (vehiclesRes.data ?? []).map((row) => asVehicle(row as Record<string, unknown>)),
      drivers: (driversRes.data ?? []).map((row) => asDriver(row as Record<string, unknown>)),
      fuelProviders: (fuelRes.data ?? []).map((row) => asFuel(row as Record<string, unknown>)),
      clients: (clientsRes.data ?? []).map((row) => asClient(row as Record<string, unknown>)),
      trips: (tripsRes.data ?? []).map((row) => asTrip(row as Record<string, unknown>)),
      invoices: (invoicesRes.data ?? []).map((row) => asInvoice(row as Record<string, unknown>)),
      fuelMarket,
    },
  };
}

export async function seedWorkspace(orgId: string): Promise<AppData> {
  const supabase = createClient();
  const data = seedData;
  await supabase.from("companies").upsert(companyRow(orgId, data.company, data.fuelMarket));
  await supabase.from("vehicles").upsert(data.vehicles.map((item) => vehicleRow(orgId, item)));
  await supabase.from("drivers").upsert(data.drivers.map((item) => driverRow(orgId, item)));
  await supabase.from("fuel_providers").upsert(data.fuelProviders.map((item) => fuelRow(orgId, item)));
  await supabase.from("clients").upsert(data.clients.map((item) => clientRow(orgId, item)));
  const draftTrips = data.trips.map((trip) => tripRow(orgId, { ...trip, invoiceId: null }));
  await supabase.from("trips").upsert(draftTrips);
  await supabase.from("invoices").upsert(data.invoices.map((item) => invoiceRow(orgId, item)));
  await supabase.from("trips").upsert(data.trips.map((trip) => tripRow(orgId, trip)));
  return data;
}

export async function clearWorkspace(orgId: string) {
  const supabase = createClient();
  await supabase.from("trips").update({ invoice_id: null }).eq("org_id", orgId);
  await supabase.from("invoices").delete().eq("org_id", orgId);
  await supabase.from("trips").delete().eq("org_id", orgId);
  await supabase.from("vehicles").delete().eq("org_id", orgId);
  await supabase.from("drivers").delete().eq("org_id", orgId);
  await supabase.from("fuel_providers").delete().eq("org_id", orgId);
  await supabase.from("clients").delete().eq("org_id", orgId);
}

export const persist = {
  company: (orgId: string, company: CompanySettings, fuelMarket: FuelMarket) =>
    createClient().from("companies").upsert(companyRow(orgId, company, fuelMarket)),
  vehicle: (orgId: string, item: Vehicle) => createClient().from("vehicles").upsert(vehicleRow(orgId, item)),
  driver: (orgId: string, item: Driver) => createClient().from("drivers").upsert(driverRow(orgId, item)),
  fuel: (orgId: string, item: FuelProvider) => createClient().from("fuel_providers").upsert(fuelRow(orgId, item)),
  client: (orgId: string, item: Client) => createClient().from("clients").upsert(clientRow(orgId, item)),
  trip: (orgId: string, item: Trip) => createClient().from("trips").upsert(tripRow(orgId, item)),
  invoice: (orgId: string, item: Invoice) => createClient().from("invoices").upsert(invoiceRow(orgId, item)),
  removeVehicle: (id: string) => createClient().from("vehicles").delete().eq("id", id),
  removeDriver: (id: string) => createClient().from("drivers").delete().eq("id", id),
  removeFuel: (id: string) => createClient().from("fuel_providers").delete().eq("id", id),
  removeClient: (id: string) => createClient().from("clients").delete().eq("id", id),
  removeTrip: (id: string) => createClient().from("trips").delete().eq("id", id),
};
