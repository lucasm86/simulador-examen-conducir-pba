# Especificación funcional

Simulador educativo independiente del examen teórico de conducir de la Provincia de Buenos Aires. Clase B1. Sin registro, sin backend, en español argentino.

## 0. Personas (perfiles locales)

Pensado para que varias personas compartan un mismo equipo sin mezclar su progreso. No hay contraseña, cuenta ni servidor: es sólo un nombre.

- **Primera vez:** pantalla «¡Bienvenido/a al simulador!» con un único campo, «¿Cómo te llamás?». El nombre se normaliza (espacios), debe tener entre 2 y 24 caracteres y no puede repetirse (sin distinguir mayúsculas ni acentos). Hasta 8 personas por dispositivo.
- **Después:** el simulador recuerda a la última persona y entra directo. Una barra superior muestra «Estudia: *nombre*» con el botón «Cambiar de persona», que lleva al selector.
- **Selector «¿Quién va a estudiar?»:** una tarjeta por persona con la cantidad de simulacros, la fecha de la última actividad y si tiene un simulacro sin terminar; «+ Agregar otra persona»; y eliminar (con confirmación; borra todos sus datos).
- **Qué es individual:** historial, estadísticas por pregunta (errores, dominadas, lista de repaso), simulacro en curso y preferencias. Estudiar por temas, Repasar errores y Práctica inteligente trabajan sobre los datos de la persona activa.
- **Dónde se ve el nombre:** barra superior, encabezado del simulacro en curso, resultado y revisión, título de «Progreso» y archivo exportado.
- **Datos previos:** si el navegador ya tenía progreso de la versión sin personas, pasa a la primera persona que se registre.
- **Límites:** los perfiles viven en el navegador de cada dispositivo; no se sincronizan entre equipos y borrar los datos del navegador los elimina (exportar el historial sirve de copia). Al no haber contraseña, cualquiera que use el equipo puede elegir a cualquier persona.

## 1. Pantalla de inicio

- Título «SIMULADOR DE EXAMEN DE CONDUCIR» y subtítulo «Prepará tu examen teórico de la Provincia de Buenos Aires».
- Cuatro tarjetas: Simular examen, Estudiar por temas, Repasar errores (con contador de pendientes), Ver mi progreso. Acceso a Práctica inteligente.
- Resumen discreto: simulacros, promedio, mejor resultado, dominadas, preparación.
- Si hay un simulacro sin terminar, aviso con botón «Continuar simulacro».
- Aclaración permanente de que no es una evaluación oficial y enlace a «Fuentes y banco de preguntas».

## 2. Modos

### A. Simulacro

Configuración: 30 o 40 preguntas; clase (B1; el resto figura como «próximamente»); tiempo (30, 45, 60, 90, 120 min o sin límite; por defecto 120 para 40 y 90 para 30); aplicar eliminatorias (sí por defecto).

Durante el examen:

- Una pregunta por pantalla, opciones como botones grandes, imagen cuando corresponde.
- Encabezado fijo: «Pregunta N de M», barra de progreso (respondidas), cronómetro; aviso cuando quedan menos de 5 minutos.
- Anterior / Siguiente; grilla «Ver todas las preguntas» para saltar a cualquiera; se puede cambiar la respuesta hasta finalizar.
- Nunca se muestra la respuesta correcta ni la explicación.
- «Finalizar examen» disponible siempre; pide confirmación y lista las preguntas sin responder.
- Cierre automático al agotarse el tiempo.
- Atajos: `1`–`9` elige opción, `←` `→` navega, `↑` `↓` mueve el foco entre opciones.

Reglas:

1. No se repiten preguntas dentro de un examen.
2. Preguntas al azar; opciones mezcladas salvo en preguntas de orden fijo (verdadero/falso y opciones que se refieren entre sí).
3. Las respuestas se conservan al retroceder.
4. Sólo preguntas oficiales verificadas de la clase elegida.
5. Si no alcanzan las preguntas verificadas, la modalidad se deshabilita con una explicación. Nunca se completa con otras.
6. Todo cambio se guarda: al recargar, el examen sigue donde estaba. El cronómetro se calcula desde la hora de inicio, así que sigue corriendo aunque la página esté cerrada.

### Evaluación

- Aprobado si correctas ≥ ⌈75 % del total⌉ (40 → 30; 30 → 23) **y**, con eliminatorias activadas, ninguna pregunta eliminatoria fallada o sin responder.
- Las preguntas sin responder cuentan como no acertadas.
- Porcentaje redondeado al entero más cercano.

### Resultados

Total, correctas, incorrectas, sin responder, porcentaje, tiempo utilizado, APROBADO / DESAPROBADO, resultado específico de eliminatorias, barras de desempeño por materia con la marca del 75 %. Botones «Revisar mis respuestas» y «Realizar otro examen».

Revisión: cada pregunta con la opción elegida, la correcta, el fundamento, la norma, la referencia al manual y la página del cuestionario. Filtro «Sólo las incorrectas».

### B. Estudio por temas

- 15 materias; por cada una: cantidad de preguntas, dominadas y porcentaje de aciertos.
- Sesiones de 10, 20 o todas las preguntas de la materia, en orden aleatorio.
- Tras responder: correcto/incorrecto, opción correcta resaltada, fundamento y referencias.
- Acciones: Repetir la pregunta, Marcar como dominada, Siguiente. Sin tiempo ni penalización.

### C. Repaso de errores

- Cola con las preguntas falladas alguna vez y todavía no dominadas, ordenadas por prioridad (`errores × 2 − racha de aciertos`; desempata el error más reciente).
- Sesiones de hasta 20 (o toda la cola). Una pregunta fallada vuelve al final de la sesión hasta responderla bien.
- Lista de «preguntas más falladas».
- **Dominada:** marcada a mano; o 3 aciertos seguidos después de un error; o al menos 2 aciertos sin errores. Volver a fallarla le quita la condición.

### D. Práctica inteligente

20 preguntas por muestreo ponderado sin repetición. El peso de cada pregunta suma: tasa de error propia, bajo rendimiento de su materia (con al menos 3 respuestas), nunca respondida, y antigüedad de la última práctica (satura a los 14 días). Las dominadas pesan mucho menos. La dificultad sólo influiría si el banco la tuviera fundamentada (hoy no).

## 3. Progreso

- Datos: simulacros (y aprobados), promedio, mejor resultado, dominadas.
- Preparación estimada (0–100): promedio de los últimos 5 simulacros ponderando más los recientes, menos hasta 10 puntos según la proporción de desaprobados. Requiere 3 simulacros. Se aclara que no garantiza aprobar el examen oficial.
- Evolución de los últimos 10 simulacros (línea con referencia en 75 %, detalle al pasar el cursor o con Tab, tabla alternativa para lectores de pantalla).
- Aciertos por materia sobre todas las respuestas registradas.
- Preguntas más falladas e historial (fecha, modalidad, aciertos, duración, resultado; los simulacros enlazan a su resultado).
- Exportar historial a JSON y Reiniciar historial (con confirmación); ambos actúan sólo sobre la persona activa.

## 4. Datos que se guardan (sólo en el navegador)

- Cada intento: fecha, modalidad, clase, duración, total, respondidas, correctas, incorrectas, sin responder, porcentaje, aprobado, eliminatorias, desempeño por materia y detalle por pregunta (el detalle se conserva para los 30 más recientes; máximo 300 intentos).
- Por pregunta: vistas, aciertos, errores, racha, última vez, último error, dominada.
- Examen en curso y preferencias.
- Todo lo anterior se guarda por persona (ver sección 0), más la lista de personas y cuál está activa.

Las sesiones de estudio, repaso y práctica inteligente se registran al terminarlas o abandonarlas, con el primer intento de cada pregunta.

## 5. Accesibilidad y diseño

- Pensado primero para celular (ancho máximo de contenido 768 px; sin desplazamiento horizontal).
- Controles de al menos 44–48 px; foco visible; enlace «Saltar al contenido».
- Opciones como `radiogroup`; diálogos nativos con foco atrapado; cronómetro con `role="timer"`; estados anunciados con `aria-live`.
- Aprobado/desaprobado y correcto/incorrecto se indican con texto y símbolo, no sólo con color.
- Respeta `prefers-reduced-motion`.

## 6. Mensajes de error

- Banco con errores de validación: aviso general y exclusión automática de las preguntas afectadas.
- Falta de preguntas para una modalidad: opción deshabilitada con explicación.
- Almacenamiento bloqueado o dañado: la app funciona sin persistir, o ignora el dato corrupto.
- Error inesperado: pantalla con mensaje y botón «Recargar» (el historial no se borra).

## 7. Fuera de alcance en esta versión

Clases distintas de B1; preguntas de selección múltiple; preguntas complementarias redactadas a partir del manual; PWA / uso sin conexión; importar un historial exportado; sincronizar personas entre dispositivos; renombrar una persona; modo oscuro.
