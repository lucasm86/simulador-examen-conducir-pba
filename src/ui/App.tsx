import { useCallback, useEffect, useState } from 'react'
import { useAplicacion } from './estado'
import { Inicio } from './pantallas/Inicio'
import { ConfigExamen } from './pantallas/ConfigExamen'
import { Examen } from './pantallas/Examen'
import { Resultados, Revision } from './pantallas/Resultados'
import { Estudio, Inteligente, Repaso } from './pantallas/Aprender'
import { Progreso } from './pantallas/Progreso'
import { Acerca } from './pantallas/Acerca'

export type Ruta = 'inicio' | 'simulacro' | 'examen' | 'resultado' | 'revision' | 'estudio' | 'repaso' | 'inteligente' | 'progreso' | 'acerca'
const RUTAS: Ruta[] = ['inicio', 'simulacro', 'examen', 'resultado', 'revision', 'estudio', 'repaso', 'inteligente', 'progreso', 'acerca']

interface Ubicacion {
  ruta: Ruta
  param: string | null
}

/** Enrutador mínimo por hash (#/ruta/parametro): funciona sin servidor y respeta el botón Atrás. */
function leerHash(): Ubicacion {
  const [, ruta = 'inicio', param] = window.location.hash.replace(/^#/, '').split('/')
  return { ruta: RUTAS.includes(ruta as Ruta) ? (ruta as Ruta) : 'inicio', param: param ? decodeURIComponent(param) : null }
}

export function App() {
  const app = useAplicacion()
  const [ubicacion, setUbicacion] = useState<Ubicacion>(leerHash)

  useEffect(() => {
    const onHash = () => {
      setUbicacion(leerHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navegar = useCallback((ruta: Ruta, param?: string) => {
    const hash = `#/${ruta}${param ? '/' + encodeURIComponent(param) : ''}`
    if (window.location.hash === hash) setUbicacion({ ruta, param: param ?? null })
    else window.location.hash = hash
  }, [])
  const ir = useCallback((r: Ruta) => navegar(r), [navegar])
  const verResultado = useCallback((id: string) => navegar('resultado', id), [navegar])
  const revisar = useCallback((id: string) => navegar('revision', id), [navegar])

  const { ruta, param } = ubicacion
  let pantalla
  switch (ruta) {
    case 'simulacro':
      pantalla = <ConfigExamen app={app} ir={ir} />
      break
    case 'examen':
      pantalla = <Examen app={app} ir={ir} verResultado={verResultado} />
      break
    case 'resultado':
      pantalla = <Resultados app={app} ir={ir} intentoId={param} revisar={revisar} />
      break
    case 'revision':
      pantalla = <Revision app={app} ir={ir} intentoId={param} volver={verResultado} />
      break
    case 'estudio':
      pantalla = <Estudio app={app} ir={ir} />
      break
    case 'repaso':
      pantalla = <Repaso app={app} ir={ir} />
      break
    case 'inteligente':
      pantalla = <Inteligente app={app} ir={ir} />
      break
    case 'progreso':
      pantalla = <Progreso app={app} ir={ir} verResultado={verResultado} />
      break
    case 'acerca':
      pantalla = <Acerca app={app} ir={ir} />
      break
    default:
      pantalla = <Inicio app={app} ir={ir} />
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 pb-16 pt-4 sm:px-6">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-marca focus:px-4 focus:py-2 focus:text-white">
        Saltar al contenido
      </a>
      {app.banco.informe.errores > 0 && (
        <p role="alert" className="mb-4 rounded-xl border border-mal/30 bg-mal-suave px-4 py-3 text-sm">
          El banco de preguntas tiene {app.banco.informe.errores} errores de validación. Las preguntas afectadas se excluyeron automáticamente.
        </p>
      )}
      <main id="contenido" key={ruta + (param ?? '')}>
        {pantalla}
      </main>
    </div>
  )
}
