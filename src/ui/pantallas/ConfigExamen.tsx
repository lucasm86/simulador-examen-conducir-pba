import { useState } from 'react'
import type { Aplicacion } from '../estado'
import type { Ruta } from '../App'
import type { ClaseLicencia } from '../../domain/types'
import { CLASES_DISPONIBLES } from '../../banco/banco'
import { CANTIDADES, crearExamen, MINUTOS_POR_DEFECTO, modalidadDisponible, OPCIONES_MINUTOS, preguntasParaSimulacro } from '../../motor/examen'
import { minimoParaAprobar } from '../../evaluacion/evaluacion'
import { Aviso, Boton, Tarjeta, Titulo } from '../componentes/Base'

export function ConfigExamen({ app, ir }: { app: Aplicacion; ir: (r: Ruta) => void }) {
  const [cantidad, setCantidad] = useState<30 | 40>(app.preferencias.cantidad)
  const [clase, setClase] = useState<ClaseLicencia>(app.preferencias.clase)
  const [minutos, setMinutos] = useState<number | null>(app.preferencias.minutos)
  const [elim, setElim] = useState(app.preferencias.aplicarEliminatorias)
  const [error, setError] = useState<string | null>(null)

  const disponibles = preguntasParaSimulacro(app.banco.preguntas, { clase })
  const nElim = disponibles.filter((p) => p.eliminatoria).length
  const ok = modalidadDisponible(app.banco.preguntas, { clase, cantidad })

  const comenzar = () => {
    try {
      const config = { cantidad, clase, minutos, aplicarEliminatorias: elim }
      app.guardarPreferencias({ clase, cantidad, minutos, aplicarEliminatorias: elim })
      app.actualizarExamen(crearExamen(app.banco.preguntas, config))
      ir('examen')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el simulacro.')
    }
  }

  const opcion = (activa: boolean, deshabilitada = false) =>
    `min-h-14 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
      deshabilitada ? 'cursor-not-allowed border-borde bg-fondo text-tinta-3' : activa ? 'border-acento bg-acento-suave ring-2 ring-acento' : 'border-borde bg-superficie hover:border-acento'
    }`

  return (
    <>
      <Titulo volver={() => ir('inicio')}>Simular examen</Titulo>
      {app.examen && (
        <div className="mb-4">
          <Aviso tono="aviso">
            Ya hay un simulacro en curso. Si empezás uno nuevo, el anterior se descarta sin guardarse.{' '}
            <button type="button" className="font-semibold text-acento underline" onClick={() => ir('examen')}>
              Continuar el que estaba
            </button>
          </Aviso>
        </div>
      )}
      <Tarjeta>
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 font-semibold text-marca">Cantidad de preguntas</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {CANTIDADES.map((n) => {
              const disponible = modalidadDisponible(app.banco.preguntas, { clase, cantidad: n })
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={cantidad === n}
                  disabled={!disponible}
                  onClick={() => {
                    setCantidad(n)
                    setMinutos(MINUTOS_POR_DEFECTO[n])
                  }}
                  className={opcion(cantidad === n, !disponible)}
                >
                  <span className="block text-lg font-semibold">{n} preguntas</span>
                  <span className="block text-sm text-tinta-2">
                    {n === 30 ? 'Simulacro breve' : 'Simulacro completo'} · se aprueba con {minimoParaAprobar(n)} correctas
                    {!disponible && ' · no disponible: faltan preguntas verificadas'}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-semibold text-marca">Clase de licencia</span>
            <select
              value={clase}
              onChange={(e) => setClase(e.target.value as ClaseLicencia)}
              className="min-h-12 w-full rounded-xl border-2 border-borde bg-superficie px-3 text-base"
            >
              {CLASES_DISPONIBLES.map((c) => (
                <option key={c.id} value={c.id} disabled={!c.disponible}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block font-semibold text-marca">Tiempo disponible</span>
            <select
              value={minutos ?? 'sin'}
              onChange={(e) => setMinutos(e.target.value === 'sin' ? null : Number(e.target.value))}
              className="min-h-12 w-full rounded-xl border-2 border-borde bg-superficie px-3 text-base"
            >
              {OPCIONES_MINUTOS.map((m) => (
                <option key={m ?? 'sin'} value={m ?? 'sin'}>
                  {m == null ? 'Sin límite de tiempo' : `${m} minutos`}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-5 flex min-h-12 cursor-pointer items-start gap-3">
          <input type="checkbox" checked={elim} onChange={(e) => setElim(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--color-acento)]" />
          <span>
            <span className="font-semibold text-marca">Aplicar preguntas eliminatorias</span>
            <span className="block text-sm leading-relaxed text-tinta-2">
              El cuestionario oficial marca algunas preguntas como «de carácter eliminatorio» ({nElim} verificadas en este banco). Si está activado, fallar
              cualquiera de las que te toquen desaprueba el simulacro aunque superes el 75 %.
            </span>
          </span>
        </label>

        {!ok && (
          <div className="mt-4">
            <Aviso tono="mal">
              No hay suficientes preguntas verificadas para esta modalidad ({disponibles.length} disponibles, se necesitan {cantidad}). El simulador nunca completa
              un examen con preguntas sin verificar.
            </Aviso>
          </div>
        )}
        {error && (
          <div className="mt-4" role="alert">
            <Aviso tono="mal">{error}</Aviso>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Boton onClick={comenzar} disabled={!ok} className="w-full sm:w-auto">
            Comenzar simulacro
          </Boton>
          <span className="text-sm text-tinta-3">{disponibles.length} preguntas oficiales verificadas para esta clase.</span>
        </div>
      </Tarjeta>
      <p className="mt-4 text-xs leading-relaxed text-tinta-3">
        Durante el simulacro no se muestran las respuestas correctas: la corrección se hace al finalizar. Criterio de referencia: 75 % de aciertos. Es un
        simulador educativo independiente, no una evaluación oficial.
      </p>
    </>
  )
}
