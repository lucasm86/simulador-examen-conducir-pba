/** Tipos del dominio. Pensados para mapearse 1:1 a tablas de una futura base de datos. */

export type ClaseLicencia = 'A' | 'B1' | 'B2' | 'C' | 'D' | 'E' | 'G'

export type CategoriaId =
  | 'senales'
  | 'prioridades'
  | 'velocidades'
  | 'semaforos'
  | 'estacionamiento'
  | 'adelantamiento'
  | 'conduccion'
  | 'alcohol'
  | 'documentacion'
  | 'vehiculo'
  | 'siniestros'
  | 'convivencia'
  | 'normativa'
  | 'luces'
  | 'autopistas'

export type TipoPregunta = 'opcion-multiple' | 'verdadero-falso'
export type EstadoVerificacion = 'verificada' | 'pendiente' | 'excluida'
export type OrigenPregunta = 'oficial' | 'complementaria'
export type Dificultad = 'baja' | 'media' | 'alta'

export interface Opcion {
  id: string
  texto: string
}

export interface ImagenPregunta {
  src: string
  alt: string
}

export interface FuentePregunta {
  documento: string
  pagina: number
  numeroOriginal: number | null
  seccion: string
}

export interface Pregunta {
  id: string
  enunciado: string
  opciones: Opcion[]
  respuestaCorrecta: string
  explicacion: string
  categoria: CategoriaId
  subcategoria: string
  clases: ClaseLicencia[]
  /** null = sin clasificar: el documento oficial no gradúa dificultad. */
  dificultad: Dificultad | null
  imagen: ImagenPregunta | null
  tipo: TipoPregunta
  /** true si las opciones aluden unas a otras ("A y B son correctas") y no pueden mezclarse. */
  ordenFijo: boolean
  fuente: FuentePregunta
  referenciaNormativa: string | null
  referenciaManual: string | null
  fechaRevision: string
  estado: EstadoVerificacion
  /** 'norma': contrastada con texto legal citado. 'clave-oficial': sólo clave del cuestionario, sin conflicto detectado. */
  nivelVerificacion: 'norma' | 'clave-oficial'
  /** Sólo true si el documento oficial la marca como "de carácter eliminatorio". */
  eliminatoria: boolean
  origen: OrigenPregunta
}

export interface Categoria {
  id: CategoriaId
  nombre: string
  preguntas: number
}

export type Modalidad = 'simulacro' | 'estudio' | 'repaso' | 'inteligente'

export interface ConfigExamen {
  cantidad: number
  clase: ClaseLicencia
  /** Minutos disponibles; null = sin límite. */
  minutos: number | null
  aplicarEliminatorias: boolean
}

export interface PreguntaEnSesion {
  id: string
  /** Orden en que se muestran las opciones (ids). */
  orden: string[]
}

/** Simulacro en curso. Se persiste completo para sobrevivir a una recarga. */
export interface SesionExamen {
  id: string
  config: ConfigExamen
  preguntas: PreguntaEnSesion[]
  /** id de pregunta -> id de opción elegida */
  respuestas: Record<string, string>
  indice: number
  inicioMs: number
}

export interface ResultadoPregunta {
  id: string
  elegida: string | null
  correcta: string
  acierto: boolean
}

export interface DesempenoCategoria {
  total: number
  correctas: number
}

/** Registro del historial (un simulacro o una sesión de estudio terminada). */
export interface Intento {
  id: string
  fecha: string
  modalidad: Modalidad
  clase: ClaseLicencia
  duracionSeg: number
  total: number
  respondidas: number
  correctas: number
  incorrectas: number
  sinResponder: number
  porcentaje: number
  /** null en modalidades sin criterio de aprobación (estudio, repaso). */
  aprobado: boolean | null
  eliminatoriasEvaluadas: number
  eliminatoriasFalladas: number
  aplicoEliminatorias: boolean
  porCategoria: Partial<Record<CategoriaId, DesempenoCategoria>>
  detalle: ResultadoPregunta[]
  /** Orden de opciones usado, para poder revisar el examen tal como se vio. */
  ordenOpciones?: Record<string, string[]>
  motivoCierre?: 'usuario' | 'tiempo'
}

export interface EstadisticaPregunta {
  vistas: number
  aciertos: number
  errores: number
  /** Aciertos consecutivos desde el último error. */
  racha: number
  ultimaVez: string | null
  ultimoError: string | null
  /** Marcada manualmente como dominada por el estudiante. */
  dominada: boolean
}

export type MapaEstadisticas = Record<string, EstadisticaPregunta>

export interface Preferencias {
  clase: ClaseLicencia
  cantidad: 30 | 40
  minutos: number | null
  aplicarEliminatorias: boolean
}
