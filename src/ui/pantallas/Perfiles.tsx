import { useState } from 'react'
import { MAX_NOMBRE, MAX_PERFILES, validarNombre, type Perfil, type ResumenPerfil } from '../../persistencia/perfiles'
import { Aviso, Boton, Dialogo, fechaHora } from '../componentes/Base'

const COLORES = ['#1d5fa8', '#17703f', '#8a3fa0', '#b3511e', '#0f766e', '#9b2c5c']

/** Círculo con la inicial; el color sale del nombre, así cada persona siempre tiene el mismo. */
export function Avatar({ nombre, tamano = 40 }: { nombre: string; tamano?: number }) {
  let h = 0
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: tamano, height: tamano, background: COLORES[h % COLORES.length], fontSize: tamano * 0.45 }}
    >
      {nombre.trim().charAt(0).toUpperCase()}
    </span>
  )
}

interface Props {
  perfiles: Perfil[]
  resumenDe: (id: string) => ResumenPerfil
  onElegir: (id: string) => void
  /** Debe lanzar un Error con el mensaje a mostrar si el nombre no es válido. */
  onCrear: (nombre: string) => void
  onEliminar: (id: string) => void
}

function FormularioNombre({ perfiles, onCrear, etiqueta, boton }: { perfiles: Perfil[]; onCrear: (n: string) => void; etiqueta: string; boton: string }) {
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState<string | null>(null)

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const problema = validarNombre(nombre, perfiles)
    if (problema) return setError(problema)
    try {
      onCrear(nombre)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar.')
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <label htmlFor="nombre-perfil" className="mb-2 block font-semibold text-marca">
        {etiqueta}
      </label>
      <input
        id="nombre-perfil"
        type="text"
        value={nombre}
        maxLength={MAX_NOMBRE + 10}
        autoComplete="off"
        autoFocus
        aria-invalid={error != null}
        aria-describedby={error ? 'error-nombre' : undefined}
        onChange={(e) => {
          setNombre(e.target.value)
          setError(null)
        }}
        className="min-h-12 w-full rounded-xl border-2 border-borde bg-superficie px-4 text-base focus:border-acento"
      />
      {error && (
        <p id="error-nombre" role="alert" className="mt-2 text-sm font-medium text-mal">
          {error}
        </p>
      )}
      <Boton type="submit" className="mt-4 w-full sm:w-auto">
        {boton}
      </Boton>
    </form>
  )
}

export function Perfiles({ perfiles, resumenDe, onElegir, onCrear, onEliminar }: Props) {
  const [agregando, setAgregando] = useState(false)
  const [aEliminar, setAEliminar] = useState<Perfil | null>(null)

  if (perfiles.length === 0) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-xl px-4 pb-16 pt-10 sm:px-6">
        <main id="contenido">
          <h1 className="text-2xl font-bold tracking-tight text-marca sm:text-3xl">¡Bienvenido/a al simulador!</h1>
          <p className="mt-2 text-tinta-2">Prepará tu examen teórico de la Provincia de Buenos Aires.</p>
          <div className="mt-6 rounded-2xl border border-borde bg-superficie p-5 sm:p-6">
            <FormularioNombre perfiles={perfiles} onCrear={onCrear} etiqueta="¿Cómo te llamás?" boton="Empezar" />
            <p className="mt-4 text-sm leading-relaxed text-tinta-2">
              Es un registro sencillo, sólo para que, si más de una persona usa este equipo, cada una tenga su propio progreso, sus errores y sus resultados. El
              nombre y los datos se guardan únicamente en este dispositivo: no hay contraseña ni cuenta, y no se envía nada a ningún servidor.
            </p>
          </div>
          <p className="mt-6 text-center text-xs text-tinta-3">Simulador educativo independiente. No es una evaluación oficial.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-xl px-4 pb-16 pt-10 sm:px-6">
      <main id="contenido">
        <h1 className="text-2xl font-bold tracking-tight text-marca sm:text-3xl">¿Quién va a estudiar?</h1>
        <p className="mt-2 text-tinta-2">Elegí tu nombre para seguir con tu progreso.</p>

        <ul className="m-0 mt-5 grid list-none gap-3 p-0">
          {perfiles.map((p) => {
            const r = resumenDe(p.id)
            return (
              <li key={p.id} className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => onElegir(p.id)}
                  className="flex min-h-16 flex-1 items-center gap-4 rounded-2xl border border-borde bg-superficie px-4 py-3 text-left hover:border-acento"
                >
                  <Avatar nombre={p.nombre} tamano={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-semibold text-marca">{p.nombre}</span>
                    <span className="block text-sm text-tinta-2">
                      {r.simulacros} simulacro{r.simulacros === 1 ? '' : 's'}
                      {r.ultimaActividad ? ` · última vez ${fechaHora(r.ultimaActividad)}` : ' · todavía sin actividad'}
                    </span>
                    {r.examenPendiente && <span className="mt-0.5 block text-sm font-medium text-aviso">Tiene un simulacro sin terminar</span>}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar a ${p.nombre}`}
                  onClick={() => setAEliminar(p)}
                  className="flex min-h-16 w-12 shrink-0 items-center justify-center rounded-2xl border border-borde bg-superficie text-tinta-3 text-lg hover:border-mal hover:text-mal"
                >
                  <span aria-hidden="true">🗑</span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="mt-5">
          {agregando ? (
            <div className="rounded-2xl border border-borde bg-superficie p-5">
              <FormularioNombre perfiles={perfiles} onCrear={onCrear} etiqueta="Nombre de la nueva persona" boton="Agregar y empezar" />
              <Boton variante="texto" className="mt-2 px-0" onClick={() => setAgregando(false)}>
                Cancelar
              </Boton>
            </div>
          ) : perfiles.length < MAX_PERFILES ? (
            <Boton variante="secundario" className="w-full" onClick={() => setAgregando(true)}>
              + Agregar otra persona
            </Boton>
          ) : (
            <Aviso>Ya hay {MAX_PERFILES} personas registradas. Eliminá una para agregar otra.</Aviso>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-tinta-3">Los datos de cada persona se guardan sólo en este dispositivo.</p>
      </main>

      <Dialogo abierto={aEliminar != null} titulo={`¿Eliminar a ${aEliminar?.nombre ?? ''}?`} onCerrar={() => setAEliminar(null)}>
        <Aviso tono="mal">
          Se borran de este dispositivo todos sus resultados, errores y preguntas dominadas, y cualquier simulacro en curso. No se puede deshacer.
        </Aviso>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Boton variante="secundario" onClick={() => setAEliminar(null)}>
            Cancelar
          </Boton>
          <Boton
            variante="peligro"
            onClick={() => {
              if (aEliminar) onEliminar(aEliminar.id)
              setAEliminar(null)
            }}
          >
            Sí, eliminar
          </Boton>
        </div>
      </Dialogo>
    </div>
  )
}
