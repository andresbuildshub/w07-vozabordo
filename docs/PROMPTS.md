# Prompts — w07-vozabordo

Prompts worth keeping from this build. Raw material for the Week 12 Method.

## Implementation prompt (packet → coding agent), 2026-09-23

> Build "Voz a Bordo" (Next.js 15 App Router, JS, Tailwind 4) from docs/PACKET.md. UI language: Spanish (Mexico), plain words, no jargon without a one-line explanation. Data is precomputed in `public/data/` (rutas.json GeoJSON with per-route stats; choques.json rows `[lat, lon, "YYYY-MM", lesionados, fallecidos, routeId|null]`; meta.json with power grid, placebo, hotspots, sources). Never add a field that identifies a vehicle, chofer or person.
>
> **F1 — lib/voz.js (pure, tested):** `mulberry32(seed)`; `asignar(elegibles, n, seed)` → pairs by rank, coin flip per pair, returns `{calcomania:[], control:[]}`; `potencia(meta, n, efecto, anios)` → nearest precomputed N ≤ requested (never extrapolate), error if n > eligible; `evaluar(choques, tratadas, control, inicio, meses)` → counts pre/post and ratio `(Tpost/Tpre)/(Cpost/Cpre)`; `permutacion(...)` → 2.5/97.5 percentiles over 1,000 random reassignments; `parseQR(text, rutas)` → `{ruta, lote}` or error, format `VAB|<route_short>|<lote>`, lote `^[A-Z0-9-]{1,12}$`. **Accept:** node tests (a)–(e) of the packet pass.
> **F2 — /mapa:** Leaflet (client-only, dynamic import), OSM tiles, routes colored by eligibility/rank, crash points (canvas renderer), hotspot circles; ranking list below (eligible first; ineligible shown greyed "menos de 11 unidades: no se publica"). Label "MODELO ESTADÍSTICO". **Accept:** loads at 390 px without horizontal scroll; tapping a route in the list highlights it on the map.
> **F3 — /plan:** three choice groups (rutas 10/20/30/40/60/92, efecto 25/33/50, años 1/2), big % + plain sentence ("de cada 10 programas así, X no podrían distinguir el efecto del azar"), verdict line; seed input (default 2041) → assignment table + CSV download. **Accept:** same seed → same table.
> **F4 — /calcomania:** route + lote inputs (validated), 4 stickers per letter page, QR via `qrcode`, print CSS. **F5 — /a-bordo:** passenger page.
> **F6 — /colocar + /api/colocar:** program code field; camera via getUserMedia + jsQR on canvas frames (on-device); on decode → POST `{ruta, lote, codigo}`; server validates code (env PROGRAM_CODE, timingSafeEqual), route exists, lote regex; writes Vercel Blob `colocaciones/<ts>-<rand>.json` with exactly `{ruta, lote, fecha}`; GET returns counts per route. Manual-entry fallback when no camera. **Accept:** wrong code → 401 and nothing written.
> **F7 — /evaluar:** pick sticker/control groups (default = placebo seed 2041 top-40) and start month; show 4 counts, ratio, permutation interval, verdict sentence; banner "PLACEBO: nadie puso calcomanías".
> **F8 — /metodo:** sources, method, limits (56% of microbús crashes off GTFS corridors; SSC ≠ C5; units estimated; Z1 no data; Edomex absent).
>
> **Commit plan:** (1) lib + tests, (2) layout/nav + home + /a-bordo, (3) /mapa, (4) /plan, (5) /calcomania, (6) /colocar + API, (7) /evaluar + /metodo, then deploy; fixes after mechanical + persona passes each get their own commit + deploy.
