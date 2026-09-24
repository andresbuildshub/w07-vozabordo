import Link from 'next/link'
import meta from '../public/data/meta.json'

export default function Inicio() {
  const fuera = meta.n_events - meta.n_on_routes
  return (
    <div className="space-y-6">
      <section>
        <p className="etiqueta">Para quien coordina un programa de seguridad vial en rutas concesionadas</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight">El pasajero también maneja.</h1>
        <p className="mt-3 text-lg max-w-2xl">
          En Kenia, poner reglas y aparatos en los microbuses no bajó los choques. Una <b>calcomanía</b> que invitaba a los pasajeros a
          decirle al chofer «más despacio» los bajó entre una cuarta y una tercera parte, sin registrar a nadie.
          Voz a Bordo te ayuda a probar eso en la CDMX: <b>qué rutas</b>, <b>si se va a poder medir</b>, y <b>si funcionó</b>.
        </p>
      </section>

      <ol className="grid gap-3 sm:grid-cols-3">
        <li className="tarjeta"><b>1. Elige rutas con datos.</b><br />{meta.routes} rutas de corredor y {meta.n_events.toLocaleString('es-MX')} choques reales con microbús (2018–2024), ordenadas por riesgo. <Link className="text-rojo underline" href="/mapa">Ver mapa →</Link></li>
        <li className="tarjeta"><b>2. Pregunta antes de gastar.</b><br />¿El registro de choques alcanza a ver el efecto? A veces la respuesta honesta es no. <Link className="text-rojo underline" href="/plan">¿Se puede medir? →</Link></li>
        <li className="tarjeta"><b>3. Pega, cuenta y mide.</b><br />Imprime la calcomanía, registra en qué rutas quedó y compara contra rutas sin calcomanía. <Link className="text-rojo underline" href="/evaluar">Evaluar →</Link></li>
      </ol>

      <section className="tarjeta border-rojo/40">
        <h2 className="font-bold">Lo que Voz a Bordo nunca hace</h2>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>No pone ningún aparato al chofer ni registra su velocidad, su ubicación o lo que gana.</li>
          <li>No guarda quejas ni calificaciones. La conversación pasa dentro del micro, entre dos personas, y no deja registro.</li>
          <li>No identifica unidades, placas ni personas. Solo cuenta calcomanías por ruta.</li>
          <li>No publica números de rutas con menos de {meta.kmin} unidades: una ruta tan chica se puede señalar en una tarde.</li>
        </ul>
      </section>

      <section className="text-sm text-neutral-700 max-w-2xl">
        <p><b>Límites que debes saber:</b> solo {meta.n_on_routes.toLocaleString('es-MX')} de los {meta.n_events.toLocaleString('es-MX')} choques con microbús caen a 50 m de un corredor del GTFS abierto; los otros {fuera.toLocaleString('es-MX')} pasan en rutas que no están en los datos. El Estado de México no tiene un registro público con tipo de vehículo y ubicación, así que aquí no aparece. <Link className="underline" href="/metodo">Método y fuentes</Link>.</p>
      </section>
    </div>
  )
}
