import { describe, expect, it } from 'vitest'
import type { MapaEstadisticas, ResultadoPregunta } from '../domain/types'
import { bancoDePrueba } from '../test/fabrica'
import { rngConSemilla } from '../motor/aleatorio'
import {
  colaDeRepaso,
  contarDominadas,
  estaDominada,
  marcarDominada,
  masFalladas,
  pendienteDeRepaso,
  prioridadRepaso,
  registrarResultados,
  seleccionAdaptativa,
} from './repaso'

const res = (id: string, acierto: boolean | null): ResultadoPregunta => ({ id, elegida: acierto === null ? null : acierto ? 'a' : 'b', correcta: 'a', acierto: !!acierto })
const F = '2026-11-14T10:00:00.000Z'

function aplicar(mapa: MapaEstadisticas, id: string, secuencia: boolean[]): MapaEstadisticas {
  return secuencia.reduce((m, ok, i) => registrarResultados(m, [res(id, ok)], `2026-11-${10 + i}T10:00:00.000Z`), mapa)
}

describe('registro de errores', () => {
  it('acumula vistas, aciertos, errores y racha', () => {
    const m = aplicar({}, 't-1', [false, false, true, true])
    expect(m['t-1']).toMatchObject({ vistas: 4, aciertos: 2, errores: 2, racha: 2, ultimoError: '2026-11-11T10:00:00.000Z' })
  })

  it('ignora las preguntas sin responder', () => {
    expect(registrarResultados({}, [res('t-1', null)], F)).toEqual({})
  })

  it('no modifica el mapa original', () => {
    const original: MapaEstadisticas = {}
    registrarResultados(original, [res('t-1', false)], F)
    expect(original).toEqual({})
  })
})

describe('repaso de errores', () => {
  const banco = bancoDePrueba(6)

  it('una pregunta fallada tres veces tiene más prioridad que una fallada una vez', () => {
    let m: MapaEstadisticas = {}
    m = aplicar(m, 't-1', [false])
    m = aplicar(m, 't-2', [false, false, false])
    expect(prioridadRepaso(m['t-2'])).toBeGreaterThan(prioridadRepaso(m['t-1']))
    expect(colaDeRepaso(banco, m).map((p) => p.id)).toEqual(['t-2', 't-1'])
  })

  it('sólo incluye preguntas falladas y todavía no dominadas', () => {
    let m: MapaEstadisticas = {}
    m = aplicar(m, 't-1', [true, true]) // nunca fallada
    m = aplicar(m, 't-2', [false, true, true, true]) // fallada y luego dominada por racha
    m = aplicar(m, 't-3', [false, true]) // fallada, aún no dominada
    expect(colaDeRepaso(banco, m).map((p) => p.id)).toEqual(['t-3'])
    expect(pendienteDeRepaso(m['t-2'])).toBe(false)
  })

  it('permite marcar una pregunta como dominada y la saca del repaso', () => {
    let m = aplicar({}, 't-1', [false, false])
    expect(colaDeRepaso(banco, m)).toHaveLength(1)
    m = marcarDominada(m, 't-1', true)
    expect(estaDominada(m['t-1'])).toBe(true)
    expect(colaDeRepaso(banco, m)).toHaveLength(0)
    m = marcarDominada(m, 't-1', false)
    expect(colaDeRepaso(banco, m)).toHaveLength(1)
  })

  it('volver a fallar una pregunta dominada la devuelve al repaso', () => {
    let m = marcarDominada(aplicar({}, 't-1', [false]), 't-1', true)
    m = aplicar(m, 't-1', [false])
    expect(estaDominada(m['t-1'])).toBe(false)
    expect(colaDeRepaso(banco, m).map((p) => p.id)).toEqual(['t-1'])
  })

  it('lista las preguntas más falladas en orden', () => {
    let m: MapaEstadisticas = {}
    m = aplicar(m, 't-1', [false])
    m = aplicar(m, 't-2', [false, false, false])
    m = aplicar(m, 't-3', [false, false])
    m = aplicar(m, 't-4', [true])
    expect(masFalladas(banco, m, 2).map((x) => x.pregunta.id)).toEqual(['t-2', 't-3'])
  })

  it('cuenta las preguntas dominadas', () => {
    let m: MapaEstadisticas = {}
    m = aplicar(m, 't-1', [true, true])
    m = aplicar(m, 't-2', [true])
    m = aplicar(m, 't-3', [false, true, true, true])
    expect(contarDominadas(banco, m)).toBe(2)
  })
})

describe('práctica inteligente', () => {
  const banco = bancoDePrueba(40)
  const ahora = Date.parse('2026-11-14T12:00:00.000Z')

  function frecuencia(mapa: MapaEstadisticas, n: number, repeticiones = 300): Map<string, number> {
    const f = new Map<string, number>()
    for (let s = 1; s <= repeticiones; s++) {
      for (const p of seleccionAdaptativa(banco, mapa, n, rngConSemilla(s), ahora)) f.set(p.id, (f.get(p.id) ?? 0) + 1)
    }
    return f
  }

  it('no repite preguntas y respeta la cantidad', () => {
    const sel = seleccionAdaptativa(banco, {}, 10, rngConSemilla(1), ahora)
    expect(sel).toHaveLength(10)
    expect(new Set(sel.map((p) => p.id)).size).toBe(10)
    expect(seleccionAdaptativa(banco, {}, 999, rngConSemilla(1), ahora)).toHaveLength(40)
  })

  it('prioriza las preguntas con más errores sobre las dominadas', () => {
    let m: MapaEstadisticas = {}
    for (const p of banco) m = registrarResultados(m, [res(p.id, true), res(p.id, true)], '2026-11-14T11:00:00.000Z')
    m = registrarResultados(m, [res('t-5', false), res('t-5', false), res('t-5', false)], '2026-11-14T11:30:00.000Z')
    const f = frecuencia(m, 5)
    const otras = [...f.entries()].filter(([id]) => id !== 't-5').map(([, v]) => v)
    expect(f.get('t-5')!).toBeGreaterThan(Math.max(...otras))
  })

  it('prioriza las preguntas nunca respondidas', () => {
    let m: MapaEstadisticas = {}
    for (const p of banco.slice(0, 30)) m = registrarResultados(m, [res(p.id, true), res(p.id, true)], '2026-11-14T11:00:00.000Z')
    const f = frecuencia(m, 10)
    const nuevas = banco.slice(30).reduce((a, p) => a + (f.get(p.id) ?? 0), 0)
    const vistas = banco.slice(0, 30).reduce((a, p) => a + (f.get(p.id) ?? 0), 0)
    expect(nuevas).toBeGreaterThan(vistas * 2)
  })

  it('prioriza lo que hace mucho no se practica', () => {
    let m: MapaEstadisticas = {}
    for (const p of banco) {
      const fecha = p.id === 't-7' ? '2026-09-01T10:00:00.000Z' : '2026-11-14T11:00:00.000Z'
      m = registrarResultados(m, [res(p.id, true)], fecha)
    }
    const f = frecuencia(m, 5)
    const promedio = [...f.values()].reduce((a, b) => a + b, 0) / banco.length
    expect(f.get('t-7')!).toBeGreaterThan(promedio * 1.5)
  })

  it('prioriza las materias con peor rendimiento', () => {
    let m: MapaEstadisticas = {}
    for (const p of banco) {
      const ok = p.categoria !== 'semaforos'
      m = registrarResultados(m, [res(p.id, ok), res(p.id, true)], '2026-11-14T11:00:00.000Z')
    }
    // se iguala el historial individual de una pregunta de cada materia para aislar el efecto de la categoría
    const debil = banco.find((p) => p.categoria === 'semaforos')!
    const fuerte = banco.find((p) => p.categoria === 'senales')!
    m[debil.id] = { ...m[fuerte.id] }
    const f = frecuencia(m, 8, 600)
    expect(f.get(debil.id)!).toBeGreaterThan(f.get(fuerte.id)!)
  })
})
