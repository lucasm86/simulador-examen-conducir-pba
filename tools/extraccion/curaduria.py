"""Curaduria manual del banco de preguntas (revision: 2026-11-14).

Este archivo es el registro de las decisiones humanas/editoriales tomadas sobre
la transcripcion automatica del cuestionario oficial (crudo.json):

  * EXCLUIDAS  -> preguntas que NO entran al banco, con motivo.
  * PARCHES    -> correcciones de transcripcion (nunca cambian la respuesta oficial).
  * TEMAS      -> materia, subcategoria, fundamento didactico y referencia normativa.
                  Cada referencia lleva "evidencia": expresiones que deben aparecer
                  en el texto de la norma guardado en fuentes/normativa/ (lo comprueba
                  construir_banco.py; si una cita no aparece, la construccion falla).
  * ASIGNACION -> que tema corresponde a cada pregunta.
  * EXPLICACIONES -> aclaraciones puntuales por pregunta.

Claves de norma:  L = Ley nacional 24.449 (texto actualizado)
                  D = Decreto PBA 532/09 (texto actualizado)
                  P = Ley PBA 13.927 (texto actualizado)
                  A = Ley PBA 15.402 (alcohol cero)
"""

FECHA_REVISION = "2026-11-14"

NORMAS = {
    "L": "ley-24449-texto-actualizado.txt",
    "D": "decreto-pba-532-09-texto-actualizado.txt",
    "P": "ley-pba-13927-texto-actualizado.txt",
    "A": "ley-pba-15402.txt",
}

MOTIVOS = {
    "duplicada": "Duplicada: el cuestionario repite la misma pregunta; se conserva una sola copia.",
    "desactualizada": "Desactualizada: la clave oficial (2019) quedó superada por normativa posterior.",
    "conflicto": "Conflicto normativo: la opción marcada como correcta contradice el texto vigente de la ley.",
    "ambigua": "Ambigua o mal redactada: más de una opción defendible o enunciado defectuoso.",
    "sin-respuesta": "Sin respuesta: el documento oficial no marca ninguna opción correcta.",
    "multiple": "Selección múltiple: el original pide marcar varias opciones; no soportado en esta versión.",
    "pendiente": "Pendiente de revisión: no pudo contrastarse con una fuente normativa o técnica.",
    "otra-clase": "Fuera de alcance de la clase B1 (tracción a sangre, camiones, etc.).",
    "transcripcion": "Fragmento de transcripción, no es una pregunta.",
}

# id -> (motivo, detalle)
EXCLUIDAS = {
    # --- duplicadas
    "p008-3": ("duplicada", "Igual a p005-3."),
    "p009-1": ("duplicada", "Igual a p005-4."),
    "p009-2": ("duplicada", "Igual a p006-1."),
    "p026-1": ("duplicada", "Variante de p022-4."),
    "p026-4": ("duplicada", "Igual a p022-5."),
    "p050-5": ("duplicada", "Igual a p062-4 (pregunta 140), que tiene las opciones bien rotuladas."),
    "p071-1": ("duplicada", "Igual a p061-3 (pregunta 135)."),
    "p178-4": ("duplicada", "Igual a p039-2 (pregunta 8)."),
    # --- desactualizadas
    "p023-2": ("desactualizada", "Cédula azul / vencimiento de cédula: el régimen de cédulas de autorizado fue modificado; el Decreto PBA 532/09 (art. 40 inc. b reglam.) ya admite que la tenencia legítima de la cédula acredita el uso por cualquier conductor."),
    "p023-3": ("desactualizada", "Cédulas para autorizados a conducir: régimen modificado."),
    "p023-4": ("desactualizada", "Cédulas para autorizados a conducir: régimen modificado."),
    "p026-2": ("desactualizada", "Cédulas para autorizados a conducir: régimen modificado."),
    "p026-3": ("desactualizada", "Cédula azul: régimen modificado."),
    "p029-3": ("desactualizada", "Marca 0,5 g/l como máximo de alcoholemia. Desde la Ley PBA 15.402 y la Ley nacional 27.714 rige alcohol cero (art. 48 inc. a Ley 24.449)."),
    "p178-2": ("desactualizada", "Pregunta 277 (eliminatoria en el original): marca 0,5 g/l. Hoy rige alcohol cero."),
    "p176-3": ("desactualizada", "Pregunta 266: umbral de 1 g/l; el régimen sancionatorio cambió con la Ley 15.402."),
    "p030-3": ("desactualizada", "Compara la vigilia con el 'nivel de alcohol permitido por ley', que hoy es cero."),
    # --- conflicto con la norma vigente (errores de la clave oficial)
    "p041-5": ("conflicto", "Pregunta 21: el art. 45 Ley 24.449 permite circular por carriles intermedios cuando no hay otro disponible a la derecha."),
    "p041-6": ("conflicto", "Pregunta 22: el art. 41 Ley 24.449 dice que en cuestas estrechas retrocede el que desciende (la prioridad es de quien asciende)."),
    "p042-4": ("conflicto", "Pregunta 26: la frase es textual del art. 49 Ley 24.449, pero la clave la marca Falso."),
    "p053-5": ("conflicto", "Pregunta 91: el art. 44 inc. c Ley 24.449 dice que en vías semaforizadas NO rigen las normas comunes de paso."),
    "p054-5": ("conflicto", "Pregunta 96 (eliminatoria en el original): marca 10 km/h; el art. 51 inc. e.1 Ley 24.449 fija velocidad precautoria nunca superior a 30 km/h."),
    "p060-3": ("conflicto", "Pregunta 130: el art. 42 inc. c Ley 24.449 prevé destellos o bocina en zona rural además de la luz de giro."),
    "p060-4": ("conflicto", "Pregunta 131: el art. 42 inc. f Ley 24.449 dice que la luz de giro izquierda indica la INCONVENIENCIA de adelantarse; la clave dice lo contrario."),
    "p061-1": ("conflicto", "Pregunta 133 (eliminatoria en el original): el art. 46 inc. b Ley 24.449 prohíbe la circulación de peatones en autopistas sin excepción."),
    "p065-1": ("conflicto", "Pregunta 150: marca 20 cm; el art. 49 inc. a Ley 24.449 exige un espacio no inferior a 50 cm entre vehículos."),
    "p068-2": ("conflicto", "Pregunta 167: el art. 47 inc. e Ley 24.449 indica peajes, zonas peligrosas o maniobras riesgosas (opción b)."),
    "p068-5": ("conflicto", "Pregunta 170: en rotondas tiene prioridad el que circula por ella (art. 43 inc. e Ley 24.449)."),
    "p119-2": ("conflicto", "El art. 46 inc. a Ley 24.449 destina el carril izquierdo a la máxima velocidad admitida y al adelantamiento; contradice además a la pregunta 135."),
    "p126-1": ("conflicto", "Marca 40 km/h como velocidad precautoria en bocacalle sin semáforo; la Ley 24.449 (art. 51 inc. e.1) fija 30 km/h. Proviene del material de CABA."),
    "p121-1": ("conflicto", "Giro a la izquierda en cruce sin semáforo: regla propia de CABA; la Ley 24.449 (art. 44 inc. f) sólo lo restringe en vías semaforizadas de doble mano."),
    "p022-3": ("conflicto", "Define 'negligencia' con la fórmula de la inobservancia de los reglamentos."),
    "p175-4": ("conflicto", "Pregunta 262: marca Falso una afirmación correcta sobre los amortiguadores."),
    # --- ambiguas
    "p051-4": ("ambigua", "Pregunta 80: dos opciones contradictorias marcadas como correctas."),
    "p047-3": ("ambigua", "Pregunta 54."),
    "p048-1": ("ambigua", "Pregunta 59: la opción marcada está mal redactada frente a 'detenerse en forma inmediata'."),
    "p052-3": ("ambigua", "Pregunta 83."),
    "p055-4": ("ambigua", "Pregunta 101: redacción defectuosa de las opciones."),
    "p059-5": ("ambigua", "Pregunta 127: las opciones a) y b) son ambas parte del art. 42 inc. c Ley 24.449."),
    "p061-4": ("ambigua", "Pregunta 136: a) y d) son ambas excepciones por emergencia (art. 48 incs. i y ñ)."),
    "p063-1": ("ambigua", "Pregunta 141."),
    "p069-1": ("ambigua", "Pregunta 171: 'mano simple' no es un término de la ley."),
    "p025-5": ("ambigua", "Redacción defectuosa de la opción marcada."),
    "p176-4": ("ambigua", "Pregunta 267: opción marcada mal redactada; la c) también es defendible."),
    "p176-6": ("ambigua", "Pregunta 269: mezcla metros y segundos."),
    "p134-1": ("ambigua", "La respuesta depende de una imagen que no permite verificarla."),
    "p173-6": ("ambigua", "Pregunta 252: errata de unidad (ml por mm). Ver p159-4, que pregunta lo mismo correctamente."),
    # --- sin respuesta / selección múltiple / transcripción
    "p054-3": ("sin-respuesta", "Pregunta 94."),
    "p061-5": ("sin-respuesta", "Pregunta 137: tabla para completar."),
    "p175-3": ("sin-respuesta", "Pregunta 261."),
    "p156-2": ("sin-respuesta", "Pregunta 540."), "p156-3": ("sin-respuesta", "Pregunta 541."),
    "p156-4": ("sin-respuesta", "Pregunta 542."), "p156-5": ("sin-respuesta", "Pregunta 543."),
    "p156-6": ("sin-respuesta", "Pregunta 544."), "p157-1": ("sin-respuesta", "Pregunta 545."),
    "p157-2": ("sin-respuesta", "Pregunta 546."), "p157-3": ("sin-respuesta", "Pregunta 547."),
    "p157-4": ("sin-respuesta", "Pregunta 548."),
    "p038-1": ("multiple", "Pregunta 2."), "p038-2": ("multiple", "Pregunta 3."),
    "p043-5": ("multiple", "Pregunta 32."), "p043-6": ("multiple", "Pregunta 33."),
    "p172-2": ("multiple", "Pregunta 244."), "p173-5": ("multiple", "Pregunta 251."),
    "p174-5": ("multiple", "Pregunta 257."), "p177-3": ("multiple", "Pregunta 272."),
    "p050-1": ("transcripcion", "Resto de la opción c) de la pregunta 71."),
    "p153-1": ("transcripcion", "Opciones de la pregunta p152-2."),
    "p178-5": ("otra-clase", "Pregunta 280: sección de camionetas y vehículos de carga."),
    # --- pendientes de revisión
    "p025-4": ("pendiente", "Lista de documentación (grabado de autopartes, tarjeta verde): requiere contraste con normativa registral vigente."),
    "p050-3": ("pendiente", "Pregunta 73 (eliminatoria en el original): plazo de 10 años para licencias profesionales."),
    "p056-5": ("pendiente", "Pregunta 107."),
    "p064-4": ("pendiente", "Pregunta 149: lado de estacionamiento."),
    "p068-4": ("pendiente", "Pregunta 169: dato fisiológico sin fuente."),
    "p089-2": ("pendiente", "Pregunta 192: la señal (círculo azul con flecha) admite otra lectura (giro obligatorio)."),
    "p093-1": ("pendiente", "Pregunta 206: ídem pregunta 192."),
    "p149-2": ("pendiente", "Velocidad máxima con niebla: sin respaldo normativo identificable."),
    "p167-2": ("pendiente", "Apoyacabezas en todos los asientos: el art. 30 Ley 24.449 remite a la reglamentación."),
    "p174-6": ("pendiente", "Pregunta 258."),
    "p176-2": ("pendiente", "Pregunta 265: tiempo de 'recuperación' del alcohol; con alcohol cero puede inducir a error."),
    "p177-2": ("pendiente", "Pregunta 271: distancia de los triángulos."),
    # --- otra clase
    "p063-4": ("otra-clase", "Pregunta 144: arreo de hacienda."), "p063-5": ("otra-clase", "Pregunta 145: tracción a sangre."),
    "p064-1": ("otra-clase", "Pregunta 146: animales de tiro."), "p064-2": ("otra-clase", "Pregunta 147: jinetes."),
    "p066-2": ("otra-clase", "Pregunta 157: camión con acoplado."),
}

V, F = ("Verdadero", False), ("Falso", False)
PARCHES = {
    "p152-2": {"opciones": [("Verdadero", False), ("Falso", True)]},
    "p094-1": {"texto": "La siguiente señal indica:", "opciones": [("Hotel", False), ("Campamento", True), ("Punto panorámico", False)]},
    "p136-2": {"opciones": [
        ("No, salvo que se realice para estacionar, entrar o salir de un garaje (cuando no exista otra posibilidad) o salvar algún obstáculo.", True),
        ("Sí, se puede realizar en cualquier ocasión pero el trayecto para circular debe ser de pocos metros.", False),
        ("Sí, siempre que se realice antes de llegar a la mitad de la cuadra y asegurándose de no poner en riesgo al resto de los vehículos.", False)]},
    "p049-7": {"opcion_texto": {2: "Es la obligación de reparar el daño que hayamos causado en circunstancias de la circulación."}},
}

# Notas de la fuente que no forman parte del enunciado
QUITAR_DEL_TEXTO = [r"\(\s*Bah[ií]a Blanca\s*\)", r"\(para todas las clases menos para moto\)"]

CATEGORIAS = {
    "senales": "Señales de tránsito y señalización vial",
    "prioridades": "Prioridades de paso",
    "velocidades": "Velocidades y distancias",
    "semaforos": "Semáforos e intersecciones",
    "estacionamiento": "Estacionamiento y maniobras",
    "adelantamiento": "Adelantamientos y sobrepasos",
    "conduccion": "Seguridad vial y conducción preventiva",
    "alcohol": "Alcohol, medicamentos y sustancias",
    "documentacion": "Documentación obligatoria",
    "vehiculo": "Elementos de seguridad del vehículo",
    "siniestros": "Siniestros viales y primeros auxilios",
    "convivencia": "Convivencia vial, ciclistas y peatones",
    "normativa": "Normativa y responsabilidades del conductor",
    "luces": "Uso de las luces",
    "autopistas": "Autopistas y vías multicarril",
}

# tema -> (categoria, subcategoria, fundamento, referencia, [(norma, regex), ...], referencia al manual)
TEMAS = {
    "conv-general": ("convivencia", "Factores de riesgo y responsabilidad compartida",
        "El riesgo vial surge de la interacción de tres factores: humano, vehicular y ambiental; el humano es el que más incide. Todos los usuarios de la vía (peatones, ciclistas y conductores) deben circular con cuidado y prevención.",
        "Ley 24.449, art. 39 inc. b", [("L", r"circular con cuidado y prevención")], "Manual del Conductor PBA, cap. 1"),
    "ciclistas": ("convivencia", "Ciclistas",
        "La bicicleta es un vehículo: quien la conduce debe respetar las normas de tránsito y hacerse visible. Al sobrepasar a un ciclista hay que dejar una distancia lateral amplia. Muchas de estas preguntas provienen del material de CABA incorporado al cuestionario provincial.",
        "Ley 24.449, art. 5 inc. g y art. 40 bis", [("L", r"Bicicleta: vehículo de dos ruedas"), ("L", r"40 bis")], None),
    "peatones": ("convivencia", "Peatones y senda peatonal",
        "En zona urbana el peatón tiene prioridad al cruzar por la senda peatonal, esté o no demarcada (si no lo está, es la prolongación de la vereda). El conductor debe detenerse y dejar que termine de cruzar.",
        "Ley 24.449, art. 5 inc. t, art. 38 y art. 41 inc. e", [("L", r"Senda peatonal: el sector de la calzada destinado al cruce"), ("L", r"PEATONES Y DICAPACITADOS"), ("L", r"Los peatones que cruzan lícitamente la calzada por la senda peatonal")], "Manual del Conductor PBA, cap. 2"),
    "senal-clases": ("senales", "Tipos de señales: forma y color",
        "Las señales reglamentarias (en general circulares, blancas con orla roja) imponen órdenes de cumplimiento obligatorio; las preventivas (rombo amarillo; naranja si es obra) advierten un riesgo; las informativas (rectangulares, azules o verdes) orientan. Las transitorias (naranjas) señalizan obras y prevalecen mientras duren.",
        "Ley 24.449, art. 22 y Anexo L (Sistema de Señalización Vial Uniforme)", [("L", r"SISTEMA UNIFORME DE SEÑALAMIENTO")], "Manual del Conductor PBA, cap. 3"),
    "senal-vertical": ("senales", "Significado de señales verticales",
        "El significado de cada señal surge del Sistema de Señalización Vial Uniforme. Fijate en la forma, el color y el símbolo: círculo con orla roja = prohibición o restricción; rombo amarillo = advertencia; rectángulo azul = información o servicios; naranja = obra.",
        "Ley 24.449, art. 22 y Anexo L (Sistema de Señalización Vial Uniforme)", [("L", r"SISTEMA UNIFORME DE SEÑALAMIENTO")], "Manual del Conductor PBA, cap. 3"),
    "senal-horizontal": ("senales", "Demarcación horizontal",
        "La demarcación horizontal tiene valor reglamentario por sí misma. Línea discontinua: puede traspasarse; línea continua o doble línea amarilla: prohibido traspasarla o circular sobre ella. El amarillo separa sentidos opuestos; las isletas canalizan el tránsito y no se pisan.",
        "Ley 24.449, art. 22 y Anexo L; art. 48 inc. c", [("L", r"SISTEMA UNIFORME DE SEÑALAMIENTO"), ("L", r"sobre los separadores de tránsito")], "Manual del Conductor PBA, cap. 3"),
    "prioridad-normativa": ("senales", "Prioridad normativa y autoridad de control",
        "El orden de prioridad es: 1) indicaciones de la autoridad de comprobación o aplicación; 2) señales del tránsito; 3) normas legales. Por eso la indicación de un agente prevalece sobre el semáforo y las señales.",
        "Ley 24.449, art. 36", [("L", r"ARTICULO 36. — PRIORIDAD NORMATIVA"), ("L", r"respetando las indicaciones de la autoridad de comprobación o aplicación, las señales del tránsito y las normas legales, en ese orden de prioridad")], "Manual del Conductor PBA, cap. 3"),
    "pare-ceda": ("prioridades", "Señales PARE y CEDA EL PASO",
        "Ante la señal PARE hay que detener por completo el vehículo antes de la senda peatonal y reanudar la marcha sólo cuando sea seguro. La señalización específica hace perder la prioridad del que viene por la derecha.",
        "Ley 24.449, art. 41 inc. a", [("L", r"La señalización específica en contrario")], "Manual del Conductor PBA, cap. 3"),
    "prioridad-derecha": ("prioridades", "Prioridad de paso en encrucijadas",
        "Regla general: tiene prioridad el que cruza desde la derecha. Es absoluta y sólo se pierde ante señalización específica, vehículos ferroviarios, vehículos de emergencia en servicio, quien circula por una semiautopista, peatones en la senda peatonal, rotondas, al salir de una vía de tierra a una pavimentada, o cuando se va a girar.",
        "Ley 24.449, art. 41", [("L", r"ARTICULO 41. — PRIORIDADES"), ("L", r"ceder siempre el paso en las encrucijadas al que cruza desde su derecha")], "Manual del Conductor PBA, cap. 6"),
    "prioridad-otras": ("prioridades", "Otras reglas de prioridad",
        "Fuera de las encrucijadas, para cualquier otra maniobra goza de prioridad quien conserva su derecha; quien se incorpora a la circulación debe ceder el paso a los que ya circulan.",
        "Ley 24.449, art. 41 (último párrafo)", [("L", r"goza de prioridad quien conserva su derecha")], "Manual del Conductor PBA, cap. 6"),
    "cuestas": ("prioridades", "Cuestas y pasos estrechos",
        "En las cuestas estrechas debe retroceder el que desciende (la prioridad es del que asciende), salvo que el que desciende lleve acoplado y el que asciende no.",
        "Ley 24.449, art. 41 (último párrafo)", [("L", r"En las cuestas estrechas debe retroceder el que desciende, salvo que éste lleve acoplado y el que asciende no")], "Manual del Conductor PBA, cap. 6"),
    "rotonda": ("prioridades", "Rotondas",
        "En una rotonda la circulación es ininterrumpida y sin detenciones, dejando la zona central a la izquierda. Tiene prioridad el que circula por ella sobre el que intenta ingresar, y debe cederla al que egresa. En PBA, la luz de giro debe encenderse antes de la mitad de cuadra previa.",
        "Ley 24.449, art. 43 inc. e; Decreto PBA 532/09, Anexo, reglamentación del art. 43", [("L", r"Tiene prioridad de paso el que circula por ella sobre el que intenta ingresar"), ("D", r"En las rotondas la señal de giro debe encenderse antes de la mitad de cuadra")], "Manual del Conductor PBA, cap. 6"),
    "emergencia-veh": ("prioridades", "Vehículos de emergencia",
        "Los vehículos de los servicios de urgencia (ambulancias, bomberos, policía) tienen prioridad sólo cuando están en cumplimiento de su misión y con sus señales reglamentarias activadas. Los demás usuarios deben dejar libre el paso y, si hace falta, detenerse.",
        "Ley 24.449, art. 41 inc. c y art. 61", [("L", r"Los vehículos del servicio público de urgencia, en cumplimiento de su misión"), ("L", r"ARTICULO 61. — VEHICULOS DE EMERGENCIAS")], "Manual del Conductor PBA, cap. 6"),
    "semaforo": ("semaforos", "Semáforos",
        "Verde: avanzar. Roja: detenerse antes de la línea o de la senda peatonal. Amarilla: detenerse si no se alcanza a cruzar antes de la roja. Amarilla intermitente: cruce riesgoso, pasar con precaución. Roja intermitente: cruce peligroso, detenerse y reiniciar sólo sin riesgo. Aun con verde hay que dejar terminar el cruce a quien lo inició y no entrar si no hay lugar del otro lado.",
        "Ley 24.449, art. 44", [("L", r"ARTICULO 44. — VIAS SEMAFORIZADAS"), ("L", r"Con luz intermitente roja, que advierte la presencia de cruce peligroso"), ("L", r"Debe permitirse finalizar el cruce que otro hace")], "Manual del Conductor PBA, cap. 3"),
    "giros": ("estacionamiento", "Giros",
        "Para girar hay que advertirlo con la luz de giro (que se mantiene hasta salir de la encrucijada), circular desde 30 metros antes por el costado más próximo al giro y reducir la velocidad. En vías semaforizadas de doble mano no se gira a la izquierda salvo señal que lo permita.",
        "Ley 24.449, art. 43 y art. 44 inc. f", [("L", r"Circular desde treinta metros antes por el costado más próximo al giro"), ("L", r"En vías de doble mano no se debe girar a la izquierda salvo señal que lo permita")], "Manual del Conductor PBA, cap. 6"),
    "marcha-atras": ("estacionamiento", "Marcha atrás",
        "Está prohibido circular marcha atrás, excepto para estacionar, egresar de un garaje o de una calle sin salida. Toda maniobra de retroceso permitida debe hacerse a velocidad reducida y por el recorrido mínimo indispensable.",
        "Ley 24.449, art. 48 inc. h; Decreto PBA 532/09, Anexo, reglamentación del art. 48", [("L", r"Circular marcha atrás, excepto para estacionar, egresar de un garage o de una calle sin salida"), ("D", r"Cualquier maniobra de retroceso, en los casos permitidos, debe efectuarse a velocidad reducida")], "Manual del Conductor PBA, cap. 6"),
    "estacionar": ("estacionamiento", "Estacionamiento y detención",
        "Se estaciona paralelo al cordón, sin empujar a otros vehículos ni subir a la vereda. Está prohibido estacionar donde se afecte la seguridad o la visibilidad: esquinas (hasta la línea de ochava), sendas peatonales, veredas, doble fila, frente a garajes en uso, paradas de transporte y rotondas. En la banquina sólo se puede parar ante una emergencia.",
        "Ley 24.449, art. 49 y art. 48 inc. i; Decreto PBA 532/09, Anexo, reglamentación del art. 49", [("L", r"ARTICULO 49. — ESTACIONAMIENTO"), ("L", r"el estacionamiento sobre la banquina y la detención en ella sin ocurrir emergencia"), ("D", r"prohibición de estacionar a la izquierda en las vías de circulación urbanas")], "Manual del Conductor PBA, cap. 6 (págs. 107-108)"),
    "adelantamiento": ("adelantamiento", "Adelantamiento",
        "Se adelanta por la izquierda, con visibilidad suficiente, verificando que nadie nos esté sobrepasando y usando la luz de giro izquierda. No se adelanta en curvas, puentes, cimas, vías férreas ni encrucijadas. Tiene prioridad para adelantar el que va inmediatamente detrás del vehículo a sobrepasar. Excepcionalmente se pasa por la derecha si el de adelante indicó que gira o se detiene a su izquierda, o en un embotellamiento.",
        "Ley 24.449, art. 42 y art. 48 inc. j", [("L", r"ARTICULO 42. — ADELANTAMIENTO"), ("L", r"El anterior ha indicado su intención de girar o de detenerse a su izquierda"), ("L", r"En curvas, encrucijadas y otras zonas peligrosas, cambiar de carril o fila, adelantarse")], "Manual del Conductor PBA, cap. 6"),
    "vel-limites": ("velocidades", "Límites de velocidad",
        "Zona urbana: 40 km/h en calles y 60 km/h en avenidas (mínima: la mitad de la máxima). Semiautopistas: 120 km/h, mínima 40. Autopistas: 130 km/h, mínima 65. Rutas: 110 km/h para autos. En encrucijadas urbanas sin semáforo la velocidad precautoria nunca supera 30 km/h; cerca de escuelas, 20 km/h. Con semáforos coordinados rige la velocidad de coordinación. Una señal puede fijar otro límite.",
        "Ley 24.449, arts. 50, 51 y 52", [("L", r"ARTICULO 51. — VELOCIDAD MAXIMA"), ("L", r"En las encrucijadas urbanas sin semáforo: la velocidad precautoria, nunca superior a 30 km/h"), ("L", r"ARTICULO 52. — LIMITES ESPECIALES")], "Manual del Conductor PBA, cap. 6"),
    "vel-riesgo": ("velocidades", "Velocidad y riesgo",
        "La velocidad precautoria es la que permite mantener el dominio total del vehículo según las condiciones propias, del vehículo, de la vía y del tiempo. A mayor velocidad, menor campo visual y mayor gravedad del siniestro. Circular demasiado lento también genera riesgo.",
        "Ley 24.449, art. 50", [("L", r"ARTICULO 50. — VELOCIDAD PRECAUTORIA")], "Manual del Conductor PBA, cap. 4"),
    "distancia": ("velocidades", "Distancia de seguridad, reacción y frenado",
        "La distancia de seguridad mínima con el vehículo de adelante es la que resulta de una separación de al menos 2 segundos (más con lluvia o niebla). La distancia de detención es la suma de la distancia de reacción (lo recorrido hasta que se actúa, alrededor de 1 segundo) y la de frenado.",
        "Decreto PBA 532/09, Anexo, reglamentación del art. 48 inc. g; Ley 24.449, art. 48 inc. g", [("D", r"separación en tiempo de por lo menos DOS \(2\) segundos"), ("L", r"a una distancia del vehículo que lo precede, menor de la prudente")], "Manual del Conductor PBA, cap. 4 (pág. 67) y cap. 6 (pág. 104)"),
    "conduccion-gral": ("conduccion", "Técnicas de conducción segura",
        "Conducir con seguridad implica anticiparse: adecuar la velocidad antes de las curvas, evitar frenadas bruscas, usar calzado sujeto al pie y mantener siempre el dominio efectivo del vehículo.",
        "Ley 24.449, art. 39 inc. b", [("L", r"conservando en todo momento el dominio efectivo del vehículo")], "Manual del Conductor PBA, cap. 4"),
    "preventiva": ("conduccion", "Conducción preventiva y eficiente",
        "La conducción preventiva consiste en adoptar conductas cautelosas, hacerse responsable de los propios actos y anticipar los errores de los demás. La conducción eficiente, además, reduce el consumo de combustible.",
        "Ley 24.449, art. 39 inc. b", [("L", r"circular con cuidado y prevención")], "Manual del Conductor PBA, cap. 4"),
    "clima": ("conduccion", "Lluvia, niebla y otras condiciones adversas",
        "Con lluvia, niebla, hielo o viento hay que reducir la velocidad, aumentar la distancia de seguridad y usar las luces bajas (y rompenieblas si se tienen), nunca las altas ni las balizas en movimiento. El aquaplaning es la pérdida de adherencia por la película de agua que el dibujo del neumático no llega a desalojar. Si no se puede seguir, hay que salir de la calzada y de la banquina.",
        "Ley 24.449, art. 50 y art. 47", [("L", r"ARTICULO 50. — VELOCIDAD PRECAUTORIA"), ("L", r"ARTICULO 47. — USO DE LAS LUCES")], "Manual del Conductor PBA, cap. 4 (pág. 72) y cap. 8 (pág. 137)"),
    "fatiga": ("conduccion", "Fatiga, sueño y estrés",
        "El cansancio, el sueño y el estrés reducen la atención y alargan el tiempo de reacción. Se recomienda dormir bien antes de viajar, parar cada dos horas aproximadamente, ventilar el habitáculo y, ante el primer síntoma de sueño, detenerse en un lugar seguro fuera de la calzada.",
        "Ley 24.449, art. 39 inc. a", [("L", r"ARTICULO 39. — CONDICIONES PARA CONDUCIR")], "Manual del Conductor PBA, cap. 5"),
    "distracciones": ("conduccion", "Distracciones y uso del celular",
        "Está prohibido conducir usando auriculares y sistemas de comunicación de operación manual continua. Cualquier distracción (celular, incluso con manos libres, comer, maquillarse, manipular el GPS) quita atención al entorno. La prohibición legal alcanza al conductor, no a los acompañantes.",
        "Ley 24.449, art. 48 inc. x", [("L", r"Conducir utilizando auriculares y sistemas de comunicación de operación manual continua")], "Manual del Conductor PBA, cap. 4"),
    "sustancias": ("alcohol", "Medicamentos y drogas",
        "Está prohibido conducir habiendo consumido estupefacientes o medicamentos que disminuyan la aptitud para conducir. No sólo las drogas ilegales afectan: también el alcohol y muchos medicamentos (en especial los sedantes).",
        "Ley 24.449, art. 48 inc. a; Ley PBA 13.927, art. 28 bis (texto según Ley 15.402)", [("L", r"habiendo consumido estupefacientes o medicamentos que disminuyan la aptitud para conducir"), ("P", r"Así también está prohibido conducir a quienes hubiesen consumido medicamentos, estupefacientes")], "Manual del Conductor PBA, cap. 5"),
    "alcohol-efectos": ("alcohol", "Efectos del alcohol",
        "El alcohol es un depresor del sistema nervioso: altera la visión, enlentece las reacciones y da falsa seguridad. Sus efectos continúan después de dejar de beber, y la resaca también afecta la conducción. Hoy rige alcohol cero para todos los conductores en la Provincia.",
        "Ley PBA 13.927, art. 28 bis (texto según Ley 15.402); Ley 24.449, art. 48 inc. a", [("P", r"alcoholemia superior a 0 \(cero\) miligramos de alcohol por litro de sangre"), ("L", r"alcoholemia superior a cero \(0\) miligramos por litro de sangre")], "Manual del Conductor PBA, cap. 5 (págs. 83-88; los valores del manual de 2019 están desactualizados)"),
    "alcohol-control": ("alcohol", "Controles de alcoholemia",
        "Todo conductor debe someterse a las pruebas destinadas a determinar su estado de intoxicación alcohólica o por drogas. Negarse constituye falta grave y hace presumir el resultado positivo. En la Provincia de Buenos Aires rige alcohol cero para todos los conductores de vehículos con motor.",
        "Ley 24.449, art. 73; Ley PBA 13.927, art. 28 bis (texto según Ley 15.402)", [("L", r"La negativa a realizar la prueba constituye falta"), ("P", r"alcoholemia superior a 0 \(cero\) miligramos de alcohol por litro de sangre"), ("A", r"LEY 15402")], "Manual del Conductor PBA, cap. 5 (pág. 88)"),
    "licencia": ("documentacion", "Licencia de conducir",
        "No se puede conducir con la licencia vencida. En PBA hay 90 días de gracia desde el vencimiento para renovarla rindiendo sólo el psicofísico (sin que eso habilite a conducir). Quien obtiene su licencia por primera vez es principiante durante 6 meses y debe llevar el distintivo. Edades mínimas: 21 años para clases C, D y E; 17 para las restantes; 16 para ciclomotores. Los menores necesitan autorización de sus padres o tutor. Todo cambio de datos debe denunciarse (la licencia caduca a los 90 días del cambio no denunciado).",
        "Ley 24.449, arts. 11, 13, 17 y 18; Decreto PBA 532/09, Anexo II, arts. 11, 14, 15 y 16", [("L", r"ARTICULO 11. — EDADES MINIMAS PARA CONDUCIR"), ("L", r"distintivo que identifique su condición de principiante"), ("D", r"plazo de gracia de noventa \(90\) días"), ("D", r"Licencia Reemplazada: corresponde al cambio de jurisdicción"), ("D", r"deberán conducir durante los primeros seis \(6\) meses")], "Manual del Conductor PBA, cap. 1 (págs. 8-16)"),
    "retencion": ("documentacion", "Retención de la licencia y del conductor",
        "La autoridad puede retener al conductor en estado de intoxicación alcohólica o por estupefacientes por el tiempo necesario para que se recupere, nunca más de 12 horas. Cuando retiene la licencia entrega la boleta de citación, que habilita a conducir por un máximo de 30 días corridos.",
        "Ley 24.449, art. 72; Ley PBA 13.927 (retención preventiva)", [("L", r"ARTICULO 72. — RETENCION PREVENTIVA"), ("L", r"Esta retención no deberá exceder de doce horas"), ("P", r"plazo máximo de TREINTA \(30\) días corridos")], "Manual del Conductor PBA, cap. 10"),
    "seguro": ("documentacion", "Seguro obligatorio",
        "Todo automotor debe estar cubierto por un seguro que cubra eventuales daños causados a terceros, transportados o no, y es obligatorio circular con el comprobante.",
        "Ley 24.449, art. 68 y art. 40 inc. c", [("L", r"ARTICULO 68. — SEGURO OBLIGATORIO"), ("L", r"eventuales daños causados a terceros, transportados o no")], "Manual del Conductor PBA, cap. 6 (pág. 91)"),
    "placas": ("documentacion", "Placas de dominio",
        "El vehículo debe tener colocadas las placas de identificación de dominio en el lugar reglamentario, legibles y sin aditamentos. Su reposición se gestiona en el Registro de la Propiedad del Automotor.",
        "Ley 24.449, art. 40 inc. d", [("L", r"tenga colocadas las placas de identificación de dominio")], "Manual del Conductor PBA, cap. 6 (pág. 91)"),
    "vtv": ("documentacion", "Verificación Técnica Vehicular",
        "Todos los vehículos destinados a circular están sujetos a una revisión técnica periódica que controla la seguridad activa y pasiva y la emisión de contaminantes. Con la VTV vencida no se puede circular.",
        "Ley PBA 13.927, art. 16; Ley 24.449, art. 34", [("P", r"VERIFICACIÓN TÉCNICA VEHICULAR. Todos los vehículos automotores"), ("L", r"ARTICULO 34. — REVISION TECNICA OBLIGATORIA")], "Manual del Conductor PBA, cap. 6 (pág. 91)"),
    "documentos": ("documentacion", "Documentación para circular",
        "Para circular hay que portar la licencia habilitante, la cédula de identificación del automotor y el comprobante del seguro, además de tener las placas colocadas y la VTV vigente.",
        "Ley 24.449, art. 40", [("L", r"ARTICULO 40. — REQUISITOS PARA CIRCULAR")], "Manual del Conductor PBA, cap. 6 (pág. 91)"),
    "cinturon": ("vehiculo", "Cinturón de seguridad",
        "El cinturón es obligatorio para todos los ocupantes, en todos los asientos y en todo trayecto. La cantidad de cinturones determina cuántas personas pueden viajar. La banda inferior va sobre los huesos de la cadera, nunca sobre el abdomen. El conductor responde ante la autoridad.",
        "Ley 24.449, art. 40 inc. k; Decreto PBA 532/09, Anexo, reglamentación del art. 48", [("L", r"usen los correajes de seguridad"), ("D", r"Los correajes de seguridad que posean los vehículos determinarán el número de ocupantes")], "Manual del Conductor PBA, cap. 7"),
    "sri": ("vehiculo", "Niños y sistemas de retención infantil",
        "Los menores de 10 años deben viajar en el asiento trasero. La reglamentación provincial exige además el dispositivo de retención infantil para los menores de 4 años; la reglamentación nacional (Decreto 32/2018) es más exigente y lo requiere hasta los 10 años, por lo que es lo recomendable.",
        "Ley 24.449, art. 40 inc. g y art. 77 inc. u; Decreto PBA 532/09, Anexo, reglamentación del art. 40 inc. g", [("L", r"menores de DIEZ \(10\) años en una ubicación distinta a la parte trasera"), ("L", r"Los menores de 10 años deben viajar en el asiento trasero"), ("D", r"Los menores de DIEZ \(10\) años deben viajar sujetos al asiento trasero con el correaje correspondiente y los menores de CUATRO \(4\) años")], "Manual del Conductor PBA, cap. 7"),
    "airbag": ("vehiculo", "Airbag",
        "El airbag es un elemento de seguridad pasiva que complementa al cinturón, nunca lo reemplaza: sin cinturón puede provocar lesiones graves.",
        None, [], "Manual del Conductor PBA, cap. 7"),
    "apoyacabezas": ("vehiculo", "Apoyacabezas",
        "El apoyacabezas bien regulado (a la altura de la cabeza y cerca de la nuca) evita el efecto látigo y las lesiones cervicales en un choque desde atrás.",
        "Ley 24.449, art. 30 inc. a", [("L", r"Correajes y cabezales normalizados")], "Manual del Conductor PBA, cap. 7 (pág. 125)"),
    "seg-activa-pasiva": ("vehiculo", "Seguridad activa, pasiva y preventiva",
        "Seguridad activa: lo que ayuda a evitar el siniestro (frenos, dirección, neumáticos, luces). Seguridad pasiva: lo que reduce los daños cuando ocurre (cinturón, airbag, apoyacabezas, carrocería). Seguridad preventiva: lo que hace distendida la vida a bordo (climatización, visibilidad).",
        "Ley 24.449, arts. 29 y 30", [("L", r"ARTICULO 29. — CONDICIONES DE SEGURIDAD"), ("L", r"ARTICULO 30. — REQUISITOS PARA AUTOMOTORES")], "Manual del Conductor PBA, cap. 7"),
    "neumaticos": ("vehiculo", "Neumáticos",
        "La profundidad mínima legal del dibujo es de 1,6 mm. La presión se controla con los neumáticos fríos y debe ser la que indica el manual del vehículo. Ante un reventón: sujetar firme el volante y desacelerar de a poco, sin frenar de golpe.",
        "Ley 24.449, art. 48 inc. l", [("L", r"cubiertas con fallas o sin la profundidad legal de los canales")], "Manual del Conductor PBA, cap. 7 (pág. 118)"),
    "equipamiento": ("vehiculo", "Equipamiento obligatorio y estado del vehículo",
        "Los automotores deben llevar matafuego y balizas portátiles normalizados (excepto las motocicletas). En los vidrios sólo se admiten aditamentos con fines de identificación, y todos los cristales deben garantizar visibilidad. Suspensión, dirección y frenos en mal estado comprometen el control del vehículo.",
        "Ley 24.449, art. 40 inc. f y art. 30", [("L", r"matafuego y balizas portátiles normalizados, excepto las motocicletas"), ("L", r"ARTICULO 30. — REQUISITOS PARA AUTOMOTORES")], "Manual del Conductor PBA, cap. 6 (pág. 92) y cap. 7"),
    "luces-equipo": ("vehiculo", "Sistema de iluminación del vehículo",
        "Faros delanteros de luz blanca o amarilla; luces de posición rojas atrás; luz de retroceso blanca. El color indica el sentido de marcha. Sólo se pueden agregar hasta dos faros rompeniebla.",
        "Ley 24.449, art. 31", [("L", r"ARTICULO 31. — SISTEMA DE ILUMINACION"), ("L", r"Luz de retroceso blanca"), ("L", r"salvo el agregado de hasta dos luces rompeniebla")], "Manual del Conductor PBA, cap. 7"),
    "espejos": ("vehiculo", "Espejos y puntos ciegos",
        "Los puntos ciegos son las zonas que el conductor no ve ni directamente ni por los espejos. Se reducen regulando los espejos antes de iniciar la marcha y mirando por encima del hombro antes de maniobrar.",
        None, [], "Manual del Conductor PBA, cap. 4"),
    "carga": ("vehiculo", "Carga, equipaje y ocupantes",
        "La carga no debe perturbar la visibilidad ni la estabilidad, ni ocultar luces. Lo más pesado va abajo y cerca del centro del vehículo. Los objetos sueltos y los animales sin sujeción son proyectiles en un choque.",
        "Ley 24.449, art. 48 inc. q", [("L", r"Transportar cualquier carga o elemento que perturbe la visibilidad, afecte peligrosamente las condiciones aerodinámicas")], "Manual del Conductor PBA, cap. 6 (pág. 110)"),
    "luces-uso": ("luces", "Uso de las luces",
        "En rutas, autopistas y semiautopistas las luces bajas van encendidas de día y de noche. La luz alta sólo se usa en zona rural y autopistas, y se cambia a baja con anticipación para no encandilar. El destello se usa en cruces y para advertir sobrepasos; las balizas, para detenciones, peajes, zonas peligrosas o maniobras riesgosas; la luz de giro, siempre que se cambia de dirección o carril.",
        "Ley 24.449, art. 47; Decreto PBA 532/09, Anexo, reglamentación del art. 47", [("L", r"ARTICULO 47. — USO DE LAS LUCES"), ("L", r"Destello: debe usarse en los cruces de vías y para advertir los sobrepasos"), ("D", r"El cambio de luz alta por baja debe realizarse a una distancia suficiente")], "Manual del Conductor PBA, cap. 7"),
    "autopista": ("autopistas", "Autopistas, semiautopistas y carriles",
        "Al ingresar a una autopista se cede el paso a quienes ya circulan. El carril izquierdo se usa para la máxima velocidad admitida y para adelantar. No se circula por la banquina (salvo emergencia) y el vehículo averiado debe salir en la primera salida. Sólo los vehículos destinados a tal fin pueden remolcar. El cambio de carril se avisa con luz de giro, en PBA con al menos 5 segundos de antelación, y tiene prioridad quien ya circula por el carril que se quiere ocupar.",
        "Ley 24.449, arts. 45 y 46; art. 48 incs. c y ñ; Decreto PBA 532/09, Anexo, reglamentación de los arts. 45 y 46", [("L", r"ARTICULO 46. — AUTOPISTAS"), ("L", r"El carril extremo izquierdo se utilizará para el desplazamiento a la máxima velocidad admitida"), ("D", r"antelación mínima de CINCO SEGUNDOS"), ("D", r"En el ingreso a una autopista debe cederse el paso a quienes circulan por ella"), ("L", r"Remolcar automotores, salvo para los vehículos destinados a tal fin")], "Manual del Conductor PBA, cap. 6"),
    "siniestro-actuar": ("siniestros", "Cómo actuar ante un siniestro o avería",
        "Orden de actuación: Proteger (señalizar con balizas del lado del que viene el tránsito y ponerse a resguardo), Alertar (llamar a emergencias) y Socorrer. Quien participa de un siniestro debe detenerse de inmediato y permanecer en el lugar.",
        "Ley 24.449, art. 65", [("L", r"ARTICULO 65. — OBLIGACIONES"), ("L", r"Detenerse inmediatamente")], "Manual del Conductor PBA, cap. 4 (pág. 74)"),
    "siniestro-legal": ("siniestros", "Obligaciones legales en un siniestro",
        "Es obligatorio detenerse inmediatamente, suministrar los datos de la licencia y del seguro a la otra parte y a la autoridad, denunciar el hecho y declarar si se es citado. Abandonar a un herido puede constituir delito. El aviso a la aseguradora debe darse dentro de los tres días.",
        "Ley 24.449, art. 65", [("L", r"Suministrar los datos de su licencia de conductor y del seguro obligatorio a la otra parte y a la autoridad")], "Manual del Conductor PBA, cap. 10"),
    "responsabilidad": ("normativa", "Responsabilidad civil y penal",
        "Se presume responsable de un siniestro a quien carecía de prioridad de paso o cometió una infracción relacionada con su causa. La responsabilidad civil es la obligación de reparar el daño causado; la penal es personal e intransferible. 'Culposo' significa que no hubo intención de dañar.",
        "Ley 24.449, art. 64", [("L", r"Se presume responsable de un accidente al que carecía de prioridad de paso")], "Manual del Conductor PBA, cap. 10"),
    "sanciones": ("normativa", "Infracciones y sanciones",
        "Las sanciones van desde la amonestación (advertencia) y la multa hasta la inhabilitación y el decomiso. Correr picadas es falta grave: el vehículo se secuestra por 30 días si el infractor es el propietario y se inhabilita al conductor.",
        "Ley PBA 13.927 (régimen de sanciones); Ley 24.449, art. 83", [("P", r"compitiendo con otro u otros vehículos o animales"), ("P", r"retenido en depósitos municipales por treinta \(30\) días si el infractor fuera el propietario"), ("L", r"ARTICULO 83. — CLASES")], "Manual del Conductor PBA, cap. 10"),
    "normas-varias": ("normativa", "Condiciones y prohibiciones generales",
        "Se conduce con ambas manos sobre el volante, salvo para accionar otros comandos. Está prohibido conducir con impedimentos físicos o psíquicos sin licencia especial, ceder el volante a quien no está habilitado, circular con más de un acoplado, llevar enganches sobresalientes y usar la bocina sin necesidad. Sólo los vehículos destinados a remolque pueden remolcar, salvo fuerza mayor.",
        "Ley 24.449, art. 48; Decreto PBA 532/09, Anexo, reglamentación del art. 39", [("L", r"ARTICULO 48. — PROHIBICIONES"), ("D", r"Los automotores serán conducidos con ambas manos sobre el volante de dirección, excepto cuando sea necesario accionar otros comandos"), ("L", r"enganches sobresalientes")], "Manual del Conductor PBA, cap. 6 (págs. 109-110)"),
    "definiciones": ("normativa", "Definiciones legales",
        "La Ley de Tránsito define cada término con precisión: calzada (zona destinada sólo a la circulación de vehículos), banquina (zona contigua a la calzada pavimentada), camino (vía rural de circulación), baliza, automóvil, zona de camino, etc. Varias preguntas cambian una palabra de la definición para volverla falsa.",
        "Ley 24.449, art. 5", [("L", r"Calzada: la zona de la vía destinada sólo a la circulación de vehículos"), ("L", r"Camino: una vía rural de circulación"), ("L", r"Zona de camino: todo espacio afectado a la vía de circulación y sus instalaciones anexas, comprendido entre las propiedades frentistas"), ("L", r"y los de tres ruedas que exceda los mil kg de peso")], "Manual del Conductor PBA, cap. 2"),
}

# "tema: ids" — admite rangos "pNNN-a..pNNN-b" (inclusive, en el orden del documento)
ASIGNACION = """
conv-general: p002-1..p005-2
ciclistas: p005-3..p010-1
peatones: p010-2..p015-2 p042-2 p043-2 p045-3 p049-1 p062-1
senal-horizontal: p015-3..p017-2 p055-5 p056-2 p072-1 p078-3..p079-2 p116-2 p118-2 p119-1 p174-2 p174-3 p174-4
senal-clases: p018-1 p038-4 p038-5 p072-2..p072-6 p074-2..p075-3 p078-2 p080-1..p083-1 p100-3..p101-7
siniestro-actuar: p018-2..p020-1 p021-1 p021-2 p021-3
siniestro-legal: p020-2 p020-3 p020-4 p021-4 p055-1 p055-2
responsabilidad: p021-5 p022-1 p022-2 p042-5 p049-6 p049-7 p050-2 p050-4
licencia: p022-4 p022-5 p022-6 p023-1 p025-3 p038-3 p040-3 p044-4 p045-1 p045-2 p052-2 p071-2 p177-6
seguro: p024-1 p024-2 p039-4
placas: p024-3 p024-4 p025-1 p056-6
vtv: p025-2 p037-2 p041-2
sustancias: p026-5..p027-4 p048-5
alcohol-efectos: p027-5 p027-6 p027-7 p028-1 p028-2 p028-3
alcohol-control: p028-4 p029-1 p029-2 p048-2 p041-1
fatiga: p030-1 p030-2 p031-1..p032-3 p047-6
distancia: p032-4 p039-2 p048-6 p054-6 p126-2 p126-3 p127-1 p127-2
distracciones: p032-5..p037-1 p040-4 p047-1 p055-3
giros: p039-1 p069-2 p069-4 p069-6 p070-1 p140-1 p140-2
marcha-atras: p039-3 p046-4 p057-5 p121-2 p136-2 p136-3
sri: p039-5 p165-2 p165-3 p166-1 p172-4
sanciones: p040-1 p040-2 p044-2 p044-3
pare-ceda: p040-5 p071-3 p104-1 p104-2 p105-1
espejos: p041-3 p158-1..p158-5
prioridad-derecha: p041-4 p050-6 p058-3 p058-4 p062-2 p062-3 p062-4 p101-8..p103-2 p105-2 p105-3 p106-1 p106-2
definiciones: p042-1 p049-2 p049-3 p049-4 p049-5 p172-3 p177-1
luces-uso: p042-3 p056-1 p057-3 p064-3 p066-3..p067-1 p067-3 p067-4 p067-5 p068-1 p068-3 p137-1..p139-3 p140-3 p141-1 p141-2 p142-1 p142-2 p143-1 p143-2
conduccion-gral: p043-1 p128-5 p129-1 p153-3 p154-1
retencion: p043-3 p043-4 p047-2
normas-varias: p044-1 p046-3 p046-7 p057-4 p162-2 p177-4 p178-3
equipamiento: p045-4 p048-4 p159-1 p159-2 p161-1 p161-2 p161-3 p162-1 p175-5
semaforo: p045-5 p045-6 p048-3 p052-4 p052-5 p052-6 p053-1 p053-2 p053-3 p053-4 p071-4 p076-1 p076-2 p077-1 p078-1 p175-2
adelantamiento: p046-1 p046-2 p051-5 p058-5..p059-4 p060-1 p060-2 p110-1 p113-1..p116-1 p117-1 p117-2 p117-3 p118-1
estacionar: p046-5 p047-7 p056-7 p056-8 p057-1 p057-2 p065-2..p066-1 p130-2..p133-2 p134-2 p135-1 p136-1
neumaticos: p046-6 p159-3 p159-4 p160-1 p160-2
clima: p047-4 p047-5 p063-2 p063-3 p067-2 p143-3..p149-1 p150-1..p153-2 p174-1 p178-1
cuestas: p051-1 p108-1 p108-2
rotonda: p051-2 p069-3 p069-5 p070-2 p070-3 p107-1 p107-2
prioridad-otras: p051-3 p109-1 p109-2 p109-3
emergencia-veh: p052-1 p083-2..p086-2 p154-2 p177-5
vel-limites: p054-1 p054-2 p054-4 p058-2 p061-2 p122-1 p123-1 p123-2 p124-1 p124-2 p125-1 p125-2
vel-riesgo: p125-3 p127-3 p128-1 p128-2 p128-3 p128-4
prioridad-normativa: p056-3 p071-5 p072-7 p073-1 p073-2 p074-1
documentos: p056-4
cinturon: p057-6 p057-7 p058-1 p163-4 p168-2..p170-1 p176-5
senal-vertical: p060-5 p087-1..p100-2 p129-2 p130-1
autopista: p061-3 p070-4 p070-5 p111-1 p111-2 p112-1 p119-3 p120-1 p120-2 p154-3 p155-1
preventiva: p155-2 p155-3 p156-1
carga: p163-1 p163-2 p163-3 p170-2
airbag: p163-5 p164-1 p165-1 p171-1 p175-1
apoyacabezas: p167-1 p168-1 p176-1
seg-activa-pasiva: p171-2 p171-3 p172-1
luces-equipo: p142-3 p173-1 p173-2 p173-3 p173-4
"""

# Aclaraciones puntuales (se anteponen al fundamento del tema)
EXPLICACIONES = {
    "p029-2": "Atención: desde la Ley PBA 15.402 (y la Ley nacional 27.714) el límite de 0,0 g/l rige para TODOS los conductores, no sólo para los profesionales.",
    "p172-4": "La clave oficial sigue la reglamentación provincial (menores de 4 años). La reglamentación nacional vigente (Decreto 32/2018) exige el sistema de retención infantil hasta los 10 años: es lo recomendable.",
    "p042-1": "Es falso porque la definición legal dice instalaciones «anexas» y propiedades «frentistas»; el enunciado cambia esas palabras.",
    "p172-3": "Es falso porque la definición legal habla de los vehículos de tres ruedas que excedan los mil (1.000) kg, no mil quinientos.",
    "p049-4": "Es falso: esa es la definición de calzada. La banquina es la zona contigua a una calzada pavimentada.",
    "p042-3": "Es falso porque las luces bajas deben permanecer encendidas tanto de día como de noche, no sólo de noche.",
    "p046-1": "Es falso porque la excepción legal es cuando el de adelante indicó que gira o se detiene a su IZQUIERDA, no a su derecha.",
    "p048-6": "Es falso porque la separación mínima es de 2 segundos, no de 5.",
    "p045-4": "Es falso porque las motocicletas están exceptuadas de llevar matafuego y balizas.",
    "p046-6": "Es falso porque la prohibición de circular con cubiertas en mal estado rige para todos, no sólo para los profesionales.",
    "p177-6": "Es falso porque el plazo de gracia en PBA es de 90 días, no de 60. En ese lapso se puede renovar, pero no conducir.",
    "p057-3": "Es falso porque las luces deben mantenerse limpias siempre, sin excepción para las rutas.",
    "p056-6": "Es falso por el 'salvo excepción': todo automotor debe llevar sus placas, sin excepciones.",
    "p052-4": "La ley dice que con luz amarilla hay que detenerse si se estima que no se alcanzará a cruzar antes de la roja.",
    "p058-2": "En vías con semaforización coordinada la velocidad máxima es la de coordinación de los semáforos (art. 51 inc. a.3).",
    "p124-1": "Es falso: la velocidad máxima no puede superarse nunca, tampoco para adelantar.",
    "p061-2": "El art. 51 inc. e.1 fija para las encrucijadas urbanas sin semáforo una velocidad precautoria nunca superior a 30 km/h.",
    "p040-3": "Las edades mínimas son 21 años (clases C, D y E), 17 (las restantes) y 16 para ciclomotores: por eso sólo 'determinada categoría' se obtiene a los 16.",
    "p020-4": "El plazo de tres días (72 horas) surge de la Ley de Seguros 17.418, art. 46.",
}

# Opciones que aluden a otras por su letra o posicion: no se pueden mezclar
RE_ORDEN_FIJO = r"(ambas|todas las (respuestas|anteriores|opciones)|ninguna de las anteriores|las opciones [A-C]|[A-C] y (la )?[A-C])"
