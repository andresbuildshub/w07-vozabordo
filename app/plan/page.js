'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { cargarTodo } from '../../lib/datos'
import { asignar, elegibles, potencia, fraseSimple, veredicto } from '../../lib/voz'

const EFECTOS = [
  [0.25, '−25%', 'lo que logró Zusha! a gran escala (lo realista)'],
  [0.33, '−33%', 'el mejor resultado a escala'],
  [0.5, '−50%', 'lo que dio el piloto chico (optimista)'],
]

function Opciones({ etiqueta, valores, valor, onCambio }) {
  return (
    <fieldset className="mt-3">
      <legend className="font-semibold">{etiqueta}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {valores.map(([v, t]) => (
          <button key={t} type="button" className="opcion" aria-pressed={valor === v} onClick={() => onCambio(v)}>{t}</button>
        ))}
      </div>
    </fieldset>
  )
}

export default function Plan() {
  const [d, setD] = useState(null)
  const [n, setN] = useState(40)
  const [efecto, setEfecto] = useState(0.25)
  const [anios, setAnios] = useState(1)
  const [semillaTxt, setSemillaTxt] = useState('2041')
  useEffect(() => { cargarTodo().then(setD) }, [])
  const semilla = /^\d{1,9}$/.test(semillaTxt) ? Number(semillaTxt) : null
  const E = useMemo(() => (d ? elegibles(d.rutas) : []), [d])
  const asig = useMemo(() => (E.length && semilla !== null ? asignar(E, n, semilla) : null), [E, n, semilla])
  if (!d) return <p>Cargando…</p>
  const tamanos = [10, 20, 30, 40, 60, d.meta.eligible].map((x) => [x, x === d.meta.eligible ? `${x} (todas)` : String(x)])
  const p = potencia(d.meta, n, efecto, anios)
  const v = veredicto(p.valor)

  function descargar() {
    const filas = [['par', 'ruta', 'grupo', 'nombre', 'semilla']]
    for (const par of asig.pares) {
      filas.push([par.par, par.calcomania.short, 'calcomania', par.calcomania.name, semilla])
      filas.push([par.par, par.control.short, 'control', par.control.name, semilla])
    }
    const csv = filas.map((f) => f.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }))
    a.download = `voz-a-bordo-asignacion-${semilla}.csv`
    a.click()
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">¿Se puede medir? Pregúntalo antes de gastar.</h1>
      <p className="max-w-3xl">
        Pones calcomanías en unas rutas y no en otras, y después comparas los choques. Pero los choques con microbús por ruta son pocos,
        y con pocos números el azar puede esconder un efecto real. Aquí ves qué tan probable es que el registro de la SSC <b>alcance a ver</b> el efecto.
      </p>
      <div className="tarjeta">
        <Opciones etiqueta="¿Cuántas rutas entran al programa? (la mitad lleva calcomanía, la otra mitad es control)" valores={tamanos} valor={n} onCambio={setN} />
        <fieldset className="mt-3">
          <legend className="font-semibold">¿Cuánto esperas que bajen los choques?</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {EFECTOS.map(([e, t, ayuda]) => (
              <button key={e} type="button" className="opcion" aria-pressed={efecto === e} onClick={() => setEfecto(e)} title={ayuda}>{t}</button>
            ))}
          </div>
          <p className="text-sm text-neutral-600 mt-1">{EFECTOS.find(([e]) => e === efecto)[2]}.</p>
        </fieldset>
        <Opciones etiqueta="¿Cuánto tiempo esperas para medir?" valores={[[1, '1 año'], [2, '2 años']]} valor={anios} onCambio={setAnios} />
      </div>

      <section className={`tarjeta ${v.tono === 'no' ? 'border-rojo' : v.tono === 'si' ? 'border-verde' : 'border-naranja'} border-2`} aria-live="polite">
        <p className="text-sm font-semibold">Probabilidad de detectar el efecto</p>
        <p className={`text-5xl font-extrabold ${v.tono === 'no' ? 'text-rojo' : v.tono === 'si' ? 'text-verde' : 'text-naranja'}`}>{Math.round(p.valor * 100)}%</p>
        <p className="font-bold mt-1">{v.texto}</p>
        <p className="mt-1">{fraseSimple(p.valor)}</p>
        <div className="mt-3 rounded-lg bg-arena p-3 text-sm">
          <p className="font-bold">Lo que tienes que decirle a quien decide</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Con la baja realista (−25%), incluso metiendo las {d.meta.eligible} rutas y esperando 2 años, <b>la probabilidad de notarlo se queda por debajo de 50%</b>. Solo bajas grandes se ven con claridad.</li>
            <li>Más de la mitad de los choques con microbús pasan en rutas que no están en los datos abiertos: este programa solo mide los corredores.</li>
            <li>No hay evidencia en México de que los pasajeros se animen a hablarle al chofer (en el Edomex, 8 de cada 10 robos en transporte son con violencia). Lo primero que un piloto real tendría que averiguar es eso.</li>
          </ul>
        </div>
        <p className="text-xs text-neutral-600 mt-2">
          <span className="etiqueta">SIMULACIÓN</span> Cómo se calculó: Monte Carlo sobre el registro real (500 programas simulados con {p.rutasSimuladas} rutas, prueba de permutación al 5%).
          No es una promesa de resultado: dice cuánto alcanza a ver el registro. Con 1–2 años antes como línea base.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">Asignación al azar</h2>
        <p className="max-w-3xl">
          Tomamos las <b>{n} rutas con más riesgo</b> del mapa (las mismas, en el mismo orden), las juntamos en pares parecidos (la 1 con la 2, la 3 con la 4…)
          y un volado decide cuál de cada par lleva calcomanía. <b>La otra se queda sin calcomanía para poder comparar</b>: sin ese grupo no sabrías si los choques bajaron por la calcomanía o por otra cosa.
        </p>
        {asig && (
          <p className="mt-2 rounded-lg bg-amarillo/60 p-3 max-w-3xl">
            <b>Empieza por la columna «Lleva calcomanía»:</b> {asig.calcomania.slice(0, 5).map((id) => d.rutas.find((r) => r.id === id).short).join(', ')}…
            {' '}Las marcadas con ● están entre las 10 rojas del mapa.
          </p>
        )}
        <details className="mt-2 max-w-3xl tarjeta">
          <summary className="font-semibold cursor-pointer">¿Por qué hay rutas rojas (●) en Control, sin calcomanía?</summary>
          <p className="mt-2 text-sm">
            Para comparar bien, cada ruta peligrosa necesita una pareja igual de peligrosa sin calcomanía. Las rutas que tuvieron un año muy malo
            suelen tener uno menos malo después, con o sin calcomanía. Si todas las rojas llevaran calcomanía, no sabrías si bajaron por la calcomanía
            o solo porque regresaron a lo normal. <b>Al terminar la medición, las rutas de control reciben su calcomanía.</b>
          </p>
        </details>
        <label className="block mt-3 font-semibold" htmlFor="semilla">Número del sorteo</label>
        <input id="semilla" inputMode="numeric" maxLength={9} value={semillaTxt} onChange={(e) => setSemillaTxt(e.target.value.replace(/\D/g, ''))}
          className="mt-1 h-11 w-40 rounded-lg border border-neutral-400 px-3" aria-describedby="semilla-ayuda" />
        <p id="semilla-ayuda" className="text-xs text-neutral-600">Guárdalo: con el mismo número cualquiera puede repetir el sorteo y comprobar que no escogiste tus rutas. Solo números, hasta 9 dígitos.</p>
        {asig ? (
          <>
            <table className="mt-3 w-full text-sm tarjeta p-0 overflow-hidden">
              <thead className="bg-arena text-left"><tr><th className="p-2">Par</th><th className="p-2">Lleva calcomanía</th><th className="p-2">Control</th></tr></thead>
              <tbody>
                {asig.pares.map((par) => (
                  <tr key={par.par} className="border-t border-arena">
                    <td className="p-2">{par.par}</td>
                    <td className="p-2 font-semibold">{par.calcomania.short}{par.calcomania.rank <= 10 ? ' ●' : ''}</td>
                    <td className="p-2">{par.control.short}{par.control.rank <= 10 ? ' ●' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="boton" onClick={descargar}>Descargar lista (CSV)</button>
              <Link className="boton boton-sec" href="/calcomania">Siguiente: imprimir calcomanías →</Link>
            </div>
          </>
        ) : <p className="text-rojo mt-2">Escribe una semilla para ver la asignación.</p>}
      </section>
    </div>
  )
}
