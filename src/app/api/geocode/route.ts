import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ hits: [] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "es");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("q", q);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "TransNOX/1.0 (ops@transnox.es)",
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "No se pudo geocodificar" }, { status: 502 });
  }

  const data = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    name?: string;
  }>;

  return NextResponse.json({
    hits: data.map((item) => ({
      label: item.name || item.display_name.split(",")[0],
      address: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
    })),
  });
}
