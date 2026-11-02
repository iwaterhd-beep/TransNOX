"use client";

import { Input } from "@/components/ui/field";
import type { GeocodeHit } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

export function AddressSearch({
  label,
  value,
  onSelect,
  placeholder,
}: {
  label: string;
  value: string;
  onSelect: (hit: GeocodeHit) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (query.trim().length < 3 || query === value) {
      setHits([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = (await response.json()) as { hits?: GeocodeHit[] };
        setHits(data.hits ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => window.clearTimeout(handle);
  }, [query, value]);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">{label}</span>
        <Input
          value={query}
          placeholder={placeholder}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
          autoComplete="off"
        />
      </label>
      {open && (hits.length > 0 || loading) ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-lg">
          {loading ? <li className="px-3 py-2 text-xs text-muted">Buscando direcciones...</li> : null}
          {hits.map((hit) => (
            <li key={`${hit.lat}-${hit.lng}-${hit.address}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-card-2"
                onClick={() => {
                  onSelect(hit);
                  setQuery(hit.address);
                  setOpen(false);
                  setHits([]);
                }}
              >
                <span className="block text-sm font-medium">{hit.label}</span>
                <span className="block text-xs text-muted">{hit.address}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
