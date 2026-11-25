import { describe, expect, it } from 'vitest'
import { bancoDePrueba } from '../test/fabrica'
import { crearExamen, responder } from '../motor/examen'
import { rngConSemilla } from '../motor/aleatorio'
import { evaluarSesion } from '../evaluacion/evaluacion'
import { Almacen, almacenEnMemoria, CLAVES, clavesDe } from './almacen'
import { MAX_PERFILES, RegistroPerfiles, validarNombre, type Perfil } from './perfiles'

const banco = bancoDePrueba(60)
const porId = new Map(banco.map((p) => [p.id, p]))
const cfg = { cantidad: 40, clase: 'B1' as const, minutos: 120, aplicarEliminatorias: true }

function intento(semilla: number, correctas: number) {
  let s = crearExamen(banco, cfg, rngConSemilla(semilla), semilla * 1_000_000)
  s.preguntas.forEach((ps, i) => {
    s = responder(s, ps.id, i < correctas ? 'a' : 'b')
  })
  return evaluarSesion(s, porId, semilla * 1_000_000 + 600_000)
}

const perfil = (nombre: string): Perfil => ({ id: nombre, nombre, creado: '2026-11-25T10:00:00.000Z' })

describe('validación de nombres', () => {
  it('acepta nombres normales y limpia espacios', () => {
    expect(validarNombre('Lucas', [])).toBeNull()
    expect(validarNombre('  María   José ', [])).toBeNull()
  })

  it('rechaza nombres muy cortos, muy largos o vacíos', () => {
    expect(validarNombre('', [])).toMatch(/al menos 2/)
    expect(validarNombre(' a ', [])).toMatch(/al menos 2/)
    expect(validarNombre('x'.repeat(25), [])).toMatch(/hasta 24/)
  })

  it('rechaza repetidos sin distinguir mayúsculas ni acentos', () => {
    expect(validarNombre('MARÍA', [perfil('maria')])).toMatch(/Ya hay una persona/)
    expect(validarNombre('Ana', [perfil('Lucas')])).toBeNull()
  })

  it('limita la cantidad de personas', () => {
    const lleno = Array.from({ length: MAX_PERFILES }, (_, i) => perfil(`Persona ${i}`))
    expect(validarNombre('Otra', lleno)).toMatch(/hasta 8/)
  })
})

describe('registro de personas', () => {
  it('registra, lista y recuerda a la persona activa tras recargar', () => {
    const kv = almacenEnMemoria()
    const r = new RegistroPerfiles(kv)
    expect(r.listar()).toEqual([])
    expect(r.activo()).toBeNull()
    const { perfil: lucas } = r.crear('  Lucas ')
    r.activar(lucas.id)
    // "recarga": otra instancia sobre el mismo almacenamiento
    const r2 = new RegistroPerfiles(kv)
    expect(r2.listar().map((p) => p.nombre)).toEqual(['Lucas'])
    expect(r2.activo()?.id).toBe(lucas.id)
  })

  it('no permite registrar un nombre inválido o repetido', () => {
    const r = new RegistroPerfiles(almacenEnMemoria())
    r.crear('Lucas')
    expect(() => r.crear('lucas')).toThrow(/Ya hay una persona/)
    expect(() => r.crear('A')).toThrow(/al menos 2/)
    expect(r.listar()).toHaveLength(1)
  })

  it('cambiar de persona deja a nadie activo hasta elegir', () => {
    const r = new RegistroPerfiles(almacenEnMemoria())
    r.activar(r.crear('Lucas').perfil.id)
    r.activar(null)
    expect(r.activo()).toBeNull()
  })

  it('ignora una lista de personas corrupta sin romper', () => {
    const kv = almacenEnMemoria()
    kv.setItem('simulador-pba:v1:perfiles', '{no es json')
    expect(new RegistroPerfiles(kv).listar()).toEqual([])
    kv.setItem('simulador-pba:v1:perfiles', JSON.stringify([{ id: 1 }, { id: 'a', nombre: 'Ana' }, null]))
    expect(new RegistroPerfiles(kv).listar().map((p) => p.nombre)).toEqual(['Ana'])
  })
})

describe('datos separados por persona', () => {
  it('cada persona tiene su historial, estadísticas y examen en curso', () => {
    const kv = almacenEnMemoria()
    const r = new RegistroPerfiles(kv)
    const lucas = r.crear('Lucas').perfil
    const ana = r.crear('Ana').perfil
    const aLucas = new Almacen(kv, lucas.id)
    const aAna = new Almacen(kv, ana.id)

    aLucas.guardarIntento(intento(1, 35))
    aLucas.guardarExamenEnCurso(crearExamen(banco, cfg, rngConSemilla(2)))
    aLucas.guardarEstadisticas({ 't-1': { vistas: 1, aciertos: 0, errores: 1, racha: 0, ultimaVez: null, ultimoError: null, dominada: false } })

    expect(aAna.leerHistorial()).toEqual([])
    expect(aAna.leerExamenEnCurso()).toBeNull()
    expect(aAna.leerEstadisticas()).toEqual({})

    aAna.guardarIntento(intento(3, 20))
    expect(aLucas.leerHistorial()).toHaveLength(1)
    expect(aAna.leerHistorial()).toHaveLength(1)
    expect(aLucas.leerHistorial()[0].correctas).toBe(35)
    expect(aAna.leerHistorial()[0].correctas).toBe(20)
  })

  it('reiniciar el historial de una persona no toca al resto', () => {
    const kv = almacenEnMemoria()
    const r = new RegistroPerfiles(kv)
    const a = new Almacen(kv, r.crear('Lucas').perfil.id)
    const b = new Almacen(kv, r.crear('Ana').perfil.id)
    a.guardarIntento(intento(1, 30))
    b.guardarIntento(intento(2, 30))
    a.reiniciar()
    expect(a.leerHistorial()).toEqual([])
    expect(b.leerHistorial()).toHaveLength(1)
  })

  it('la exportación incluye el nombre de la persona', () => {
    const exp = new Almacen(almacenEnMemoria(), 'x').exportar(new Date('2026-11-25T10:00:00.000Z'), 'Ana')
    expect(exp.perfil).toBe('Ana')
    expect('perfil' in new Almacen(almacenEnMemoria()).exportar()).toBe(false)
  })

  it('el resumen informa simulacros, última actividad y examen pendiente', () => {
    const kv = almacenEnMemoria()
    const r = new RegistroPerfiles(kv)
    const p = r.crear('Lucas').perfil
    expect(r.resumenDe(p.id)).toEqual({ simulacros: 0, ultimaActividad: null, examenPendiente: false })
    const a = new Almacen(kv, p.id)
    const i = intento(1, 30)
    a.guardarIntento(i)
    a.guardarExamenEnCurso(crearExamen(banco, cfg, rngConSemilla(2)))
    expect(r.resumenDe(p.id)).toEqual({ simulacros: 1, ultimaActividad: i.fecha, examenPendiente: true })
  })
})

describe('migración de datos de la versión sin personas', () => {
  it('el primer perfil se queda con el progreso que ya existía en el navegador', () => {
    const kv = almacenEnMemoria()
    const viejo = new Almacen(kv) // claves globales, como antes
    viejo.guardarIntento(intento(1, 33))
    viejo.guardarExamenEnCurso(crearExamen(banco, cfg, rngConSemilla(2)))
    viejo.guardarPreferencias({ clase: 'B1', cantidad: 30, minutos: null, aplicarEliminatorias: false })

    const r = new RegistroPerfiles(kv)
    const { perfil: lucas, migrado } = r.crear('Lucas')
    expect(migrado).toBe(true)

    const nuevo = new Almacen(kv, lucas.id)
    expect(nuevo.leerHistorial()).toHaveLength(1)
    expect(nuevo.leerHistorial()[0].correctas).toBe(33)
    expect(nuevo.leerExamenEnCurso()).not.toBeNull()
    expect(nuevo.leerPreferencias().cantidad).toBe(30)
    // las claves globales se vacían: no quedan datos huérfanos ni se heredan a la segunda persona
    for (const k of Object.values(CLAVES)) expect(kv.getItem(k)).toBeNull()
    const ana = r.crear('Ana')
    expect(ana.migrado).toBe(false)
    expect(new Almacen(kv, ana.perfil.id).leerHistorial()).toEqual([])
  })

  it('sin datos previos no migra nada', () => {
    expect(new RegistroPerfiles(almacenEnMemoria()).crear('Lucas').migrado).toBe(false)
  })
})

describe('eliminar una persona', () => {
  it('borra todos sus datos, la saca de la lista y deja a nadie activo si era la activa', () => {
    const kv = almacenEnMemoria()
    const r = new RegistroPerfiles(kv)
    const lucas = r.crear('Lucas').perfil
    const ana = r.crear('Ana').perfil
    r.activar(lucas.id)
    const a = new Almacen(kv, lucas.id)
    a.guardarIntento(intento(1, 30))
    a.guardarExamenEnCurso(crearExamen(banco, cfg, rngConSemilla(2)))
    new Almacen(kv, ana.id).guardarIntento(intento(2, 30))

    r.eliminar(lucas.id)

    expect(r.listar().map((p) => p.nombre)).toEqual(['Ana'])
    expect(r.activo()).toBeNull()
    for (const k of Object.values(clavesDe(lucas.id))) expect(kv.getItem(k)).toBeNull()
    expect(new Almacen(kv, ana.id).leerHistorial()).toHaveLength(1)
  })
})
