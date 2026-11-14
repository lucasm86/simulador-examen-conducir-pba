import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variante = 'primario' | 'secundario' | 'texto' | 'peligro'

const ESTILO: Record<Variante, string> = {
  primario: 'bg-marca text-white hover:bg-acento disabled:bg-tinta-3',
  secundario: 'border border-borde bg-superficie text-tinta hover:border-acento hover:text-acento disabled:text-tinta-3',
  texto: 'text-acento hover:underline disabled:text-tinta-3',
  peligro: 'border border-mal bg-superficie text-mal hover:bg-mal-suave',
}

export function Boton({ variante = 'primario', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-medium transition-colors disabled:cursor-not-allowed ${ESTILO[variante]} ${className}`}
    />
  )
}

export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-borde bg-superficie p-5 sm:p-6 ${className}`}>{children}</section>
}

export function Titulo({ children, volver }: { children: ReactNode; volver?: () => void }) {
  return (
    <div className="mb-5">
      {volver && (
        <button type="button" onClick={volver} className="mb-2 inline-flex min-h-11 items-center gap-1 rounded-lg pr-3 text-sm font-medium text-acento hover:underline">
          <span aria-hidden="true">←</span> Volver al inicio
        </button>
      )}
      <h1 className="text-2xl font-semibold tracking-tight text-marca sm:text-3xl">{children}</h1>
    </div>
  )
}

export function Aviso({ tono = 'info', children }: { tono?: 'info' | 'aviso' | 'mal' | 'bien'; children: ReactNode }) {
  const c = {
    info: 'border-acento/30 bg-acento-suave text-tinta',
    aviso: 'border-aviso/30 bg-aviso-suave text-tinta',
    mal: 'border-mal/30 bg-mal-suave text-tinta',
    bien: 'border-bien/30 bg-bien-suave text-tinta',
  }[tono]
  return <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${c}`}>{children}</div>
}

export function BarraProgreso({ valor, maximo, etiqueta }: { valor: number; maximo: number; etiqueta: string }) {
  const pct = maximo === 0 ? 0 : Math.round((valor / maximo) * 100)
  return (
    <div role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={maximo} aria-valuenow={valor} className="h-2 w-full overflow-hidden rounded-full bg-borde">
      <div className="h-full rounded-full bg-acento transition-[width] duration-200" style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Diálogo modal accesible (usa <dialog> nativo: foco atrapado y cierre con Escape). */
export function Dialogo({ abierto, titulo, children, onCerrar }: { abierto: boolean; titulo: string; children: ReactNode; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal?.()
    if (!abierto && d.open) d.close?.()
  }, [abierto])
  if (!abierto) return null
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialogo-titulo"
      onCancel={(e) => {
        e.preventDefault()
        onCerrar()
      }}
      className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-borde bg-superficie p-6 text-tinta backdrop:bg-marca/50"
    >
      <h2 id="dialogo-titulo" className="text-xl font-semibold text-marca">
        {titulo}
      </h2>
      <div className="mt-3">{children}</div>
    </dialog>
  )
}

export function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor: ReactNode; nota?: string }) {
  return (
    <div className="rounded-xl border border-borde bg-superficie px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-tinta-3">{etiqueta}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-marca">{valor}</div>
      {nota && <div className="mt-0.5 text-xs text-tinta-3">{nota}</div>}
    </div>
  )
}

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
