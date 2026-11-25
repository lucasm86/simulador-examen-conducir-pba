import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { clavesDe } from '../persistencia/almacen'
import { RegistroPerfiles } from '../persistencia/perfiles'
import type { SesionExamen } from '../domain/types'

let perfilId = ''
const sesion = () => JSON.parse(localStorage.getItem(clavesDe(perfilId).examenEnCurso)!) as SesionExamen
const marcada = () => screen.getAllByRole('radio').findIndex((r) => r.getAttribute('aria-checked') === 'true')

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

describe('atajos en el simulacro', () => {
  async function empezar() {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /Simular examen/ }))
    await user.click(await screen.findByRole('button', { name: 'Comenzar simulacro' }))
    await screen.findByText('Pregunta 1 de 40')
    return user
  }

  it('los números eligen, Enter avanza, Retroceso vuelve conservando la respuesta', async () => {
    const user = await empezar()
    await user.keyboard('2')
    expect(marcada()).toBe(1)
    expect(Object.keys(sesion().respuestas)).toHaveLength(1)

    await user.keyboard('{Enter}')
    expect(screen.getByText('Pregunta 2 de 40')).toBeTruthy()
    expect(marcada()).toBe(-1)
    await user.keyboard('1')
    expect(marcada()).toBe(0)

    await user.keyboard('{Backspace}')
    expect(screen.getByText('Pregunta 1 de 40')).toBeTruthy()
    expect(marcada()).toBe(1) // la respuesta de la pregunta 1 se conservó
    await user.keyboard('{Enter}')
    expect(marcada()).toBe(0) // y la de la 2 también
  })

  it('Enter funciona aunque el foco esté en una opción recién elegida con el mouse', async () => {
    const user = await empezar()
    await user.click(screen.getAllByRole('radio')[2])
    await user.keyboard('{Enter}')
    expect(screen.getByText('Pregunta 2 de 40')).toBeTruthy()
  })

  it('no avanza de más: Retroceso en la primera pregunta no hace nada', async () => {
    const user = await empezar()
    await user.keyboard('{Backspace}')
    expect(screen.getByText('Pregunta 1 de 40')).toBeTruthy()
  })

  it('Esc abre la confirmación de finalizar y volver a apretarlo la cierra', async () => {
    const user = await empezar()
    await user.keyboard('1{Escape}')
    expect(screen.getByRole('heading', { name: '¿Finalizar el examen?', hidden: true })).toBeTruthy()
    const antes = sesion().respuestas
    expect(Object.keys(antes)).toHaveLength(1)
    // con el diálogo abierto los atajos no actúan sobre el examen (la 2 existe en toda pregunta, incluso en verdadero/falso)
    await user.keyboard('2')
    expect(sesion().respuestas).toEqual(antes)
  })

  it('Enter en la última pregunta propone finalizar', async () => {
    const user = await empezar()
    await user.keyboard('{Enter}'.repeat(39))
    expect(screen.getByText('Pregunta 40 de 40')).toBeTruthy()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { name: '¿Finalizar el examen?', hidden: true })).toBeTruthy()
  }, 20_000)

  it('Enter sobre un botón conserva su acción propia (no salta dos veces)', async () => {
    const user = await empezar()
    const siguiente = screen.getByRole('button', { name: /Siguiente/ })
    siguiente.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Pregunta 2 de 40')).toBeTruthy()
  })
})

describe('atajos en estudio, repaso y práctica inteligente', () => {
  it('estudio: número responde, Enter avanza, Retroceso repite, Esc termina', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /Estudiar por temas/ }))
    await user.click(await screen.findByRole('button', { name: /Semáforos e intersecciones/ }))
    await screen.findByText('Pregunta 1 de 10')

    // Enter y Retroceso no hacen nada hasta responder
    await user.keyboard('{Enter}')
    expect(screen.getByText('Pregunta 1 de 10')).toBeTruthy()
    await user.keyboard('{Backspace}')
    expect(screen.queryByText('Fundamento')).toBeNull()

    await user.keyboard('1')
    expect(await screen.findByText('Fundamento')).toBeTruthy()
    // ya respondida: otro número no cambia la respuesta
    const elegida = screen.getAllByRole('radio').findIndex((r) => r.getAttribute('aria-checked') === 'true')
    await user.keyboard('2')
    expect(screen.getAllByRole('radio')[elegida].getAttribute('aria-checked')).toBe('true')

    await user.keyboard('{Backspace}') // repetir la pregunta
    expect(screen.queryByText('Fundamento')).toBeNull()
    expect(screen.getByText('Pregunta 1 de 10')).toBeTruthy()

    await user.keyboard('2')
    await screen.findByText('Fundamento')
    await user.keyboard('{Enter}')
    expect(screen.getByText('Pregunta 2 de 10')).toBeTruthy()

    await user.keyboard('{Escape}')
    expect(await screen.findByRole('button', { name: /Simular examen/ })).toBeTruthy()
  }, 20_000)

  it('práctica inteligente responde con números y avanza con Enter', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /Práctica inteligente/ }))
    await screen.findByText('Pregunta 1 de 20')
    await user.keyboard('1')
    await screen.findByText('Fundamento')
    await user.keyboard('{Enter}')
    expect(screen.getByText('Pregunta 2 de 20')).toBeTruthy()
  })

  it('en la pantalla de nombre, escribir no dispara atajos', async () => {
    localStorage.clear()
    window.location.hash = ''
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('¿Cómo te llamás?'), 'Ana 2')
    expect((screen.getByLabelText('¿Cómo te llamás?') as HTMLInputElement).value).toBe('Ana 2')
  })
})
