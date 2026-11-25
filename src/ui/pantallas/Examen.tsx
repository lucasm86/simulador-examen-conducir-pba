import { useCallback, useEffect, useRef, useState } from 'react'
import type { Aplicacion } from '../estado'
import type { Ruta } from '../App'
import { formatearTiempo, irA, pendientes, responder, segundosRestantes, segundosTranscurridos } from '../../motor/examen'
import { evaluarSesion } from '../../evaluacion/evaluacion'
import { Aviso, BarraProgreso, Boton, Dialogo, LeyendaAtajos } from '../componentes/Base'
import { useAtajos } from '../atajos'
import { TarjetaPregunta } from '../componentes/TarjetaPregunta'

export function Examen({ app, ir, verResultado }: { app: Aplicacion; ir: (r: Ruta) => void; verResultado: (id: string) => void }) {
  const sesion = app.examen
  const [ahora, setAhora] = useState(() => Date.now())
  const [confirmar, setConfirmar] = useState(false)
  const [verMapa, setVerMapa] = useState(false)
  const cerrado = useRef(false)
  const refTitulo = useRef<HTMLParagraphElement>(null)

  const finalizar = useCallback(
    (motivo: 'usuario' | 'tiempo') => {
      if (!sesion || cerrado.current) return
      cerrado.current = true
      const intento = evaluarSesion(sesion, app.banco.porId, Date.now(), motivo)
      app.registrarRespuestas(intento.detalle, intento.fecha)
      app.guardarIntento(intento)
      app.actualizarExamen(null)
      verResultado(intento.id)
    },
    [sesion, app, verResultado],
  )

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const restante = sesion ? segundosRestantes(sesion, ahora) : null
  useEffect(() => {
    if (restante === 0) finalizar('tiempo')
  }, [restante, finalizar])

  const indice = sesion?.indice ?? 0
  useEffect(() => {
    refTitulo.current?.focus()
  }, [indice])

  // Atajos: 1–9 elige opción · Enter siguiente · Retroceso anterior · Esc finalizar · ← → navegan
  useAtajos({
    activo: !!sesion && !confirmar,
    flechas: true,
    opcion: (n) => {
      if (!sesion) return
      const ps = sesion.preguntas[sesion.indice]
      const op = ps.orden[n - 1]
      if (op) app.actualizarExamen(responder(sesion, ps.id, op))
    },
    siguiente: (origen) => {
      if (!sesion) return
      if (sesion.indice < sesion.preguntas.length - 1) app.actualizarExamen(irA(sesion, sesion.indice + 1))
      else if (origen === 'enter') setConfirmar(true) // en la última, Enter equivale a «Finalizar examen»
    },
    anterior: () => sesion && app.actualizarExamen(irA(sesion, sesion.indice - 1)),
    salir: () => setConfirmar(true),
  })

  if (!sesion) {
    return (
      <div className="pt-10 text-center">
        <p className="text-tinta-2">No hay ningún simulacro en curso.</p>
        <Boton className="mt-4" onClick={() => ir('simulacro')}>
          Configurar un simulacro
        </Boton>
      </div>
    )
  }

  const total = sesion.preguntas.length
  const ps = sesion.preguntas[sesion.indice]
  const pregunta = app.banco.porId.get(ps.id)!
  const sinResponder = pendientes(sesion)
  const respondidas = total - sinResponder.length
  const pocoTiempo = restante != null && restante <= 300

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 border-b border-borde bg-fondo/95 px-4 pb-3 pt-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p ref={refTitulo} tabIndex={-1} className="text-base font-semibold text-marca outline-none" aria-live="polite">
            Pregunta {sesion.indice + 1} de {total}
          </p>
          <div className="flex items-center gap-3">
            <span
              role="timer"
              aria-label={restante == null ? 'Tiempo transcurrido' : 'Tiempo restante'}
              className={`rounded-lg px-3 py-1.5 text-base font-semibold tabular-nums ${pocoTiempo ? 'bg-mal-suave text-mal' : 'bg-superficie text-tinta'}`}
            >
              <span aria-hidden="true">⏱ </span>
              {formatearTiempo(restante ?? segundosTranscurridos(sesion, ahora))}
            </span>
          </div>
        </div>
        <div className="mt-2">
          <BarraProgreso valor={respondidas} maximo={total} etiqueta={`Respondidas ${respondidas} de ${total}`} />
        </div>
        <p className="mt-1 text-xs text-tinta-3">
          {app.perfil.nombre} · {respondidas} respondidas · {sinResponder.length} pendientes
          {pocoTiempo && <span className="font-semibold text-mal"> · Quedan menos de 5 minutos</span>}
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-borde bg-superficie p-5 sm:p-7">
        <TarjetaPregunta
          key={ps.id}
          pregunta={pregunta}
          orden={ps.orden}
          elegida={sesion.respuestas[ps.id] ?? null}
          mostrarSolucion={false}
          onElegir={(op) => app.actualizarExamen(responder(sesion, ps.id, op))}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-between">
        <Boton variante="secundario" disabled={sesion.indice === 0} onClick={() => app.actualizarExamen(irA(sesion, sesion.indice - 1))}>
          <span aria-hidden="true">←</span> Anterior
        </Boton>
        {sesion.indice < total - 1 ? (
          <Boton onClick={() => app.actualizarExamen(irA(sesion, sesion.indice + 1))}>
            Siguiente <span aria-hidden="true">→</span>
          </Boton>
        ) : (
          <Boton onClick={() => setConfirmar(true)}>Finalizar examen</Boton>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Boton variante="texto" onClick={() => setVerMapa((v) => !v)} aria-expanded={verMapa} className="px-0">
          {verMapa ? 'Ocultar' : 'Ver'} todas las preguntas
        </Boton>
        {sesion.indice < total - 1 && (
          <Boton variante="secundario" onClick={() => setConfirmar(true)}>
            Finalizar examen
          </Boton>
        )}
      </div>

      {verMapa && (
        <nav aria-label="Ir a una pregunta" className="mt-2 grid grid-cols-8 gap-2 sm:grid-cols-10">
          {sesion.preguntas.map((q, i) => {
            const hecha = !!sesion.respuestas[q.id]
            return (
              <button
                key={q.id}
                type="button"
                aria-label={`Pregunta ${i + 1}, ${hecha ? 'respondida' : 'pendiente'}`}
                aria-current={i === sesion.indice ? 'step' : undefined}
                onClick={() => app.actualizarExamen(irA(sesion, i))}
                className={`h-11 rounded-lg border text-sm font-medium tabular-nums ${
                  i === sesion.indice ? 'border-acento ring-2 ring-acento' : 'border-borde'
                } ${hecha ? 'bg-acento-suave text-marca' : 'bg-superficie text-tinta-3'}`}
              >
                {i + 1}
              </button>
            )
          })}
        </nav>
      )}

      <LeyendaAtajos
        items={[
          ['1–9', 'elegir opción'],
          ['Enter', 'siguiente'],
          ['Retroceso', 'anterior'],
          ['Esc', 'finalizar'],
        ]}
      />

      <Dialogo abierto={confirmar} titulo="¿Finalizar el examen?" onCerrar={() => setConfirmar(false)}>
        {sinResponder.length > 0 ? (
          <Aviso tono="aviso">
            Te {sinResponder.length === 1 ? 'queda 1 pregunta' : `quedan ${sinResponder.length} preguntas`} sin responder (
            {sinResponder
              .slice(0, 12)
              .map((i) => i + 1)
              .join(', ')}
            {sinResponder.length > 12 ? '…' : ''}). Las preguntas sin responder cuentan como incorrectas.
          </Aviso>
        ) : (
          <p className="text-tinta-2">Respondiste todas las preguntas. Una vez finalizado no vas a poder cambiar las respuestas.</p>
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Boton
            variante="secundario"
            onClick={() => {
              setConfirmar(false)
              if (sinResponder.length > 0) app.actualizarExamen(irA(sesion, sinResponder[0]))
            }}
          >
            {sinResponder.length > 0 ? 'Ir a las pendientes' : 'Seguir revisando'}
          </Boton>
          <Boton onClick={() => finalizar('usuario')}>Finalizar y corregir</Boton>
        </div>
      </Dialogo>
    </>
  )
}
