import type { Intento, MapaEstadisticas, Preferencias, SesionExamen } from '../domain/types'

/** Subconjunto de Storage que usamos: permite inyectar un almacén en memoria en pruebas. */
export interface AlmacenClaveValor {
  getItem(clave: string): string | null
  setItem(clave: string, valor: string): void
  removeItem(clave: string): void
}

export const VERSION_DATOS = 1
export const PREFIJO = 'simulador-pba:v1:'

/**
 * Claves de almacenamiento. Sin `perfilId` son las claves "globales" originales
 * (versión sin perfiles); con `perfilId` cada persona tiene las suyas.
 */
export function clavesDe(perfilId?: string | null) {
  const p = perfilId ? `${PREFIJO}p:${perfilId}:` : PREFIJO
  return {
    historial: p + 'historial',
    estadisticas: p + 'estadisticas',
    examenEnCurso: p + 'examen-en-curso',
    preferencias: p + 'preferencias',
  } as const
}
export const CLAVES = clavesDe()

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

export function almacenDelNavegador(): AlmacenClaveValor {
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
  /** Nombre de la persona a la que pertenecen los datos. */
  perfil?: string
  preferencias: Preferencias
  historial: Intento[]
  estadisticas: MapaEstadisticas
}

export class Almacen {
  private readonly claves: ReturnType<typeof clavesDe>

  constructor(
    private readonly kv: AlmacenClaveValor = almacenDelNavegador(),
    perfilId?: string | null,
  ) {
    this.claves = clavesDe(perfilId)
  }

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
    const h = this.leer<Intento[]>(this.claves.historial, [])
    return Array.isArray(h) ? h : []
  }

  /** Agrega un intento (el más reciente primero) y recorta detalle e historial antiguos. */
  guardarIntento(intento: Intento): Intento[] {
    const historial = [intento, ...this.leerHistorial().filter((i) => i.id !== intento.id)]
      .slice(0, MAX_HISTORIAL)
      .map((i, n) => (n < MAX_CON_DETALLE ? i : { ...i, detalle: [], ordenOpciones: undefined }))
    this.escribir(this.claves.historial, historial)
    return historial
  }

  leerEstadisticas(): MapaEstadisticas {
    const e = this.leer<MapaEstadisticas>(this.claves.estadisticas, {})
    return e && typeof e === 'object' && !Array.isArray(e) ? e : {}
  }

  guardarEstadisticas(mapa: MapaEstadisticas): void {
    this.escribir(this.claves.estadisticas, mapa)
  }

  leerExamenEnCurso(): SesionExamen | null {
    return this.leer<SesionExamen | null>(this.claves.examenEnCurso, null)
  }

  guardarExamenEnCurso(sesion: SesionExamen): void {
    this.escribir(this.claves.examenEnCurso, sesion)
  }

  borrarExamenEnCurso(): void {
    this.kv.removeItem(this.claves.examenEnCurso)
  }

  leerPreferencias(): Preferencias {
    return { ...PREFERENCIAS_POR_DEFECTO, ...this.leer<Partial<Preferencias>>(this.claves.preferencias, {}) }
  }

  guardarPreferencias(p: Preferencias): void {
    this.escribir(this.claves.preferencias, p)
  }

  exportar(ahora: Date = new Date(), perfil?: string): DatosExportados {
    return {
      aplicacion: 'simulador-examen-conducir-pba',
      version: VERSION_DATOS,
      exportado: ahora.toISOString(),
      ...(perfil ? { perfil } : {}),
      preferencias: this.leerPreferencias(),
      historial: this.leerHistorial(),
      estadisticas: this.leerEstadisticas(),
    }
  }

  /** Borra historial, estadísticas y examen en curso. Conserva las preferencias. */
  reiniciar(): void {
    this.kv.removeItem(this.claves.historial)
    this.kv.removeItem(this.claves.estadisticas)
    this.kv.removeItem(this.claves.examenEnCurso)
  }
}
