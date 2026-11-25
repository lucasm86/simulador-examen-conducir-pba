import type { Aplicacion } from '../estado'
import type { Ruta } from '../App'
import { colaDeRepaso } from '../../repaso/repaso'
import { preparacionEstimada, resumenGeneral } from '../../estadisticas/estadisticas'
import { filtrarPreguntas } from '../../banco/banco'
import { pendientes } from '../../motor/examen'
import { Aviso, Boton } from '../componentes/Base'
import { AvisoVigencia, fechaLarga, useVigencia } from '../componentes/AvisoVigencia'

export function Inicio({ app, ir }: { app: Aplicacion; ir: (r: Ruta) => void }) {
  const vigencia = useVigencia(app.banco.meta.fechaRevision)
  const preguntas = filtrarPreguntas(app.banco.preguntas, { clase: app.preferencias.clase })
  const resumen = resumenGeneral(app.historial, preguntas, app.estadisticas)
  const enRepaso = colaDeRepaso(preguntas, app.estadisticas).length
  const prep = preparacionEstimada(app.historial)

  const tarjetas: { ruta: Ruta; titulo: string; texto: string; icono: string; nota?: string }[] = [
    { ruta: 'simulacro', titulo: 'Simular examen', texto: '30 o 40 preguntas al azar, con cronómetro y corrección al final.', icono: '📝' },
    { ruta: 'estudio', titulo: 'Estudiar por temas', texto: 'Elegí una materia y recibí la explicación después de cada respuesta.', icono: '📚' },
    {
      ruta: 'repaso',
      titulo: 'Repasar errores',
      texto: 'Volvé sobre las preguntas que fallaste hasta dominarlas.',
      icono: '🔁',
      nota: enRepaso > 0 ? `${enRepaso} pendiente${enRepaso === 1 ? '' : 's'}` : undefined,
    },
    { ruta: 'progreso', titulo: 'Ver mi progreso', texto: 'Historial, evolución y rendimiento por materia.', icono: '📈' },
  ]

  return (
    <>
      <header className="mb-6 pt-2 text-center sm:pt-6">
        <h1 className="text-2xl font-bold tracking-tight text-marca sm:text-4xl">SIMULADOR DE EXAMEN DE CONDUCIR</h1>
        <p className="mt-2 text-base text-tinta-2 sm:text-lg">Prepará tu examen teórico de la Provincia de Buenos Aires</p>
      </header>

      <AvisoVigencia vigencia={vigencia} fechaRevision={app.banco.meta.fechaRevision} />

      {app.examen && (
        <div className="mb-5">
          <Aviso tono="aviso">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                Tenés un simulacro sin terminar ({app.examen.preguntas.length - pendientes(app.examen).length} de {app.examen.preguntas.length} respondidas). El
                cronómetro siguió corriendo.
              </span>
              <Boton onClick={() => ir('examen')}>Continuar simulacro</Boton>
            </div>
          </Aviso>
        </div>
      )}

      <nav aria-label="Modos de uso" className="grid gap-4 sm:grid-cols-2">
        {tarjetas.map((t) => (
          <button
            key={t.ruta}
            type="button"
            onClick={() => ir(t.ruta)}
            className="group flex min-h-28 items-start gap-4 rounded-2xl border border-borde bg-superficie p-5 text-left transition-colors hover:border-acento"
          >
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-acento-suave text-2xl">
              {t.icono}
            </span>
            <span className="flex-1">
              <span className="flex flex-wrap items-center gap-2 text-lg font-semibold text-marca group-hover:text-acento">
                {t.titulo}
                {t.nota && <span className="rounded-full bg-aviso-suave px-2 py-0.5 text-xs font-semibold text-aviso">{t.nota}</span>}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-tinta-2">{t.texto}</span>
            </span>
          </button>
        ))}
      </nav>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => ir('inteligente')}
          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-acento/50 bg-acento-suave/50 px-5 py-3 text-left hover:border-acento"
        >
          <span>
            <span className="font-semibold text-marca">Práctica inteligente</span>
            <span className="block text-sm text-tinta-2">20 preguntas elegidas según tus errores, tus materias más flojas y lo que todavía no viste.</span>
          </span>
          <span aria-hidden="true" className="text-xl text-acento">
            →
          </span>
        </button>
      </div>

      <section aria-label="Resumen de tu desempeño" className="mt-6 rounded-2xl border border-borde bg-superficie px-5 py-4 text-sm text-tinta-2">
        {resumen.simulacros === 0 && resumen.preguntasRespondidas === 0 ? (
          <p>Todavía no hay actividad registrada. Tus resultados se guardan sólo en este dispositivo, sin contraseña ni cuenta.</p>
        ) : (
          <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-1 p-0">
            <li>
              Simulacros: <strong className="text-tinta">{resumen.simulacros}</strong>
            </li>
            <li>
              Promedio: <strong className="text-tinta">{resumen.promedio == null ? '—' : `${resumen.promedio} %`}</strong>
            </li>
            <li>
              Mejor: <strong className="text-tinta">{resumen.mejor == null ? '—' : `${resumen.mejor} %`}</strong>
            </li>
            <li>
              Dominadas: <strong className="text-tinta">{resumen.dominadas}</strong> de {resumen.totalBanco}
            </li>
            <li>
              Preparación: <strong className="text-tinta">{prep.etiqueta}</strong>
            </li>
          </ul>
        )}
      </section>

      <p className="mt-6 text-center text-xs leading-relaxed text-tinta-3">
        Simulador educativo independiente. No es una evaluación oficial ni pertenece al Gobierno de la Provincia de Buenos Aires.{' '}
        <button type="button" className="font-medium text-acento underline" onClick={() => ir('acerca')}>
          Fuentes, banco de preguntas y limitaciones
        </button>
        {vigencia.comprobadoEl && (
          <span className="mt-1 block">
            Preguntas revisadas contra la normativa el {fechaLarga(app.banco.meta.fechaRevision)}. Fuentes oficiales comprobadas el {fechaLarga(vigencia.comprobadoEl)}: sin cambios.
          </span>
        )}
      </p>
    </>
  )
}
