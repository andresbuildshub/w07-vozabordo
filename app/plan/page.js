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
        <p className="text-xs text-neutral-600 mt-2">
          <span className="etiqueta">SIMULACIÓN</span> Monte Carlo sobre el registro real (500 programas simulados con {p.rutasSimuladas} rutas, prueba de permutación al 5%).
          No es una promesa de resultado: dice cuánto alcanza a ver el registro. Con 1–2 años antes como línea base.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold">Asignación al azar</h2>
        <p className="text-sm text-neutral-700 max-w-3xl">
          Las rutas se juntan en pares parecidos (1 con 2, 3 con 4…) y una moneda decide cuál lleva calcomanía. Así nadie escoge «sus» rutas.
          La semilla hace que cualquiera pueda repetir el volado y obtener lo mismo.
        </p>
        <label className="block mt-2 font-semibold" htmlFor="semilla">Semilla</label>
        <input id="semilla" inputMode="numeric" maxLength={9} value={semillaTxt} onChange={(e) => setSemillaTxt(e.target.value.replace(/\D/g, ''))}
          className="mt-1 h-11 w-40 rounded-lg border border-neutral-400 px-3" aria-describedby="semilla-ayuda" />
        <p id="semilla-ayuda" className="text-xs text-neutral-600">Solo números, hasta 9 dígitos.</p>
        {asig ? (
          <>
            <table className="mt-3 w-full text-sm tarjeta p-0 overflow-hidden">
              <thead className="bg-arena text-left"><tr><th className="p-2">Par</th><th className="p-2">Lleva calcomanía</th><th className="p-2">Control</th></tr></thead>
              <tbody>
                {asig.pares.map((par) => (
                  <tr key={par.par} className="border-t border-arena">
                    <td className="p-2">{par.par}</td>
                    <td className="p-2 font-semibold">{par.calcomania.short}</td>
                    <td className="p-2">{par.control.short}</td>
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
