import { describe, expect, it } from 'vitest'
import type { Intento, MapaEstadisticas } from '../domain/types'
import { bancoDePrueba } from '../test/fabrica'
import { registrarResultados } from '../repaso/repaso'
import { aciertosPorCategoria, evolucion, preparacionEstimada, resumenGeneral } from './estadisticas'

function sim(n: number, porcentaje: number, extra: Partial<Intento> = {}): Intento {
  const correctas = Math.round((porcentaje / 100) * 40)
  return {
    id: `s-${n}`,
    fecha: `2026-11-${String(n).padStart(2, '0')}T10:00:00.000Z`,
    modalidad: 'simulacro',
    clase: 'B1',
    duracionSeg: 900,
    total: 40,
    respondidas: 40,
    correctas,
    incorrectas: 40 - correctas,
    sinResponder: 0,
    porcentaje,
    aprobado: porcentaje >= 75,
    eliminatoriasEvaluadas: 0,
    eliminatoriasFalladas: 0,
    aplicoEliminatorias: true,
    porCategoria: {},
    detalle: [],
    ...extra,
  }
}

describe('resumen general', () => {
  const banco = bancoDePrueba(20)

  it('calcula cantidad de exámenes, promedio y mejor resultado sólo con simulacros', () => {
    const h = [sim(1, 60), sim(2, 80), sim(3, 90), sim(4, 20, { modalidad: 'estudio', aprobado: null })]
    const r = resumenGeneral(h, banco, {})
    expect(r).toMatchObject({ simulacros: 3, sesionesEstudio: 1, promedio: 77, mejor: 90, aprobados: 2, preguntasRespondidas: 160, totalBanco: 20 })
  })

  it('sin historial devuelve valores nulos, no ceros engañosos', () => {
    expect(resumenGeneral([], banco, {})).toMatchObject({ simulacros: 0, promedio: null, mejor: null, dominadas: 0 })
  })
})

describe('evolución', () => {
  it('devuelve los últimos diez simulacros en orden cronológico', () => {
    const h = Array.from({ length: 14 }, (_, i) => sim(i + 1, 50 + i)).reverse()
    const e = evolucion(h, 10)
    expect(e).toHaveLength(10)
    expect(e[0].id).toBe('s-5')
    expect(e[9].id).toBe('s-14')
  })
})

describe('aciertos por materia', () => {
  it('calcula el porcentaje por categoría y deja null donde no hay respuestas', () => {
    const banco = bancoDePrueba(8) // 2 por categoría
    let m: MapaEstadisticas = {}
    const senales = banco.filter((p) => p.categoria === 'senales')
    m = registrarResultados(m, [
      { id: senales[0].id, elegida: 'a', correcta: 'a', acierto: true },
      { id: senales[1].id, elegida: 'b', correcta: 'a', acierto: false },
    ], '2026-11-14T10:00:00.000Z')
    const cats = [
      { id: 'senales' as const, nombre: 'Señales', preguntas: 2 },
      { id: 'prioridades' as const, nombre: 'Prioridades', preguntas: 2 },
    ]
    expect(aciertosPorCategoria(cats, banco, m)).toEqual([
      { id: 'senales', nombre: 'Señales', vistas: 2, aciertos: 1, porcentaje: 50 },
      { id: 'prioridades', nombre: 'Prioridades', vistas: 0, aciertos: 0, porcentaje: null },
    ])
  })
})

describe('indicador de preparación', () => {
  it('pide al menos tres simulacros', () => {
    const p = preparacionEstimada([sim(1, 95), sim(2, 95)])
    expect(p.nivel).toBe('sin-datos')
    expect(p.indice).toBeNull()
    expect(p.detalle).toMatch(/1 simulacro más/)
  })

  it('ignora las sesiones de estudio', () => {
    const h = [sim(1, 90), sim(2, 90), sim(3, 90, { modalidad: 'estudio' })]
    expect(preparacionEstimada(h).nivel).toBe('sin-datos')
  })

  it('refleja resultados altos y bajos', () => {
    expect(preparacionEstimada([sim(1, 95), sim(2, 92), sim(3, 98)]).nivel).toBe('muy-buena')
    expect(preparacionEstimada([sim(1, 40), sim(2, 45), sim(3, 38)]).nivel).toBe('inicial')
  })

  it('pesa más los simulacros recientes', () => {
    const mejorando = preparacionEstimada([sim(1, 50), sim(2, 70), sim(3, 90)]).indice!
    const empeorando = preparacionEstimada([sim(1, 90), sim(2, 70), sim(3, 50)]).indice!
    expect(mejorando).toBeGreaterThan(empeorando)
  })

  it('usa como máximo los últimos cinco', () => {
    const h = [sim(1, 10), sim(2, 10), sim(3, 90), sim(4, 90), sim(5, 90), sim(6, 90), sim(7, 90)]
    const p = preparacionEstimada(h)
    expect(p.simulacrosConsiderados).toBe(5)
    expect(p.indice).toBe(90)
  })
})
