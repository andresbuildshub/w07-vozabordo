'use client'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

// Leaflet map: corridor routes (GTFS), microbús crashes (SSC), DBSCAN hotspots.
export default function Mapa({ geo, choques, hotspots, seleccion, onSeleccion }) {
  const div = useRef(null)
  const estado = useRef({})

  useEffect(() => {
    let vivo = true
    import('leaflet').then((L) => {
      if (!vivo || estado.current.mapa) return
      const mapa = L.map(div.current, { preferCanvas: true, zoomControl: true }).setView([19.40, -99.13], 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, attribution: '© OpenStreetMap',
      }).addTo(mapa)
      const lienzo = L.canvas({ padding: 0.5 })
      for (const [lat, lon, , , muertos, ruta] of choques) {
        L.circleMarker([lat, lon], {
          renderer: lienzo, radius: muertos ? 3.5 : 2, weight: 0, fillOpacity: ruta ? 0.55 : 0.25,
          fillColor: muertos ? '#7a2410' : '#1d1d1f',
        }).addTo(mapa)
      }
      const capas = {}
      const estilo = (p) => p.eligible
        ? { color: p.rank <= 10 ? '#b23a1f' : '#e08a2e', weight: p.rank <= 10 ? 4 : 2.5, opacity: 0.85 }
        : { color: '#8a8f89', weight: 1.5, opacity: 0.6, dashArray: '4 4' }
      L.geoJSON(geo, {
        style: (f) => estilo(f.properties),
        onEachFeature: (f, capa) => {
          capas[f.properties.id] = capa
          capa.on('click', () => onSeleccion?.(f.properties.id))
        },
      }).addTo(mapa)
      for (const h of hotspots) {
        L.circle([h.lat, h.lon], { radius: 160, color: '#b23a1f', weight: 2, dashArray: '5 4', fill: false })
          .bindTooltip(`${h.corner}: ${h.n} choques con microbús`).addTo(mapa)
      }
      estado.current = { mapa, capas, estilo, L }
    })
    return () => { vivo = false }
  }, [geo, choques, hotspots, onSeleccion])

  useEffect(() => {
    const { mapa, capas, estilo } = estado.current
    if (!mapa) return
    for (const [id, capa] of Object.entries(capas)) {
      const p = capa.feature.properties
      capa.setStyle(id === seleccion ? { color: '#14352b', weight: 7, opacity: 1, dashArray: null } : estilo(p))
    }
    if (seleccion && capas[seleccion]) {
      capas[seleccion].bringToFront()
      mapa.fitBounds(capas[seleccion].getBounds(), { padding: [20, 20] })
    }
  }, [seleccion])

  useEffect(() => () => { estado.current.mapa?.remove(); estado.current = {} }, [])

  return <div ref={div} className="h-[55vh] min-h-[320px] w-full rounded-xl border border-arena" role="region" aria-label="Mapa de rutas y choques" />
}
