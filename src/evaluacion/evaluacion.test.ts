import { describe, expect, it } from 'vitest'
import type { Pregunta } from '../domain/types'
import { bancoDePrueba } from '../test/fabrica'
import { crearExamen, responder } from '../motor/examen'
import { rngConSemilla } from '../motor/aleatorio'
import { esCorrecta, evaluar, evaluarSesion, minimoParaAprobar, porcentaje, type EntradaEvaluacion } from './evaluacion'

/** Responde bien las primeras `ok`, mal las siguientes `mal` y deja el resto sin responder. */
function respuestas(preguntas: Pregunta[], ok: number, mal = 0): Record<string, string> {
  const r: Record<string, string> = {}
  preguntas.forEach((p, i) => {
    if (i < ok) r[p.id] = p.respuestaCorrecta
    else if (i < ok + mal) r[p.id] = 'b'
  })
  return r
}

const entrada = (preguntas: Pregunta[], resp: Record<string, string>, extra: Partial<EntradaEvaluacion> = {}): EntradaEvaluacion => ({
  id: 'x',
  modalidad: 'simulacro',
  clase: 'B1',
  preguntas,
  respuestas: resp,
  duracionSeg: 600,
  fecha: '2026-11-14T12:00:00.000Z',
  aplicarEliminatorias: true,
  ...extra,
})

describe('corrección de respuestas', () => {
  it('reconoce la opción correcta', () => {
    const [p] = bancoDePrueba(1)
    expect(esCorrecta(p, 'a')).toBe(true)
    expect(esCorrecta(p, 'b')).toBe(false)
    expect(esCorrecta(p, null)).toBe(false)
    expect(esCorrecta(p, undefined)).toBe(false)
  })

  it('cuenta correctas, incorrectas y sin responder', () => {
    const ps = bancoDePrueba(40)
    const r = evaluar(entrada(ps, respuestas(ps, 34, 4)))
    expect(r.total).toBe(40)
    expect(r.correctas).toBe(34)
    expect(r.incorrectas).toBe(4)
    expect(r.sinResponder).toBe(2)
    expect(r.respondidas).toBe(38)
    expect(r.detalle).toHaveLength(40)
    expect(r.detalle[39]).toEqual({ id: ps[39].id, elegida: null, correcta: 'a', acierto: false })
  })

  it('desglosa el desempeño por categoría', () => {
    const ps = bancoDePrueba(40) // 4 categorías, 10 preguntas cada una
    const r = evaluar(entrada(ps, respuestas(ps, 20)))
    const total = Object.values(r.porCategoria).reduce((a, c) => a + c!.total, 0)
    const correctas = Object.values(r.porCategoria).reduce((a, c) => a + c!.correctas, 0)
    expect(total).toBe(40)
    expect(correctas).toBe(20)
    expect(r.porCategoria.senales).toEqual({ total: 10, correctas: 5 })
  })
})

describe('cálculo de porcentajes', () => {
  it('redondea al entero más cercano', () => {
    expect(porcentaje(34, 40)).toBe(85)
    expect(porcentaje(23, 30)).toBe(77)
    expect(porcentaje(0, 40)).toBe(0)
    expect(porcentaje(40, 40)).toBe(100)
    expect(porcentaje(0, 0)).toBe(0)
  })

  it('las preguntas sin responder cuentan como no acertadas', () => {
    const ps = bancoDePrueba(40)
    const r = evaluar(entrada(ps, respuestas(ps, 10))) // 10 bien, 30 sin responder
    expect(r.porcentaje).toBe(25)
    expect(r.aprobado).toBe(false)
  })
})

describe('aprobación con 75 %', () => {
  it('exige 30 de 40 y 23 de 30', () => {
    expect(minimoParaAprobar(40)).toBe(30)
    expect(minimoParaAprobar(30)).toBe(23)
  })

  it.each([
    [40, 30, true],
    [40, 29, false],
    [40, 40, true],
    [30, 23, true],
    [30, 22, false],
  ])('con %i preguntas y %i correctas, aprobado = %s', (total, ok, esperado) => {
    const ps = bancoDePrueba(total)
    expect(evaluar(entrada(ps, respuestas(ps, ok, total - ok))).aprobado).toBe(esperado)
  })

  it('un examen vacío nunca se aprueba', () => {
    expect(evaluar(entrada([], {})).aprobado).toBe(false)
  })

  it('en estudio y repaso no hay aprobado ni desaprobado', () => {
    const ps = bancoDePrueba(10)
    expect(evaluar(entrada(ps, respuestas(ps, 2, 8), { modalidad: 'estudio' })).aprobado).toBeNull()
    expect(evaluar(entrada(ps, respuestas(ps, 10), { modalidad: 'repaso' })).aprobado).toBeNull()
  })
})

describe('preguntas eliminatorias verificadas', () => {
  const ps = bancoDePrueba(40, (n) => ({ eliminatoria: n === 40 || n === 39 }))

  it('fallar una eliminatoria desaprueba aunque se supere el 75 %', () => {
    const r = evaluar(entrada(ps, respuestas(ps, 39, 1))) // la n.º 40 (eliminatoria) mal
    expect(r.porcentaje).toBe(98)
    expect(r.eliminatoriasEvaluadas).toBe(2)
    expect(r.eliminatoriasFalladas).toBe(1)
    expect(r.aprobado).toBe(false)
  })

  it('una eliminatoria sin responder también cuenta como fallada', () => {
    const r = evaluar(entrada(ps, respuestas(ps, 38))) // 39 y 40 sin responder
    expect(r.eliminatoriasFalladas).toBe(2)
    expect(r.aprobado).toBe(false)
  })

  it('con todas las eliminatorias bien y 75 % se aprueba', () => {
    const resp = respuestas(ps, 28, 10)
    resp[ps[38].id] = 'a'
    resp[ps[39].id] = 'a'
    const r = evaluar(entrada(ps, resp))
    expect(r.correctas).toBe(30)
    expect(r.eliminatoriasFalladas).toBe(0)
    expect(r.aprobado).toBe(true)
  })

  it('si el estudiante desactiva las eliminatorias, sólo cuenta el 75 %', () => {
    const r = evaluar(entrada(ps, respuestas(ps, 38, 2), { aplicarEliminatorias: false }))
    expect(r.eliminatoriasFalladas).toBe(2)
    expect(r.aprobado).toBe(true)
  })

  it('no trata como eliminatoria a una pregunta que no es oficial', () => {
    const mixtas = bancoDePrueba(40, (n) => ({ eliminatoria: n === 40, origen: n === 40 ? 'complementaria' : 'oficial' }))
    const r = evaluar(entrada(mixtas, respuestas(mixtas, 39, 1)))
    expect(r.eliminatoriasEvaluadas).toBe(0)
    expect(r.aprobado).toBe(true)
  })
})

describe('evaluación de una sesión de simulacro', () => {
  const banco = bancoDePrueba(80)
  const porId = new Map(banco.map((p) => [p.id, p]))
  const cfg = { cantidad: 40, clase: 'B1' as const, minutos: 120, aplicarEliminatorias: true }

  it('corrige de principio a fin un examen de 40 preguntas', () => {
    let s = crearExamen(banco, cfg, rngConSemilla(4), 0)
    s.preguntas.forEach((ps, i) => {
      s = responder(s, ps.id, i < 34 ? 'a' : 'b')
    })
    const r = evaluarSesion(s, porId, 25 * 60_000)
    expect(r).toMatchObject({ total: 40, correctas: 34, incorrectas: 6, sinResponder: 0, porcentaje: 85, aprobado: true, duracionSeg: 1500, modalidad: 'simulacro' })
    expect(Object.keys(r.ordenOpciones!)).toHaveLength(40)
  })

  it('al cerrarse por tiempo, la duración no supera el límite', () => {
    const s = crearExamen(banco, { ...cfg, minutos: 30 }, rngConSemilla(4), 0)
    const r = evaluarSesion(s, porId, 5 * 3_600_000, 'tiempo')
    expect(r.duracionSeg).toBe(1800)
    expect(r.motivoCierre).toBe('tiempo')
    expect(r.sinResponder).toBe(40)
    expect(r.aprobado).toBe(false)
  })

  it('falla si una pregunta dejó de estar en el banco verificado', () => {
    const s = crearExamen(banco, cfg, rngConSemilla(4), 0)
    const incompleto = new Map(porId)
    incompleto.delete(s.preguntas[0].id)
    expect(() => evaluarSesion(s, incompleto)).toThrow(/no está en el banco verificado/)
  })
})
