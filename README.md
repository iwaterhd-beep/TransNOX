# TransNOX

Consola operativa de margen, costes y facturación para transporte ligero hasta 3.500 kg MMA con plataforma elevadora (España).

## Arranque

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Los maestros y rutas de demostración (Sevilla - Huelva) se cargan en el navegador. No hace falta API key para mapas (OSM + OSRM) ni para precios de carburante (proxy MITEco).

## Qué incluye

1. **Maestros**: flota 3.5 t, conductores con coste hora empresa, tarjetas de combustible, clientes fiscales.
2. **Planificador GIS**: autocompletado Nominatim, Leaflet, ida / ida-vuelta, km, tiempo, esperas de muelle.
3. **Motor de costes** en tiempo real y **semáforo de margen** (<15% rojo, 15-25% amarillo, >25% verde).
4. **Facturas** Base + IVA 21% - IRPF (0/1/7/15), PDF con membrete y QR.
5. **Hucha fiscal**: IVA repercutido vs soportado (Modelo 303) y reserva IS / IRPF 130.
6. **Dashboard** de cierre mensual y KPIs (€/km, ranking clientes/vehículos, km en vacío, ocupación de palets).

Los datos viven en `localStorage` (`transnox-store`) para poder usar la app sin backend. El esquema listo para Supabase está en `supabase/schema.sql`.

## Fórmulas

- Combustible = (km / 100) × consumo × (precio litro - descuento tarjeta)
- Personal = (conducción + carga/espera) en horas × ((bruto + SS empresa) / horas mes)
- Desgaste = km × €/km
- Fijo imputado = ((fijos anuales/12 + amortización) / 22 / 8) × horas de ruta
- Coste directo = suma de los anteriores + peajes, dietas, parking, AdBlue
- Margen € = precio venta - coste directo
- Margen % = margen € / precio venta × 100

## Stack

Next.js 16, React 19, TypeScript, Tailwind v4, Zustand, Leaflet, Recharts, @react-pdf/renderer, Lucide.
