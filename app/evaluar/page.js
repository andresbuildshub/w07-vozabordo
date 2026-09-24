'use client'
import { useEffect, useMemo, useState } from 'react'
import { cargarTodo } from '../../lib/datos'
import { asignar, elegibles, evaluar, permutacion, lecturaEvaluacion } from '../../lib/voz'

const INICIOS = []
for (let y = 2019; y <= 2024; y++) for (const m of ['01', '07']) if (`${y}-${m}` <= '2024-01') INICIOS.push(`${y}-${m}`)

export default function Evaluar() {
  const [d, setD] = useState(null)
  const [n, setN] = useState(40)
  const [semillaTxt, setSemillaTxt] = useState('2041')
  const [inicio, setInicio] = useState('2023-07')
  const [meses, setMeses] = useState(12)
  useEffect(() => { cargarTodo().then(setD) }, [])
  const semilla = /^\d{1,9}$/.test(semillaTxt) ? Number(semillaTxt) : null
  const res = useMemo(() => {
    if (!d || semilla === null) return null
    const a = asignar(elegibles(d.rutas), n, semilla)
    const r = evaluar(d.choques, a.calcomania, a.control, inicio, meses)
    const iv = permutacion(d.choques, a.calcomania, a.control, inicio, meses, 1000)
    return { a, r, iv }
  }, [d, n, semilla, inicio, meses])
  if (!d) return <p>Cargando…</p>
  const mesesMax = inicio >= '2024-01' ? 12 : 24

  return (
    <div className="space-y-5">
      <div className="rounded-xl border-2 border-rojo bg-[#fbeee9] p-4">
        <p className="font-extrabold text-rojo">PLACEBO: nadie puso calcomanías.</p>
        <p className="text-sm mt-1">Todavía no hay un programa en la calle. Esta página corre la evaluación sobre choques <b>reales</b> con una fecha de inicio <b>inventada</b>, para que veas cómo se ve «sin efecto». Si alguna vez te sale «bajaron» aquí, es el azar, y por eso siempre se compara contra el intervalo.</p>
      </div>
      <h1 className="text-2xl font-extrabold">¿Funcionó? Compara contra rutas sin calcomanía.</h1>
      <div className="tarjeta flex flex-wrap gap-4 items-end">
        <label>Rutas<select value={n} onChange={(e) => setN(Number(e.target.value))} className="block h-11 rounded-lg border border-neutral-400 px-2">
          {[10, 20, 30, 40, 60, d.meta.eligible - (d.meta.eligible % 2)].map((x) => <option key={x} value={x}>{x}</option>)}
        </select></label>
        <label>Semilla<input inputMode="numeric" maxLength={9} value={semillaTxt} onChange={(e) => setSemillaTxt(e.target.value.replace(/\D/g, ''))} className="block h-11 w-28 rounded-lg border border-neutral-400 px-2" /></label>
        <label>Inicio (inventado)<select value={inicio} onChange={(e) => { setInicio(e.target.value); if (e.target.value >= '2024-01') setMeses(12) }} className="block h-11 rounded-lg border border-neutral-400 px-2">
          {INICIOS.map((x) => <option key={x}>{x}</option>)}
        </select></label>
        <label>Meses antes y después<select value={meses} onChange={(e) => setMeses(Number(e.target.value))} className="block h-11 rounded-lg border border-neutral-400 px-2">
          {[6, 12, 24].filter((x) => x <= mesesMax).map((x) => <option key={x} value={x}>{x}</option>)}
        </select></label>
      </div>
      {!res ? <p className="text-rojo">Escribe una semilla.</p> : (
        <>
          <table className="w-full text-sm tarjeta p-0 overflow-hidden">
            <thead className="bg-arena text-left"><tr><th className="p-2">Choques con microbús</th><th className="p-2">Antes</th><th className="p-2">Después</th></tr></thead>
            <tbody>
              <tr className="border-t border-arena"><td className="p-2 font-semibold">Rutas con calcomanía ({res.a.calcomania.length})</td><td className="p-2">{res.r.tPre}</td><td className="p-2">{res.r.tPost}</td></tr>
              <tr className="border-t border-arena"><td className="p-2">Rutas control ({res.a.control.length})</td><td className="p-2">{res.r.cPre}</td><td className="p-2">{res.r.cPost}</td></tr>
            </tbody>
          </table>
          <p className="text-xs text-neutral-600">Ventana: {res.r.desde} a {res.r.hasta} (sin incluir el último mes). Fuente: SSC, choques a 50 m de cada corredor.</p>
          <section className="tarjeta border-2 border-verde" aria-live="polite">
            <p className="text-sm font-semibold">Cambio relativo (calcomanía vs control)</p>
            <p className="text-4xl font-extrabold">{res.r.razon < 1 ? '−' : '+'}{Math.abs(Math.round((res.r.razon - 1) * 100))}%</p>
            <p className="mt-1">El azar, repartiendo las mismas rutas al revés 1,000 veces, da entre <b>{Math.round((res.iv.bajo - 1) * 100)}%</b> y <b>+{Math.round((res.iv.alto - 1) * 100)}%</b>.</p>
            <p className="mt-2 font-bold">{lecturaEvaluacion(res.r.razon, res.iv)}</p>
            <p className="text-xs text-neutral-600 mt-2"><span className="etiqueta">PRUEBA DE PERMUTACIÓN</span> corre en tu navegador sobre los datos abiertos.</p>
          </section>
        </>
      )}
    </div>
  )
}
