'use client'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { cargarTodo } from '../../lib/datos'
import { LOTE_RE, textoQR } from '../../lib/voz'

function Calcomania({ corta, lote, qr }) {
  return (
    <div className="calco rounded-2xl border-[3px] border-tinta bg-amarillo p-4 flex gap-3 items-start break-inside-avoid">
      <div className="flex-1">
        <p className="text-2xl font-extrabold leading-tight">¿Va muy rápido?</p>
        <p className="mt-1 text-lg leading-snug">Tienes derecho a decirle:<br /><b>«Más despacio, por favor.»</b></p>
        <p className="mt-1 text-lg">Aquí todos vamos igual.</p>
        <p className="mt-2 text-[11px] leading-tight">Ruta {corta} · Lote {lote} · Nadie registra quién habla ni en qué unidad. No es un número de quejas.</p>
      </div>
      {qr && <img src={qr} alt={`Código QR ruta ${corta}, lote ${lote}`} className="w-24 h-24 bg-white p-1 rounded" />}
    </div>
  )
}

export default function PaginaCalcomania() {
  const [rutas, setRutas] = useState([])
  const [corta, setCorta] = useState('6A')
  const [loteTxt, setLoteTxt] = useState('L01')
  const [qr, setQr] = useState(null)
  useEffect(() => { cargarTodo().then((d) => setRutas([...d.rutas].sort((a, b) => a.rank - b.rank))) }, [])
  const lote = loteTxt.toUpperCase()
  const loteOk = LOTE_RE.test(lote)
  const ruta = rutas.find((r) => r.short === corta)
  useEffect(() => {
    if (!loteOk || !ruta) { setQr(null); return }
    QRCode.toDataURL(textoQR(corta, lote, window.location.origin), { margin: 1, width: 240 }).then(setQr)
  }, [corta, lote, loteOk, ruta])

  return (
    <div className="space-y-4">
      <div className="no-imprimir space-y-3">
        <h1 className="text-2xl font-extrabold">Calcomanía para imprimir</h1>
        <p className="max-w-3xl">
          Sale 4 veces por hoja tamaño carta. El texto no acusa a nadie: le da permiso al pasajero de hablar y le recuerda que no es el único.
          El QR solo lleva <b>ruta y lote</b>. Si un pasajero lo escanea, llega a una página que explica qué es y qué no es.
        </p>
        <div className="flex flex-wrap gap-4 items-end">
          <label className="block">
            <span className="font-semibold">Ruta</span>
            <select value={corta} onChange={(e) => setCorta(e.target.value)} className="mt-1 block h-11 rounded-lg border border-neutral-400 px-2">
              {rutas.map((r) => (
                <option key={r.id} value={r.short} disabled={!r.eligible}>
                  {r.short}{r.eligible ? '' : ' (menos de 11 unidades)'}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-semibold">Lote</span>
            <input value={loteTxt} maxLength={12} onChange={(e) => setLoteTxt(e.target.value)} aria-invalid={!loteOk}
              className="mt-1 block h-11 w-32 rounded-lg border border-neutral-400 px-3 uppercase" />
          </label>
          <button className="boton" onClick={() => window.print()} disabled={!loteOk}>Imprimir</button>
        </div>
        {!loteOk && <p className="text-rojo text-sm">El lote solo puede tener letras, números y guiones (hasta 12).</p>}
      </div>
      {loteOk && ruta && (
        <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Calcomania key={i} corta={corta} lote={lote} qr={qr} />)}
        </div>
      )}
    </div>
  )
}
