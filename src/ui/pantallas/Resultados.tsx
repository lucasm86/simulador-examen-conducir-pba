import { useState } from 'react'
import type { Aplicacion } from '../estado'
import type { Ruta } from '../App'
import type { CategoriaId, Intento } from '../../domain/types'
import { formatearTiempo } from '../../motor/examen'
import { minimoParaAprobar, porcentaje } from '../../evaluacion/evaluacion'
import { Aviso, Boton, Dato, fechaHora, Tarjeta, Titulo } from '../componentes/Base'
import { BarrasPorMateria, type FilaBarra } from '../componentes/Graficos'
import { Explicacion, TarjetaPregunta } from '../componentes/TarjetaPregunta'

function filasPorCategoria(app: Aplicacion, intento: Intento): FilaBarra[] {
  return app.banco.categorias
    .filter((c) => intento.porCategoria[c.id as CategoriaId])
    .map((c) => {
      const d = intento.porCategoria[c.id as CategoriaId]!
      return { id: c.id, nombre: c.nombre, porcentaje: porcentaje(d.correctas, d.total), detalle: `${d.correctas} de ${d.total}` }
    })
}

export function Resultados({ app, ir, intentoId, revisar }: { app: Aplicacion; ir: (r: Ruta) => void; intentoId: string | null; revisar: (id: string) => void }) {
  const intento = app.historial.find((i) => i.id === intentoId)
  if (!intento) {
    return (
      <>
        <Titulo volver={() => ir('inicio')}>Resultado</Titulo>
        <Aviso tono="aviso">No se encontró ese resultado en el historial.</Aviso>
      </>
    )
  }
  const aprobado = intento.aprobado === true
  const minimo = minimoParaAprobar(intento.total)

  return (
    <>
      <Titulo volver={() => ir('inicio')}>Resultado del simulacro</Titulo>

      <div
        role="status"
        className={`rounded-2xl border-2 p-6 text-center ${aprobado ? 'border-bien bg-bien-suave' : 'border-mal bg-mal-suave'}`}
      >
        <p className={`text-3xl font-bold tracking-tight sm:text-4xl ${aprobado ? 'text-bien' : 'text-mal'}`}>
          <span aria-hidden="true">{aprobado ? '✓ ' : '✗ '}</span>
          {aprobado ? 'APROBADO' : 'DESAPROBADO'}
        </p>
        <p className="mt-2 text-lg text-tinta">
          {intento.correctas} de {intento.total} correctas · <strong>{intento.porcentaje} %</strong>
        </p>
        <p className="mt-1 text-sm text-tinta-2">
          Se necesitaban {minimo} correctas (75 %).
          {intento.motivoCierre === 'tiempo' && ' El examen se cerró automáticamente al agotarse el tiempo.'}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Dato etiqueta="Preguntas" valor={intento.total} />
        <Dato etiqueta="Correctas" valor={intento.correctas} />
        <Dato etiqueta="Incorrectas" valor={intento.incorrectas} />
        <Dato etiqueta="Sin responder" valor={intento.sinResponder} />
        <Dato etiqueta="Porcentaje" valor={`${intento.porcentaje} %`} />
        <Dato etiqueta="Tiempo utilizado" valor={formatearTiempo(intento.duracionSeg)} nota={fechaHora(intento.fecha)} />
      </div>

      <div className="mt-4">
        {intento.eliminatoriasEvaluadas === 0 ? (
          <Aviso>Eliminatorias: en este simulacro no te tocó ninguna pregunta marcada como eliminatoria en el cuestionario oficial.</Aviso>
        ) : intento.eliminatoriasFalladas === 0 ? (
          <Aviso tono="bien">
            ✓ Eliminatorias: respondiste bien las {intento.eliminatoriasEvaluadas} pregunta{intento.eliminatoriasEvaluadas === 1 ? '' : 's'} eliminatoria
            {intento.eliminatoriasEvaluadas === 1 ? '' : 's'} que te tocaron.
          </Aviso>
        ) : (
          <Aviso tono={intento.aplicoEliminatorias ? 'mal' : 'aviso'}>
            ✗ Eliminatorias: fallaste {intento.eliminatoriasFalladas} de {intento.eliminatoriasEvaluadas}.{' '}
            {intento.aplicoEliminatorias
              ? 'Por eso el simulacro queda desaprobado aunque el porcentaje alcance.'
              : 'Tenías desactivada la regla de eliminatorias, así que no afectó el resultado.'}
          </Aviso>
        )}
      </div>

      <Tarjeta className="mt-4">
        <h2 className="mb-4 text-lg font-semibold text-marca">Desempeño por materia</h2>
        <BarrasPorMateria titulo="Porcentaje de aciertos por materia en este simulacro" filas={filasPorCategoria(app, intento)} />
      </Tarjeta>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Boton variante="secundario" onClick={() => revisar(intento.id)} disabled={intento.detalle.length === 0}>
          Revisar mis respuestas
        </Boton>
        <Boton onClick={() => ir('simulacro')}>Realizar otro examen</Boton>
      </div>
      {intento.incorrectas + intento.sinResponder > 0 && (
        <p className="mt-3 text-center text-sm text-tinta-2">
          Las preguntas que fallaste ya están en{' '}
          <button type="button" className="font-medium text-acento underline" onClick={() => ir('repaso')}>
            Repasar errores
          </button>
          .
        </p>
      )}
    </>
  )
}

export function Revision({ app, ir, intentoId, volver }: { app: Aplicacion; ir: (r: Ruta) => void; intentoId: string | null; volver: (id: string) => void }) {
  const [soloErrores, setSoloErrores] = useState(false)
  const intento = app.historial.find((i) => i.id === intentoId)
  if (!intento || intento.detalle.length === 0) {
    return (
      <>
        <Titulo volver={() => ir('inicio')}>Revisión</Titulo>
        <Aviso tono="aviso">El detalle de este intento ya no está disponible (sólo se conserva el de los más recientes).</Aviso>
      </>
    )
  }
  const filas = intento.detalle.map((d, i) => ({ d, n: i + 1 })).filter(({ d }) => !soloErrores || !d.acierto)

  return (
    <>
      <Titulo volver={() => ir('inicio')}>Revisión de respuestas</Titulo>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-tinta-2">
          {intento.correctas} correctas · {intento.incorrectas} incorrectas · {intento.sinResponder} sin responder
        </p>
        <div className="flex flex-wrap gap-2">
          <Boton variante="secundario" aria-pressed={soloErrores} onClick={() => setSoloErrores((v) => !v)}>
            {soloErrores ? 'Mostrar todas' : 'Sólo las incorrectas'}
          </Boton>
          <Boton variante="secundario" onClick={() => volver(intento.id)}>
            Volver al resultado
          </Boton>
        </div>
      </div>
      {filas.length === 0 && <Aviso tono="bien">No hubo respuestas incorrectas. ¡Excelente!</Aviso>}
      <ol className="m-0 grid list-none gap-4 p-0">
        {filas.map(({ d, n }) => {
          const p = app.banco.porId.get(d.id)
          if (!p) {
            return (
              <li key={d.id}>
                <Aviso tono="aviso">La pregunta {n} ya no forma parte del banco verificado.</Aviso>
              </li>
            )
          }
          return (
            <li key={d.id} className="rounded-2xl border border-borde bg-superficie p-5">
              <p className={`mb-2 text-sm font-semibold ${d.acierto ? 'text-bien' : 'text-mal'}`}>
                Pregunta {n} · {d.acierto ? '✓ Correcta' : d.elegida ? '✗ Incorrecta' : '✗ Sin responder'}
              </p>
              <TarjetaPregunta pregunta={p} orden={intento.ordenOpciones?.[d.id] ?? p.opciones.map((o) => o.id)} elegida={d.elegida} mostrarSolucion />
              <Explicacion pregunta={p} />
            </li>
          )
        })}
      </ol>
      <div className="mt-6">
        <Boton onClick={() => ir('simulacro')}>Realizar otro examen</Boton>
      </div>
    </>
  )
}
