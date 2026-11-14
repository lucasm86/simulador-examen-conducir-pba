/** Generador de números aleatorios en [0, 1). Inyectable para poder testear. */
export type Rng = () => number

/** PRNG determinístico (mulberry32) para pruebas y reproducibilidad. */
export function rngConSemilla(semilla: number): Rng {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates. No modifica el arreglo original. */
export function mezclar<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const copia = [...items]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/** Toma `n` elementos distintos al azar. */
export function muestra<T>(items: readonly T[], n: number, rng: Rng = Math.random): T[] {
  return mezclar(items, rng).slice(0, Math.max(0, n))
}

/**
 * Muestreo ponderado sin reposición (Efraimidis–Spirakis).
 * Los pesos <= 0 se tratan como un peso mínimo para que todo elemento sea elegible.
 */
export function muestraPonderada<T>(items: readonly T[], pesos: readonly number[], n: number, rng: Rng = Math.random): T[] {
  const claves = items.map((item, i) => {
    const w = Math.max(pesos[i] ?? 0, 1e-6)
    const u = Math.max(rng(), 1e-12)
    return { item, clave: Math.pow(u, 1 / w) }
  })
  claves.sort((a, b) => b.clave - a.clave)
  return claves.slice(0, Math.max(0, n)).map((c) => c.item)
}

export function nuevoId(prefijo: string, rng: Rng = Math.random): string {
  return `${prefijo}-${Date.now().toString(36)}-${Math.floor(rng() * 1e9).toString(36)}`
}
