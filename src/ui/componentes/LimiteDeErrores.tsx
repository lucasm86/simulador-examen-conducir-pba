import { Component, type ReactNode } from 'react'

/** Muestra un mensaje claro si algo falla al cargar (por ejemplo, un banco de preguntas dañado). */
export class LimiteDeErrores extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="mx-auto max-w-xl p-6" role="alert">
        <h1 className="text-xl font-semibold">No se pudo cargar el simulador</h1>
        <p className="mt-2 text-tinta-2">
          Ocurrió un error inesperado. Tu historial no se borró. Probá recargar la página; si el problema sigue, revisá que el banco de
          preguntas esté completo.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-mal-suave p-3 text-sm text-mal">{this.state.error.message}</pre>
        <button className="mt-4 rounded-lg bg-marca px-4 py-3 font-medium text-white" onClick={() => location.reload()}>
          Recargar
        </button>
      </main>
    )
  }
}
