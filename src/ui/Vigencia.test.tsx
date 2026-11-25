import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from './App'
import { RegistroPerfiles } from '../persistencia/perfiles'

function estadoPublicado(resultado: string, revisado = new Date().toISOString()) {
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ revisado, resultado, documentos: [] })))
}

beforeEach(() => {
  const registro = new RegistroPerfiles()
  registro.activar(registro.crear('Lucas').perfil.id)
  window.location.hash = ''
  window.scrollTo = () => {}
})

describe('aviso de vigencia en el inicio', () => {
  it('avisa cuando las fuentes oficiales cambiaron', async () => {
    estadoPublicado('cambio')
    render(<App />)
    expect(await screen.findByText(/Los documentos oficiales cambiaron/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'sitio oficial' }).getAttribute('href')).toContain('gba.gob.ar')
  })

  it('si no cambiaron, no avisa y deja constancia de la comprobación', async () => {
    estadoPublicado('sin-cambios')
    render(<App />)
    expect(await screen.findByText(/Fuentes oficiales comprobadas el .*sin cambios/)).toBeTruthy()
    expect(screen.queryByText(/Los documentos oficiales cambiaron/)).toBeNull()
  })

  it('sin conexión no muestra nada y la app funciona igual', async () => {
    render(<App />) // setup.ts: fetch rechaza
    expect(await screen.findByRole('button', { name: /Simular examen/ })).toBeTruthy()
    expect(screen.queryByText(/documentos oficiales cambiaron/)).toBeNull()
    expect(screen.queryByText(/comprobadas el/)).toBeNull()
  })
})
