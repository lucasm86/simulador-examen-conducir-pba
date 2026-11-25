import { useEffect, useState } from 'react'
import { cargarEstado, evaluarVigencia, type EstadoFuentes, type Vigencia } from '../../vigencia/vigencia'
import { Aviso } from './Base'

const OFICIAL = 'https://www.gba.gob.ar/seguridad_vial'

/** YYYY-MM-DD → DD/MM/AAAA, sin pasar por Date (evita correrse un día por la zona horaria). */
export function fechaLarga(ymd: string): string {
  const [a, m, d] = ymd.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

/** Consulta el estado publicado de las fuentes oficiales al abrirse. Sin conexión: no muestra nada. */
export function useVigencia(fechaRevisionBanco: string, ahora: () => Date = () => new Date()): Vigencia {
  const [estado, setEstado] = useState<EstadoFuentes | null>(null)
  useEffect(() => {
    let vivo = true
    cargarEstado().then((e) => vivo && setEstado(e))
    return () => {
      vivo = false
    }
  }, [])
  // Mientras no hay respuesta (o sin conexión) no se afirma nada sobre las fuentes; la antigüedad de la revisión sí se sabe sin red.
  return evaluarVigencia(fechaRevisionBanco, estado, ahora())
}

export function AvisoVigencia({ vigencia, fechaRevision }: { vigencia: Vigencia; fechaRevision: string }) {
  if (!vigencia.aviso) return null
  return (
    <div className="mb-5" role="status">
      <Aviso tono="aviso">
        {vigencia.aviso === 'cambio' ? (
          <>
            <strong>Los documentos oficiales cambiaron.</strong> Se detectó una versión nueva del cuestionario o del manual publicados por la Provincia, posterior a la última
            revisión de este simulador ({fechaLarga(fechaRevision)}). Algunas preguntas podrían estar desactualizadas: ante la duda, confirmalas en el{' '}
            <a className="font-medium text-acento underline" href={OFICIAL} target="_blank" rel="noreferrer">
              sitio oficial
            </a>
            .
          </>
        ) : (
          <>
            <strong>Las preguntas llevan {vigencia.diasDesdeRevision} días sin revisarse.</strong> La última comparación con la ley fue el {fechaLarga(fechaRevision)}. Puede haber
            cambios en la normativa o en el examen; ante la duda, confirmá en el{' '}
            <a className="font-medium text-acento underline" href={OFICIAL} target="_blank" rel="noreferrer">
              sitio oficial
            </a>
            .
          </>
        )}
      </Aviso>
    </div>
  )
}
