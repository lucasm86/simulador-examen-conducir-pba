import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Las pruebas de pantalla nunca salen a la red: la comprobación de vigencia queda "sin conexión".
beforeEach(() => {
  vi.stubGlobal('fetch', () => Promise.reject(new Error('sin red en pruebas')))
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})
