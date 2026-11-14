import type { Pregunta } from '../domain/types'

export type Severidad = 'error' | 'advertencia'

export interface Hallazgo {
  severidad: Severidad
  codigo:
    | 'id-duplicado'
    | 'opcion-vacia'
    | 'opcion-repetida'
    | 'pocas-opciones'
    | 'respuesta-inexistente'
    | 'sin-fuente'
    | 'incompleta'
    | 'imagen-faltante'
    | 'sin-verificar'
    | 'posible-duplicado'
    | 'eliminatoria-no-oficial'
    | 'sin-clase'
  id: string
  mensaje: string
}

export interface InformeValidacion {
  hallazgos: Hallazgo[]
  errores: number
  advertencias: number
  /** Preguntas que pueden entrar al motor de evaluación. */
  aptas: Pregunta[]
}

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Valida un banco de preguntas. No lanza: devuelve un informe.
 * `imagenesDisponibles` (opcional) permite detectar recursos gráficos faltantes.
 * Una pregunta con algún hallazgo de severidad "error", o que no esté verificada,
 * nunca forma parte de `aptas`.
 */
export function validarBanco(preguntas: Pregunta[], imagenesDisponibles?: ReadonlySet<string>): InformeValidacion {
  const hallazgos: Hallazgo[] = []
  const conError = new Set<string>()
  const add = (severidad: Severidad, codigo: Hallazgo['codigo'], id: string, mensaje: string) => {
    hallazgos.push({ severidad, codigo, id, mensaje })
    if (severidad === 'error') conError.add(id)
  }

  const idsVistos = new Map<string, number>()
  const contenidoVisto = new Map<string, string>()

  preguntas.forEach((p, n) => {
    const id = p.id || `#${n}`
    if (!p.id) add('error', 'incompleta', id, 'La pregunta no tiene ID.')
    if (idsVistos.has(p.id)) add('error', 'id-duplicado', id, `ID duplicado (posiciones ${idsVistos.get(p.id)} y ${n}).`)
    idsVistos.set(p.id, n)

    if (!p.enunciado || p.enunciado.trim().length < 10) add('error', 'incompleta', id, 'Enunciado vacío o demasiado corto.')
    if (!p.categoria || !p.subcategoria) add('error', 'incompleta', id, 'Falta la categoría o la subcategoría.')
    if (!p.explicacion || !p.explicacion.trim()) add('error', 'incompleta', id, 'Falta la explicación.')
    if (!p.fechaRevision) add('error', 'incompleta', id, 'Falta la fecha de revisión normativa.')

    const opciones = p.opciones ?? []
    if (opciones.length < 2) add('error', 'pocas-opciones', id, 'Debe tener al menos dos opciones.')
    if (opciones.some((o) => !o.id || !o.texto || !o.texto.trim())) add('error', 'opcion-vacia', id, 'Hay opciones vacías.')
    const idsOpc = opciones.map((o) => o.id)
    if (new Set(idsOpc).size !== idsOpc.length) add('error', 'opcion-repetida', id, 'Hay IDs de opción repetidos.')
    const textos = opciones.map((o) => normalizar(o.texto ?? ''))
    if (new Set(textos).size !== textos.length) add('error', 'opcion-repetida', id, 'Hay opciones con el mismo texto.')
    if (!idsOpc.includes(p.respuestaCorrecta)) add('error', 'respuesta-inexistente', id, 'La respuesta correcta no existe entre las opciones.')

    if (!p.fuente || !p.fuente.documento || !Number.isFinite(p.fuente.pagina) || p.fuente.pagina < 1) {
      add('error', 'sin-fuente', id, 'Falta la fuente documental o la página de origen.')
    }
    if (!p.clases || p.clases.length === 0) add('error', 'sin-clase', id, 'No indica clases de licencia aplicables.')
    if (p.imagen) {
      if (!p.imagen.src || !p.imagen.alt) add('error', 'imagen-faltante', id, 'La imagen no tiene ruta o texto alternativo.')
      else if (imagenesDisponibles && !imagenesDisponibles.has(p.imagen.src)) {
        add('error', 'imagen-faltante', id, `No se encuentra el recurso gráfico ${p.imagen.src}.`)
      }
    }
    if (p.estado !== 'verificada') add('advertencia', 'sin-verificar', id, `Estado «${p.estado}»: queda fuera del motor de evaluación.`)
    if (p.eliminatoria && p.origen !== 'oficial') {
      add('error', 'eliminatoria-no-oficial', id, 'Sólo las preguntas oficiales pueden ser eliminatorias.')
    }

    const clave = `${normalizar(p.enunciado ?? '')}|${[...textos].sort().join('|')}|${p.imagen?.src ?? ''}`
    const previo = contenidoVisto.get(clave)
    if (previo) add('advertencia', 'posible-duplicado', id, `Contenido posiblemente duplicado de ${previo}.`)
    else contenidoVisto.set(clave, id)
  })

  const aptas = preguntas.filter((p) => p.estado === 'verificada' && !conError.has(p.id))
  return {
    hallazgos,
    errores: hallazgos.filter((h) => h.severidad === 'error').length,
    advertencias: hallazgos.filter((h) => h.severidad === 'advertencia').length,
    aptas,
  }
}
