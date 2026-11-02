import { monthKey, round2 } from "@/lib/format";
import type {
  Client,
  CompanySettings,
  Invoice,
  Trip,
  Vehicle,
} from "@/lib/types";

export interface MonthClose {
  month: string;
  invoicedGross: number;
  taxableIncome: number;
  ivaRepercutido: number;
  ivaSoportado: number;
  ivaAIngresar: number;
  fuel: number;
  payroll: number;
  maintenance: number;
  extras: number;
  operatingCosts: number;
  profitBeforeTax: number;
  taxReserveIs: number;
  taxReserveTotal: number;
  netCleanProfit: number;
  km: number;
  emptyKm: number;
  profitPerKm: number;
  occupancyAvg: number;
  routeCount: number;
}

function deductibleBase(trip: Trip): number {
  return trip.costs.fuel + trip.extras.tolls + trip.extras.parking + trip.extras.adblue;
}

export function closeMonth(
  month: string,
  trips: Trip[],
  invoices: Invoice[],
  settings: CompanySettings,
): MonthClose {
  const monthTrips = trips.filter(
    (trip) => monthKey(trip.date) === month && trip.status !== "draft",
  );
  const monthInvoices = invoices.filter((invoice) => monthKey(invoice.issueDate) === month);

  const taxableIncome = round2(monthInvoices.reduce((sum, invoice) => sum + invoice.base, 0));
  const invoicedGross = round2(monthInvoices.reduce((sum, invoice) => sum + invoice.total, 0));
  const ivaRepercutido = round2(monthInvoices.reduce((sum, invoice) => sum + invoice.iva, 0));

  const fuel = round2(monthTrips.reduce((sum, trip) => sum + trip.costs.fuel, 0));
  const payroll = round2(monthTrips.reduce((sum, trip) => sum + trip.costs.personnel, 0));
  const maintenance = round2(monthTrips.reduce((sum, trip) => sum + trip.costs.wear, 0));
  const extras = round2(monthTrips.reduce((sum, trip) => sum + trip.costs.extras, 0));
  const operatingCosts = round2(fuel + payroll + maintenance + extras + monthTrips.reduce((sum, trip) => sum + trip.costs.fixedImputed, 0));

  const deductible = round2(monthTrips.reduce((sum, trip) => sum + deductibleBase(trip), 0));
  const ivaSoportado = round2(deductible * settings.ivaRate);
  const ivaAIngresar = round2(Math.max(0, ivaRepercutido - ivaSoportado));

  const profitBeforeTax = round2(taxableIncome - operatingCosts);
  const taxRate = settings.legalForm === "autonomo" ? settings.autonomoIrpfRate : settings.isRate;
  const taxReserveIs = round2(Math.max(0, profitBeforeTax) * taxRate);
  const taxReserveTotal = round2(ivaAIngresar + taxReserveIs);
  const netCleanProfit = round2(profitBeforeTax - taxReserveIs);

  const km = round2(monthTrips.reduce((sum, trip) => sum + trip.distanceKm, 0));
  const emptyKm = round2(monthTrips.reduce((sum, trip) => sum + trip.costs.emptyKm, 0));
  const occupancyAvg =
    monthTrips.length === 0
      ? 0
      : round2(monthTrips.reduce((sum, trip) => sum + trip.costs.occupancyPct, 0) / monthTrips.length);

  return {
    month,
    invoicedGross,
    taxableIncome,
    ivaRepercutido,
    ivaSoportado,
    ivaAIngresar,
    fuel,
    payroll,
    maintenance,
    extras,
    operatingCosts,
    profitBeforeTax,
    taxReserveIs,
    taxReserveTotal,
    netCleanProfit,
    km,
    emptyKm,
    profitPerKm: km > 0 ? round2(netCleanProfit / km) : 0,
    occupancyAvg,
    routeCount: monthTrips.length,
  };
}

export function clientRanking(
  month: string,
  trips: Trip[],
  clients: Client[],
): Array<{ client: Client; sale: number; cost: number; marginPct: number; trips: number }> {
  return clients
    .map((client) => {
      const rows = trips.filter(
        (trip) =>
          trip.clientId === client.id &&
          monthKey(trip.date) === month &&
          trip.status !== "draft",
      );
      const sale = rows.reduce((sum, trip) => sum + trip.margin.sale, 0);
      const cost = rows.reduce((sum, trip) => sum + trip.costs.total, 0);
      const marginPct = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
      return { client, sale: round2(sale), cost: round2(cost), marginPct: round2(marginPct), trips: rows.length };
    })
    .filter((row) => row.trips > 0)
    .sort((a, b) => b.marginPct - a.marginPct);
}

export function vehicleRanking(
  month: string,
  trips: Trip[],
  vehicles: Vehicle[],
): Array<{
  vehicle: Vehicle;
  km: number;
  cost: number;
  costPerKm: number;
  marginPct: number;
  trips: number;
}> {
  return vehicles
    .map((vehicle) => {
      const rows = trips.filter(
        (trip) =>
          trip.vehicleId === vehicle.id &&
          monthKey(trip.date) === month &&
          trip.status !== "draft",
      );
      const km = rows.reduce((sum, trip) => sum + trip.distanceKm, 0);
      const cost = rows.reduce((sum, trip) => sum + trip.costs.total, 0);
      const sale = rows.reduce((sum, trip) => sum + trip.margin.sale, 0);
      return {
        vehicle,
        km: round2(km),
        cost: round2(cost),
        costPerKm: km > 0 ? round2(cost / km) : 0,
        marginPct: sale > 0 ? round2(((sale - cost) / sale) * 100) : 0,
        trips: rows.length,
      };
    })
    .filter((row) => row.trips > 0)
    .sort((a, b) => a.costPerKm - b.costPerKm);
}
