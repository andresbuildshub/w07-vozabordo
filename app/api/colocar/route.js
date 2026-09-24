import { NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import { timingSafeEqual, randomBytes } from 'node:crypto'
import rutasGeo from '../../../public/data/rutas.json'
import { LOTE_RE, registroColocacion } from '../../../lib/voz'

export const dynamic = 'force-dynamic'
const CORTAS = new Set(rutasGeo.features.filter((f) => f.properties.eligible).map((f) => f.properties.short))
const PREFIJO = 'colocaciones/'

function codigoValido(dado) {
  const real = process.env.PROGRAM_CODE || ''
  const a = Buffer.from(String(dado || '').slice(0, 64))
  const b = Buffer.from(real)
  return real.length > 0 && a.length === b.length && timingSafeEqual(a, b)
}

// Counts per route, read from blob pathnames (colocaciones/<ruta>/<lote>/<fecha>/<rand>.json). No contents needed.
export async function GET() {
  const porRuta = {}
  let cursor
  let total = 0
  try {
    do {
      const r = await list({ prefix: PREFIJO, cursor, limit: 1000 })
      for (const b of r.blobs) {
        const [, ruta, lote] = b.pathname.split('/')
        if (!CORTAS.has(ruta)) continue
        porRuta[ruta] ??= { total: 0, lotes: {} }
        porRuta[ruta].total++
        porRuta[ruta].lotes[lote] = (porRuta[ruta].lotes[lote] || 0) + 1
        total++
      }
      cursor = r.hasMore ? r.cursor : undefined
    } while (cursor)
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el conteo' }, { status: 503 })
  }
  return NextResponse.json({ total, porRuta })
}

export async function POST(req) {
  let b
  try { b = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }
  if (typeof b !== 'object' || b === null) return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  if (!codigoValido(b.codigo)) return NextResponse.json({ error: 'Código de programa incorrecto' }, { status: 401 })
  const ruta = String(b.ruta || '').slice(0, 12)
  const lote = String(b.lote || '').slice(0, 12)
  if (!CORTAS.has(ruta)) return NextResponse.json({ error: 'Ruta no elegible o inexistente' }, { status: 400 })
  if (!LOTE_RE.test(lote)) return NextResponse.json({ error: 'Lote inválido' }, { status: 400 })
  const reg = registroColocacion(ruta, lote) // exactly {ruta, lote, fecha} — nothing else is ever stored
  const nombre = `${PREFIJO}${ruta}/${lote}/${reg.fecha}/${Date.now()}-${randomBytes(4).toString('hex')}.json`
  try {
    await put(nombre, JSON.stringify(reg), { access: 'private', contentType: 'application/json', addRandomSuffix: false })
  } catch {
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 503 })
  }
  return NextResponse.json({ ok: true, guardado: reg })
}
