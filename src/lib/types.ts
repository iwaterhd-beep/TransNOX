export type FuelType = "diesel" | "gasolina" | "electrico";
export type PricingMode = "closed" | "per_pallet" | "per_km";
export type RouteStatus = "draft" | "completed" | "invoiced";
export type InvoiceStatus = "issued" | "paid";
export type LegalForm = "sl" | "autonomo";
export type MarginLight = "red" | "yellow" | "green" | "neutral";
export type IrpfRate = 0 | 1 | 7 | 15;
export type StopKind = "origin" | "waypoint" | "destination";

export interface CompanySettings {
  name: string;
  tradeName: string;
  nif: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  email: string;
  phone: string;
  iban: string;
  legalForm: LegalForm;
  ivaRate: number;
  employerSsRate: number;
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
  electricityEurKwh: number;
  defaultDieselPrice: number;
  defaultPetrolPrice: number;
  isRate: number;
  autonomoIrpfRate: number;
  invoiceSeries: string;
  nextInvoiceNumber: number;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  fuelType: FuelType;
  consumptionPer100: number;
  monthlyAmortization: number;
  annualInsurance: number;
  annualTransportCard: number;
  annualItv: number;
  annualMaintenance: number;
  annualTaxes: number;
  wearCostPerKm: number;
  palletCapacity: number;
  active: boolean;
}

export interface Driver {
  id: string;
  name: string;
  dni: string;
  phone: string;
  monthlyGrossSalary: number;
  employerSs: number;
  ssManual: boolean;
  monthlyHours: number;
  active: boolean;
}

export interface FuelProvider {
  id: string;
  name: string;
  discountPerLiter: number;
  manualPricePerLiter: number | null;
  useLivePrice: boolean;
  brandQuery: string;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  nif: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  irpfRetention: IrpfRate;
  active: boolean;
}

export interface GeoPoint {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface RouteStop extends GeoPoint {
  id: string;
  kind: StopKind;
  pallets: number;
}

export interface RouteExtras {
  tolls: number;
  meals: number;
  parking: number;
  adblue: number;
}

export interface RouteCostBreakdown {
  fuel: number;
  personnel: number;
  wear: number;
  fixedImputed: number;
  extras: number;
  total: number;
  hoursUsed: number;
  emptyKm: number;
  loadedKm: number;
  occupancyPct: number;
}

export interface MarginResult {
  sale: number;
  cost: number;
  euros: number;
  pct: number;
  light: MarginLight;
}

export interface Trip {
  id: string;
  date: string;
  reference: string;
  vehicleId: string;
  driverId: string;
  clientId: string;
  fuelProviderId: string;
  roundTrip: boolean;
  stops: RouteStop[];
  distanceKm: number;
  drivingMinutes: number;
  loadWaitMinutes: number;
  geometry: [number, number][];
  extras: RouteExtras;
  pricingMode: PricingMode;
  closedPrice: number;
  pricePerPallet: number;
  pallets: number;
  pricePerKm: number;
  notes: string;
  status: RouteStatus;
  invoiceId: string | null;
  costs: RouteCostBreakdown;
  margin: MarginResult;
}

export interface InvoiceLine {
  tripId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  issueDate: string;
  tripIds: string[];
  lines: InvoiceLine[];
  base: number;
  ivaRate: number;
  iva: number;
  irpfRate: number;
  irpf: number;
  total: number;
  status: InvoiceStatus;
}

export interface FuelMarket {
  updatedAt: string | null;
  diesel: number;
  petrol: number;
  byBrand: Record<string, { diesel: number; petrol: number; stations: number }>;
  source: "miteco" | "manual";
}

export interface AppData {
  company: CompanySettings;
  vehicles: Vehicle[];
  drivers: Driver[];
  fuelProviders: FuelProvider[];
  clients: Client[];
  trips: Trip[];
  invoices: Invoice[];
  fuelMarket: FuelMarket;
}

export interface GeocodeHit {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface RoutingResult {
  distanceKm: number;
  drivingMinutes: number;
  geometry: [number, number][];
}
