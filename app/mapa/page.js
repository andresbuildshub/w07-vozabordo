'use client'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { cargarTodo } from '../../lib/datos'
import { KMIN } from '../../lib/voz'

const Mapa = dynamic(() => import('../../components/Mapa'), { ssr: false, loading: () => <div className="h-[55vh] min-h-[320px] rounded-xl bg-arena animate-pulse" /> })

export default function PaginaMapa() {
  const [d, setD] = useState(null)
  const [error, setError] = useState(null)
  const [sel, setSel] = useState(null)
  const [verTodas, setVerTodas] = useState(false)
  useEffect(() => { cargarTodo().then(setD).catch((e) => setError(e.message)) }, [])
  const onSel = useCallback((id) => setSel(id), [])
  if (error) return <p className="text-rojo">{error}</p>
  if (!d) return <p>Cargando datos abiertos…</p>
  const { geo, rutas, meta, choques } = d
  const orden = [...rutas].sort((a, b) => a.rank - b.rank)
  const lista = verTodas ? orden : orden.filter((r) => r.eligible).slice(0, 15)
  const elegida = rutas.find((r) => r.id === sel)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">¿Dónde chocan los micros?</h1>
      <p className="max-w-3xl">
        Cada punto es un choque con un microbús registrado por la SSC entre 2018 y 2024 ({meta.n_events.toLocaleString('es-MX')} en total; los más oscuros tuvieron muertos).
        Las líneas son las {meta.routes} rutas de corredor concesionado del GTFS abierto. <span className="text-rojo font-semibold">Rojo</span> = las 10 rutas con más riesgo en exceso;
        <span className="text-naranja font-semibold"> naranja</span> = el resto que sí se puede publicar; <span className="text-neutral-500">gris punteado</span> = menos de {KMIN} unidades, no se publica.
        Los círculos rojos punteados son esquinas donde se juntan muchos choques.
      </p>
      <Mapa geo={geo} choques={choques} hotspots={meta.hotspots} seleccion={sel} onSeleccion={onSel} />
      {elegida && (
        <div className="tarjeta" aria-live="polite">
          <b>Ruta {elegida.short}</b> · {elegida.name.split(' · ')[1]}<br />
          {elegida.eligible
            ? <>{elegida.km} km · ~{elegida.units} unidades · {elegida.crashes} choques con microbús a 50 m (2018–2024) · lugar {elegida.rank} en riesgo</>
            : <>Menos de {KMIN} unidades estimadas{elegida.units ? ` (~${elegida.units})` : ' (dato del GTFS dudoso)'}: sus números no se publican.</>}
        </div>
      )}
      <section>
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <h2 className="text-xl font-bold">Rutas con más riesgo</h2>
          <span className="etiqueta">MODELO ESTADÍSTICO (corrige la suerte)</span>
        </div>
        <p className="text-sm text-neutral-700 mt-1 max-w-3xl">
          «Riesgo en exceso» = cuántos choques más de los que se esperarían para una ruta de ese largo, corrigiendo la suerte de rutas con pocos datos.
          No es una calificación de choferes: es una forma de decidir dónde empezar.
        </p>
        <ol className="mt-3 divide-y divide-arena tarjeta p-0">
          {lista.map((r) => (
            <li key={r.id}>
              <button onClick={() => setSel(r.id)} aria-pressed={sel === r.id}
                className={`w-full text-left px-4 py-3 flex justify-between gap-3 ${r.eligible ? '' : 'opacity-50'} ${sel === r.id ? 'bg-arena' : ''}`}>
                <span>
                  <b>{r.eligible ? `${r.rank} · ` : ''}Ruta {r.short}</b>
                  <span className="block text-sm text-neutral-600">{r.name.split(' · ')[1]}</span>
                  <span className="block text-xs text-neutral-500">
                    {r.eligible ? `${r.km} km · ~${r.units} unidades` : `menos de ${KMIN} unidades: no se publica`}
                  </span>
                </span>
                <span className="text-right shrink-0">
                  {r.eligible ? <><b>{r.crashes}</b><span className="block text-xs text-neutral-500">choques</span></> : '—'}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <button className="boton boton-sec mt-3" onClick={() => setVerTodas((v) => !v)}>
          {verTodas ? 'Ver solo las 15 primeras' : `Ver las ${rutas.length} rutas`}
        </button>
        <p className="mt-4"><Link className="boton" href="/plan">Siguiente: ¿se puede medir? →</Link></p>
      </section>
    </div>
  )
}
