import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  elegibles, asignar, potencia, evaluar, permutacion, parseQR, textoQR, registroColocacion, KMIN, veredicto,
} from '../lib/voz.js'

const geo = JSON.parse(readFileSync(new URL('../public/data/rutas.json', import.meta.url)))
const rutas = geo.features.map((f) => f.properties)
const meta = JSON.parse(readFileSync(new URL('../public/data/meta.json', import.meta.url)))
const choques = JSON.parse(readFileSync(new URL('../public/data/choques.json', import.meta.url)))
const E = elegibles(rutas)

test('data: 137 routes, 3,107 microbús crashes, eligible = units ≥ 11', () => {
  assert.equal(rutas.length, 137)
  assert.equal(choques.length, 3107)
  assert.equal(E.length, meta.eligible)
  assert.ok(E.every((r) => r.units >= KMIN))
})

test('(a) asignar is deterministic, one sticker + one control per pair, never an ineligible route', () => {
  const a = asignar(E, 40, 2041)
  const b = asignar(E, 40, 2041)
  assert.deepEqual(a.calcomania, b.calcomania)
  assert.equal(a.calcomania.length, 20)
  assert.equal(a.control.length, 20)
  assert.equal(new Set([...a.calcomania, ...a.control]).size, 40)
  const ids = new Set(E.map((r) => r.id))
  assert.ok([...a.calcomania, ...a.control].every((id) => ids.has(id)))
  assert.notDeepEqual(asignar(E, 40, 1).calcomania, a.calcomania)
})

test('(b) potencia reads the grid, never extrapolates, refuses more than eligible', () => {
  const p = potencia(meta, 40, 0.25, 1)
  assert.equal(p.rutasSimuladas, 40)
  assert.ok(p.valor > 0 && p.valor < 1)
  assert.equal(potencia(meta, 45, 0.25, 1).rutasSimuladas, 40) // rounds DOWN to a simulated N
  assert.throws(() => potencia(meta, meta.eligible + 1, 0.25, 1))
  assert.equal(veredicto(0.9).tono, 'si')
  assert.equal(veredicto(0.3).tono, 'no')
})

test('(c) placebo on the real ledger falls inside the permutation interval', () => {
  const a = asignar(E, 40, 2041)
  const r = evaluar(choques, a.calcomania, a.control, '2023-07', 12)
  assert.ok(r.tPre + r.cPre > 50, 'enough crashes in the window')
  const iv = permutacion(choques, a.calcomania, a.control, '2023-07', 12, 400)
  assert.ok(iv.bajo < r.razon && r.razon < iv.alto, `placebo ${r.razon} outside [${iv.bajo}, ${iv.alto}]`)
})

test('(d) QR payload: valid, unknown route, bad batch, foreign QR', () => {
  assert.deepEqual(parseQR(textoQR('6A', 'L01'), rutas), { ruta: '6A', lote: 'L01' })
  assert.throws(() => parseQR('VAB|NOEXISTE|L01', rutas), /no está/)
  assert.throws(() => parseQR('VAB|6A|l01; DROP', rutas), /Lote/)
  assert.throws(() => parseQR('https://example.com', rutas), /no es de Voz a Bordo/)
})

test('(e) the stored record has exactly {ruta, lote, fecha}', () => {
  const r = registroColocacion('6A', 'L01', new Date('2026-09-24T12:00:00Z'))
  assert.deepEqual(Object.keys(r).sort(), ['fecha', 'lote', 'ruta'])
  assert.equal(r.fecha, '2026-09-24')
})
