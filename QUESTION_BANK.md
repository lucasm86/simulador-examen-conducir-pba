# Banco de preguntas: extracción, verificación y mantenimiento

## Estado actual (revisión 2026-11-14)

| | Cantidad |
|---|---|
| Preguntas transcriptas (páginas 2–178 del cuestionario) | 618 |
| **Verificadas, en uso** | **531** |
| Excluidas o pendientes | 87 |
| Eliminatorias (marca oficial) entre las verificadas | 20 |
| Con imagen | 194 |
| Aplicables a todas las clases / sólo auto y camioneta | 472 / 59 |

Por materia: señales 105 · conducción preventiva 59 · elementos del vehículo 55 · convivencia 46 · prioridades 43 · estacionamiento y maniobras 35 ·
documentación 27 · velocidades 26 · normativa 26 · luces 26 · adelantamiento 25 · alcohol y sustancias 17 · semáforos 16 · siniestros 14 · autopistas 11.

No hay preguntas complementarias (`src/data/banco/complementarias.json` está vacío): todo el banco es oficial.

## Proceso (`npm run banco`)

```
fuentes/cuestionario.pdf
   │  tools/extraccion/extraer.py        transcribe (no decide nada)
   ▼
tools/extraccion/crudo.json
   │  tools/extraccion/imagenes.py       recorta las imágenes de cada pregunta
   │  tools/extraccion/curaduria.py      decisiones editoriales (a mano)
   │  tools/extraccion/construir_banco.py valida y genera
   ▼
src/data/banco/oficial.json   excluidas.json   meta.json     public/img/preguntas/*.jpg
```

Requiere Python 3 con PyMuPDF (`pip install pymupdf`).

### 1. Extracción (`extraer.py`)

- Lee el PDF con PyMuPDF conservando color, tipografía y posición de cada línea.
- **Respuesta correcta:** la opción impresa en verde `#90C852`. En las preguntas «V / F» en una sola línea, la letra en verde.
- **Eliminatoria:** leyenda «(Pregunta de carácter eliminatorio)», en rojo `#EE302E` o dentro del enunciado.
- Reconoce los formatos del documento: `A.` / `a)` / `A –` / viñetas, preguntas numeradas y sin numerar, opciones partidas entre páginas.
- Asocia a cada pregunta las imágenes ubicadas entre el enunciado y las opciones.
- El ID crudo es `pPPP-N` (página y orden en la página); el ID final es `of-pPPP-N`.

### 2. Curaduría (`curaduria.py`)

Único lugar con decisiones humanas. Contiene:

- `EXCLUIDAS`: pregunta → motivo y detalle.
- `PARCHES`: correcciones de transcripción (nunca cambian la clave oficial).
- `TEMAS`: materia, subcategoría, fundamento didáctico, referencia normativa, **evidencia** y referencia al manual.
- `ASIGNACION`: tema de cada pregunta (admite rangos).
- `EXPLICACIONES`: aclaraciones puntuales por pregunta.

### 3. Construcción (`construir_banco.py`)

Falla (y no genera nada) si: una pregunta no excluida no tiene tema; no tiene exactamente una opción correcta; hay contenido duplicado;
falta una imagen; o **una cita normativa no aparece en el texto de la norma** guardado en `fuentes/normativa/`.

## Criterio de verificación

Una pregunta está `verificada` cuando: (1) la clave surge inequívocamente del documento oficial, (2) tiene una sola respuesta correcta,
(3) se leyó y no contradice la normativa vigente ni otra pregunta, y (4) tiene tema y fuente.

Campo `nivelVerificacion`:

- `norma` (520 preguntas): su tema tiene una referencia legal cuya cita textual se comprueba automáticamente.
- `clave-oficial` (11): temas de conducción sin norma específica (airbag, espejos y puntos ciegos); valen por la clave oficial.

Alcance honesto: la comprobación automática garantiza que **el artículo citado existe y dice lo citado**. Que la respuesta de cada pregunta
sea coherente con ese artículo se revisó por lectura, tema por tema, no con una prueba formal pregunta por pregunta.

## Motivos de exclusión

| Motivo | Cant. | Ejemplos |
|---|---|---|
| Conflicto con la norma vigente | 16 | P. 150: 20 cm entre autos estacionados (art. 49: 50 cm). P. 96: 10 km/h en bocacalles (art. 51: 30). P. 131: luz de giro izquierda = «puede sobrepasarlo» (art. 42 inc. f: lo contrario). P. 133: peatones en autopista «salvo senda especial» (art. 46 inc. b: prohibido sin excepción). |
| Ambigua o mal redactada | 14 | Dos opciones marcadas (P. 80); opciones a) y b) ambas legales (P. 127). |
| Sin respuesta marcada | 12 | Sección «14) Seguridad Activa y Pasiva» (P. 540–548), P. 94, P. 261. |
| Pendiente de revisión | 12 | Datos sin fuente identificable; señales de lectura dudosa (P. 192, 206). |
| Desactualizada | 9 | Alcoholemia 0,5 g/l (hoy alcohol cero); cédula azul. |
| Duplicada | 8 | Se conserva una copia. |
| Selección múltiple | 8 | «Marque las opciones…»: tipo no soportado aún. |
| Fuera de alcance B1 | 6 | Tracción a sangre, camión con acoplado. |
| Fragmento de transcripción | 2 | — |

El detalle de cada una está en `src/data/banco/excluidas.json` y en la pantalla «Fuentes y banco de preguntas» de la app.
**Ocho de las excluidas eran eliminatorias en el original:** P. 96 (conflicto), 277 (desactualizada), 73 (pendiente), 137, 542 y 548 (sin respuesta marcada), 145 y 280 (otra clase).

## Eliminatorias

Sólo son eliminatorias las 20 preguntas que el documento marca como tales y que pasaron la verificación. No se asigna ese carácter por criterio propio.
El documento no explica cómo se aplican en el examen real; el simulador adopta la lectura literal (fallar una desaprueba) y permite desactivarla.

## Esquema de una pregunta

Definido en `src/domain/types.ts` (`Pregunta`): `id`, `enunciado`, `opciones[{id,texto}]`, `respuestaCorrecta`, `explicacion`, `categoria`,
`subcategoria`, `clases[]`, `dificultad` (hoy `null`: el documento no gradúa dificultad), `imagen{src,alt}`, `tipo`, `ordenFijo`,
`fuente{documento,pagina,numeroOriginal,seccion}`, `referenciaNormativa`, `referenciaManual`, `fechaRevision`, `estado`, `nivelVerificacion`,
`eliminatoria`, `origen` (`oficial` | `complementaria`).

`ordenFijo` es `true` cuando las opciones se refieren entre sí («A y B son correctas», «Todas las respuestas…») o es verdadero/falso: esas no se mezclan.

## Validador en la app (`src/banco/validador.ts`)

Se ejecuta al cargar y en las pruebas. Detecta: IDs duplicados, opciones vacías o repetidas, respuesta inexistente, falta de fuente,
preguntas incompletas, imagen faltante, preguntas sin verificar, contenido posiblemente duplicado y eliminatorias no oficiales.
Sólo las preguntas `verificada` y sin errores llegan al motor (`informe.aptas`).

## Cómo ampliar el banco

- **Preguntas complementarias:** agregarlas a `src/data/banco/complementarias.json` con `origen: "complementaria"`, `eliminatoria: false`,
  fuente (manual y página) y `estado: "verificada"`. Entran a estudio, repaso y práctica inteligente, nunca a los simulacros.
- **Otras clases:** ampliar `PAG_HASTA` en `extraer.py` (las secciones de motos, cargas, etc. están en las páginas 178–228), curar esas
  preguntas, asignarles sus clases en `construir_banco.py` y habilitar la clase en `CLASES_DISPONIBLES` (`src/banco/banco.ts`).
- **Rescatar una excluida:** quitarla de `EXCLUIDAS`, asignarle tema y reconstruir.

## Limitaciones conocidas

- Las explicaciones se arman con la respuesta oficial + el fundamento del tema (53 temas); 19 preguntas tienen además una aclaración propia.
- Los textos alternativos de las imágenes son genéricos (no describen la escena para no revelar la respuesta ni inventar contenido).
- Los enunciados conservan la redacción del documento, incluidas faltas de acentuación.
- Muchas preguntas con foto provienen del material de CABA incorporado al cuestionario provincial; se excluyeron las que aplican reglas propias de CABA detectadas.
