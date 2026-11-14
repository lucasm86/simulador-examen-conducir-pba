import { useState } from 'react'
import type { Aplicacion } from '../estado'
import type { Ruta } from '../App'
import type { CategoriaId, Pregunta } from '../../domain/types'
import { filtrarPreguntas } from '../../banco/banco'
import { mezclar } from '../../motor/aleatorio'
import { colaDeRepaso, contarDominadas, masFalladas, seleccionAdaptativa } from '../../repaso/repaso'
import { aciertosPorCategoria } from '../../estadisticas/estadisticas'
import { Aviso, Boton, Tarjeta, Titulo } from '../componentes/Base'
import { Practica } from './Practica'

interface Sesion {
  clave: number
  titulo: string
  preguntas: Pregunta[]
}

/** B. Modo estudio: elegir materia y cantidad. */
export function Estudio({ app, ir }: { app: Aplicacion; ir: (r: Ruta) => void }) {
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [cantidad, setCantidad] = useState<number | 'todas'>(10)
  const base = filtrarPreguntas(app.banco.preguntas, { clase: app.preferencias.clase, incluirComplementarias: true })
  const rendimiento = aciertosPorCategoria(app.banco.categorias, base, app.estadisticas)

  const empezar = (id: CategoriaId, nombre: string) => {
    const deLaMateria = mezclar(base.filter((p) => p.categoria === id))
    setSesion({ clave: Date.now(), titulo: `Estudio · ${nombre}`, preguntas: cantidad === 'todas' ? deLaMateria : deLaMateria.slice(0, cantidad) })
  }

  if (sesion) {
    return <Practica key={sesion.clave} app={app} modalidad="estudio" titulo={sesion.titulo} preguntas={sesion.preguntas} onSalir={() => ir('inicio')} onOtra={() => setSesion(null)} />
  }

  return (
    <>
      <Titulo volver={() => ir('inicio')}>Estudiar por temas</Titulo>
      <p className="mb-4 text-tinta-2">Sin tiempo ni penalización: respondés, ves si acertaste y leés el fundamento con su referencia.</p>
      <fieldset className="m-0 mb-5 border-0 p-0">
        <legend className="mb-2 text-sm font-semibold text-marca">Preguntas por sesión</legend>
        <div className="flex flex-wrap gap-2">
          {([10, 20, 'todas'] as const).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={cantidad === n}
              onClick={() => setCantidad(n)}
              className={`min-h-11 rounded-full border-2 px-4 text-sm font-medium ${cantidad === n ? 'border-acento bg-acento-suave text-marca' : 'border-borde bg-superficie text-tinta-2'}`}
            >
              {n === 'todas' ? 'Todas las de la materia' : `${n} preguntas`}
            </button>
          ))}
        </div>
      </fieldset>
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
        {app.banco.categorias.map((c) => {
          const n = base.filter((p) => p.categoria === c.id).length
          const r = rendimiento.find((x) => x.id === c.id)
          const dom = contarDominadas(base.filter((p) => p.categoria === c.id), app.estadisticas)
          return (
            <li key={c.id}>
              <button
                type="button"
                disabled={n === 0}
                onClick={() => empezar(c.id, c.nombre)}
                className="flex min-h-20 w-full flex-col justify-center rounded-2xl border border-borde bg-superficie px-5 py-4 text-left hover:border-acento disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="font-semibold text-marca">{c.nombre}</span>
                <span className="mt-1 text-sm text-tinta-2">
                  {n} preguntas · {dom} dominadas{r?.porcentaje != null ? ` · ${r.porcentaje} % de aciertos` : ' · sin practicar'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

/** C. Repaso de errores. */
export function Repaso({ app, ir }: { app: Aplicacion; ir: (r: Ruta) => void }) {
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const base = filtrarPreguntas(app.banco.preguntas, { clase: app.preferencias.clase, incluirComplementarias: true })
  const cola = colaDeRepaso(base, app.estadisticas)
  const top = masFalladas(base, app.estadisticas, 8)

  if (sesion) {
    return <Practica key={sesion.clave} app={app} modalidad="repaso" titulo={sesion.titulo} preguntas={sesion.preguntas} onSalir={() => ir('inicio')} onOtra={() => setSesion(null)} />
  }

  return (
    <>
      <Titulo volver={() => ir('inicio')}>Repasar errores</Titulo>
      {cola.length === 0 ? (
        <Aviso tono="bien">
          No tenés preguntas pendientes de repaso. Cuando falles alguna en un simulacro o en el modo estudio, va a aparecer acá hasta que la domines.
        </Aviso>
      ) : (
        <Tarjeta>
          <p className="text-lg text-tinta">
            Tenés <strong>{cola.length}</strong> pregunta{cola.length === 1 ? '' : 's'} para repasar.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-tinta-2">
            Aparecen primero las que más veces fallaste. Si volvés a equivocarte, la pregunta se repite al final de la sesión. Sale del repaso cuando la
            respondés bien tres veces seguidas o la marcás como dominada.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Boton onClick={() => setSesion({ clave: Date.now(), titulo: 'Repaso de errores', preguntas: cola.slice(0, 20) })}>
              Repasar {Math.min(cola.length, 20)} ahora
            </Boton>
            {cola.length > 20 && (
              <Boton variante="secundario" onClick={() => setSesion({ clave: Date.now(), titulo: 'Repaso de errores', preguntas: cola })}>
                Repasar las {cola.length}
              </Boton>
            )}
          </div>
        </Tarjeta>
      )}

      {top.length > 0 && (
        <Tarjeta className="mt-4">
          <h2 className="mb-3 text-lg font-semibold text-marca">Tus preguntas más falladas</h2>
          <ol className="m-0 grid list-none gap-3 p-0">
            {top.map(({ pregunta, estadistica }) => (
              <li key={pregunta.id} className="flex items-start justify-between gap-3 border-b border-borde pb-3 last:border-0 last:pb-0">
                <span className="text-sm leading-snug text-tinta">{pregunta.enunciado}</span>
                <span className="shrink-0 rounded-full bg-mal-suave px-2.5 py-1 text-xs font-semibold tabular-nums text-mal">
                  {estadistica.errores} error{estadistica.errores === 1 ? '' : 'es'} / {estadistica.vistas}
                </span>
              </li>
            ))}
          </ol>
        </Tarjeta>
      )}
    </>
  )
}

/** D. Práctica inteligente. */
export function Inteligente({ app, ir }: { app: Aplicacion; ir: (r: Ruta) => void }) {
  const base = filtrarPreguntas(app.banco.preguntas, { clase: app.preferencias.clase, incluirComplementarias: true })
  const nueva = (): Sesion => ({ clave: Date.now(), titulo: 'Práctica inteligente', preguntas: seleccionAdaptativa(base, app.estadisticas, 20) })
  const [sesion, setSesion] = useState<Sesion>(nueva)
  return (
    <Practica key={sesion.clave} app={app} modalidad="inteligente" titulo={sesion.titulo} preguntas={sesion.preguntas} onSalir={() => ir('inicio')} onOtra={() => setSesion(nueva())} />
  )
}
