import type { ConfigExamen, Pregunta, PreguntaEnSesion, SesionExamen } from '../domain/types'
import { filtrarPreguntas } from '../banco/banco'
import { mezclar, muestra, nuevoId, type Rng } from './aleatorio'

export const CANTIDADES = [30, 40] as const
export const MINUTOS_POR_DEFECTO: Record<number, number> = { 30: 90, 40: 120 }
export const OPCIONES_MINUTOS: (number | null)[] = [30, 45, 60, 90, 120, null]

export class PreguntasInsuficientesError extends Error {
  constructor(
    public disponibles: number,
    public requeridas: number,
  ) {
    super(`Hay ${disponibles} preguntas verificadas para esta selección y se necesitan ${requeridas}.`)
    this.name = 'PreguntasInsuficientesError'
  }
}

/** Preguntas habilitadas para un simulacro de la clase indicada (sólo oficiales verificadas). */
export function preguntasParaSimulacro(banco: Pregunta[], config: Pick<ConfigExamen, 'clase'>): Pregunta[] {
  return filtrarPreguntas(banco, { clase: config.clase })
}

/** ¿Alcanzan las preguntas verificadas para ofrecer esta modalidad? */
export function modalidadDisponible(banco: Pregunta[], config: Pick<ConfigExamen, 'clase' | 'cantidad'>): boolean {
  return preguntasParaSimulacro(banco, config).length >= config.cantidad
}

/** Orden de opciones a mostrar: mezclado salvo que las opciones se refieran unas a otras. */
export function ordenarOpciones(pregunta: Pregunta, rng: Rng = Math.random): string[] {
  const ids = pregunta.opciones.map((o) => o.id)
  return pregunta.ordenFijo ? ids : mezclar(ids, rng)
}

export function prepararPreguntas(preguntas: Pregunta[], rng: Rng = Math.random): PreguntaEnSesion[] {
  return preguntas.map((p) => ({ id: p.id, orden: ordenarOpciones(p, rng) }))
}

/**
 * Crea un simulacro: `cantidad` preguntas distintas elegidas al azar entre las
 * verificadas de la clase, con las opciones mezcladas. Nunca completa con
 * preguntas no verificadas: si no alcanzan, lanza PreguntasInsuficientesError.
 */
export function crearExamen(banco: Pregunta[], config: ConfigExamen, rng: Rng = Math.random, ahoraMs: number = Date.now()): SesionExamen {
  const candidatas = preguntasParaSimulacro(banco, config)
  if (candidatas.length < config.cantidad) throw new PreguntasInsuficientesError(candidatas.length, config.cantidad)
  const elegidas = muestra(candidatas, config.cantidad, rng)
  return {
    id: nuevoId('sim', rng),
    config,
    preguntas: prepararPreguntas(elegidas, rng),
    respuestas: {},
    indice: 0,
    inicioMs: ahoraMs,
  }
}

/** Registra (o cambia) una respuesta. Devuelve una sesión nueva. */
export function responder(sesion: SesionExamen, preguntaId: string, opcionId: string): SesionExamen {
  const p = sesion.preguntas.find((q) => q.id === preguntaId)
  if (!p || !p.orden.includes(opcionId)) return sesion
  return { ...sesion, respuestas: { ...sesion.respuestas, [preguntaId]: opcionId } }
}

export function irA(sesion: SesionExamen, indice: number): SesionExamen {
  const max = sesion.preguntas.length - 1
  return { ...sesion, indice: Math.min(Math.max(indice, 0), max) }
}

export function pendientes(sesion: SesionExamen): number[] {
  return sesion.preguntas.map((p, i) => (sesion.respuestas[p.id] ? -1 : i)).filter((i) => i >= 0)
}

export function segundosTranscurridos(sesion: SesionExamen, ahoraMs: number = Date.now()): number {
  return Math.max(0, Math.floor((ahoraMs - sesion.inicioMs) / 1000))
}

/** Segundos restantes; null si el simulacro no tiene límite. */
export function segundosRestantes(sesion: SesionExamen, ahoraMs: number = Date.now()): number | null {
  if (sesion.config.minutos == null) return null
  return Math.max(0, sesion.config.minutos * 60 - segundosTranscurridos(sesion, ahoraMs))
}

export function tiempoAgotado(sesion: SesionExamen, ahoraMs: number = Date.now()): boolean {
  return segundosRestantes(sesion, ahoraMs) === 0
}

/** Comprueba que una sesión recuperada del almacenamiento siga siendo utilizable con el banco actual. */
export function sesionValida(sesion: unknown, porId: Map<string, Pregunta>): sesion is SesionExamen {
  if (!sesion || typeof sesion !== 'object') return false
  const s = sesion as SesionExamen
  if (!Array.isArray(s.preguntas) || s.preguntas.length === 0 || !s.config || typeof s.inicioMs !== 'number') return false
  if (new Set(s.preguntas.map((p) => p.id)).size !== s.preguntas.length) return false
  return s.preguntas.every((ps) => {
    const p = porId.get(ps.id)
    return !!p && ps.orden.length === p.opciones.length && p.opciones.every((o) => ps.orden.includes(o.id))
  })
}

export function formatearTiempo(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
