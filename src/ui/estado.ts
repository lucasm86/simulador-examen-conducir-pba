import { useCallback, useMemo, useState } from 'react'
import type { Intento, MapaEstadisticas, Preferencias, ResultadoPregunta, SesionExamen } from '../domain/types'
import { obtenerBanco } from '../banco/banco'
import { sesionValida } from '../motor/examen'
import { Almacen } from '../persistencia/almacen'
import { marcarDominada, registrarResultados } from '../repaso/repaso'

/** Estado global de la app: banco + datos persistidos. Toda escritura pasa por acá. */
export function useAplicacion() {
  const banco = useMemo(() => obtenerBanco(), [])
  const almacen = useMemo(() => new Almacen(), [])
  const [historial, setHistorial] = useState<Intento[]>(() => almacen.leerHistorial())
  const [estadisticas, setEstadisticas] = useState<MapaEstadisticas>(() => almacen.leerEstadisticas())
  const [preferencias, setPreferencias] = useState<Preferencias>(() => almacen.leerPreferencias())
  const [examen, setExamen] = useState<SesionExamen | null>(() => {
    const s = almacen.leerExamenEnCurso()
    if (s && sesionValida(s, banco.porId)) return s
    if (s) almacen.borrarExamenEnCurso() // sesión incompatible con el banco actual
    return null
  })

  const actualizarExamen = useCallback(
    (s: SesionExamen | null) => {
      setExamen(s)
      if (s) almacen.guardarExamenEnCurso(s)
      else almacen.borrarExamenEnCurso()
    },
    [almacen],
  )

  const registrarRespuestas = useCallback(
    (resultados: ResultadoPregunta[], fecha: string) => {
      setEstadisticas((prev) => {
        const nuevo = registrarResultados(prev, resultados, fecha)
        almacen.guardarEstadisticas(nuevo)
        return nuevo
      })
    },
    [almacen],
  )

  const guardarIntento = useCallback(
    (intento: Intento) => {
      setHistorial(almacen.guardarIntento(intento))
    },
    [almacen],
  )

  const alternarDominada = useCallback(
    (id: string, dominada: boolean) => {
      setEstadisticas((prev) => {
        const nuevo = marcarDominada(prev, id, dominada)
        almacen.guardarEstadisticas(nuevo)
        return nuevo
      })
    },
    [almacen],
  )

  const guardarPreferencias = useCallback(
    (p: Preferencias) => {
      setPreferencias(p)
      almacen.guardarPreferencias(p)
    },
    [almacen],
  )

  const reiniciar = useCallback(() => {
    almacen.reiniciar()
    setHistorial([])
    setEstadisticas({})
    setExamen(null)
  }, [almacen])

  const exportar = useCallback(() => almacen.exportar(), [almacen])

  return {
    banco,
    historial,
    estadisticas,
    preferencias,
    examen,
    actualizarExamen,
    registrarRespuestas,
    guardarIntento,
    alternarDominada,
    guardarPreferencias,
    reiniciar,
    exportar,
  }
}

export type Aplicacion = ReturnType<typeof useAplicacion>
