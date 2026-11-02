"use client";

import type { RouteStop } from "@/lib/types";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { useTheme } from "next-themes";
import "leaflet/dist/leaflet.css";

function markerIcon(kind: RouteStop["kind"], index?: number) {
  const colors = {
    origin: "#e0b03a",
    waypoint: "#8e98a6",
    destination: "#3fa86a",
  };
  const text = kind === "waypoint" ? String((index ?? 0) + 1) : kind === "origin" ? "O" : "D";
  return L.divIcon({
    className: "tn-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:999px;background:${colors[kind]};color:#161a20;display:flex;align-items:center;justify-content:center;font:600 11px IBM Plex Mono,monospace;border:2px solid #fff">${text}</div>`,
  });
}

function Fit({ stops, geometry }: { stops: RouteStop[]; geometry: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    const points = geometry.length > 0 ? geometry : stops.map((stop) => [stop.lat, stop.lng] as [number, number]);
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 11);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [28, 28] });
  }, [geometry, map, stops]);
  return null;
}

export default function RouteMap({
  stops,
  geometry,
}: {
  stops: RouteStop[];
  geometry: [number, number][];
}) {
  const { resolvedTheme } = useTheme();
  const tiles =
    resolvedTheme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  const waypoints = stops.filter((stop) => stop.kind === "waypoint");

  return (
    <MapContainer
      center={[37.3891, -5.9845]}
      zoom={8}
      className="h-full w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url={tiles}
      />
      <Fit stops={stops} geometry={geometry} />
      {geometry.length > 1 ? (
        <Polyline positions={geometry} pathOptions={{ color: "#c48a12", weight: 4, opacity: 0.9 }} />
      ) : null}
      {stops.map((stop, index) =>
        Number.isFinite(stop.lat) && Number.isFinite(stop.lng) ? (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={markerIcon(stop.kind, waypoints.findIndex((item) => item.id === stop.id))}
          />
        ) : (
          <span key={`${stop.id}-${index}`} hidden />
        ),
      )}
    </MapContainer>
  );
}
