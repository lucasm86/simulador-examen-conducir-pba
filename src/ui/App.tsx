import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAplicacion } from './estado'
import { Inicio } from './pantallas/Inicio'
import { ConfigExamen } from './pantallas/ConfigExamen'
import { Examen } from './pantallas/Examen'
import { Resultados, Revision } from './pantallas/Resultados'
import { Estudio, Inteligente, Repaso } from './pantallas/Aprender'
import { Progreso } from './pantallas/Progreso'
import { Acerca } from './pantallas/Acerca'
import { Avatar, Perfiles } from './pantallas/Perfiles'
import { RegistroPerfiles, type Perfil } from '../persistencia/perfiles'

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

function AppPerfil({ perfil, onCambiar }: { perfil: Perfil; onCambiar: () => void }) {
  const app = useAplicacion(perfil)
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
      {ruta !== 'examen' && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-borde bg-superficie px-3 py-2">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <Avatar nombre={perfil.nombre} tamano={28} />
            <span className="truncate">
              Estudia: <strong className="text-marca">{perfil.nombre}</strong>
            </span>
          </span>
          <button type="button" onClick={onCambiar} className="min-h-11 shrink-0 rounded-lg px-2 text-sm font-medium text-acento hover:underline">
            Cambiar de persona
          </button>
        </div>
      )}
      <main id="contenido" key={ruta + (param ?? '')}>
        {pantalla}
      </main>
    </div>
  )
}

/** Raíz: pide registrarse o elegir persona; luego monta la app de esa persona (con su propio estado). */
export function App() {
  const registro = useMemo(() => new RegistroPerfiles(), [])
  const [perfiles, setPerfiles] = useState(() => registro.listar())
  const [activo, setActivo] = useState<Perfil | null>(() => registro.activo())

  const refrescar = () => {
    setPerfiles(registro.listar())
    setActivo(registro.activo())
  }
  const entrar = (id: string | null) => {
    window.location.hash = ''
    registro.activar(id)
    refrescar()
  }

  if (!activo) {
    return (
      <Perfiles
        perfiles={perfiles}
        resumenDe={(id) => registro.resumenDe(id)}
        onElegir={entrar}
        onCrear={(nombre) => entrar(registro.crear(nombre).perfil.id)}
        onEliminar={(id) => {
          registro.eliminar(id)
          refrescar()
        }}
      />
    )
  }
  return <AppPerfil key={activo.id} perfil={activo} onCambiar={() => entrar(null)} />
}
