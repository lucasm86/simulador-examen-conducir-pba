import { describe, expect, it } from 'vitest'
import type { ConfigExamen } from '../domain/types'
import { bancoDePrueba, pregunta } from '../test/fabrica'
import { mezclar, muestraPonderada, rngConSemilla } from './aleatorio'
import {
  crearExamen,
  formatearTiempo,
  irA,
  modalidadDisponible,
  ordenarOpciones,
  pendientes,
  PreguntasInsuficientesError,
  responder,
  segundosRestantes,
  sesionValida,
  tiempoAgotado,
} from './examen'

const config = (c: Partial<ConfigExamen> = {}): ConfigExamen => ({ cantidad: 40, clase: 'B1', minutos: 120, aplicarEliminatorias: true, ...c })

describe('selección aleatoria', () => {
  it('no repite preguntas dentro de un mismo examen', () => {
    const banco = bancoDePrueba(120)
    for (let semilla = 1; semilla <= 50; semilla++) {
      const s = crearExamen(banco, config(), rngConSemilla(semilla))
      const ids = s.preguntas.map((p) => p.id)
      expect(ids).toHaveLength(40)
      expect(new Set(ids).size).toBe(40)
    }
  })

  it('respeta la cantidad elegida (30 o 40)', () => {
    const banco = bancoDePrueba(60)
    expect(crearExamen(banco, config({ cantidad: 30 })).preguntas).toHaveLength(30)
    expect(crearExamen(banco, config({ cantidad: 40 })).preguntas).toHaveLength(40)
  })

  it('genera combinaciones distintas en simulacros sucesivos', () => {
    const banco = bancoDePrueba(200)
    const a = crearExamen(banco, config(), rngConSemilla(1)).preguntas.map((p) => p.id).join()
    const b = crearExamen(banco, config(), rngConSemilla(2)).preguntas.map((p) => p.id).join()
    expect(a).not.toBe(b)
  })

  it('es reproducible con la misma semilla', () => {
    const banco = bancoDePrueba(80)
    const a = crearExamen(banco, config(), rngConSemilla(7), 0)
    const b = crearExamen(banco, config(), rngConSemilla(7), 0)
    expect(a.preguntas).toEqual(b.preguntas)
  })

  it('sólo usa preguntas de la clase elegida', () => {
    const banco = bancoDePrueba(100, (n) => ({ clases: n % 2 ? ['B1'] : ['A'] }))
    const s = crearExamen(banco, config({ clase: 'B1', cantidad: 30 }), rngConSemilla(3))
    const ids = new Set(banco.filter((p) => p.clases.includes('B1')).map((p) => p.id))
    expect(s.preguntas.every((p) => ids.has(p.id))).toBe(true)
  })

  it('excluye las preguntas no verificadas', () => {
    const banco = bancoDePrueba(90, (n) => ({ estado: n % 3 === 0 ? 'pendiente' : 'verificada' }))
    const noVerificadas = new Set(banco.filter((p) => p.estado !== 'verificada').map((p) => p.id))
    for (let semilla = 1; semilla <= 20; semilla++) {
      const s = crearExamen(banco, config(), rngConSemilla(semilla))
      expect(s.preguntas.some((p) => noVerificadas.has(p.id))).toBe(false)
    }
  })

  it('no completa con preguntas inválidas: si no alcanzan, falla y la modalidad queda deshabilitada', () => {
    const banco = [...bancoDePrueba(35), ...bancoDePrueba(20, (n) => ({ id: `p-${n}`, estado: 'pendiente' }))]
    expect(modalidadDisponible(banco, { clase: 'B1', cantidad: 40 })).toBe(false)
    expect(modalidadDisponible(banco, { clase: 'B1', cantidad: 30 })).toBe(true)
    expect(() => crearExamen(banco, config({ cantidad: 40 }))).toThrow(PreguntasInsuficientesError)
  })
})

describe('aleatorización de opciones', () => {
  it('mezcla las opciones conservando todas y sin duplicar', () => {
    const p = pregunta(1)
    const ordenes = new Set<string>()
    for (let semilla = 1; semilla <= 40; semilla++) {
      const orden = ordenarOpciones(p, rngConSemilla(semilla))
      expect([...orden].sort()).toEqual(['a', 'b', 'c'])
      ordenes.add(orden.join(''))
    }
    expect(ordenes.size).toBeGreaterThan(1)
  })

  it('mantiene la correspondencia con la respuesta correcta', () => {
    const banco = bancoDePrueba(60)
    const s = crearExamen(banco, config(), rngConSemilla(11))
    for (const ps of s.preguntas) {
      const p = banco.find((q) => q.id === ps.id)!
      // el id de la opción correcta sigue apuntando al mismo texto, esté en la posición que esté
      expect(ps.orden).toContain(p.respuestaCorrecta)
      expect(p.opciones.find((o) => o.id === p.respuestaCorrecta)!.texto).toMatch(/^Correcta/)
    }
  })

  it('no mezcla cuando las opciones se refieren entre sí', () => {
    const p = pregunta(1, { ordenFijo: true })
    for (let semilla = 1; semilla <= 20; semilla++) expect(ordenarOpciones(p, rngConSemilla(semilla))).toEqual(['a', 'b', 'c'])
  })

  it('mezclar no modifica el arreglo original', () => {
    const original = [1, 2, 3, 4, 5]
    mezclar(original, rngConSemilla(1))
    expect(original).toEqual([1, 2, 3, 4, 5])
  })

  it('el muestreo ponderado no repite y favorece los pesos altos', () => {
    const items = ['a', 'b', 'c', 'd']
    let conA = 0
    for (let semilla = 1; semilla <= 200; semilla++) {
      const m = muestraPonderada(items, [50, 1, 1, 1], 2, rngConSemilla(semilla))
      expect(new Set(m).size).toBe(2)
      if (m.includes('a')) conA++
    }
    expect(conA).toBeGreaterThan(180)
  })
})

describe('respuestas y navegación', () => {
  const banco = bancoDePrueba(50)
  const s0 = crearExamen(banco, config(), rngConSemilla(5), 1_000_000)

  it('registra una respuesta y permite cambiarla', () => {
    const id = s0.preguntas[0].id
    const s1 = responder(s0, id, 'b')
    expect(s1.respuestas[id]).toBe('b')
    expect(responder(s1, id, 'a').respuestas[id]).toBe('a')
    expect(s0.respuestas[id]).toBeUndefined() // inmutable
  })

  it('ignora opciones o preguntas inexistentes', () => {
    expect(responder(s0, s0.preguntas[0].id, 'zzz')).toBe(s0)
    expect(responder(s0, 'no-existe', 'a')).toBe(s0)
  })

  it('conserva las respuestas al retroceder y avanzar', () => {
    const id0 = s0.preguntas[0].id
    let s = responder(s0, id0, 'c')
    s = irA(s, 5)
    s = responder(s, s.preguntas[5].id, 'a')
    s = irA(s, 0)
    expect(s.indice).toBe(0)
    expect(s.respuestas[id0]).toBe('c')
    expect(s.respuestas[s.preguntas[5].id]).toBe('a')
  })

  it('no navega fuera de rango', () => {
    expect(irA(s0, -3).indice).toBe(0)
    expect(irA(s0, 999).indice).toBe(39)
  })

  it('informa las preguntas pendientes', () => {
    let s = s0
    for (const i of [0, 1, 2]) s = responder(s, s.preguntas[i].id, 'a')
    expect(pendientes(s)).toHaveLength(37)
    expect(pendientes(s)[0]).toBe(3)
  })
})

describe('cronómetro', () => {
  const banco = bancoDePrueba(50)
  it('calcula el tiempo restante y detecta el agotamiento', () => {
    const s = crearExamen(banco, config({ minutos: 120 }), rngConSemilla(1), 0)
    expect(segundosRestantes(s, 0)).toBe(7200)
    expect(segundosRestantes(s, 60_000)).toBe(7140)
    expect(tiempoAgotado(s, 7_199_000)).toBe(false)
    expect(tiempoAgotado(s, 7_200_000)).toBe(true)
    expect(segundosRestantes(s, 9_999_999)).toBe(0)
  })

  it('admite simulacros sin límite de tiempo', () => {
    const s = crearExamen(banco, config({ minutos: null }), rngConSemilla(1), 0)
    expect(segundosRestantes(s, 99_999_999)).toBeNull()
    expect(tiempoAgotado(s, 99_999_999)).toBe(false)
  })

  it('formatea el tiempo', () => {
    expect(formatearTiempo(0)).toBe('00:00')
    expect(formatearTiempo(75)).toBe('01:15')
    expect(formatearTiempo(7200)).toBe('2:00:00')
  })
})

describe('validez de una sesión recuperada', () => {
  const banco = bancoDePrueba(50)
  const porId = new Map(banco.map((p) => [p.id, p]))
  const s = crearExamen(banco, config(), rngConSemilla(9))

  it('acepta una sesión íntegra tras serializarla', () => {
    expect(sesionValida(JSON.parse(JSON.stringify(s)), porId)).toBe(true)
  })

  it('rechaza sesiones corruptas o con preguntas que ya no están verificadas', () => {
    expect(sesionValida(null, porId)).toBe(false)
    expect(sesionValida({ foo: 1 }, porId)).toBe(false)
    const sinUna = new Map(porId)
    sinUna.delete(s.preguntas[3].id)
    expect(sesionValida(s, sinUna)).toBe(false)
    const repetida = { ...s, preguntas: [...s.preguntas.slice(0, 39), s.preguntas[0]] }
    expect(sesionValida(repetida, porId)).toBe(false)
  })
})
