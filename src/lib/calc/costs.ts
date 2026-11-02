import { round2 } from "@/lib/format";
import type {
  CompanySettings,
  Driver,
  FuelMarket,
  FuelProvider,
  MarginLight,
  MarginResult,
  PricingMode,
  RouteCostBreakdown,
  RouteExtras,
  Trip,
  Vehicle,
} from "@/lib/types";

export const EMPLOYER_SS_HINT = 0.325;

export function monthlyFixedCosts(vehicle: Vehicle): number {
  return (
    (vehicle.annualInsurance +
      vehicle.annualTransportCard +
      vehicle.annualItv +
      vehicle.annualMaintenance +
      vehicle.annualTaxes) /
    12
  );
}

export function monthlyVehicleBurden(vehicle: Vehicle): number {
  return monthlyFixedCosts(vehicle) + vehicle.monthlyAmortization;
}

export function employerSsFromGross(gross: number, rate: number): number {
  return round2(gross * rate);
}

export function driverHourlyCost(driver: Driver): number {
  if (driver.monthlyHours <= 0) return 0;
  return (driver.monthlyGrossSalary + driver.employerSs) / driver.monthlyHours;
}

export function vehicleHourlyFixed(
  vehicle: Vehicle,
  settings: CompanySettings,
): number {
  const days = Math.max(1, settings.workingDaysPerMonth);
  const hours = Math.max(1, settings.workingHoursPerDay);
  return monthlyVehicleBurden(vehicle) / days / hours;
}

export function extrasTotal(extras: RouteExtras): number {
  return extras.tolls + extras.meals + extras.parking + extras.adblue;
}

export function liveFuelUnitPrice(
  vehicle: Vehicle,
  provider: FuelProvider,
  market: FuelMarket,
  settings: CompanySettings,
): number {
  if (vehicle.fuelType === "electrico") {
    return settings.electricityEurKwh;
  }
  if (!provider.useLivePrice && provider.manualPricePerLiter != null) {
    return provider.manualPricePerLiter;
  }
  const branded = market.byBrand[provider.brandQuery.toLowerCase()];
  if (vehicle.fuelType === "gasolina") {
    return branded?.petrol || market.petrol || settings.defaultPetrolPrice;
  }
  return branded?.diesel || market.diesel || settings.defaultDieselPrice;
}

export function netEnergyPrice(
  vehicle: Vehicle,
  provider: FuelProvider,
  unitPrice: number,
): number {
  if (vehicle.fuelType === "electrico") return Math.max(0, unitPrice);
  return Math.max(0, unitPrice - provider.discountPerLiter);
}

export function computeRouteCosts(input: {
  vehicle: Vehicle;
  driver: Driver;
  settings: CompanySettings;
  distanceKm: number;
  drivingMinutes: number;
  loadWaitMinutes: number;
  roundTrip: boolean;
  pallets: number;
  unitEnergyPrice: number;
  discountPerLiter: number;
  extras: RouteExtras;
}): RouteCostBreakdown {
  const hoursUsed =
    (Math.max(0, input.drivingMinutes) + Math.max(0, input.loadWaitMinutes)) /
    60;
  const distanceKm = Math.max(0, input.distanceKm);
  const energyPrice =
    input.vehicle.fuelType === "electrico"
      ? Math.max(0, input.unitEnergyPrice)
      : Math.max(0, input.unitEnergyPrice - input.discountPerLiter);

  const fuel =
    (distanceKm / 100) * input.vehicle.consumptionPer100 * energyPrice;
  const personnel = hoursUsed * driverHourlyCost(input.driver);
  const wear = distanceKm * input.vehicle.wearCostPerKm;
  const fixedImputed =
    vehicleHourlyFixed(input.vehicle, input.settings) * hoursUsed;
  const extras = extrasTotal(input.extras);

  const emptyKm = input.roundTrip ? distanceKm / 2 : 0;
  const loadedKm = Math.max(0, distanceKm - emptyKm);
  const occupancyPct =
    input.vehicle.palletCapacity > 0
      ? Math.min(100, (input.pallets / input.vehicle.palletCapacity) * 100)
      : 0;

  return {
    fuel: round2(fuel),
    personnel: round2(personnel),
    wear: round2(wear),
    fixedImputed: round2(fixedImputed),
    extras: round2(extras),
    total: round2(fuel + personnel + wear + fixedImputed + extras),
    hoursUsed: round2(hoursUsed),
    emptyKm: round2(emptyKm),
    loadedKm: round2(loadedKm),
    occupancyPct: round2(occupancyPct),
  };
}

export function computeSalePrice(input: {
  mode: PricingMode;
  closedPrice: number;
  pricePerPallet: number;
  pallets: number;
  pricePerKm: number;
  distanceKm: number;
}): number {
  switch (input.mode) {
    case "closed":
      return round2(Math.max(0, input.closedPrice));
    case "per_pallet":
      return round2(Math.max(0, input.pricePerPallet) * Math.max(0, input.pallets));
    case "per_km":
      return round2(Math.max(0, input.pricePerKm) * Math.max(0, input.distanceKm));
  }
}

export function computeMargin(sale: number, cost: number): MarginResult {
  const safeSale = round2(Math.max(0, sale));
  const safeCost = round2(Math.max(0, cost));
  const euros = round2(safeSale - safeCost);
  const pct = safeSale > 0 ? round2((euros / safeSale) * 100) : 0;
  let light: MarginLight = "neutral";
  if (safeSale > 0) {
    if (pct < 15) light = "red";
    else if (pct <= 25) light = "yellow";
    else light = "green";
  }
  return { sale: safeSale, cost: safeCost, euros, pct, light };
}

export function evaluateTrip(
  trip: Pick<
    Trip,
    | "distanceKm"
    | "drivingMinutes"
    | "loadWaitMinutes"
    | "roundTrip"
    | "pallets"
    | "extras"
    | "pricingMode"
    | "closedPrice"
    | "pricePerPallet"
    | "pricePerKm"
  >,
  vehicle: Vehicle,
  driver: Driver,
  provider: FuelProvider,
  settings: CompanySettings,
  market: FuelMarket,
): { costs: RouteCostBreakdown; margin: MarginResult; unitEnergyPrice: number } {
  const unitEnergyPrice = liveFuelUnitPrice(vehicle, provider, market, settings);
  const costs = computeRouteCosts({
    vehicle,
    driver,
    settings,
    distanceKm: trip.distanceKm,
    drivingMinutes: trip.drivingMinutes,
    loadWaitMinutes: trip.loadWaitMinutes,
    roundTrip: trip.roundTrip,
    pallets: trip.pallets,
    unitEnergyPrice,
    discountPerLiter: provider.discountPerLiter,
    extras: trip.extras,
  });
  const sale = computeSalePrice({
    mode: trip.pricingMode,
    closedPrice: trip.closedPrice,
    pricePerPallet: trip.pricePerPallet,
    pallets: trip.pallets,
    pricePerKm: trip.pricePerKm,
    distanceKm: trip.distanceKm,
  });
  return {
    costs,
    margin: computeMargin(sale, costs.total),
    unitEnergyPrice,
  };
}

export const MARGIN_COPY: Record<MarginLight, { title: string; detail: string }> = {
  red: {
    title: "Alerta crítica",
    detail: "Margen por debajo del 15%. Riesgo de pérdida o baja rentabilidad.",
  },
  yellow: {
    title: "Aceptable",
    detail: "Margen entre 15% y 25%. Cubre costes, con poco colchón.",
  },
  green: {
    title: "Óptimo",
    detail: "Margen por encima del 25%. Ruta financieramente sana.",
  },
  neutral: {
    title: "Sin tarifa",
    detail: "Introduce el precio de venta para auditar el margen.",
  },
};
