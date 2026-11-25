import { describe, expect, it, vi } from 'vitest'
import { cargarEstado, evaluarVigencia, leerEstado, type EstadoFuentes } from './vigencia'

const ahora = new Date('2026-11-25T12:00:00Z')
const estado = (resultado: EstadoFuentes['resultado'], revisado = '2026-11-24T09:00:00Z'): EstadoFuentes => ({ revisado, resultado, documentos: [] })

describe('evaluarVigencia', () => {
  it('sin avisos cuando las fuentes no cambiaron y la revisión es reciente', () => {
    const v = evaluarVigencia('2026-11-14', estado('sin-cambios'), ahora)
    expect(v.aviso).toBeNull()
    expect(v.comprobadoEl).toBe('2026-11-24')
  })

  it('avisa cuando las fuentes oficiales cambiaron', () => {
    expect(evaluarVigencia('2026-11-14', estado('cambio'), ahora).aviso).toBe('cambio')
  })

  it('el aviso de cambio tiene prioridad sobre el de revisión vieja', () => {
    expect(evaluarVigencia('2025-01-01', estado('cambio'), ahora).aviso).toBe('cambio')
  })

  it('avisa si la última revisión del banco tiene más de 90 días, aun sin cambios', () => {
    const v = evaluarVigencia('2026-07-01', estado('sin-cambios'), ahora)
    expect(v.aviso).toBe('revision')
    expect(v.diasDesdeRevision).toBeGreaterThan(90)
  })

  it('90 días justos todavía no avisa', () => {
    expect(evaluarVigencia('2026-08-27', null, ahora).aviso).toBeNull()
  })

  it('sin conexión (estado null) no inventa avisos ni confirma nada', () => {
    expect(evaluarVigencia('2026-11-14', null, ahora)).toMatchObject({ aviso: null, comprobadoEl: null })
  })

  it('una comprobación vieja (más de 21 días) no se toma como garantía ni como alarma', () => {
    expect(evaluarVigencia('2026-11-14', estado('cambio', '2026-10-01T09:00:00Z'), ahora)).toMatchObject({ aviso: null, comprobadoEl: null })
    expect(evaluarVigencia('2026-11-14', estado('sin-cambios', '2026-10-01T09:00:00Z'), ahora).comprobadoEl).toBeNull()
  })

  it('"no se pudo verificar" no es un cambio', () => {
    expect(evaluarVigencia('2026-11-14', estado('no-verificable'), ahora)).toMatchObject({ aviso: null, comprobadoEl: null })
  })
})

describe('leerEstado', () => {
  it('acepta el formato publicado y descarta lo raro', () => {
    expect(leerEstado({ revisado: '2026-11-25T21:54:33Z', resultado: 'sin-cambios', documentos: [{ documento: 'a.pdf', estado: 'sin-cambios' }, 5] })).toEqual({
      revisado: '2026-11-25T21:54:33Z',
      resultado: 'sin-cambios',
      documentos: [{ documento: 'a.pdf', estado: 'sin-cambios' }],
    })
    for (const malo of [null, 'x', 3, {}, { revisado: 'ayer', resultado: 'cambio' }, { revisado: '2026-11-25T00:00:00Z', resultado: 'otra-cosa' }]) {
      expect(leerEstado(malo)).toBeNull()
    }
  })
})

describe('cargarEstado', () => {
  const conFetch = (impl: unknown) => vi.stubGlobal('fetch', impl)

  it('devuelve el estado si la respuesta es válida', async () => {
    conFetch(async () => new Response(JSON.stringify({ revisado: '2026-11-25T00:00:00Z', resultado: 'cambio', documentos: [] })))
    expect((await cargarEstado('x'))?.resultado).toBe('cambio')
  })

  it('devuelve null ante error de red, 404 o JSON inválido, sin lanzar', async () => {
    conFetch(async () => {
      throw new Error('sin red')
    })
    expect(await cargarEstado('x')).toBeNull()
    conFetch(async () => new Response('nada', { status: 404 }))
    expect(await cargarEstado('x')).toBeNull()
    conFetch(async () => new Response('no es json'))
    expect(await cargarEstado('x')).toBeNull()
  })

  it('devuelve null si la red no responde a tiempo', async () => {
    conFetch((_u: string, init: RequestInit) => new Promise((_ok, no) => init.signal!.addEventListener('abort', () => no(new Error('abortado')))))
    expect(await cargarEstado('x', 20)).toBeNull()
  })
})
