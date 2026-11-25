# Simulador de examen de conducir · Provincia de Buenos Aires

Aplicación web para practicar el examen teórico de la licencia de conducir (clase B1) de la Provincia de Buenos Aires.
Simulador educativo **independiente**: no es una evaluación oficial. Funciona sin backend, sin cuentas y sin claves de API.

## Ejecutar

Requisitos: Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 149 pruebas automatizadas (Vitest)
npm run build      # typecheck + build de producción en dist/
```

## Qué incluye

- **Simulacro** de 30 o 40 preguntas al azar, cronómetro configurable, navegación, confirmación al finalizar, cierre automático por tiempo, corrección al final (75 % + eliminatorias oficiales) y revisión con fundamento.
- **Estudio por temas** (15 materias), **repaso de errores** (prioriza las más falladas, reintenta hasta acertar, marcar como dominada) y **práctica inteligente** (selección adaptativa).
- **Progreso**: historial, evolución de los últimos 10 simulacros, aciertos por materia, más falladas, preparación estimada, exportar a JSON y reiniciar.
- **Personas en un mismo equipo:** un registro sencillo (sólo el nombre) y un selector para alternar; cada persona tiene su propio historial, errores y dominadas.
- **Teclado:** `1`–`9` eligen opción, `Enter` siguiente, `Retroceso` anterior, `Esc` finalizar (en estudio, repaso y práctica: `Retroceso` repite la pregunta y `Esc` termina la sesión).
- **Vigencia:** una tarea semanal de GitHub compara los PDF oficiales con la copia del banco; si cambiaron (o si la revisión normativa tiene más de 90 días) la app lo avisa al abrirse.
- Persistencia en `localStorage`; un simulacro interrumpido se recupera al recargar.

## Banco de preguntas

- 531 preguntas oficiales verificadas (20 eliminatorias, 194 con imagen) en `src/data/banco/oficial.json`.
- 87 excluidas con motivo documentado en `src/data/banco/excluidas.json` (duplicadas, desactualizadas, en conflicto con la ley vigente, ambiguas, sin respuesta, etc.).
- Fuente: «Batería de preguntas y respuestas» de la Dirección Provincial de Política y Seguridad Vial (páginas 2 a 178), contrastada el 2026-11-14 con Ley 24.449, Ley PBA 13.927, Decreto PBA 532/09 y Ley PBA 15.402 (textos en `fuentes/normativa/`).
- Los PDF se obtuvieron de Wayback Machine (captura 2026-09-16) porque gba.gob.ar estaba en mantenimiento; el mismo 2026-11-14 se comprobó con `npm run fuentes:check` que son idénticos a los publicados en el sitio oficial.

Regenerar el banco (requiere Python 3 + PyMuPDF): `npm run banco`.
La curaduría (exclusiones, materias, fundamentos y citas legales) está en `tools/extraccion/curaduria.py`; la construcción falla si una cita no aparece en el texto de la norma.

## Estructura

```
src/domain        tipos
src/banco         carga, filtros y validador del banco
src/motor         selección aleatoria, sesión de examen, cronómetro
src/evaluacion    corrección y criterio de aprobación
src/repaso        errores, dominio y selección adaptativa
src/estadisticas  resumen, evolución, preparación
src/persistencia  almacenamiento local, exportar y reiniciar
src/ui            pantallas y componentes
tools/extraccion  extracción del PDF, imágenes, curaduría y construcción
```

## Documentación

- [SPECS.md](SPECS.md) — especificación funcional.
- [ARCHITECTURE.md](ARCHITECTURE.md) — arquitectura técnica y pruebas.
- [QUESTION_BANK.md](QUESTION_BANK.md) — extracción, verificación y mantenimiento del banco.
- [SOURCES.md](SOURCES.md) — fuentes oficiales, normativa y fechas de revisión.

## Limitaciones conocidas

- Sólo clase B1; las secciones de motos, camiones y transporte del cuestionario no están importadas.
- Las explicaciones se arman por tema (con cita legal comprobada), no redactadas pregunta por pregunta.
- Los textos alternativos de las imágenes son genéricos.
- Las preguntas de selección múltiple del original están excluidas; no hay preguntas complementarias.
- Sin PWA: necesita un servidor estático (o `npm run dev`); no funciona abriendo el HTML con `file://`.
- El criterio de eliminatorias sigue la marca del documento oficial, que no explica cómo se aplica en el examen real.
