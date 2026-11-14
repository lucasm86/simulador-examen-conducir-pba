import type { Categoria, CategoriaId, Intento, MapaEstadisticas, Pregunta } from '../domain/types'
import { contarDominadas, masFalladas, rendimientoPorCategoria } from '../repaso/repaso'

export interface ResumenGeneral {
  simulacros: number
  sesionesEstudio: number
  promedio: number | null
  mejor: number | null
  aprobados: number
  preguntasRespondidas: number
  dominadas: number
  totalBanco: number
}

export const soloSimulacros = (historial: Intento[]) => historial.filter((i) => i.modalidad === 'simulacro')

export function resumenGeneral(historial: Intento[], preguntas: Pregunta[], mapa: MapaEstadisticas): ResumenGeneral {
  const sims = soloSimulacros(historial)
  const pct = sims.map((s) => s.porcentaje)
  return {
    simulacros: sims.length,
    sesionesEstudio: historial.length - sims.length,
    promedio: pct.length ? Math.round(pct.reduce((a, b) => a + b, 0) / pct.length) : null,
    mejor: pct.length ? Math.max(...pct) : null,
    aprobados: sims.filter((s) => s.aprobado).length,
    preguntasRespondidas: historial.reduce((a, i) => a + i.respondidas, 0),
    dominadas: contarDominadas(preguntas, mapa),
    totalBanco: preguntas.length,
  }
}

/** Últimos `n` simulacros en orden cronológico (el más reciente al final). */
export function evolucion(historial: Intento[], n = 10): Intento[] {
  return [...soloSimulacros(historial)].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-n)
}

export interface AciertoCategoria {
  id: CategoriaId
  nombre: string
  vistas: number
  aciertos: number
  /** 0–100, o null si todavía no hay respuestas en esa materia. */
  porcentaje: number | null
}

/** Porcentaje de aciertos por materia, sobre todas las respuestas registradas (cualquier modalidad). */
export function aciertosPorCategoria(categorias: Categoria[], preguntas: Pregunta[], mapa: MapaEstadisticas): AciertoCategoria[] {
  const r = rendimientoPorCategoria(preguntas, mapa)
  return categorias.map((c) => {
    const d = r[c.id]
    return {
      id: c.id,
      nombre: c.nombre,
      vistas: d?.vistas ?? 0,
      aciertos: d?.aciertos ?? 0,
      porcentaje: d && d.vistas > 0 ? Math.round(d.tasa * 100) : null,
    }
  })
}

export { masFalladas }

export type NivelPreparacion = 'sin-datos' | 'inicial' | 'en-progreso' | 'cerca' | 'buena' | 'muy-buena'

export interface Preparacion {
  nivel: NivelPreparacion
  /** 0–100, o null sin datos suficientes. */
  indice: number | null
  etiqueta: string
  detalle: string
  simulacrosConsiderados: number
}

export const MIN_SIMULACROS_PREPARACION = 3

/**
 * Indicador orientativo de preparación. Usa los últimos 5 simulacros, pesando más
 * los recientes, y descuenta si alguno reciente quedó desaprobado.
 * NO predice ni garantiza el resultado del examen oficial.
 */
export function preparacionEstimada(historial: Intento[]): Preparacion {
  const recientes = evolucion(historial, 5)
  if (recientes.length < MIN_SIMULACROS_PREPARACION) {
    const faltan = MIN_SIMULACROS_PREPARACION - recientes.length
    return {
      nivel: 'sin-datos',
      indice: null,
      etiqueta: 'Todavía sin datos suficientes',
      detalle: `Completá ${faltan} simulacro${faltan === 1 ? '' : 's'} más para ver una estimación.`,
      simulacrosConsiderados: recientes.length,
    }
  }
  let suma = 0
  let pesos = 0
  recientes.forEach((s, i) => {
    const w = i + 1
    suma += s.porcentaje * w
    pesos += w
  })
  const ponderado = suma / pesos
  const tasaAprobados = recientes.filter((s) => s.aprobado).length / recientes.length
  const indice = Math.round(Math.max(0, Math.min(100, ponderado - (1 - tasaAprobados) * 10)))
  const [nivel, etiqueta, detalle]: [NivelPreparacion, string, string] =
    indice >= 88
      ? ['muy-buena', 'Muy buena preparación', 'Venís aprobando con margen. Mantené el ritmo con repasos cortos.']
      : indice >= 78
        ? ['buena', 'Buena preparación', 'Estás por encima del 75 % requerido. Reforzá las materias más flojas.']
        : indice >= 68
          ? ['cerca', 'Cerca del objetivo', 'Estás cerca del 75 %. Repasá tus errores antes de rendir.']
          : indice >= 50
            ? ['en-progreso', 'En progreso', 'Todavía por debajo del 75 %. Estudiá por temas y repasá errores.']
            : ['inicial', 'Etapa inicial', 'Conviene empezar por el modo estudio, materia por materia.']
  return { nivel, indice, etiqueta, detalle, simulacrosConsiderados: recientes.length }
}
