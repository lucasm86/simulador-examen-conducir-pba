import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { obtenerBanco } from '../banco/banco'
import { clavesDe } from '../persistencia/almacen'
import { RegistroPerfiles } from '../persistencia/perfiles'
import type { Intento, SesionExamen } from '../domain/types'

const banco = obtenerBanco()
let perfilId = ''
const claves = () => clavesDe(perfilId)
/** Texto de la opción sin el prefijo oculto para lectores de pantalla. */
const textoOpcion = (r: HTMLElement) => r.textContent!.replace(/^.*?Opción \S+: /, '')
const esOpcion = (r: HTMLElement, texto: string) => textoOpcion(r) === texto
const sesionGuardada = () => JSON.parse(localStorage.getItem(claves().examenEnCurso)!) as SesionExamen
const historial = () => JSON.parse(localStorage.getItem(claves().historial) ?? '[]') as Intento[]

/** Responde la pregunta visible: bien o mal según se pida. Devuelve el texto elegido. */
async function responderVisible(user: ReturnType<typeof userEvent.setup>, indice: number, bien: boolean) {
  const ps = sesionGuardada().preguntas[indice]
  const p = banco.porId.get(ps.id)!
  const opcion = bien ? p.opciones.find((o) => o.id === p.respuestaCorrecta)! : p.opciones.find((o) => o.id !== p.respuestaCorrecta)!
  const radios = screen.getAllByRole('radio')
  await user.click(radios[ps.orden.indexOf(opcion.id)])
  return { ps, p, opcion }
}

beforeEach(() => {
  const registro = new RegistroPerfiles()
  perfilId = registro.crear('Lucas').perfil.id
  registro.activar(perfilId)
  window.location.hash = ''
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
  window.scrollTo = () => {}
})

describe('pantalla principal', () => {
  it('muestra el título, el subtítulo y las cuatro tarjetas', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'SIMULADOR DE EXAMEN DE CONDUCIR' })).toBeTruthy()
    expect(screen.getByText('Prepará tu examen teórico de la Provincia de Buenos Aires')).toBeTruthy()
    for (const t of ['Simular examen', 'Estudiar por temas', 'Repasar errores', 'Ver mi progreso']) {
      expect(screen.getByRole('button', { name: new RegExp(t) })).toBeTruthy()
    }
    expect(screen.getByText(/Simulador educativo independiente/)).toBeTruthy()
  })
})

describe('simulacro de 40 preguntas de principio a fin', () => {
  it('permite elegir, responder, retroceder, finalizar, ver el resultado y revisar', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Simular examen/ }))
    expect((await screen.findByRole('button', { name: /40 preguntas/ })).getAttribute('aria-pressed')).toBe('true')
    await user.click(screen.getByRole('button', { name: 'Comenzar simulacro' }))

    expect(await screen.findByText('Pregunta 1 de 40')).toBeTruthy()
    expect(screen.getByRole('timer')).toBeTruthy()
    const sesion = sesionGuardada()
    expect(sesion.preguntas).toHaveLength(40)
    expect(new Set(sesion.preguntas.map((p) => p.id)).size).toBe(40)

    // 34 bien, 5 mal y la última sin responder
    for (let i = 0; i < 39; i++) {
      expect(screen.getByText(`Pregunta ${i + 1} de 40`)).toBeTruthy()
      const { p } = await responderVisible(user, i, i < 34)
      // durante el examen no se revela la solución
      expect(screen.queryByText(/Respuesta correcta/)).toBeNull()
      expect(screen.queryByText('Fundamento')).toBeNull()
      expect(screen.getByRole('heading', { name: p.enunciado })).toBeTruthy()
      await user.click(screen.getByRole('button', { name: /Siguiente/ }))
    }
    expect(screen.getByText('Pregunta 40 de 40')).toBeTruthy()

    // retroceder conserva la respuesta y permite cambiarla
    await user.click(screen.getByRole('button', { name: /Anterior/ }))
    expect(screen.getByText('Pregunta 39 de 40')).toBeTruthy()
    expect(screen.getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1)
    await responderVisible(user, 38, true) // la cambia a correcta: ahora 35 bien, 4 mal
    await user.click(screen.getByRole('button', { name: /Siguiente/ }))

    // finalizar avisa de la pendiente
    await user.click(screen.getByRole('button', { name: 'Finalizar examen' }))
    const dialogo = screen.getByRole('dialog', { hidden: true })
    expect(within(dialogo).getByText(/queda 1 pregunta sin responder/)).toBeTruthy()
    await user.click(within(dialogo).getByRole('button', { name: 'Finalizar y corregir', hidden: true }))

    expect(await screen.findByText(/APROBADO|DESAPROBADO/)).toBeTruthy()
    const [intento] = historial()
    expect(intento).toMatchObject({ modalidad: 'simulacro', total: 40, correctas: 35, incorrectas: 4, sinResponder: 1, porcentaje: 88 })
    expect(intento.aprobado).toBe(intento.eliminatoriasFalladas === 0)
    expect(screen.getByText(intento.aprobado ? 'APROBADO' : 'DESAPROBADO')).toBeTruthy()
    expect(screen.getByText('35 de 40 correctas ·', { exact: false })).toBeTruthy()
    expect(localStorage.getItem(claves().examenEnCurso)).toBeNull()

    // revisión: cada pregunta con la elegida, la correcta y su explicación
    await user.click(screen.getByRole('button', { name: 'Revisar mis respuestas' }))
    expect(await screen.findByRole('heading', { name: /^Revisión de respuestas/ })).toBeTruthy()
    expect(screen.getAllByText('Fundamento')).toHaveLength(40)
    await user.click(screen.getByRole('button', { name: 'Sólo las incorrectas' }))
    expect(screen.getAllByText('Fundamento')).toHaveLength(5)
    expect(screen.getAllByText(/Incorrecta$/).length).toBeGreaterThanOrEqual(4)
    expect(screen.getByText(/Sin responder/)).toBeTruthy()

    // los errores quedaron registrados para el repaso
    const est = JSON.parse(localStorage.getItem(claves().estadisticas)!)
    expect(Object.values(est).filter((e: any) => e.errores > 0)).toHaveLength(4)
  }, 60_000)

  it('recupera el examen interrumpido al recargar la página', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.click(screen.getByRole('button', { name: /Simular examen/ }))
    await user.click(await screen.findByRole('button', { name: 'Comenzar simulacro' }))
    await screen.findByText('Pregunta 1 de 40')
    const { opcion } = await responderVisible(user, 0, true)
    await user.click(screen.getByRole('button', { name: /Siguiente/ }))
    await user.click(screen.getByRole('button', { name: /Siguiente/ }))
    expect(screen.getByText('Pregunta 3 de 40')).toBeTruthy()

    unmount() // "recarga": se monta la app de nuevo, sólo con lo que hay en localStorage
    render(<App />)
    expect(await screen.findByText('Pregunta 3 de 40')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Anterior/ }))
    await user.click(screen.getByRole('button', { name: /Anterior/ }))
    const marcada = screen.getAllByRole('radio').find((r) => r.getAttribute('aria-checked') === 'true')!
    expect(marcada.textContent).toContain(opcion.texto)
  }, 30_000)
})

describe('modo estudio y repaso de errores', () => {
  it('corrige al instante, explica, registra el error y lo ofrece en el repaso', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Estudiar por temas/ }))
    await user.click(await screen.findByRole('button', { name: /Prioridades de paso/ }))
    expect(await screen.findByText('Pregunta 1 de 10')).toBeTruthy()

    // responde mal: se informa, se resalta la correcta y se muestra el fundamento
    const enunciado = screen.getByRole('heading', { level: 2 }).textContent!
    // el enunciado puede repetirse en varias preguntas: se identifica por enunciado + opciones mostradas
    const mostradas = screen.getAllByRole('radio').map(textoOpcion).sort().join('|')
    const p = banco.preguntas.find(
      (q) => q.enunciado === enunciado && q.categoria === 'prioridades' && q.opciones.map((o) => o.texto).sort().join('|') === mostradas,
    )!
    const correcta = p.opciones.find((o) => o.id === p.respuestaCorrecta)!.texto
    const mala = screen.getAllByRole('radio').find((r) => !esOpcion(r, correcta))!
    await user.click(mala)
    expect(await screen.findByText(/Incorrecto\. La respuesta correcta está resaltada/)).toBeTruthy()
    expect(screen.getByText(/Respuesta correcta$/)).toBeTruthy()
    expect(screen.getByText('Fundamento')).toBeTruthy()
    expect(screen.getByText(/Cuestionario oficial PBA, página/)).toBeTruthy()

    // repetir la pregunta y acertar
    await user.click(screen.getByRole('button', { name: 'Repetir la pregunta' }))
    await user.click(screen.getAllByRole('radio').find((r) => esOpcion(r, correcta))!)
    expect(await screen.findByText(/¡Correcto!/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Siguiente pregunta/ }))
    expect(screen.getByText('Pregunta 2 de 10')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Terminar sesión' }))

    // la sesión quedó en el historial como estudio, sin aprobado/desaprobado
    expect(historial()[0]).toMatchObject({ modalidad: 'estudio', total: 1, correctas: 0, aprobado: null })

    // repaso: ofrece exactamente esa pregunta
    await user.click(await screen.findByRole('button', { name: /Repasar errores/ }))
    expect(await screen.findByText(/pregunta para repasar/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Repasar 1 ahora/ }))
    expect(await screen.findByRole('heading', { level: 2, name: enunciado })).toBeTruthy()

    // si falla de nuevo, vuelve a aparecer hasta que la responda bien
    await user.click(screen.getAllByRole('radio').find((r) => !esOpcion(r, correcta))!)
    expect(await screen.findByText(/Va a volver a aparecer/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Siguiente pregunta/ }))
    expect(screen.getByText('Pregunta 2 de 2')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: enunciado })).toBeTruthy()
    await user.click(screen.getAllByRole('radio').find((r) => esOpcion(r, correcta))!)
    await user.click(screen.getByRole('button', { name: /Marcar como dominada/ }))
    await user.click(screen.getByRole('button', { name: 'Terminar' }))
    expect(await screen.findByText('Sesión terminada')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Volver al inicio' }))
    await user.click(await screen.findByRole('button', { name: /Repasar errores/ }))
    expect(await screen.findByText(/No tenés preguntas pendientes de repaso/)).toBeTruthy()
  }, 30_000)
})

describe('progreso', () => {
  it('muestra el historial persistido y permite reiniciarlo', async () => {
    const intento: Intento = {
      id: 'sim-x', fecha: '2026-11-10T10:00:00.000Z', modalidad: 'simulacro', clase: 'B1', duracionSeg: 900, total: 40, respondidas: 40,
      correctas: 34, incorrectas: 6, sinResponder: 0, porcentaje: 85, aprobado: true, eliminatoriasEvaluadas: 0, eliminatoriasFalladas: 0,
      aplicoEliminatorias: true, porCategoria: { senales: { total: 40, correctas: 34 } }, detalle: [],
    }
    localStorage.setItem(claves().historial, JSON.stringify([intento]))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Ver mi progreso/ }))
    expect(await screen.findByText('34/40 · 85 %')).toBeTruthy()
    expect(screen.getByText(/No garantiza aprobar el examen oficial/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Reiniciar historial' }))
    await user.click(screen.getByRole('button', { name: 'Sí, borrar todo', hidden: true }))
    expect(await screen.findByText('Sin actividad registrada.')).toBeTruthy()
    expect(localStorage.getItem(claves().historial)).toBeNull()
  })
})
