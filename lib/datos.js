'use client'
// Client-side loader for the precomputed open data (cached per page load).
const cache = {}
export function cargar(nombre) {
  if (!cache[nombre]) cache[nombre] = fetch(`/data/${nombre}.json`).then((r) => {
    if (!r.ok) throw new Error(`No se pudo cargar ${nombre}`)
    return r.json()
  })
  return cache[nombre]
}
export async function cargarTodo() {
  const [geo, meta, choques] = await Promise.all([cargar('rutas'), cargar('meta'), cargar('choques')])
  return { geo, rutas: geo.features.map((f) => f.properties), meta, choques }
}
