import type { CategoriaId, EstadisticaPregunta, MapaEstadisticas, Pregunta, ResultadoPregunta } from '../domain/types'
import { muestraPonderada, type Rng } from '../motor/aleatorio'

/** Aciertos consecutivos a partir de los cuales una pregunta fallada se considera dominada. */
export const RACHA_DOMINIO = 3

export const estadisticaVacia = (): EstadisticaPregunta => ({
  vistas: 0,
  aciertos: 0,
  errores: 0,
  racha: 0,
  ultimaVez: null,
  ultimoError: null,
  dominada: false,
})

/** Actualiza las estadísticas por pregunta con los resultados de una sesión. Las no respondidas no cuentan. */
export function registrarResultados(mapa: MapaEstadisticas, resultados: ResultadoPregunta[], fecha: string): MapaEstadisticas {
  const nuevo: MapaEstadisticas = { ...mapa }
  for (const r of resultados) {
    if (r.elegida == null) continue
    const e = { ...(nuevo[r.id] ?? estadisticaVacia()) }
    e.vistas++
    e.ultimaVez = fecha
    if (r.acierto) {
      e.aciertos++
      e.racha++
    } else {
      e.errores++
      e.racha = 0
      e.ultimoError = fecha
      e.dominada = false // volver a fallarla le quita la marca manual
    }
    nuevo[r.id] = e
  }
  return nuevo
}

export function marcarDominada(mapa: MapaEstadisticas, id: string, dominada: boolean): MapaEstadisticas {
  const e = { ...(mapa[id] ?? estadisticaVacia()), dominada }
  return { ...mapa, [id]: e }
}

/** Dominada = marcada a mano, o respondida bien varias veces seguidas (o siempre bien, al menos dos veces). */
export function estaDominada(e: EstadisticaPregunta | undefined): boolean {
  if (!e) return false
  if (e.dominada) return true
  if (e.errores === 0) return e.aciertos >= 2
  return e.racha >= RACHA_DOMINIO
}

/** ¿La pregunta debe aparecer en el repaso de errores? */
export function pendienteDeRepaso(e: EstadisticaPregunta | undefined): boolean {
  return !!e && e.errores > 0 && !estaDominada(e)
}

/**
 * Prioridad de repaso: más errores => más prioridad; cada acierto posterior la reduce.
 * Una pregunta fallada tres veces siempre queda por encima de una fallada una sola vez
 * (a igual racha de aciertos posteriores).
 */
export function prioridadRepaso(e: EstadisticaPregunta): number {
  return e.errores * 2 - e.racha
}

export function colaDeRepaso(preguntas: Pregunta[], mapa: MapaEstadisticas): Pregunta[] {
  return preguntas
    .filter((p) => pendienteDeRepaso(mapa[p.id]))
    .sort((a, b) => {
      const ea = mapa[a.id]
      const eb = mapa[b.id]
      const d = prioridadRepaso(eb) - prioridadRepaso(ea)
      if (d !== 0) return d
      return (eb.ultimoError ?? '').localeCompare(ea.ultimoError ?? '')
    })
}

export function masFalladas(preguntas: Pregunta[], mapa: MapaEstadisticas, n = 10): { pregunta: Pregunta; estadistica: EstadisticaPregunta }[] {
  return preguntas
    .filter((p) => (mapa[p.id]?.errores ?? 0) > 0)
    .map((p) => ({ pregunta: p, estadistica: mapa[p.id] }))
    .sort((a, b) => b.estadistica.errores - a.estadistica.errores || b.estadistica.vistas - a.estadistica.vistas)
    .slice(0, n)
}

export function contarDominadas(preguntas: Pregunta[], mapa: MapaEstadisticas): number {
  return preguntas.filter((p) => estaDominada(mapa[p.id])).length
}

/* ---------------- Práctica inteligente (entrenamiento adaptativo) ---------------- */

export interface PesosAdaptativos {
  errores: number
  categoriaDebil: number
  nunca: number
  antiguedad: number
  dominada: number
}

export const PESOS_POR_DEFECTO: PesosAdaptativos = {
  errores: 4, // frecuencia histórica de errores de la pregunta
  categoriaDebil: 2, // materias con peor rendimiento
  nunca: 2.5, // preguntas nunca respondidas
  antiguedad: 1.5, // hace mucho que no se practica (satura a los 14 días)
  dominada: 0.15, // factor que reduce el peso de lo ya dominado
}

const DIA_MS = 86_400_000

export function rendimientoPorCategoria(preguntas: Pregunta[], mapa: MapaEstadisticas): Partial<Record<CategoriaId, { aciertos: number; vistas: number; tasa: number }>> {
  const acc: Partial<Record<CategoriaId, { aciertos: number; vistas: number; tasa: number }>> = {}
  for (const p of preguntas) {
    const e = mapa[p.id]
    if (!e || e.vistas === 0) continue
    const c = (acc[p.categoria] ??= { aciertos: 0, vistas: 0, tasa: 0 })
    c.aciertos += e.aciertos
    c.vistas += e.vistas
  }
  for (const c of Object.values(acc)) c.tasa = c.vistas ? c.aciertos / c.vistas : 0
  return acc
}

/** Peso de selección de una pregunta para la práctica inteligente (siempre > 0). */
export function pesoAdaptativo(
  p: Pregunta,
  mapa: MapaEstadisticas,
  rendimiento: ReturnType<typeof rendimientoPorCategoria>,
  ahoraMs: number,
  pesos: PesosAdaptativos = PESOS_POR_DEFECTO,
): number {
  const e = mapa[p.id]
  let peso = 0.2
  const cat = rendimiento[p.categoria]
  if (cat && cat.vistas >= 3) peso += pesos.categoriaDebil * (1 - cat.tasa)
  if (!e || e.vistas === 0) return peso + pesos.nunca
  peso += pesos.errores * (e.errores / e.vistas)
  if (e.ultimaVez) {
    const dias = Math.max(0, (ahoraMs - Date.parse(e.ultimaVez)) / DIA_MS)
    peso += pesos.antiguedad * Math.min(dias / 14, 1)
  }
  // La dificultad sólo se usa cuando está fundamentada en el banco (hoy: sin clasificar).
  if (p.dificultad === 'alta') peso *= 1.15
  if (estaDominada(e)) peso *= pesos.dominada
  return peso
}

/** Elige `n` preguntas distintas priorizando lo que el estudiante todavía no domina. */
export function seleccionAdaptativa(
  preguntas: Pregunta[],
  mapa: MapaEstadisticas,
  n: number,
  rng: Rng = Math.random,
  ahoraMs: number = Date.now(),
  pesos: PesosAdaptativos = PESOS_POR_DEFECTO,
): Pregunta[] {
  const rendimiento = rendimientoPorCategoria(preguntas, mapa)
  const w = preguntas.map((p) => pesoAdaptativo(p, mapa, rendimiento, ahoraMs, pesos))
  return muestraPonderada(preguntas, w, Math.min(n, preguntas.length), rng)
}
