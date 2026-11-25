import { useEffect, useRef } from 'react'

export interface Atajos {
  /** Si es false no se escucha el teclado (por ejemplo, con un diálogo abierto). */
  activo: boolean
  /** Teclas 1–9: elegir la opción n (1 = primera de las mostradas). */
  opcion?: (n: number) => void
  /** Enter (o flecha derecha, si `flechas`): pasar a la siguiente. */
  siguiente?: (origen: 'enter' | 'flecha') => void
  /** Retroceso (o flecha izquierda, si `flechas`): volver. */
  anterior?: (origen: 'retroceso' | 'flecha') => void
  /** Escape: finalizar o salir. */
  salir?: () => void
  /** Habilita ← y → como alias de anterior y siguiente. */
  flechas?: boolean
}

/**
 * Atajos de teclado comunes a todas las pantallas de preguntas.
 * No interfiere con la escritura en campos ni con el Enter nativo de los botones
 * (excepto en las opciones de respuesta, donde Enter significa "siguiente").
 */
export function useAtajos(config: Atajos) {
  const ref = useRef(config)
  ref.current = config

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = ref.current
      if (!c.activo || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement | null
      const tag = t?.tagName
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA' || t?.isContentEditable) return
      const enOpcion = t?.getAttribute?.('role') === 'radio'
      const enBotonOEnlace = (tag === 'BUTTON' || tag === 'A') && !enOpcion

      if (e.key === 'Enter') {
        if (enBotonOEnlace || e.repeat || !c.siguiente) return // Enter sobre un botón hace su propia acción
        e.preventDefault()
        c.siguiente('enter')
      } else if (e.key === 'Backspace') {
        if (!c.anterior) return
        e.preventDefault()
        c.anterior('retroceso')
      } else if (e.key === 'Escape') {
        if (!c.salir) return
        e.preventDefault()
        c.salir()
      } else if (e.key === 'ArrowRight' && c.flechas) {
        c.siguiente?.('flecha')
      } else if (e.key === 'ArrowLeft' && c.flechas) {
        c.anterior?.('flecha')
      } else if (/^[1-9]$/.test(e.key)) {
        c.opcion?.(Number(e.key))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
