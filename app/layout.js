import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Voz a Bordo',
  description: 'Elige rutas de micro con datos, pon una calcomanía para pasajeros y mide sin vigilar a nadie. CDMX.',
}

const NAV = [
  ['/mapa', 'Mapa'],
  ['/plan', '¿Se puede medir?'],
  ['/calcomania', 'Calcomanía'],
  ['/colocar', 'Colocar'],
  ['/evaluar', 'Evaluar'],
  ['/metodo', 'Método'],
]

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <header className="bg-verde text-white">
          <div className="mx-auto max-w-5xl px-4 py-3">
            <Link href="/" className="text-lg font-bold">Voz a Bordo</Link>
            <nav className="mt-2 flex gap-x-4 gap-y-1 flex-wrap text-sm">
              {NAV.map(([h, t]) => (
                <Link key={h} href={h} className="underline-offset-4 hover:underline opacity-90">{t}</Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-8 pt-4 text-xs text-neutral-600 border-t border-arena">
          Datos abiertos de la CDMX: hechos de tránsito de la SSC (2018–2024) y GTFS de corredores concesionados (feb-2026).
          Voz a Bordo nunca registra a un chofer, una unidad, una placa ni a una persona. Proyecto de clase (Crystal Ball Studio, semana 7), no es un programa oficial.
        </footer>
      </body>
    </html>
  )
}
