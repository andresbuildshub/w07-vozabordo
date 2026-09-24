export const metadata = { title: 'Voz a Bordo · Para pasajeros' }

export default function ABordo() {
  return (
    <div className="max-w-xl space-y-4 text-lg">
      <p className="etiqueta">Escaneaste la calcomanía</p>
      <h1 className="text-3xl font-extrabold">Si va muy rápido, puedes decirle.</h1>
      <p>«Más despacio, por favor.» Con respeto, en voz alta. La calcomanía está para que no seas la única persona que lo piensa.</p>
      <div className="tarjeta space-y-2 text-base">
        <p><b>Qué es:</b> un estudio por ruta para ver si los choques bajan cuando los pasajeros se sienten con permiso de hablar.</p>
        <p><b>Qué NO es:</b> no es un número de quejas, no califica al chofer y no guarda nada de ti. Nadie registra quién habla ni en qué unidad vas.</p>
        <p><b>Si te sientes en peligro</b> por un asalto o una agresión, no discutas: llama al <b>911</b>.</p>
      </div>
      <p className="text-sm text-neutral-600">Proyecto de clase, no es un programa oficial del gobierno.</p>
    </div>
  )
}
