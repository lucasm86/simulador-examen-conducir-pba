import type { Aplicacion } from '../estado'
import type { Ruta } from '../App'
import { Aviso, Dato, Tarjeta, Titulo } from '../componentes/Base'

export function Acerca({ app, ir }: { app: Aplicacion; ir: (r: Ruta) => void }) {
  const { meta, excluidas, informe } = app.banco
  const motivos = Object.entries(meta.totales.porMotivoDeExclusion as Record<string, number>).sort((a, b) => b[1] - a[1])
  const descripcion = (m: string) => excluidas.find((e) => e.motivo === m)?.motivoDescripcion ?? m

  return (
    <>
      <Titulo volver={() => ir('inicio')}>Fuentes y banco de preguntas</Titulo>
      <Aviso tono="aviso">
        Este es un simulador educativo independiente. No es una evaluación oficial ni está avalado por el Gobierno de la Provincia de Buenos Aires. El examen
        real puede incluir preguntas distintas y criterios propios de cada municipio.
      </Aviso>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Dato etiqueta="Verificadas" valor={app.banco.preguntas.length} nota="en uso" />
        <Dato etiqueta="Excluidas" valor={excluidas.length} nota="no se muestran" />
        <Dato etiqueta="Eliminatorias" valor={meta.totales.eliminatorias} nota="marca oficial" />
        <Dato etiqueta="Con imagen" valor={meta.totales.conImagen} />
      </div>

      <Tarjeta className="mt-4 text-sm leading-relaxed">
        <h2 className="mb-2 text-lg font-semibold text-marca">De dónde salen las preguntas</h2>
        <p>
          Todas las preguntas provienen de la <strong>«{meta.fuente.documento}»</strong>, publicada por la Dirección Provincial de Política y Seguridad Vial.
          Se procesaron las páginas {meta.fuente.paginasProcesadas}. La respuesta correcta es la que el documento resalta en verde.
        </p>
        <p className="mt-2">
          Cada respuesta se contrastó con el texto vigente de la Ley nacional 24.449, la Ley provincial 13.927, el Decreto provincial 532/09 y la Ley
          provincial 15.402 (alcohol cero). Fecha de revisión normativa: <strong>{meta.fechaRevision}</strong>.
        </p>
        <p className="mt-2 break-words text-tinta-2">
          Documento oficial:{' '}
          <a className="text-acento underline" href={meta.fuente.urlOficial} target="_blank" rel="noreferrer">
            {meta.fuente.urlOficial}
          </a>
          . Al construir el banco el sitio oficial estaba en mantenimiento y se usó la copia archivada en Wayback Machine del 16/09/2026; el mismo día
          se comprobó que es idéntica (mismo SHA-256) a la publicada en el sitio oficial.
        </p>
      </Tarjeta>

      <Tarjeta className="mt-4 text-sm leading-relaxed">
        <h2 className="mb-2 text-lg font-semibold text-marca">Preguntas que quedaron afuera</h2>
        <p className="mb-3 text-tinta-2">
          De {meta.totales.transcriptas} preguntas transcriptas, {excluidas.length} no entran a ningún examen ni sesión de estudio:
        </p>
        <ul className="m-0 grid list-none gap-2 p-0">
          {motivos.map(([m, n]) => (
            <li key={m} className="flex gap-3">
              <span className="w-8 shrink-0 text-right font-semibold tabular-nums text-marca">{n}</span>
              <span>{descripcion(m)}</span>
            </li>
          ))}
        </ul>
        <details className="mt-4">
          <summary className="min-h-11 cursor-pointer py-2 font-medium text-acento">Ver el detalle de las {excluidas.length} preguntas excluidas</summary>
          <ul className="m-0 mt-2 grid list-none gap-3 p-0">
            {excluidas.map((e) => (
              <li key={e.id} className="border-b border-borde pb-3 last:border-0">
                <p className="text-tinta">{e.enunciado}</p>
                <p className="mt-1 text-xs text-tinta-2">
                  Pág. {e.pagina}
                  {e.numeroOriginal ? ` · pregunta ${e.numeroOriginal}` : ''} · <strong>{e.motivo}</strong>
                  {e.detalle ? ` — ${e.detalle}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </details>
      </Tarjeta>

      <Tarjeta className="mt-4 text-sm leading-relaxed">
        <h2 className="mb-2 text-lg font-semibold text-marca">Estado del validador</h2>
        <p>
          {informe.errores === 0 ? '✓ El banco cargado no tiene errores de validación' : `✗ El validador encontró ${informe.errores} errores`} ({informe.advertencias}{' '}
          advertencias). Sólo las preguntas verificadas y sin errores llegan al motor de exámenes.
        </p>
      </Tarjeta>
    </>
  )
}
