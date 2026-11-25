import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { Almacen, clavesDe } from '../persistencia/almacen'
import { RegistroPerfiles } from '../persistencia/perfiles'
import type { Intento } from '../domain/types'

const intento = (id: string, porcentaje: number): Intento => ({
  id, fecha: '2026-11-10T10:00:00.000Z', modalidad: 'simulacro', clase: 'B1', duracionSeg: 900, total: 40, respondidas: 40,
  correctas: Math.round(porcentaje * 0.4), incorrectas: 40 - Math.round(porcentaje * 0.4), sinResponder: 0, porcentaje, aprobado: porcentaje >= 75,
  eliminatoriasEvaluadas: 0, eliminatoriasFalladas: 0, aplicoEliminatorias: true, porCategoria: {}, detalle: [],
})

beforeEach(() => {
  window.location.hash = ''
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
  window.scrollTo = () => {}
})

describe('registro y selección de personas', () => {
  it('la primera vez pide el nombre y valida lo que se escribe', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: /Bienvenido\/a al simulador/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Simular examen/ })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Empezar' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/al menos 2/)
    await user.type(screen.getByLabelText('¿Cómo te llamás?'), 'L')
    await user.click(screen.getByRole('button', { name: 'Empezar' }))
    expect(screen.getByRole('alert').textContent).toMatch(/al menos 2/)

    await user.clear(screen.getByLabelText('¿Cómo te llamás?'))
    await user.type(screen.getByLabelText('¿Cómo te llamás?'), 'Lucas')
    await user.click(screen.getByRole('button', { name: 'Empezar' }))

    expect(await screen.findByRole('button', { name: /Simular examen/ })).toBeTruthy()
    expect(screen.getByText('Lucas')).toBeTruthy()
    expect(new RegistroPerfiles().listar().map((p) => p.nombre)).toEqual(['Lucas'])
  })

  it('al recargar sigue con la misma persona, sin volver a preguntar', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.type(screen.getByLabelText('¿Cómo te llamás?'), 'Lucas')
    await user.click(screen.getByRole('button', { name: 'Empezar' }))
    await screen.findByRole('button', { name: /Simular examen/ })
    unmount()
    render(<App />)
    expect(await screen.findByRole('button', { name: /Simular examen/ })).toBeTruthy()
    expect(screen.getByText('Lucas')).toBeTruthy()
  })

  it('dos personas en el mismo equipo tienen progreso separado y se puede alternar', async () => {
    const registro = new RegistroPerfiles()
    const lucas = registro.crear('Lucas').perfil
    registro.activar(lucas.id)
    new Almacen(undefined, lucas.id).guardarIntento(intento('sim-lucas', 85))

    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Cambiar de persona' }))

    // selector: Lucas aparece con su resumen; se agrega Ana
    expect(await screen.findByRole('heading', { name: '¿Quién va a estudiar?' })).toBeTruthy()
    expect(screen.getByText(/1 simulacro · última vez/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: '+ Agregar otra persona' }))
    await user.type(screen.getByLabelText('Nombre de la nueva persona'), 'Ana')
    await user.click(screen.getByRole('button', { name: 'Agregar y empezar' }))

    // Ana arranca de cero
    await user.click(await screen.findByRole('button', { name: /Ver mi progreso/ }))
    expect(await screen.findByRole('heading', { name: 'Progreso de Ana' })).toBeTruthy()
    expect(screen.getByText('Sin actividad registrada.')).toBeTruthy()

    // vuelve a Lucas: conserva su resultado
    await user.click(screen.getByRole('button', { name: 'Cambiar de persona' }))
    await user.click(await screen.findByRole('button', { name: /^Lucas/i  }))
    await user.click(await screen.findByRole('button', { name: /Ver mi progreso/ }))
    expect(await screen.findByRole('heading', { name: 'Progreso de Lucas' })).toBeTruthy()
    expect(screen.getByText('34/40 · 85 %')).toBeTruthy()
  })

  it('no deja registrar a alguien con el mismo nombre', async () => {
    const registro = new RegistroPerfiles()
    registro.crear('María')
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: '+ Agregar otra persona' }))
    await user.type(screen.getByLabelText('Nombre de la nueva persona'), 'maria')
    await user.click(screen.getByRole('button', { name: 'Agregar y empezar' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/Ya hay una persona con ese nombre/)
    expect(registro.listar()).toHaveLength(1)
  })

  it('al terminar un simulacro, el resultado dice de quién es', async () => {
    const registro = new RegistroPerfiles()
    registro.activar(registro.crear('Ana').perfil.id)
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: /Simular examen/ }))
    await user.click(await screen.findByRole('button', { name: 'Comenzar simulacro' }))
    expect(await screen.findByText(/Ana · 0 respondidas/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Finalizar examen' }))
    await user.click(within(screen.getByRole('dialog', { hidden: true })).getByRole('button', { name: 'Finalizar y corregir', hidden: true }))
    expect(await screen.findByRole('heading', { name: 'Resultado del simulacro de Ana' })).toBeTruthy()
  }, 20_000)

  it('eliminar a una persona pide confirmación y borra sus datos', async () => {
    const registro = new RegistroPerfiles()
    const ana = registro.crear('Ana').perfil
    registro.crear('Lucas')
    new Almacen(undefined, ana.id).guardarIntento(intento('sim-ana', 60))
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Eliminar a Ana' }))
    expect(await screen.findByRole('dialog', { hidden: true })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar', hidden: true }))
    expect(registro.listar().map((p) => p.nombre)).toEqual(['Lucas'])
    expect(localStorage.getItem(clavesDe(ana.id).historial)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Eliminar a Ana' })).toBeNull()
  })
})
