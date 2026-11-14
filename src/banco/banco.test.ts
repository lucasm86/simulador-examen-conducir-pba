import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Pregunta } from '../domain/types'
import { bancoDePrueba, pregunta } from '../test/fabrica'
import { crearBanco, filtrarPreguntas, obtenerBanco } from './banco'
import { validarBanco } from './validador'
import oficial from '../data/banco/oficial.json'

const codigos = (ps: Pregunta[], img?: Set<string>) => validarBanco(ps, img).hallazgos.map((h) => h.codigo)

describe('validador del banco', () => {
  it('acepta un banco correcto', () => {
    const r = validarBanco(bancoDePrueba(5))
    expect(r.errores).toBe(0)
    expect(r.aptas).toHaveLength(5)
  })

  it('detecta IDs duplicados', () => {
    expect(codigos([pregunta(1), pregunta(1, { enunciado: 'Otro enunciado distinto' })])).toContain('id-duplicado')
  })

  it('detecta opciones vacías', () => {
    const p = pregunta(1)
    p.opciones[1] = { id: 'b', texto: '   ' }
    expect(codigos([p])).toContain('opcion-vacia')
  })

  it('detecta respuestas correctas inexistentes', () => {
    expect(codigos([pregunta(1, { respuestaCorrecta: 'z' })])).toContain('respuesta-inexistente')
  })

  it('detecta preguntas sin fuente', () => {
    const p = pregunta(1, { fuente: { documento: '', pagina: 0, numeroOriginal: null, seccion: '' } })
    expect(codigos([p])).toContain('sin-fuente')
  })

  it('detecta preguntas incompletas', () => {
    expect(codigos([pregunta(1, { enunciado: '' })])).toContain('incompleta')
    expect(codigos([pregunta(1, { explicacion: '' })])).toContain('incompleta')
    expect(codigos([pregunta(1, { opciones: [{ id: 'a', texto: 'Única' }] })])).toContain('pocas-opciones')
  })

  it('detecta recursos gráficos faltantes', () => {
    const p = pregunta(1, { imagen: { src: 'img/no-existe.jpg', alt: 'Una señal' } })
    expect(codigos([p], new Set(['img/otra.jpg']))).toContain('imagen-faltante')
    expect(codigos([p], new Set(['img/no-existe.jpg']))).not.toContain('imagen-faltante')
    expect(codigos([pregunta(2, { imagen: { src: 'img/x.jpg', alt: '' } })])).toContain('imagen-faltante')
  })

  it('advierte sobre preguntas sin verificar y las deja fuera de las aptas', () => {
    const r = validarBanco([pregunta(1), pregunta(2, { estado: 'pendiente' }), pregunta(3, { estado: 'excluida' })])
    expect(r.hallazgos.filter((h) => h.codigo === 'sin-verificar')).toHaveLength(2)
    expect(r.aptas.map((p) => p.id)).toEqual(['t-1'])
  })

  it('detecta contenido posiblemente duplicado', () => {
    const a = pregunta(1)
    const b = { ...pregunta(1), id: 't-otra', enunciado: 'PREGUNTA de prueba, número 1.' }
    expect(codigos([a, b])).toContain('posible-duplicado')
  })

  it('no admite eliminatorias que no sean oficiales', () => {
    expect(codigos([pregunta(1, { eliminatoria: true, origen: 'complementaria' })])).toContain('eliminatoria-no-oficial')
  })

  it('una pregunta con errores nunca es apta aunque diga estar verificada', () => {
    const r = validarBanco([pregunta(1, { respuestaCorrecta: 'z' }), pregunta(2)])
    expect(r.aptas.map((p) => p.id)).toEqual(['t-2'])
  })
})

describe('crearBanco y filtros', () => {
  it('sólo expone preguntas verificadas', () => {
    const b = crearBanco([pregunta(1), pregunta(2, { estado: 'pendiente' })], [{ id: 'senales', nombre: 'Señales' }])
    expect(b.preguntas.map((p) => p.id)).toEqual(['t-1'])
    expect(b.porId.has('t-2')).toBe(false)
    expect(b.categorias).toEqual([{ id: 'senales', nombre: 'Señales', preguntas: 1 }])
  })

  it('filtra por clase y por categoría', () => {
    const ps = [
      pregunta(1, { clases: ['B1', 'B2'], categoria: 'senales' }),
      pregunta(2, { clases: ['A'], categoria: 'senales' }),
      pregunta(3, { clases: ['B1'], categoria: 'prioridades' }),
    ]
    expect(filtrarPreguntas(ps, { clase: 'B1' }).map((p) => p.id)).toEqual(['t-1', 't-3'])
    expect(filtrarPreguntas(ps, { clase: 'A' }).map((p) => p.id)).toEqual(['t-2'])
    expect(filtrarPreguntas(ps, { clase: 'B1', categorias: ['prioridades'] }).map((p) => p.id)).toEqual(['t-3'])
  })

  it('excluye las complementarias salvo que se pidan', () => {
    const ps = [pregunta(1), pregunta(2, { origen: 'complementaria' })]
    expect(filtrarPreguntas(ps)).toHaveLength(1)
    expect(filtrarPreguntas(ps, { incluirComplementarias: true })).toHaveLength(2)
  })
})

describe('banco real incorporado', () => {
  const banco = obtenerBanco()

  it('no tiene errores de validación', () => {
    const errores = banco.informe.hallazgos.filter((h) => h.severidad === 'error')
    expect(errores).toEqual([])
    expect(banco.informe.hallazgos.filter((h) => h.codigo === 'posible-duplicado')).toEqual([])
  })

  it('todas las preguntas del archivo oficial entran al motor (todas verificadas)', () => {
    expect(banco.preguntas.length).toBe((oficial as unknown[]).length)
    expect(banco.preguntas.every((p) => p.estado === 'verificada' && p.origen === 'oficial')).toBe(true)
  })

  it('alcanza para un simulacro completo de clase B1', () => {
    expect(filtrarPreguntas(banco.preguntas, { clase: 'B1' }).length).toBeGreaterThanOrEqual(40)
  })

  it('cada pregunta conserva documento y página de origen', () => {
    expect(banco.preguntas.every((p) => p.fuente.documento.length > 10 && p.fuente.pagina >= 2 && p.fuente.pagina <= 228)).toBe(true)
  })

  it('las imágenes referenciadas existen en public/', () => {
    const faltantes = banco.preguntas
      .filter((p) => p.imagen)
      .filter((p) => !existsSync(resolve(process.cwd(), 'public', p.imagen!.src)))
      .map((p) => p.id)
    expect(faltantes).toEqual([])
  })

  it('ninguna pregunta excluida o pendiente está en el banco activo', () => {
    const activos = new Set(banco.preguntas.map((p) => p.id))
    expect(banco.excluidas.length).toBeGreaterThan(0)
    expect(banco.excluidas.filter((e) => activos.has(e.id))).toEqual([])
  })

  it('las eliminatorias son sólo las marcadas en el documento oficial', () => {
    const elim = banco.preguntas.filter((p) => p.eliminatoria)
    expect(elim.length).toBe(banco.meta.totales.eliminatorias)
    expect(elim.every((p) => p.origen === 'oficial')).toBe(true)
  })
})
