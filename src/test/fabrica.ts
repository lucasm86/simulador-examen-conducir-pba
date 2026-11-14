import type { CategoriaId, Pregunta } from '../domain/types'

/** Crea una pregunta válida de prueba. La opción correcta es siempre "a". */
export function pregunta(n: number, cambios: Partial<Pregunta> = {}): Pregunta {
  return {
    id: `t-${n}`,
    enunciado: `Pregunta de prueba número ${n}`,
    opciones: [
      { id: 'a', texto: `Correcta ${n}` },
      { id: 'b', texto: `Incorrecta uno ${n}` },
      { id: 'c', texto: `Incorrecta dos ${n}` },
    ],
    respuestaCorrecta: 'a',
    explicacion: 'Explicación de prueba.',
    categoria: 'senales',
    subcategoria: 'Prueba',
    clases: ['A', 'B1', 'B2', 'C', 'D', 'E', 'G'],
    dificultad: null,
    imagen: null,
    tipo: 'opcion-multiple',
    ordenFijo: false,
    fuente: { documento: 'Documento de prueba', pagina: 1, numeroOriginal: null, seccion: 'Prueba' },
    referenciaNormativa: null,
    referenciaManual: null,
    fechaRevision: '2026-11-14',
    estado: 'verificada',
    nivelVerificacion: 'clave-oficial',
    eliminatoria: false,
    origen: 'oficial',
    ...cambios,
  }
}

export function bancoDePrueba(cantidad: number, cambios: (n: number) => Partial<Pregunta> = () => ({})): Pregunta[] {
  const cats: CategoriaId[] = ['senales', 'prioridades', 'velocidades', 'semaforos']
  return Array.from({ length: cantidad }, (_, i) => pregunta(i + 1, { categoria: cats[i % cats.length], ...cambios(i + 1) }))
}
