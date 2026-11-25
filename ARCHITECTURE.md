# Arquitectura técnica

React 19 + TypeScript (estricto) + Vite 6 + Tailwind CSS 4. Pruebas con Vitest, jsdom y Testing Library. Sin backend, sin claves de API, sin dependencias de ejecución más que React.

## Capas

```
src/ui  ──►  src/motor, evaluacion, repaso, estadisticas  ──►  src/domain (tipos)
   │                         ▲
   └──►  src/persistencia    └──  src/banco  ◄── src/data/banco/*.json
```

La lógica es TypeScript puro, sin React ni acceso directo al navegador: funciones que reciben datos y devuelven datos nuevos (inmutables). El azar (`Rng`) y el reloj (`ahoraMs`) se inyectan, por eso todo es testeable y reproducible.

| Módulo | Archivo | Responsabilidad |
|---|---|---|
| Dominio | `src/domain/types.ts` | `Pregunta`, `SesionExamen`, `Intento`, `EstadisticaPregunta`, `Preferencias`. Pensados para mapear a tablas. |
| Banco | `src/banco/banco.ts` | Carga los JSON, valida, expone sólo preguntas aptas, filtros por clase y materia. |
| Validación | `src/banco/validador.ts` | Informe de hallazgos; `aptas` = verificadas y sin errores. |
| Motor | `src/motor/examen.ts`, `aleatorio.ts` | Crear examen, responder, navegar, cronómetro, validar sesión recuperada; mezcla y muestreo (uniforme y ponderado). |
| Evaluación | `src/evaluacion/evaluacion.ts` | Corrección, porcentaje, 75 %, eliminatorias, desglose por materia. |
| Repaso | `src/repaso/repaso.ts` | Estadísticas por pregunta, dominio, cola de repaso, selección adaptativa. |
| Estadísticas | `src/estadisticas/estadisticas.ts` | Resumen, evolución, aciertos por materia, preparación estimada. |
| Persistencia | `src/persistencia/almacen.ts` | `localStorage` con claves versionadas, tolerancia a datos corruptos, exportar y reiniciar. |
| Vigencia | `src/vigencia/vigencia.ts` | Lee `estado.json` (rama `estado`, escrito por el workflow semanal) y decide si avisar: fuentes cambiadas o revisión vieja. Nunca lanza ni bloquea sin red. |
| Interfaz | `src/ui/` | Pantallas, componentes y el estado global. |
| Importación | `tools/extraccion/` | Canal Python que genera el banco (ver QUESTION_BANK.md). No forma parte del bundle. |

## Interfaz

- `ui/estado.ts` — hook `useAplicacion()`: única fuente de verdad en memoria (banco, historial, estadísticas, preferencias, examen en curso) y único punto de escritura al almacén.
- `ui/App.tsx` — enrutador mínimo por hash (`#/ruta/parametro`): funciona abriendo `dist/index.html` desde cualquier servidor estático y respeta el botón Atrás. Rutas: `inicio`, `simulacro`, `examen`, `resultado/:id`, `revision/:id`, `estudio`, `repaso`, `inteligente`, `progreso`, `acerca`.
- `ui/pantallas/` — `Inicio`, `ConfigExamen`, `Examen`, `Resultados` (+ `Revision`), `Aprender` (`Estudio`, `Repaso`, `Inteligente`), `Practica` (sesión compartida por los tres modos de aprendizaje), `Progreso`, `Acerca`.
- `ui/componentes/` — `TarjetaPregunta` (+ `Explicacion`), `Graficos` (SVG/CSS propios, sin librería), `Base` (botón, tarjeta, aviso, diálogo, barra de progreso), `LimiteDeErrores`.

`ui/atajos.ts` (`useAtajos`) concentra los atajos de teclado de todas las pantallas de preguntas; ignora los campos de texto y deja que `Enter` sobre un botón haga su propia acción (salvo en las opciones de respuesta, donde significa «siguiente»).

`TarjetaPregunta` recibe `mostrarSolucion`; `Examen` siempre pasa `false`. Esa es la garantía de que el simulacro no revela respuestas.

## Flujo de un simulacro

1. `crearExamen(banco, config)` elige N preguntas distintas y fija el orden de opciones → `SesionExamen`.
2. Cada interacción produce una sesión nueva (`responder`, `irA`) que `actualizarExamen` guarda en estado y en `localStorage`.
3. Al finalizar (usuario o tiempo): `evaluarSesion` → `Intento`; se actualizan estadísticas por pregunta, se guarda el intento y se borra el examen en curso.
4. Al iniciar la app, `sesionValida` comprueba que la sesión guardada siga siendo compatible con el banco; si no, se descarta.

## Persistencia

Claves bajo el prefijo `simulador-pba:v1:`:

- Globales: `perfiles` (lista de personas) y `perfil-activo`.
- Por persona, bajo `simulador-pba:v1:p:<idPerfil>:`: `historial`, `estadisticas`, `examen-en-curso`, `preferencias`. `clavesDe(perfilId)` las calcula; `Almacen(kv, perfilId)` lee y escribe sólo las de esa persona.
- `RegistroPerfiles` (`persistencia/perfiles.ts`) administra la lista: crear (valida el nombre y, si es la primera persona, **migra** las claves globales de la versión sin perfiles a ella), activar, eliminar (borra sus claves) y `resumenDe` para el selector.
- En la interfaz, `App` es la raíz: sin persona activa muestra `Perfiles`; con una, monta `AppPerfil` con `key = idPerfil`, de modo que al cambiar de persona se descarta todo el estado en memoria y `useAplicacion(perfil)` carga el de la nueva. Para un cambio incompatible de formato, subir la versión del prefijo y escribir una migración en `Almacen`.
`Almacen` recibe un `AlmacenClaveValor` (por defecto `localStorage`; en memoria si está bloqueado), lo que permite reemplazarlo por IndexedDB o por una API remota sin tocar el resto.
El volumen es pequeño: un intento de 40 preguntas con detalle ocupa unos 4 KB.

## Datos

`src/data/banco/oficial.json` (≈0,9 MB) se importa estáticamente y queda dentro del bundle (JS ≈1,1 MB, 170 KB comprimido). Las imágenes (≈10 MB, JPEG) se sirven desde `public/img/preguntas/` y se cargan sólo al mostrarse.
Agregar preguntas no requiere tocar código: basta con sumar entradas a los JSON (o regenerarlos).

## Pruebas (`npm test`, 149 casos)

| Archivo | Cubre |
|---|---|
| `banco/banco.test.ts` | Cada regla del validador; filtros; integridad del banco real (sin errores, ≥ 40 para B1, imágenes presentes, excluidas fuera). |
| `motor/examen.test.ts` | Sin duplicados, combinaciones distintas, clase, exclusión de no verificadas, insuficiencia, mezcla de opciones, navegación, cronómetro, sesión recuperada. |
| `evaluacion/evaluacion.test.ts` | Corrección, porcentajes, 75 % (23/30, 30/40), eliminatorias, examen de 40 de punta a punta, cierre por tiempo. |
| `repaso/repaso.test.ts` | Registro de errores, prioridad (3 errores > 1), dominio, más falladas, cada criterio de la selección adaptativa. |
| `persistencia/almacen.test.ts` | Guardar y recuperar, examen interrumpido, datos corruptos, exportar, reiniciar. |
| `persistencia/perfiles.test.ts` | Validación de nombres, registro y persona activa, datos separados por persona, migración de datos previos, eliminar. |
| `estadisticas/estadisticas.test.ts` | Resumen, evolución, aciertos por materia, preparación. |
| `ui/Perfiles.test.tsx` | Primer registro con validación, recarga sin volver a preguntar, dos personas con progreso separado, nombre repetido, nombre en el resultado, eliminar con confirmación. |
| `ui/Atajos.test.tsx` | Teclado en el simulacro (números, Enter, Retroceso, Esc, última pregunta, Enter sobre botones) y en estudio y práctica inteligente. |
| `ui/App.test.tsx` | Con el banco real: inicio; simulacro de 40 completo con revisión; recarga a mitad de examen; estudio → repaso → dominada; progreso y reinicio. |

## Decisiones

- **Hash router propio** en lugar de una librería: diez rutas, cero dependencias.
- **Gráficos propios**: dos gráficos simples no justifican una librería.
- **Cronómetro por hora de inicio** y no por contador: sobrevive a recargas y a pestañas en segundo plano.
- **Estadísticas actualizadas en cada respuesta** en los modos de aprendizaje: nada se pierde si se cierra la pestaña.
- **El canal de importación es Python** (PyMuPDF lee color y posición del PDF); la app nunca procesa PDF.

## Evolución prevista

- **PWA:** agregar `vite-plugin-pwa` con precache del bundle y cache de imágenes; la app ya no depende de la red en tiempo de ejecución.
- **Bundle:** cargar el banco con `import()` dinámico o `fetch` si crece.
- **Backend opcional:** implementar `AlmacenClaveValor` contra una API para sincronizar entre dispositivos.
- **Más clases y preguntas de selección múltiple:** ver QUESTION_BANK.md; requiere un `tipo` nuevo en `Pregunta`, en `TarjetaPregunta` y en `evaluar`.
