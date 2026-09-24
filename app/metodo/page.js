import meta from '../../public/data/meta.json'

export const metadata = { title: 'Voz a Bordo · Método y fuentes' }

export default function Metodo() {
  const pl = meta.placebo
  return (
    <article className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold">Método, fuentes y límites</h1>
      <h2 className="text-lg font-bold">Fuentes (datos abiertos, sin datos personales)</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><b>Choques:</b> {meta.sources.ssc}. {meta.n_events.toLocaleString('es-MX')} hechos con al menos un microbús, 2018–2024.</li>
        <li><b>Rutas:</b> {meta.sources.gtfs}. {meta.routes} rutas.</li>
        <li><b>Evidencia de la calcomanía:</b> Habyarimana & Jack, «State vs Consumer Regulation» (NBER WP 18378, 2012) y el estudio a gran escala en PNAS (2015): en Kenia, las calcomanías bajaron las reclamaciones al seguro entre la mitad y dos tercios en el piloto, y entre una cuarta y una tercera parte a escala. Las reglas del gobierno (limitadores de velocidad) no tuvieron efecto medible.</li>
      </ul>
      <h2 className="text-lg font-bold">Qué hace el modelo</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>Cada choque se asigna al corredor más cercano si está a {meta.buffer_m} m o menos.</li>
        <li><b>Riesgo en exceso (Empirical Bayes):</b> esperado = {meta.lambda_km_yr} choques por km por año × largo de la ruta. Como las rutas con pocos choques pueden verse peligrosas por suerte, el número observado se mezcla con el esperado según cuánta evidencia tiene (sobredispersión k = {meta.k}). Se ordena por observado corregido − esperado.</li>
        <li><b>Esquinas (DBSCAN):</b> grupos de 8 o más choques a menos de 120 m entre sí. Encontró {meta.hotspots.length} esquinas; la primera: {meta.hotspots[0].corner} ({meta.hotspots[0].n} choques).</li>
        <li><b>Unidades por ruta (estimación):</b> tiempo de la vuelta completa ÷ intervalo entre salidas, del GTFS. Menos de {meta.kmin} unidades → no se publica. Pasan {meta.eligible} de {meta.routes}.</li>
        <li><b>¿Se puede medir? (Monte Carlo):</b> se simulan 500 programas por escenario con la tasa de cada ruta fija, ruido de conteo, la mitad con calcomanía, y una prueba de permutación al 5%.</li>
        <li><b>Placebo de referencia (calculado en Python):</b> 40 rutas, semilla {pl.seed}, inicio inventado {pl.start}, 12 meses antes y después → razón {pl.ratio}, dentro de lo que da el azar ({pl.null_lo}–{pl.null_hi}). El método no inventa efectos donde no los hay.</li>
      </ol>
      <h2 className="text-lg font-bold">Límites (dichos en voz alta)</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><b>{(meta.n_events - meta.n_on_routes).toLocaleString('es-MX')} de {meta.n_events.toLocaleString('es-MX')} choques con microbús (56%) no caen cerca de ningún corredor del GTFS:</b> pasan en rutas que no están en los datos abiertos. La mayoría del problema está fuera del mapa.</li>
        <li><b>Con el efecto que Zusha! logró a escala (−25%), el registro casi no lo ve:</b> incluso con las {meta.eligible} rutas y 2 años, la probabilidad de detectarlo es menor a 1 en 2. Solo efectos de −33% o más, con muchas rutas y 2 años, se ven con claridad.</li>
        <li>El C5 («incidentes viales») no registra tipo de vehículo, por eso se usa la SSC. La SSC solo registra lo que atiende; los choques sin reporte no están.</li>
        <li>Las unidades por ruta son una estimación del GTFS, no un conteo. La ruta Z1 tiene datos imposibles y queda como «sin dato».</li>
        <li>Estado de México: no hay registro público con tipo de vehículo y ubicación. Voz a Bordo no aplica ahí todavía.</li>
        <li>La evidencia es de Nairobi. En el Edomex, el 82.8% de los robos en transporte colectivo son con violencia (ENVIPE 2025): no hay fuente de que un pasajero mexicano se atreva a hablarle al chofer. Eso es lo primero que un programa real tendría que medir.</li>
      </ul>
      <p className="text-sm text-neutral-600">Código y pipeline: <code>scripts/build_data.py</code> en el repositorio.</p>
    </article>
  )
}
