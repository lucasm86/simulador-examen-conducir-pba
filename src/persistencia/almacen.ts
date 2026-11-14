import type { Intento, MapaEstadisticas, Preferencias, SesionExamen } from '../domain/types'

/** Subconjunto de Storage que usamos: permite inyectar un almacén en memoria en pruebas. */
export interface AlmacenClaveValor {
  getItem(clave: string): string | null
  setItem(clave: string, valor: string): void
  removeItem(clave: string): void
}

export const VERSION_DATOS = 1
const PREFIJO = 'simulador-pba:v1:'
export const CLAVES = {
  historial: PREFIJO + 'historial',
  estadisticas: PREFIJO + 'estadisticas',
  examenEnCurso: PREFIJO + 'examen-en-curso',
  preferencias: PREFIJO + 'preferencias',
} as const

/** Máximo de intentos que conservan el detalle pregunta por pregunta (para no crecer sin límite). */
export const MAX_CON_DETALLE = 30
export const MAX_HISTORIAL = 300

export const PREFERENCIAS_POR_DEFECTO: Preferencias = {
  clase: 'B1',
  cantidad: 40,
  minutos: 120,
  aplicarEliminatorias: true,
}

export function almacenEnMemoria(): AlmacenClaveValor {
  const m = new Map<string, string>()
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  }
}

function almacenDelNavegador(): AlmacenClaveValor {
  try {
    const ls = globalThis.localStorage
    const prueba = PREFIJO + 'prueba'
    ls.setItem(prueba, '1')
    ls.removeItem(prueba)
    return ls
  } catch {
    // Modo privado estricto o almacenamiento bloqueado: la app sigue funcionando sin persistir.
    return almacenEnMemoria()
  }
}

export interface DatosExportados {
  aplicacion: 'simulador-examen-conducir-pba'
  version: number
  exportado: string
  preferencias: Preferencias
  historial: Intento[]
  estadisticas: MapaEstadisticas
}

export class Almacen {
  constructor(private readonly kv: AlmacenClaveValor = almacenDelNavegador()) {}

  private leer<T>(clave: string, porDefecto: T): T {
    try {
      const crudo = this.kv.getItem(clave)
      return crudo == null ? porDefecto : (JSON.parse(crudo) as T)
    } catch {
      return porDefecto // dato corrupto: se ignora en lugar de romper la app
    }
  }

  private escribir(clave: string, valor: unknown): boolean {
    try {
      this.kv.setItem(clave, JSON.stringify(valor))
      return true
    } catch {
      return false // cuota excedida
    }
  }

  leerHistorial(): Intento[] {
    const h = this.leer<Intento[]>(CLAVES.historial, [])
    return Array.isArray(h) ? h : []
  }

  /** Agrega un intento (el más reciente primero) y recorta detalle e historial antiguos. */
  guardarIntento(intento: Intento): Intento[] {
    const historial = [intento, ...this.leerHistorial().filter((i) => i.id !== intento.id)]
      .slice(0, MAX_HISTORIAL)
      .map((i, n) => (n < MAX_CON_DETALLE ? i : { ...i, detalle: [], ordenOpciones: undefined }))
    this.escribir(CLAVES.historial, historial)
    return historial
  }

  leerEstadisticas(): MapaEstadisticas {
    const e = this.leer<MapaEstadisticas>(CLAVES.estadisticas, {})
    return e && typeof e === 'object' && !Array.isArray(e) ? e : {}
  }

  guardarEstadisticas(mapa: MapaEstadisticas): void {
    this.escribir(CLAVES.estadisticas, mapa)
  }

  leerExamenEnCurso(): SesionExamen | null {
    return this.leer<SesionExamen | null>(CLAVES.examenEnCurso, null)
  }

  guardarExamenEnCurso(sesion: SesionExamen): void {
    this.escribir(CLAVES.examenEnCurso, sesion)
  }

  borrarExamenEnCurso(): void {
    this.kv.removeItem(CLAVES.examenEnCurso)
  }

  leerPreferencias(): Preferencias {
    return { ...PREFERENCIAS_POR_DEFECTO, ...this.leer<Partial<Preferencias>>(CLAVES.preferencias, {}) }
  }

  guardarPreferencias(p: Preferencias): void {
    this.escribir(CLAVES.preferencias, p)
  }

  exportar(ahora: Date = new Date()): DatosExportados {
    return {
      aplicacion: 'simulador-examen-conducir-pba',
      version: VERSION_DATOS,
      exportado: ahora.toISOString(),
      preferencias: this.leerPreferencias(),
      historial: this.leerHistorial(),
      estadisticas: this.leerEstadisticas(),
    }
  }

  /** Borra historial, estadísticas y examen en curso. Conserva las preferencias. */
  reiniciar(): void {
    this.kv.removeItem(CLAVES.historial)
    this.kv.removeItem(CLAVES.estadisticas)
    this.kv.removeItem(CLAVES.examenEnCurso)
  }
}
