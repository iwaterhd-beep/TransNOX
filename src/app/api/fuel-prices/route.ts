import { NextResponse } from "next/server";

const MITECO =
  "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroCCAA/01";

function parseEs(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

type FuelPayload = {
  updatedAt: string;
  fechaMiteco: string | null;
  diesel: number;
  petrol: number;
  stations: number;
  byBrand: Record<string, { diesel: number; petrol: number; stations: number }>;
  source: "miteco";
};

let memoryCache: { expires: number; body: FuelPayload } | null = null;

export async function GET() {
  try {
    if (memoryCache && memoryCache.expires > Date.now()) {
      return NextResponse.json(memoryCache.body);
    }
    const response = await fetch(MITECO, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ error: "MITEco no disponible" }, { status: 502 });
    }
    const payload = (await response.json()) as {
      Fecha?: string;
      ListaEESSPrecio?: Array<Record<string, string>>;
    };
    const stations = payload.ListaEESSPrecio ?? [];
    const sevilla = stations.filter((station) => (station.Provincia ?? "").toUpperCase() === "SEVILLA");
    const pool = sevilla.length > 0 ? sevilla : stations;

    const diesel = pool.map((station) => parseEs(station["Precio Gasoleo A"])).filter((value): value is number => value != null);
    const petrol = pool.map((station) => parseEs(station["Precio Gasolina 95 E5"])).filter((value): value is number => value != null);

    const brands = ["cepsa", "repsol", "plenoil", "bp", "shell", "galp"];
    const byBrand: Record<string, { diesel: number; petrol: number; stations: number }> = {};
    for (const brand of brands) {
      const branded = pool.filter((station) => (station["Rótulo"] ?? "").toLowerCase().includes(brand));
      const d = branded.map((station) => parseEs(station["Precio Gasoleo A"])).filter((value): value is number => value != null);
      const p = branded.map((station) => parseEs(station["Precio Gasolina 95 E5"])).filter((value): value is number => value != null);
      const dAvg = average(d);
      const pAvg = average(p);
      if (dAvg || pAvg) {
        byBrand[brand] = {
          diesel: Number((dAvg ?? 0).toFixed(3)),
          petrol: Number((pAvg ?? 0).toFixed(3)),
          stations: branded.length,
        };
      }
    }

    const body: FuelPayload = {
      updatedAt: new Date().toISOString(),
      fechaMiteco: payload.Fecha ?? null,
      diesel: Number((average(diesel) ?? 0).toFixed(3)),
      petrol: Number((average(petrol) ?? 0).toFixed(3)),
      stations: pool.length,
      byBrand,
      source: "miteco",
    };
    memoryCache = { expires: Date.now() + 6 * 60 * 60 * 1000, body };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "MITEco no disponible" }, { status: 502 });
  }
}
