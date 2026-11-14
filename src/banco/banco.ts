import type { Categoria, CategoriaId, ClaseLicencia, Pregunta } from '../domain/types'
import { validarBanco, type InformeValidacion } from './validador'
import oficialJson from '../data/banco/oficial.json'
import complementariasJson from '../data/banco/complementarias.json'
import excluidasJson from '../data/banco/excluidas.json'
import metaJson from '../data/banco/meta.json'

export interface PreguntaExcluida {
  id: string
  pagina: number
  numeroOriginal: number | null
  enunciado: string
  motivo: string
  motivoDescripcion: string
  detalle: string
  eliminatoriaEnOriginal: boolean
  estado: 'pendiente' | 'excluida'
}

export interface Banco {
  /** Únicas preguntas que el motor puede usar: verificadas y sin errores de validación. */
  preguntas: Pregunta[]
  porId: Map<string, Pregunta>
  categorias: Categoria[]
  informe: InformeValidacion
  excluidas: PreguntaExcluida[]
  meta: typeof metaJson
}

/** Arma un banco a partir de preguntas crudas. Para ampliar la base alcanza con sumar archivos JSON. */
export function crearBanco(crudas: Pregunta[], categoriasBase: { id: string; nombre: string }[]): Omit<Banco, 'excluidas' | 'meta'> {
  const informe = validarBanco(crudas)
  const preguntas = informe.aptas
  const porId = new Map(preguntas.map((p) => [p.id, p]))
  const categorias = categoriasBase
    .map((c) => ({
      id: c.id as CategoriaId,
      nombre: c.nombre,
      preguntas: preguntas.filter((p) => p.categoria === c.id).length,
    }))
    .filter((c) => c.preguntas > 0)
  return { preguntas, porId, categorias, informe }
}

let cache: Banco | null = null

export function obtenerBanco(): Banco {
  if (!cache) {
    const crudas = [...(oficialJson as unknown as Pregunta[]), ...(complementariasJson as unknown as Pregunta[])]
    cache = {
      ...crearBanco(crudas, metaJson.categorias),
      excluidas: excluidasJson as PreguntaExcluida[],
      meta: metaJson,
    }
  }
  return cache
}

export interface FiltroPreguntas {
  clase?: ClaseLicencia
  categorias?: CategoriaId[]
  /** Por defecto sólo las oficiales entran a los simulacros. */
  incluirComplementarias?: boolean
}

export function filtrarPreguntas(preguntas: Pregunta[], filtro: FiltroPreguntas = {}): Pregunta[] {
  return preguntas.filter((p) => {
    if (p.estado !== 'verificada') return false
    if (filtro.clase && !p.clases.includes(filtro.clase)) return false
    if (filtro.categorias && filtro.categorias.length > 0 && !filtro.categorias.includes(p.categoria)) return false
    if (!filtro.incluirComplementarias && p.origen !== 'oficial') return false
    return true
  })
}

export const CLASES_DISPONIBLES: { id: ClaseLicencia; nombre: string; disponible: boolean }[] = [
  { id: 'B1', nombre: 'B1 · Automóviles, camionetas y utilitarios particulares', disponible: true },
  { id: 'A', nombre: 'A · Motos (próximamente)', disponible: false },
  { id: 'C', nombre: 'C · Camiones sin acoplado (próximamente)', disponible: false },
  { id: 'D', nombre: 'D · Transporte de pasajeros (próximamente)', disponible: false },
]
