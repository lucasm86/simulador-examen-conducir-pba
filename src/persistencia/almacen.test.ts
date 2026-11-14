import { describe, expect, it } from 'vitest'
import { bancoDePrueba } from '../test/fabrica'
import { crearExamen, irA, responder, sesionValida } from '../motor/examen'
import { rngConSemilla } from '../motor/aleatorio'
import { evaluarSesion } from '../evaluacion/evaluacion'
import { registrarResultados } from '../repaso/repaso'
import { Almacen, almacenEnMemoria, CLAVES, MAX_CON_DETALLE, PREFERENCIAS_POR_DEFECTO } from './almacen'

const banco = bancoDePrueba(80)
const porId = new Map(banco.map((p) => [p.id, p]))
const cfg = { cantidad: 40, clase: 'B1' as const, minutos: 120, aplicarEliminatorias: true }

function intento(semilla: number, correctas: number, ahora = semilla * 1_000_000) {
  let s = crearExamen(banco, cfg, rngConSemilla(semilla), ahora - 600_000)
  s.preguntas.forEach((ps, i) => {
    s = responder(s, ps.id, i < correctas ? 'a' : 'b')
  })
  return evaluarSesion(s, porId, ahora)
}

describe('guardado y recuperación de resultados', () => {
  it('persiste un resultado y lo recupera con otra instancia (simula recargar la página)', () => {
    const kv = almacenEnMemoria()
    const r = intento(1, 34)
    new Almacen(kv).guardarIntento(r)
    const recuperado = new Almacen(kv).leerHistorial()
    expect(recuperado).toHaveLength(1)
    expect(recuperado[0]).toEqual(JSON.parse(JSON.stringify(r)))
    expect(recuperado[0]).toMatchObject({ correctas: 34, porcentaje: 85, aprobado: true })
  })

  it('funciona sobre localStorage real', () => {
    new Almacen().guardarIntento(intento(2, 20))
    expect(localStorage.getItem(CLAVES.historial)).toContain('"correctas":20')
    expect(new Almacen().leerHistorial()[0].aprobado).toBe(false)
  })

  it('guarda el más reciente primero y no duplica un mismo intento', () => {
    const a = new Almacen(almacenEnMemoria())
    const r1 = intento(1, 30)
    const r2 = intento(2, 35)
    a.guardarIntento(r1)
    a.guardarIntento(r2)
    a.guardarIntento(r2)
    expect(a.leerHistorial().map((i) => i.id)).toEqual([r2.id, r1.id])
  })

  it('recorta el detalle de los intentos antiguos pero conserva sus totales', () => {
    const a = new Almacen(almacenEnMemoria())
    for (let i = 1; i <= MAX_CON_DETALLE + 3; i++) a.guardarIntento(intento(i, 30))
    const h = a.leerHistorial()
    expect(h).toHaveLength(MAX_CON_DETALLE + 3)
    expect(h[0].detalle).toHaveLength(40)
    expect(h[MAX_CON_DETALLE].detalle).toHaveLength(0)
    expect(h[MAX_CON_DETALLE].correctas).toBe(30)
  })

  it('persiste las estadísticas por pregunta', () => {
    const kv = almacenEnMemoria()
    const r = intento(3, 10)
    new Almacen(kv).guardarEstadisticas(registrarResultados({}, r.detalle, r.fecha))
    const e = new Almacen(kv).leerEstadisticas()
    expect(Object.keys(e)).toHaveLength(40)
    expect(Object.values(e).filter((x) => x.errores === 1)).toHaveLength(30)
  })

  it('tolera datos corruptos sin romper', () => {
    const kv = almacenEnMemoria()
    kv.setItem(CLAVES.historial, '{esto no es json')
    kv.setItem(CLAVES.estadisticas, '[1,2,3]')
    kv.setItem(CLAVES.examenEnCurso, 'null')
    const a = new Almacen(kv)
    expect(a.leerHistorial()).toEqual([])
    expect(a.leerEstadisticas()).toEqual({})
    expect(a.leerExamenEnCurso()).toBeNull()
    expect(a.leerPreferencias()).toEqual(PREFERENCIAS_POR_DEFECTO)
  })
})

describe('persistencia de exámenes interrumpidos', () => {
  it('recupera el examen en curso con sus respuestas, posición y hora de inicio', () => {
    const kv = almacenEnMemoria()
    let s = crearExamen(banco, cfg, rngConSemilla(8), 5_000)
    s = responder(s, s.preguntas[0].id, 'b')
    s = responder(s, s.preguntas[1].id, 'a')
    s = irA(s, 12)
    new Almacen(kv).guardarExamenEnCurso(s)

    const recuperada = new Almacen(kv).leerExamenEnCurso()
    expect(recuperada).toEqual(s)
    expect(sesionValida(recuperada, porId)).toBe(true)
    expect(recuperada!.indice).toBe(12)
    expect(recuperada!.respuestas).toEqual({ [s.preguntas[0].id]: 'b', [s.preguntas[1].id]: 'a' })
    expect(recuperada!.inicioMs).toBe(5_000) // el cronómetro sigue desde el inicio original
  })

  it('el examen recuperado se puede terminar y evaluar', () => {
    const kv = almacenEnMemoria()
    let s = crearExamen(banco, cfg, rngConSemilla(8), 0)
    for (let i = 0; i < 20; i++) s = responder(s, s.preguntas[i].id, 'a')
    new Almacen(kv).guardarExamenEnCurso(s)
    let r = new Almacen(kv).leerExamenEnCurso()!
    for (let i = 20; i < 40; i++) r = responder(r, r.preguntas[i].id, 'a')
    expect(evaluarSesion(r, porId, 60_000)).toMatchObject({ correctas: 40, aprobado: true })
  })

  it('se borra al finalizar', () => {
    const a = new Almacen(almacenEnMemoria())
    a.guardarExamenEnCurso(crearExamen(banco, cfg, rngConSemilla(8)))
    a.borrarExamenEnCurso()
    expect(a.leerExamenEnCurso()).toBeNull()
  })
})

describe('preferencias, exportación y reinicio', () => {
  it('guarda y recupera preferencias, completando las que falten', () => {
    const kv = almacenEnMemoria()
    new Almacen(kv).guardarPreferencias({ clase: 'B1', cantidad: 30, minutos: null, aplicarEliminatorias: false })
    expect(new Almacen(kv).leerPreferencias()).toEqual({ clase: 'B1', cantidad: 30, minutos: null, aplicarEliminatorias: false })
    kv.setItem(CLAVES.preferencias, '{"cantidad":30}')
    expect(new Almacen(kv).leerPreferencias()).toEqual({ ...PREFERENCIAS_POR_DEFECTO, cantidad: 30 })
  })

  it('exporta todo el historial a un objeto JSON serializable', () => {
    const a = new Almacen(almacenEnMemoria())
    const r = intento(1, 33)
    a.guardarIntento(r)
    a.guardarEstadisticas(registrarResultados({}, r.detalle, r.fecha))
    const exp = a.exportar(new Date('2026-11-14T15:00:00.000Z'))
    const ida = JSON.parse(JSON.stringify(exp))
    expect(ida).toMatchObject({ aplicacion: 'simulador-examen-conducir-pba', version: 1, exportado: '2026-11-14T15:00:00.000Z' })
    expect(ida.historial).toHaveLength(1)
    expect(Object.keys(ida.estadisticas)).toHaveLength(40)
  })

  it('reiniciar borra historial, estadísticas y examen en curso, y conserva preferencias', () => {
    const a = new Almacen(almacenEnMemoria())
    const r = intento(1, 33)
    a.guardarIntento(r)
    a.guardarEstadisticas(registrarResultados({}, r.detalle, r.fecha))
    a.guardarExamenEnCurso(crearExamen(banco, cfg, rngConSemilla(8)))
    a.guardarPreferencias({ ...PREFERENCIAS_POR_DEFECTO, cantidad: 30 })
    a.reiniciar()
    expect(a.leerHistorial()).toEqual([])
    expect(a.leerEstadisticas()).toEqual({})
    expect(a.leerExamenEnCurso()).toBeNull()
    expect(a.leerPreferencias().cantidad).toBe(30)
  })
})
