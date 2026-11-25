/**
 * Vigencia del banco de preguntas.
 *
 * Una tarea semanal de GitHub compara los PDF oficiales con la copia usada para armar el banco
 * y publica el resultado (estado.json). La app lo lee al abrirse y, si las fuentes cambiaron o
 * la última revisión del banco es muy vieja, lo avisa. No actualiza preguntas por sí sola:
 * un cambio hay que revisarlo y curarlo a mano.
 */

export interface EstadoFuentes {
  /** Cuándo corrió la comprobación (ISO UTC). */
  revisado: string
  resultado: 'sin-cambios' | 'cambio' | 'no-verificable'
  documentos: { documento: string; estado: string }[]
}

export const URL_ESTADO = 'https://raw.githubusercontent.com/lucasm86/simulador-examen-conducir-pba/estado/estado.json'

/** Días desde la última revisión normativa a partir de los cuales se recomienda volver a revisar. */
export const DIAS_REVISION_VIGENTE = 90
/** Si la comprobación automática es más vieja que esto, deja de ser una garantía. */
export const DIAS_COMPROBACION_VIGENTE = 21

export type NivelAviso = 'cambio' | 'revision' | null

export interface Vigencia {
  /** 'cambio' = fuentes oficiales modificadas · 'revision' = banco con revisión vieja · null = sin avisos. */
  aviso: NivelAviso
  /** Fecha (YYYY-MM-DD) de la última comprobación automática, si está al día y sin cambios. */
  comprobadoEl: string | null
  diasDesdeRevision: number
}

const DIA_MS = 86_400_000

export function diasEntre(desdeIso: string, hasta: Date): number {
  return Math.floor((hasta.getTime() - new Date(desdeIso).getTime()) / DIA_MS)
}

/** Valida lo que llegó por red: cualquier cosa rara se ignora en vez de romper la app. */
export function leerEstado(dato: unknown): EstadoFuentes | null {
  if (!dato || typeof dato !== 'object') return null
  const d = dato as Record<string, unknown>
  if (typeof d.revisado !== 'string' || Number.isNaN(new Date(d.revisado).getTime())) return null
  if (d.resultado !== 'sin-cambios' && d.resultado !== 'cambio' && d.resultado !== 'no-verificable') return null
  const documentos = Array.isArray(d.documentos)
    ? d.documentos.filter((x): x is { documento: string; estado: string } => !!x && typeof x.documento === 'string' && typeof x.estado === 'string')
    : []
  return { revisado: d.revisado, resultado: d.resultado, documentos }
}

/**
 * @param fechaRevisionBanco fecha (YYYY-MM-DD) en que se contrastó el banco con la normativa
 * @param estado último estado publicado (null si no se pudo leer: sin conexión, etc.)
 */
export function evaluarVigencia(fechaRevisionBanco: string, estado: EstadoFuentes | null, ahora: Date): Vigencia {
  const diasDesdeRevision = diasEntre(fechaRevisionBanco, ahora)
  const comprobacionAlDia = estado != null && diasEntre(estado.revisado, ahora) <= DIAS_COMPROBACION_VIGENTE

  if (estado && comprobacionAlDia && estado.resultado === 'cambio') {
    return { aviso: 'cambio', comprobadoEl: null, diasDesdeRevision }
  }
  if (diasDesdeRevision > DIAS_REVISION_VIGENTE) {
    return { aviso: 'revision', comprobadoEl: null, diasDesdeRevision }
  }
  const sinCambios = comprobacionAlDia && estado!.resultado === 'sin-cambios'
  return { aviso: null, comprobadoEl: sinCambios ? estado!.revisado.slice(0, 10) : null, diasDesdeRevision }
}

/** Lee el estado publicado. Nunca lanza: sin red, caído o con formato raro devuelve null. */
export async function cargarEstado(url = URL_ESTADO, tiempoMs = 6000): Promise<EstadoFuentes | null> {
  if (typeof fetch !== 'function') return null
  const control = new AbortController()
  const temporizador = setTimeout(() => control.abort(), tiempoMs)
  try {
    const r = await fetch(url, { cache: 'no-store', signal: control.signal })
    if (!r.ok) return null
    return leerEstado(await r.json())
  } catch {
    return null
  } finally {
    clearTimeout(temporizador)
  }
}
