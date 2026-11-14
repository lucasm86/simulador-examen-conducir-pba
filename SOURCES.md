# Fuentes

Fecha de revisión normativa de todo el banco: **2026-11-14**.

## Documentos oficiales de estudio

| Documento | URL oficial | Archivo local | SHA-256 |
|---|---|---|---|
| Batería de preguntas y respuestas – Examen teórico Licencia de Conducir (IF-2019-33101289-GDEBA-DPPYSVMGGP), 229 páginas | https://www.gba.gob.ar/static/seguridadvial/docs/cuestionario.pdf | `fuentes/cuestionario.pdf` | `4a894436d6164f080b785f48fac76d60b85a198ef99e8e9dab1260eda61cfb65` |
| Manual del Conductor de la Provincia de Buenos Aires (IF-2019-33097300-GDEBA-DPPYSVMGGP), 185 páginas | https://www.gba.gob.ar/static/seguridadvial/docs/manual_del_conductor.pdf | `fuentes/manual_del_conductor.pdf` | `b3ff30998455f7e5d19e50becbd0b0736454580230747a8f2636913f6b6b219c` |

Página institucional: https://www.gba.gob.ar/seguridadvial/licencias_de_conducir

### Cómo se obtuvieron

El 2026-11-14, al iniciar el proyecto, todo `gba.gob.ar` respondía «503 – En mantenimiento». Con autorización del responsable del proyecto se
descargaron las copias de Wayback Machine:

- `https://web.archive.org/web/20260916145504/https://www.gba.gob.ar/static/seguridadvial/docs/cuestionario.pdf`
- `https://web.archive.org/web/20260916145503/https://www.gba.gob.ar/static/seguridadvial/docs/manual_del_conductor.pdf`

Ese mismo día, cuando el sitio volvió a estar disponible, se ejecutó `npm run fuentes:check`: **los dos archivos publicados en el sitio oficial
son idénticos (mismo SHA-256) a las copias usadas**. Metadatos de los PDF: creados el 23/09/2019, modificados el 17/09/2025.

### Mantenimiento

```bash
npm run fuentes:check
```

Descarga los PDF de la URL oficial y compara su hash con `fuentes/*.pdf` (salida 0 = sin cambios, 1 = cambiaron, 2 = no se pudo comprobar).
Con `python -I tools/extraccion/verificar_fuentes.py --guardar` deja las versiones nuevas en `fuentes/nuevas/`.
Si hay cambios: revisar el documento, reemplazarlo en `fuentes/`, ejecutar `npm run banco` y repasar la curaduría (ver QUESTION_BANK.md).

## Normativa contrastada

Los textos se guardan en `fuentes/normativa/` y son los que usa la comprobación automática de citas.

| Norma | Texto usado | Origen (consultado el 2026-11-14) |
|---|---|---|
| Ley nacional 24.449 de Tránsito, texto actualizado (incluye Leyes 26.363, 27.425 y la alcoholemia cero del art. 48 inc. a) | `ley-24449-texto-actualizado.txt` | https://www.argentina.gob.ar/normativa/nacional/ley-24449-818/actualizacion |
| Ley PBA 13.927 (Código de Tránsito), texto actualizado con Leyes 14.246 … 15.402, 15.613 y 15.657 | `ley-pba-13927-texto-actualizado.txt` | https://normas.gba.gob.ar/ar-b/ley/2008/13927/2954 |
| Decreto PBA 532/09 (reglamentario), texto actualizado con Decretos 1552/10, 2036/11, 164/17, 1350/18 y 751/23 | `decreto-pba-532-09-texto-actualizado.txt` | https://normas.gba.gob.ar/ar-b/decreto/2009/532/36346 |
| Ley PBA 15.402 (alcohol cero) | `ley-pba-15402.txt` | https://normas.gba.gob.ar/ar-b/ley/2023/15402/334888 |

No se pudo consultar ese día (error del servidor): el texto actualizado del Decreto nacional 779/95 en InfoLEG / argentina.gob.ar. Por eso
ninguna referencia del banco cita ese decreto; la reglamentación citada es siempre la provincial (Decreto 532/09).

Normas mencionadas en explicaciones pero **no** verificadas contra su texto en esta revisión: Ley nacional 27.714 (alcohol cero nacional; su
efecto sí está verificado en el art. 48 inc. a de la Ley 24.449 actualizada), Decreto nacional 32/2018 (retención infantil hasta 10 años) y
Ley de Seguros 17.418, art. 46 (aviso del siniestro en tres días).

## Imágenes

Las 194 imágenes de `public/img/preguntas/` son recortes de las páginas del cuestionario oficial, necesarias para interpretar las preguntas.
El documento no indica una licencia de reutilización; su portada aclara que parte de las preguntas provienen del material de la Ciudad
Autónoma de Buenos Aires, usado con autorización de ese gobierno. Se incluyen con fines educativos, sin fines comerciales y con atribución
a la fuente. Antes de una distribución pública o comercial conviene confirmar las condiciones de uso con la Dirección Provincial de Política
y Seguridad Vial.
