'use client'
import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { cargarTodo } from '../../lib/datos'
import { parseQR, LOTE_RE } from '../../lib/voz'

export default function Colocar() {
  const [rutas, setRutas] = useState([])
  const [codigo, setCodigo] = useState('')
  const [camara, setCamara] = useState(false)
  const [leido, setLeido] = useState(null)
  const [msg, setMsg] = useState(null)
  const [conteo, setConteo] = useState(null)
  const [manualRuta, setManualRuta] = useState('')
  const [manualLote, setManualLote] = useState('')
  const video = useRef(null)
  const lienzo = useRef(null)
  const flujo = useRef(null)

  useEffect(() => { cargarTodo().then((d) => setRutas(d.rutas)); refrescar() }, [])
  useEffect(() => () => detener(), [])

  async function refrescar() {
    try { const r = await fetch('/api/colocar'); setConteo(r.ok ? await r.json() : null) } catch { setConteo(null) }
  }

  function detener() {
    flujo.current?.getTracks().forEach((t) => t.stop())
    flujo.current = null
    setCamara(false)
  }

  async function iniciar() {
    setMsg(null); setLeido(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      flujo.current = s
      video.current.srcObject = s
      await video.current.play()
      setCamara(true)
      requestAnimationFrame(cuadro)
    } catch {
      setMsg({ tipo: 'error', texto: 'No hay acceso a la cámara. Usa la captura manual de abajo.' })
    }
  }

  // Vision on the phone: each frame is read into a canvas, jsQR looks for a code, and the frame is discarded.
  function cuadro() {
    if (!flujo.current) return
    const v = video.current
    const c = lienzo.current
    if (v.readyState === v.HAVE_ENOUGH_DATA) {
      c.width = v.videoWidth; c.height = v.videoHeight
      const ctx = c.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(v, 0, 0, c.width, c.height)
      const img = ctx.getImageData(0, 0, c.width, c.height)
      const q = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
      ctx.clearRect(0, 0, c.width, c.height)
      if (q) {
        try { setLeido(parseQR(q.data, rutas)); detener(); return }
        catch (e) { setMsg({ tipo: 'error', texto: e.message }) }
      }
    }
    requestAnimationFrame(cuadro)
  }

  async function registrar(dato) {
    setMsg(null)
    const r = await fetch('/api/colocar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...dato, codigo }) })
    const j = await r.json().catch(() => ({}))
    if (r.ok) { setMsg({ tipo: 'ok', texto: `Listo: +1 calcomanía en la ruta ${j.guardado.ruta} (lote ${j.guardado.lote}). Solo se guardó ruta, lote y fecha.` }); setLeido(null); refrescar() }
    else setMsg({ tipo: 'error', texto: j.error || 'No se pudo registrar' })
  }

  const manualOk = rutas.some((r) => r.short === manualRuta && r.eligible) && LOTE_RE.test(manualLote.toUpperCase())

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-extrabold">Registrar calcomanías colocadas</h1>
      <p>Cuando pegues una calcomanía dentro de un micro, escanea su QR. La app suma <b>+1 a esa ruta</b>. No pide placa, número económico ni foto: sin saber en qué rutas quedaron, la evaluación no sirve, pero para eso basta con contarlas.</p>
      <label className="block">
        <span className="font-semibold">Código del programa</span>
        <input type="password" autoComplete="off" maxLength={64} value={codigo} onChange={(e) => setCodigo(e.target.value)}
          className="mt-1 block h-11 w-full max-w-xs rounded-lg border border-neutral-400 px-3" />
        <span className="text-xs text-neutral-600">Es la clave del programa, la tiene quien administra este sitio (si coordinas tú, pídela ahí). Sin código no se guarda nada.</span>
      </label>

      <section className="tarjeta space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="etiqueta">LA CÁMARA LEE EL QR</span>
          <span className="text-sm">La cámara lee el QR aquí mismo; ninguna imagen sale del teléfono.</span>
        </div>
        <video ref={video} playsInline muted className={`w-full rounded-lg bg-black ${camara ? '' : 'hidden'}`} />
        <canvas ref={lienzo} className="hidden" />
        {!camara ? <button className="boton" onClick={iniciar}>Abrir cámara</button> : <button className="boton boton-sec" onClick={detener}>Cerrar cámara</button>}
        {leido && (
          <div className="rounded-lg bg-arena p-3">
            <p>QR leído: <b>ruta {leido.ruta}</b>, lote <b>{leido.lote}</b>.</p>
            <button className="boton mt-2" disabled={!codigo} onClick={() => registrar(leido)}>Registrar esta calcomanía</button>
          </div>
        )}
      </section>

      <details className="tarjeta">
        <summary className="font-semibold cursor-pointer">Sin cámara: captura manual</summary>
        <div className="mt-3 flex flex-wrap gap-3 items-end">
          <label>Ruta<input value={manualRuta} maxLength={6} onChange={(e) => setManualRuta(e.target.value.toUpperCase())} className="block h-11 w-24 rounded-lg border border-neutral-400 px-2" /></label>
          <label>Lote<input value={manualLote} maxLength={12} onChange={(e) => setManualLote(e.target.value.toUpperCase())} className="block h-11 w-28 rounded-lg border border-neutral-400 px-2" /></label>
          <button className="boton" disabled={!manualOk || !codigo} onClick={() => registrar({ ruta: manualRuta, lote: manualLote.toUpperCase() })}>Registrar</button>
        </div>
      </details>

      {msg && <p role="status" className={msg.tipo === 'ok' ? 'text-verde font-semibold' : 'text-rojo font-semibold'}>{msg.texto}</p>}

      <section>
        <h2 className="text-xl font-bold">Calcomanías registradas por ruta</h2>
        <p className="text-xs text-neutral-600"><span className="etiqueta">DEMOSTRACIÓN</span> No hay un programa real en la calle: cualquier conteo aquí es de prueba.</p>
        {!conteo ? <p className="text-sm mt-2">Sin datos todavía.</p> : conteo.total === 0 ? <p className="text-sm mt-2">Todavía no hay calcomanías registradas.</p> : (
          <ul className="mt-2 tarjeta divide-y divide-arena p-0">
            {Object.entries(conteo.porRuta).sort((a, b) => b[1].total - a[1].total).map(([ruta, v]) => (
              <li key={ruta} className="flex justify-between px-4 py-2"><span>Ruta {ruta}</span><b>{v.total}</b></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
