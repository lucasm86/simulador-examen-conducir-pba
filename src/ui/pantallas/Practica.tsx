import { useEffect, useMemo, useRef, useState } from 'react'
import type { Aplicacion } from '../estado'
import type { Modalidad, Pregunta } from '../../domain/types'
import { ordenarOpciones } from '../../motor/examen'
import { nuevoId } from '../../motor/aleatorio'
import { esCorrecta, evaluar } from '../../evaluacion/evaluacion'
import { estaDominada } from '../../repaso/repaso'
import { Aviso, BarraProgreso, Boton, Dato, Tarjeta } from '../componentes/Base'
import { Explicacion, TarjetaPregunta } from '../componentes/TarjetaPregunta'

interface Props {
  app: Aplicacion
  modalidad: Exclude<Modalidad, 'simulacro'>
  titulo: string
  preguntas: Pregunta[]
  onSalir: () => void
  onOtra: () => void
}

/**
 * Sesión sin tiempo ni penalización, con corrección y fundamento inmediatos.
 * La usan el modo estudio, el repaso de errores y la práctica inteligente.
 * En repaso, una pregunta fallada vuelve al final de la cola hasta responderla bien.
 */
export function Practica({ app, modalidad, titulo, preguntas, onSalir, onOtra }: Props) {
  const [cola, setCola] = useState<Pregunta[]>(preguntas)
  const [pos, setPos] = useState(0)
  const [elegida, setElegida] = useState<string | null>(null)
  const [intentoN, setIntentoN] = useState(0)
  const [terminada, setTerminada] = useState(false)
  // primer intento de cada pregunta: es lo que se guarda en el historial de la sesión
  const primeros = useRef(new Map<string, string>())
  const inicio = useRef(Date.now())
  const guardada = useRef(false)
  const refCabecera = useRef<HTMLParagraphElement>(null)

  const actual = cola[pos]
  const orden = useMemo(() => (actual ? ordenarOpciones(actual) : []), [actual, intentoN]) // eslint-disable-line react-hooks/exhaustive-deps
  const respondida = elegida != null
  const acierto = actual ? esCorrecta(actual, elegida) : false

  const guardarSesion = () => {
    if (guardada.current || primeros.current.size === 0) return
    guardada.current = true
    const vistas = preguntas.filter((p) => primeros.current.has(p.id))
    const intento = evaluar({
      id: nuevoId(modalidad),
      modalidad,
      clase: app.preferencias.clase,
      preguntas: vistas,
      respuestas: Object.fromEntries(primeros.current),
      duracionSeg: Math.round((Date.now() - inicio.current) / 1000),
      fecha: new Date().toISOString(),
      aplicarEliminatorias: false,
    })
    app.guardarIntento(intento)
  }

  // si se abandona la pantalla a mitad de sesión, lo respondido igual queda en el historial
  const guardarRef = useRef(guardarSesion)
  guardarRef.current = guardarSesion
  useEffect(() => () => guardarRef.current(), [])

  useEffect(() => {
    refCabecera.current?.focus()
  }, [pos, intentoN])

  const elegir = (opcionId: string) => {
    if (respondida || !actual) return
    setElegida(opcionId)
    const ok = esCorrecta(actual, opcionId)
    if (!primeros.current.has(actual.id)) primeros.current.set(actual.id, opcionId)
    app.registrarRespuestas([{ id: actual.id, elegida: opcionId, correcta: actual.respuestaCorrecta, acierto: ok }], new Date().toISOString())
    if (!ok && modalidad === 'repaso') setCola((c) => [...c, actual]) // reintentar hasta acertar
  }

  const siguiente = () => {
    if (pos + 1 >= cola.length) {
      guardarSesion()
      setTerminada(true)
    } else {
      setPos(pos + 1)
      setElegida(null)
      setIntentoN(0)
    }
  }

  const repetir = () => {
    setElegida(null)
    setIntentoN((n) => n + 1)
  }

  if (preguntas.length === 0) {
    return <Aviso tono="aviso">No hay preguntas verificadas disponibles para esta selección.</Aviso>
  }

  if (terminada) {
    const total = primeros.current.size
    const ok = preguntas.filter((p) => esCorrecta(p, primeros.current.get(p.id))).length
    return (
      <>
        <h1 className="mb-5 text-2xl font-semibold text-marca sm:text-3xl">Sesión terminada</h1>
        <Tarjeta>
          <p className="text-tinta-2">{titulo}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Dato etiqueta="Respondidas" valor={total} />
            <Dato etiqueta="Bien al primer intento" valor={ok} />
            <Dato etiqueta="Para repasar" valor={total - ok} />
          </div>
          <p className="mt-4 text-sm text-tinta-2">
            En este modo no hay aprobado ni desaprobado. {total - ok > 0 ? 'Las que fallaste quedaron anotadas en «Repasar errores».' : '¡No fallaste ninguna!'}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Boton variante="secundario" onClick={onSalir}>
              Volver al inicio
            </Boton>
            <Boton onClick={onOtra}>Otra sesión</Boton>
          </div>
        </Tarjeta>
      </>
    )
  }

  const dominada = estaDominada(app.estadisticas[actual.id])

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <p ref={refCabecera} tabIndex={-1} className="text-base font-semibold text-marca outline-none">
            Pregunta {pos + 1} de {cola.length}
          </p>
          <Boton
            variante="texto"
            className="px-0"
            onClick={() => {
              guardarSesion()
              onSalir()
            }}
          >
            Terminar sesión
          </Boton>
        </div>
        <p className="mb-2 text-sm text-tinta-3">{titulo} · sin límite de tiempo</p>
        <BarraProgreso valor={pos + (respondida ? 1 : 0)} maximo={cola.length} etiqueta="Avance de la sesión" />
      </div>

      <div className="rounded-2xl border border-borde bg-superficie p-5 sm:p-7">
        <TarjetaPregunta key={`${actual.id}-${pos}-${intentoN}`} pregunta={actual} orden={orden} elegida={elegida} mostrarSolucion={respondida} onElegir={elegir} deshabilitada={respondida} />

        <div aria-live="polite">
          {respondida && (
            <>
              <p className={`mt-5 rounded-xl px-4 py-3 text-base font-semibold ${acierto ? 'bg-bien-suave text-bien' : 'bg-mal-suave text-mal'}`}>
                {acierto ? '✓ ¡Correcto!' : '✗ Incorrecto. La respuesta correcta está resaltada en verde.'}
                {!acierto && modalidad === 'repaso' && <span className="block text-sm font-normal text-tinta">Va a volver a aparecer al final de esta sesión.</span>}
              </p>
              <Explicacion pregunta={actual} />
            </>
          )}
        </div>
      </div>

      {respondida && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Boton variante="secundario" onClick={repetir}>
            Repetir la pregunta
          </Boton>
          <Boton variante="secundario" aria-pressed={dominada} onClick={() => app.alternarDominada(actual.id, !dominada)}>
            {dominada ? '★ Dominada (quitar)' : '☆ Marcar como dominada'}
          </Boton>
          <Boton onClick={siguiente}>{pos + 1 >= cola.length ? 'Terminar' : 'Siguiente pregunta →'}</Boton>
        </div>
      )}
    </>
  )
}
