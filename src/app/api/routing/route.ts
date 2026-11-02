import { NextRequest, NextResponse } from "next/server";

interface Point {
  lat: number;
  lng: number;
}

function haversineKm(a: Point, b: Point): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const originLat = toRad(a.lat);
  const destLat = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(originLat) * Math.cos(destLat) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function fallbackRoute(points: Point[], roundTrip: boolean) {
  const path = roundTrip && points[0] ? [...points, points[0]] : points;
  let distanceKm = 0;
  for (let i = 1; i < path.length; i += 1) {
    distanceKm += haversineKm(path[i - 1], path[i]) * 1.32;
  }
  const drivingMinutes = (distanceKm / 62) * 60;
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    drivingMinutes: Math.round(drivingMinutes),
    geometry: path.map((point) => [point.lat, point.lng] as [number, number]),
    fallback: true,
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { points?: Point[]; roundTrip?: boolean };
  const points = (body.points ?? []).filter(
    (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng),
  );
  if (points.length < 2) {
    return NextResponse.json({ error: "Se necesitan origen y destino" }, { status: 400 });
  }

  const sequence = body.roundTrip ? [...points, points[0]] : points;
  const coordPath = sequence.map((point) => `${point.lng},${point.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordPath}?overview=full&geometries=geojson&alternatives=false`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return NextResponse.json(fallbackRoute(points, Boolean(body.roundTrip)));
    }
    const data = (await response.json()) as {
      routes?: Array<{
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
      }>;
    };
    const route = data.routes?.[0];
    if (!route) {
      return NextResponse.json(fallbackRoute(points, Boolean(body.roundTrip)));
    }
    return NextResponse.json({
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      drivingMinutes: Math.round(route.duration / 60),
      geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
      fallback: false,
    });
  } catch {
    return NextResponse.json(fallbackRoute(points, Boolean(body.roundTrip)));
  }
}
