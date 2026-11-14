import type { Pregunta } from '../../domain/types'

const LETRAS = 'ABCDEFGH'

interface Props {
  pregunta: Pregunta
  /** Orden de las opciones (ids). */
  orden: string[]
  elegida: string | null
  /** Si es true se revela cuál es la correcta (nunca durante un simulacro). */
  mostrarSolucion: boolean
  onElegir?: (opcionId: string) => void
  deshabilitada?: boolean
}

/**
 * Enunciado, imagen y opciones de una pregunta.
 * Las opciones forman un grupo de radio: Tab entra al grupo, flechas o números eligen.
 */
export function TarjetaPregunta({ pregunta, orden, elegida, mostrarSolucion, onElegir, deshabilitada }: Props) {
  const opciones = orden.map((id) => pregunta.opciones.find((o) => o.id === id)!).filter(Boolean)
  const idTitulo = `enunciado-${pregunta.id}`
  const bloqueada = deshabilitada || !onElegir

  const moverFoco = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const botones = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button[role="radio"]')
    botones?.[(i + d + opciones.length) % opciones.length]?.focus()
  }

  return (
    <div>
      {pregunta.eliminatoria && mostrarSolucion && (
        <p className="mb-2 inline-block rounded-md bg-aviso-suave px-2 py-1 text-xs font-semibold text-aviso">Pregunta eliminatoria en el cuestionario oficial</p>
      )}
      <h2 id={idTitulo} className="text-lg font-semibold leading-snug text-tinta sm:text-xl">
        {pregunta.enunciado}
      </h2>
      {pregunta.imagen && (
        <img
          src={`${import.meta.env.BASE_URL}${pregunta.imagen.src}`}
          alt={pregunta.imagen.alt}
          className="mt-4 max-h-72 w-auto max-w-full rounded-xl border border-borde bg-white object-contain"
        />
      )}
      <div role="radiogroup" aria-labelledby={idTitulo} className="mt-5 grid gap-3">
        {opciones.map((o, i) => {
          const seleccionada = elegida === o.id
          const esCorrecta = o.id === pregunta.respuestaCorrecta
          let estilo = 'border-borde bg-superficie hover:border-acento'
          let marca: string | null = null
          if (mostrarSolucion && esCorrecta) {
            estilo = 'border-bien bg-bien-suave'
            marca = seleccionada ? '✓ Tu respuesta · Correcta' : '✓ Respuesta correcta'
          } else if (mostrarSolucion && seleccionada) {
            estilo = 'border-mal bg-mal-suave'
            marca = '✗ Tu respuesta · Incorrecta'
          } else if (seleccionada) {
            estilo = 'border-acento bg-acento-suave ring-2 ring-acento'
          }
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={seleccionada}
              disabled={bloqueada}
              tabIndex={seleccionada || (!elegida && i === 0) ? 0 : -1}
              onClick={() => onElegir?.(o.id)}
              onKeyDown={(e) => moverFoco(e, i)}
              className={`flex min-h-14 w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-base leading-snug transition-colors disabled:cursor-default ${estilo}`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                  seleccionada ? 'border-acento bg-acento text-white' : 'border-borde bg-fondo text-tinta-2'
                }`}
              >
                {pregunta.ordenFijo ? LETRAS[i] : seleccionada ? '●' : ''}
              </span>
              <span className="flex-1">
                <span className="sr-only">Opción {pregunta.ordenFijo ? LETRAS[i] : i + 1}: </span>
                {o.texto}
                {marca && <span className={`mt-1 block text-sm font-semibold ${esCorrecta ? 'text-bien' : 'text-mal'}`}>{marca}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Fundamento y referencias. Sólo se muestra fuera del simulacro o al revisarlo. */
export function Explicacion({ pregunta }: { pregunta: Pregunta }) {
  return (
    <div className="mt-4 rounded-xl border border-borde bg-fondo p-4 text-sm leading-relaxed">
      <p className="font-semibold text-marca">Fundamento</p>
      <p className="mt-1 text-tinta">{pregunta.explicacion}</p>
      <dl className="mt-3 grid gap-1 text-tinta-2">
        {pregunta.referenciaNormativa && (
          <div>
            <dt className="inline font-medium">Norma: </dt>
            <dd className="inline">{pregunta.referenciaNormativa}</dd>
          </div>
        )}
        {pregunta.referenciaManual && (
          <div>
            <dt className="inline font-medium">Para estudiar: </dt>
            <dd className="inline">{pregunta.referenciaManual}</dd>
          </div>
        )}
        <div>
          <dt className="inline font-medium">Fuente: </dt>
          <dd className="inline">
            Cuestionario oficial PBA, página {pregunta.fuente.pagina}
            {pregunta.fuente.numeroOriginal ? `, pregunta ${pregunta.fuente.numeroOriginal}` : ''}. Revisión normativa: {pregunta.fechaRevision}.
          </dd>
        </div>
      </dl>
    </div>
  )
}
