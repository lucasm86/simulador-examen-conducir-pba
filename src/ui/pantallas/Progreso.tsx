import { useState } from 'react'
import type { Aplicacion } from '../estado'
import type { Ruta } from '../App'
import type { Modalidad } from '../../domain/types'
import { filtrarPreguntas } from '../../banco/banco'
import { formatearTiempo } from '../../motor/examen'
import { aciertosPorCategoria, evolucion, masFalladas, preparacionEstimada, resumenGeneral } from '../../estadisticas/estadisticas'
import { Aviso, Boton, Dato, Dialogo, fechaHora, Tarjeta, Titulo } from '../componentes/Base'
import { BarrasPorMateria, GraficoEvolucion } from '../componentes/Graficos'

const NOMBRE_MODALIDAD: Record<Modalidad, string> = { simulacro: 'Simulacro', estudio: 'Estudio', repaso: 'Repaso', inteligente: 'Práctica inteligente' }

export function Progreso({ app, ir, verResultado }: { app: Aplicacion; ir: (r: Ruta) => void; verResultado: (id: string) => void }) {
  const [confirmar, setConfirmar] = useState(false)
  const base = filtrarPreguntas(app.banco.preguntas, { clase: app.preferencias.clase, incluirComplementarias: true })
  const resumen = resumenGeneral(app.historial, base, app.estadisticas)
  const evo = evolucion(app.historial, 10)
  const prep = preparacionEstimada(app.historial)
  const materias = aciertosPorCategoria(app.banco.categorias, base, app.estadisticas)
  const falladas = masFalladas(base, app.estadisticas, 5)

  const exportar = () => {
    const blob = new Blob([JSON.stringify(app.exportar(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `simulador-conducir-historial-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Titulo volver={() => ir('inicio')}>Progreso de {app.perfil.nombre}</Titulo>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Dato etiqueta="Simulacros" valor={resumen.simulacros} nota={`${resumen.aprobados} aprobados`} />
        <Dato etiqueta="Promedio" valor={resumen.promedio == null ? '—' : `${resumen.promedio} %`} />
        <Dato etiqueta="Mejor resultado" valor={resumen.mejor == null ? '—' : `${resumen.mejor} %`} />
        <Dato etiqueta="Dominadas" valor={resumen.dominadas} nota={`de ${resumen.totalBanco} preguntas`} />
      </div>

      <Tarjeta className="mt-4">
        <h2 className="text-lg font-semibold text-marca">Preparación estimada</h2>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
          <span className="text-3xl font-bold tabular-nums text-marca">{prep.indice == null ? '—' : `${prep.indice}/100`}</span>
          <span className="text-base font-semibold text-tinta">{prep.etiqueta}</span>
        </div>
        {prep.indice != null && (
          <div className="relative mt-3 h-2.5 rounded-full bg-borde/60" role="img" aria-label={`Índice de preparación ${prep.indice} de 100`}>
            <div className="h-full rounded-full bg-acento" style={{ width: `${prep.indice}%` }} />
          </div>
        )}
        <p className="mt-3 text-sm text-tinta-2">{prep.detalle}</p>
        <p className="mt-2 text-xs leading-relaxed text-tinta-3">
          Estimación orientativa basada en tus últimos {Math.max(prep.simulacrosConsiderados, 3)} simulacros (pesan más los recientes). No garantiza aprobar el
          examen oficial.
        </p>
      </Tarjeta>

      <Tarjeta className="mt-4">
        <h2 className="mb-3 text-lg font-semibold text-marca">Evolución de los últimos simulacros</h2>
        {evo.length === 0 ? <p className="text-sm text-tinta-2">Todavía no completaste ningún simulacro.</p> : <GraficoEvolucion intentos={evo} />}
      </Tarjeta>

      <Tarjeta className="mt-4">
        <h2 className="mb-4 text-lg font-semibold text-marca">Aciertos por materia</h2>
        <BarrasPorMateria
          titulo="Porcentaje de aciertos por materia, sobre todas tus respuestas"
          filas={materias.map((m) => ({ id: m.id, nombre: m.nombre, porcentaje: m.porcentaje, detalle: `${m.aciertos} de ${m.vistas}` }))}
        />
      </Tarjeta>

      {falladas.length > 0 && (
        <Tarjeta className="mt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-marca">Preguntas más falladas</h2>
            <Boton variante="texto" className="px-0" onClick={() => ir('repaso')}>
              Ir a repasar →
            </Boton>
          </div>
          <ol className="m-0 grid list-none gap-2 p-0 text-sm">
            {falladas.map(({ pregunta, estadistica }) => (
              <li key={pregunta.id} className="flex items-start justify-between gap-3">
                <span className="text-tinta">{pregunta.enunciado}</span>
                <span className="shrink-0 tabular-nums text-tinta-2">
                  {estadistica.errores}/{estadistica.vistas}
                </span>
              </li>
            ))}
          </ol>
        </Tarjeta>
      )}

      <Tarjeta className="mt-4">
        <h2 className="mb-3 text-lg font-semibold text-marca">Historial</h2>
        {app.historial.length === 0 ? (
          <p className="text-sm text-tinta-2">Sin actividad registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-borde text-xs uppercase tracking-wide text-tinta-3">
                  <th className="py-2 pr-3 font-medium">Fecha</th>
                  <th className="py-2 pr-3 font-medium">Modalidad</th>
                  <th className="py-2 pr-3 font-medium">Aciertos</th>
                  <th className="py-2 pr-3 font-medium">Duración</th>
                  <th className="py-2 font-medium">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {app.historial.slice(0, 30).map((i) => (
                  <tr key={i.id} className="border-b border-borde/60 last:border-0">
                    <td className="py-2 pr-3 tabular-nums">{fechaHora(i.fecha)}</td>
                    <td className="py-2 pr-3">{NOMBRE_MODALIDAD[i.modalidad]}</td>
                    <td className="py-2 pr-3 tabular-nums">
                      {i.correctas}/{i.total} · {i.porcentaje} %
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{formatearTiempo(i.duracionSeg)}</td>
                    <td className="py-2">
                      {i.modalidad === 'simulacro' ? (
                        <button type="button" className={`min-h-9 font-semibold underline ${i.aprobado ? 'text-bien' : 'text-mal'}`} onClick={() => verResultado(i.id)}>
                          {i.aprobado ? '✓ Aprobado' : '✗ Desaprobado'}
                        </button>
                      ) : (
                        <span className="text-tinta-3">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Boton variante="secundario" onClick={exportar}>
            Exportar historial (JSON)
          </Boton>
          <Boton variante="peligro" onClick={() => setConfirmar(true)}>
            Reiniciar historial
          </Boton>
        </div>
        <p className="mt-3 text-xs text-tinta-3">Los datos de cada persona se guardan únicamente en este navegador. No hay cuentas ni se envía nada a ningún servidor.</p>
      </Tarjeta>

      <Dialogo abierto={confirmar} titulo="¿Reiniciar todo el historial?" onCerrar={() => setConfirmar(false)}>
        <Aviso tono="mal">
          Se van a borrar de este dispositivo los resultados, las estadísticas por pregunta, la lista de repaso y cualquier simulacro en curso de {app.perfil.nombre}. El resto de las personas no se ve afectado. No se puede
          deshacer. Si querés conservar una copia, exportá el historial antes.
        </Aviso>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Boton variante="secundario" onClick={() => setConfirmar(false)}>
            Cancelar
          </Boton>
          <Boton
            variante="peligro"
            onClick={() => {
              app.reiniciar()
              setConfirmar(false)
            }}
          >
            Sí, borrar todo
          </Boton>
        </div>
      </Dialogo>
    </>
  )
}
