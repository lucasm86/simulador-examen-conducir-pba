import { Almacen, almacenDelNavegador, clavesDe, PREFIJO, type AlmacenClaveValor } from './almacen'

/** Persona que usa el simulador en este dispositivo. Sin contraseña: sólo separa el progreso de cada uno. */
export interface Perfil {
  id: string
  nombre: string
  creado: string
}

export const MAX_PERFILES = 8
export const MIN_NOMBRE = 2
export const MAX_NOMBRE = 24
const CLAVE_PERFILES = PREFIJO + 'perfiles'
const CLAVE_ACTIVO = PREFIJO + 'perfil-activo'

export const normalizarNombre = (n: string) => n.replace(/\s+/g, ' ').trim()

/** Para comparar nombres sin distinguir mayúsculas ni acentos. */
const claveNombre = (n: string) =>
  normalizarNombre(n)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Devuelve el mensaje de error, o null si el nombre es válido. */
export function validarNombre(nombre: string, existentes: Perfil[]): string | null {
  const n = normalizarNombre(nombre)
  if (existentes.length >= MAX_PERFILES) return `Se pueden registrar hasta ${MAX_PERFILES} personas en este dispositivo.`
  if (n.length < MIN_NOMBRE) return `Escribí un nombre de al menos ${MIN_NOMBRE} letras.`
  if (n.length > MAX_NOMBRE) return `El nombre puede tener hasta ${MAX_NOMBRE} caracteres.`
  if (existentes.some((p) => claveNombre(p.nombre) === claveNombre(n))) {
    return 'Ya hay una persona con ese nombre. Usá otro (por ejemplo, agregando la inicial del apellido).'
  }
  return null
}

const esPerfil = (p: unknown): p is Perfil =>
  !!p && typeof p === 'object' && typeof (p as Perfil).id === 'string' && typeof (p as Perfil).nombre === 'string' && (p as Perfil).nombre.length > 0

export interface ResumenPerfil {
  simulacros: number
  /** Fecha ISO del último intento de cualquier modalidad, o null. */
  ultimaActividad: string | null
  /** Simulacro en curso sin terminar. */
  examenPendiente: boolean
}

/** Lista de personas del dispositivo y cuál está activa. Los datos de cada una viven bajo sus propias claves. */
export class RegistroPerfiles {
  constructor(private readonly kv: AlmacenClaveValor = almacenDelNavegador()) {}

  listar(): Perfil[] {
    try {
      const crudo = this.kv.getItem(CLAVE_PERFILES)
      const lista = crudo ? JSON.parse(crudo) : []
      return Array.isArray(lista) ? lista.filter(esPerfil) : []
    } catch {
      return []
    }
  }

  private guardar(lista: Perfil[]): void {
    try {
      this.kv.setItem(CLAVE_PERFILES, JSON.stringify(lista))
    } catch {
      /* cuota excedida: la lista en memoria de la sesión sigue siendo válida */
    }
  }

  activo(): Perfil | null {
    const id = this.kv.getItem(CLAVE_ACTIVO)
    return (id && this.listar().find((p) => p.id === id)) || null
  }

  activar(id: string | null): void {
    if (id) this.kv.setItem(CLAVE_ACTIVO, id)
    else this.kv.removeItem(CLAVE_ACTIVO)
  }

  /**
   * Registra una persona. Si es la primera y ya había datos de la versión sin perfiles
   * (guardados en este navegador), pasan a ser de esa persona: no se pierde nada.
   */
  crear(nombre: string): { perfil: Perfil; migrado: boolean } {
    const lista = this.listar()
    const error = validarNombre(nombre, lista)
    if (error) throw new Error(error)
    const perfil: Perfil = {
      id: `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
      nombre: normalizarNombre(nombre),
      creado: new Date().toISOString(),
    }
    let migrado = false
    if (lista.length === 0) {
      const viejas = clavesDe()
      const nuevas = clavesDe(perfil.id)
      for (const k of Object.keys(viejas) as (keyof typeof viejas)[]) {
        const valor = this.kv.getItem(viejas[k])
        if (valor != null) {
          this.kv.setItem(nuevas[k], valor)
          this.kv.removeItem(viejas[k])
          migrado = true
        }
      }
    }
    this.guardar([...lista, perfil])
    return { perfil, migrado }
  }

  /** Elimina a la persona y todos sus datos. */
  eliminar(id: string): void {
    for (const clave of Object.values(clavesDe(id))) this.kv.removeItem(clave)
    this.guardar(this.listar().filter((p) => p.id !== id))
    if (this.kv.getItem(CLAVE_ACTIVO) === id) this.kv.removeItem(CLAVE_ACTIVO)
  }

  resumenDe(id: string): ResumenPerfil {
    const a = new Almacen(this.kv, id)
    const historial = a.leerHistorial()
    return {
      simulacros: historial.filter((i) => i.modalidad === 'simulacro').length,
      ultimaActividad: historial[0]?.fecha ?? null,
      examenPendiente: a.leerExamenEnCurso() != null,
    }
  }
}
