// Voz a Bordo — pure logic (no React, no DOM). Tested in test/voz.test.mjs.
// Nothing here ever handles a plate, a unit, a chofer or a person: only routes, batches and counts.

export const KMIN = 11 // minimum estimated units for a route-level number to be published

// Seeded PRNG so any assignment can be recomputed by anyone with the same seed.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Eligible routes, best-first (rank from the Empirical Bayes model).
export function elegibles(rutas) {
  return rutas.filter((r) => r.eligible).sort((a, b) => a.rank - b.rank)
}

// Pairs by rank (1–2, 3–4, …), one coin flip per pair: one route gets the sticker, the other is control.
export function asignar(rutasElegibles, n, seed) {
  if (!Number.isInteger(n) || n < 2) throw new Error('n debe ser un entero ≥ 2')
  if (n > rutasElegibles.length) throw new Error(`Solo hay ${rutasElegibles.length} rutas elegibles`)
  const rand = mulberry32(seed)
  const top = rutasElegibles.slice(0, n - (n % 2))
  const calcomania = []
  const control = []
  const pares = []
  for (let i = 0; i < top.length; i += 2) {
    const [a, b] = [top[i], top[i + 1]]
    const aGana = rand() < 0.5
    const [t, c] = aGana ? [a, b] : [b, a]
    calcomania.push(t.id)
    control.push(c.id)
    pares.push({ par: i / 2 + 1, calcomania: t, control: c })
  }
  return { calcomania, control, pares, seed }
}

// Probability of detecting the effect, from the precomputed Monte Carlo grid.
// Uses the largest simulated N that is ≤ n (never extrapolates upward).
export function potencia(meta, n, efecto, anios) {
  if (n > meta.eligible) throw new Error(`Solo hay ${meta.eligible} rutas elegibles`)
  const filas = meta.power.filter((p) => p.effect === efecto && p.years_after === anios && p.routes <= n)
  if (!filas.length) throw new Error('Sin simulación para esos parámetros')
  const fila = filas.sort((a, b) => b.routes - a.routes)[0]
  return { valor: fila.power, rutasSimuladas: fila.routes }
}

export function fraseSimple(p) {
  const fallan = Math.round((1 - p) * 10)
  if (p >= 0.8) return `Alta: de cada 10 programas así, unos ${10 - fallan} verían el efecto.`
  return `De cada 10 programas así, unos ${fallan} no podrían distinguir el efecto del azar.`
}

export function veredicto(p) {
  if (p >= 0.8) return { tono: 'si', texto: 'SÍ SE PUEDE MEDIR con este registro.' }
  if (p >= 0.5) return { tono: 'medio', texto: 'MEDIO: es casi un volado. Más rutas o más años.' }
  return { tono: 'no', texto: 'NO SE PUEDE MEDIR BIEN: gastarías sin saber si funcionó.' }
}

function sumarMes(ym, meses) {
  const [y, m] = ym.split('-').map(Number)
  const t = y * 12 + (m - 1) + meses
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`
}

// Counts crashes before/after `inicio` (YYYY-MM) in windows of `meses`, for sticker vs control routes.
// choques rows: [lat, lon, "YYYY-MM", lesionados, fallecidos, routeId|null]
export function evaluar(choques, tratadas, control, inicio, meses = 12) {
  const desde = sumarMes(inicio, -meses)
  const hasta = sumarMes(inicio, meses)
  const T = new Set(tratadas)
  const C = new Set(control)
  const n = { tPre: 0, tPost: 0, cPre: 0, cPost: 0 }
  for (const [, , ym, , , ruta] of choques) {
    if (!ruta || ym < desde || ym >= hasta) continue
    const post = ym >= inicio
    if (T.has(ruta)) post ? n.tPost++ : n.tPre++
    else if (C.has(ruta)) post ? n.cPost++ : n.cPre++
  }
  return { ...n, desde, hasta, razon: razon(n) }
}

function razon({ tPre, tPost, cPre, cPost }) {
  // +0.5 keeps an empty cell from dividing by zero
  return ((tPost + 0.5) / (tPre + 0.5)) / ((cPost + 0.5) / (cPre + 0.5))
}

// Null distribution: reshuffle which routes are "sticker" many times; where would chance put the ratio?
export function permutacion(choques, tratadas, control, inicio, meses = 12, veces = 1000, seed = 7) {
  const todas = [...tratadas, ...control]
  const rand = mulberry32(seed)
  const razones = []
  for (let k = 0; k < veces; k++) {
    const mezc = [...todas]
    for (let i = mezc.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[mezc[i], mezc[j]] = [mezc[j], mezc[i]]
    }
    const r = evaluar(choques, mezc.slice(0, tratadas.length), mezc.slice(tratadas.length), inicio, meses).razon
    razones.push(r)
  }
  razones.sort((a, b) => a - b)
  return { bajo: razones[Math.floor(veces * 0.025)], alto: razones[Math.floor(veces * 0.975)] }
}

export function lecturaEvaluacion(razon, intervalo) {
  const pct = Math.round((1 - razon) * 100)
  if (razon < intervalo.bajo)
    return `Las rutas con calcomanía bajaron ${pct}% respecto al control, más de lo que el azar suele dar.`
  if (razon > intervalo.alto)
    return `Las rutas con calcomanía SUBIERON respecto al control, más de lo que el azar suele dar. Revisa qué pasó.`
  return 'No se distingue del azar. Con estos números no puedes decir que funcionó (ni que no).'
}

export const LOTE_RE = /^[A-Z0-9-]{1,12}$/

// QR payload: <site>/a-bordo#VAB|<route short name>|<batch>. Nothing else fits in it on purpose.
// The part after '#' never reaches the server when a passenger opens the link.
export function parseQR(texto, rutas) {
  let t = String(texto || '').trim()
  if (t.includes('#')) t = decodeURIComponent(t.slice(t.indexOf('#') + 1))
  const partes = t.split('|')
  if (partes.length !== 3 || partes[0] !== 'VAB') throw new Error('Este QR no es de Voz a Bordo')
  const [, corta, lote] = partes
  const ruta = rutas.find((r) => r.short === corta)
  if (!ruta) throw new Error(`La ruta ${corta} no está en la lista`)
  if (!LOTE_RE.test(lote)) throw new Error('Lote inválido')
  return { ruta: ruta.short, lote }
}

export function textoQR(corta, lote, origen = '') {
  const carga = `VAB|${corta}|${lote}`
  return origen ? `${origen}/a-bordo#${encodeURIComponent(carga)}` : carga
}

// The only record the server is allowed to keep.
export function registroColocacion(ruta, lote, fecha = new Date()) {
  return { ruta, lote, fecha: fecha.toISOString().slice(0, 10) }
}
