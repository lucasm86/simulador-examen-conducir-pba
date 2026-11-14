import { useState } from 'react'
import type { Intento } from '../../domain/types'
import { PORCENTAJE_APROBACION } from '../../evaluacion/evaluacion'
import { fechaCorta } from './Base'

export interface FilaBarra {
  id: string
  nombre: string
  /** 0–100 o null si no hay datos. */
  porcentaje: number | null
  detalle: string
}

/**
 * Barras horizontales de porcentaje de aciertos por materia.
 * Una sola serie (un solo tono); la línea punteada marca el 75 % requerido.
 * Los valores van como texto al lado de cada barra, así que no dependen del color.
 */
export function BarrasPorMateria({ filas, titulo }: { filas: FilaBarra[]; titulo: string }) {
  return (
    <figure className="m-0">
      <figcaption className="sr-only">{titulo}</figcaption>
      <ul className="m-0 grid list-none gap-3 p-0">
        {filas.map((f) => (
          <li key={f.id} className="grid gap-1" title={`${f.nombre}: ${f.detalle}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-tinta">{f.nombre}</span>
              <span className="shrink-0 tabular-nums text-tinta-2">{f.porcentaje == null ? 'Sin datos' : `${f.porcentaje} % · ${f.detalle}`}</span>
            </div>
            <div className="relative h-2.5 rounded-full bg-borde/60">
              {f.porcentaje != null && f.porcentaje > 0 && <div className="h-full rounded-full bg-acento" style={{ width: `${Math.max(f.porcentaje, 1.5)}%` }} />}
              <span aria-hidden="true" className="absolute -top-1 h-4.5 border-l-2 border-dashed border-tinta-2" style={{ left: `${PORCENTAJE_APROBACION}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-tinta-3">La línea punteada indica el {PORCENTAJE_APROBACION} % necesario para aprobar.</p>
    </figure>
  )
}

/** Evolución de los últimos simulacros: línea con puntos, referencia en 75 % y detalle al pasar o enfocar. */
export function GraficoEvolucion({ intentos }: { intentos: Intento[] }) {
  const [activo, setActivo] = useState<number | null>(null)
  const W = 640
  const H = 220
  const m = { izq: 34, der: 14, sup: 14, inf: 26 }
  const ancho = W - m.izq - m.der
  const alto = H - m.sup - m.inf
  const x = (i: number) => m.izq + (intentos.length === 1 ? ancho / 2 : (i * ancho) / (intentos.length - 1))
  const y = (v: number) => m.sup + alto - (v / 100) * alto
  const puntos = intentos.map((s, i) => `${x(i)},${y(s.porcentaje)}`).join(' ')
  const sel = activo != null ? intentos[activo] : null

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Evolución del porcentaje de aciertos en los últimos ${intentos.length} simulacros`}>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={m.izq} x2={W - m.der} y1={y(v)} y2={y(v)} stroke={v === 75 ? '#4a5a6a' : '#d9e0e7'} strokeWidth={v === 75 ? 1.5 : 1} strokeDasharray={v === 75 ? '5 4' : undefined} />
            <text x={m.izq - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#6b7a89">
              {v}
            </text>
          </g>
        ))}
        <text x={W - m.der} y={y(75) - 5} textAnchor="end" fontSize="11" fill="#4a5a6a">
          75 % para aprobar
        </text>
        {intentos.length > 1 && <polyline points={puntos} fill="none" stroke="#1d5fa8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {intentos.map((s, i) => (
          <g key={s.id}>
            <circle cx={x(i)} cy={y(s.porcentaje)} r={activo === i ? 6.5 : 5} fill="#1d5fa8" stroke="#ffffff" strokeWidth="2" />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#6b7a89">
              {i + 1}
            </text>
            <circle
              cx={x(i)}
              cy={y(s.porcentaje)}
              r={16}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`Simulacro ${i + 1}, ${fechaCorta(s.fecha)}: ${s.porcentaje} %, ${s.aprobado ? 'aprobado' : 'desaprobado'}`}
              onMouseEnter={() => setActivo(i)}
              onMouseLeave={() => setActivo(null)}
              onFocus={() => setActivo(i)}
              onBlur={() => setActivo(null)}
            />
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 min-h-5 text-sm text-tinta-2" aria-live="polite">
        {sel ? (
          <>
            Simulacro {activo! + 1} · {fechaCorta(sel.fecha)} · <strong className="text-tinta">{sel.porcentaje} %</strong> ({sel.correctas}/{sel.total}) ·{' '}
            {sel.aprobado ? '✓ Aprobado' : '✗ Desaprobado'}
          </>
        ) : (
          'Porcentaje de aciertos por simulacro, del más antiguo al más reciente. Pasá el cursor o usá Tab para ver el detalle.'
        )}
      </figcaption>
      <table className="sr-only-tabla">
        <caption>Evolución de simulacros</caption>
        <thead>
          <tr>
            <th>N.º</th>
            <th>Fecha</th>
            <th>Porcentaje</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          {intentos.map((s, i) => (
            <tr key={s.id}>
              <td>{i + 1}</td>
              <td>{fechaCorta(s.fecha)}</td>
              <td>{s.porcentaje} %</td>
              <td>{s.aprobado ? 'Aprobado' : 'Desaprobado'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
