import type {
  CategoriaId,
  ClaseLicencia,
  DesempenoCategoria,
  Intento,
  Modalidad,
  Pregunta,
  ResultadoPregunta,
  SesionExamen,
} from '../domain/types'

export const PORCENTAJE_APROBACION = 75

/** Mínimo de respuestas correctas para aprobar: 75 % redondeado hacia arriba (30 → 23, 40 → 30). */
export function minimoParaAprobar(total: number): number {
  return Math.ceil((total * PORCENTAJE_APROBACION) / 100)
}

/** Porcentaje entero de aciertos. Las preguntas sin responder cuentan como no acertadas. */
export function porcentaje(correctas: number, total: number): number {
  return total === 0 ? 0 : Math.round((correctas / total) * 100)
}

export function esCorrecta(pregunta: Pregunta, opcionId: string | null | undefined): boolean {
  return !!opcionId && opcionId === pregunta.respuestaCorrecta
}

export interface EntradaEvaluacion {
  id: string
  modalidad: Modalidad
  clase: ClaseLicencia
  preguntas: Pregunta[]
  respuestas: Record<string, string | undefined>
  duracionSeg: number
  fecha: string
  aplicarEliminatorias: boolean
  ordenOpciones?: Record<string, string[]>
  motivoCierre?: 'usuario' | 'tiempo'
}

/**
 * Corrige un conjunto de preguntas.
 * - Aprobación (sólo simulacro e inteligente no aplican criterio distinto): >= 75 % de aciertos
 *   y, si corresponde, ninguna pregunta eliminatoria oficial fallada o sin responder.
 * - En estudio y repaso `aprobado` es null: no hay penalización.
 */
export function evaluar(e: EntradaEvaluacion): Intento {
  const detalle: ResultadoPregunta[] = []
  const porCategoria: Partial<Record<CategoriaId, DesempenoCategoria>> = {}
  let correctas = 0
  let respondidas = 0
  let elimEvaluadas = 0
  let elimFalladas = 0

  for (const p of e.preguntas) {
    const elegida = e.respuestas[p.id] ?? null
    const acierto = esCorrecta(p, elegida)
    if (elegida) respondidas++
    if (acierto) correctas++
    const cat = (porCategoria[p.categoria] ??= { total: 0, correctas: 0 })
    cat.total++
    if (acierto) cat.correctas++
    if (p.eliminatoria && p.origen === 'oficial' && p.estado === 'verificada') {
      elimEvaluadas++
      if (!acierto) elimFalladas++
    }
    detalle.push({ id: p.id, elegida, correcta: p.respuestaCorrecta, acierto })
  }

  const total = e.preguntas.length
  const conCriterio = e.modalidad === 'simulacro'
  const alcanzaPuntaje = correctas >= minimoParaAprobar(total)
  const superaEliminatorias = !e.aplicarEliminatorias || elimFalladas === 0

  return {
    id: e.id,
    fecha: e.fecha,
    modalidad: e.modalidad,
    clase: e.clase,
    duracionSeg: e.duracionSeg,
    total,
    respondidas,
    correctas,
    incorrectas: respondidas - correctas,
    sinResponder: total - respondidas,
    porcentaje: porcentaje(correctas, total),
    aprobado: conCriterio ? total > 0 && alcanzaPuntaje && superaEliminatorias : null,
    eliminatoriasEvaluadas: elimEvaluadas,
    eliminatoriasFalladas: elimFalladas,
    aplicoEliminatorias: e.aplicarEliminatorias,
    porCategoria,
    detalle,
    ordenOpciones: e.ordenOpciones,
    motivoCierre: e.motivoCierre,
  }
}

/** Corrige un simulacro en curso. Falla si alguna pregunta ya no existe en el banco verificado. */
export function evaluarSesion(
  sesion: SesionExamen,
  porId: Map<string, Pregunta>,
  ahoraMs: number = Date.now(),
  motivoCierre: 'usuario' | 'tiempo' = 'usuario',
): Intento {
  const preguntas = sesion.preguntas.map((ps) => {
    const p = porId.get(ps.id)
    if (!p) throw new Error(`La pregunta ${ps.id} no está en el banco verificado.`)
    return p
  })
  const limite = sesion.config.minutos == null ? Infinity : sesion.config.minutos * 60
  const duracionSeg = Math.min(Math.max(0, Math.floor((ahoraMs - sesion.inicioMs) / 1000)), limite)
  return evaluar({
    id: sesion.id,
    modalidad: 'simulacro',
    clase: sesion.config.clase,
    preguntas,
    respuestas: sesion.respuestas,
    duracionSeg,
    fecha: new Date(ahoraMs).toISOString(),
    aplicarEliminatorias: sesion.config.aplicarEliminatorias,
    ordenOpciones: Object.fromEntries(sesion.preguntas.map((p) => [p.id, p.orden])),
    motivoCierre,
  })
}
