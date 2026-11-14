"""Extrae las preguntas del cuestionario oficial (PDF) a un JSON crudo.

Uso:
    python -I tools/extraccion/extraer.py fuentes/cuestionario.pdf tools/extraccion/crudo.json

La respuesta correcta se detecta por el color verde (#90C852) con que el
documento oficial resalta la opcion correcta. Las preguntas eliminatorias se
detectan por la leyenda "(Pregunta de caracter eliminatorio)".

Este script NO decide que preguntas entran al banco: solo transcribe.
La curaduria (verificacion, categoria, explicacion) esta en curaduria/ y la
aplica construir_banco.py.
"""
import json
import re
import sys

import fitz  # PyMuPDF

VERDE, ROJO = 0x90C852, 0xEE302E
PAG_DESDE, PAG_HASTA = 2, 178  # secciones generales + "Auto y Camioneta"
SUBTITULOS = {"USUARIOS DE BICICLETA", "SEÑALES DE TRANSITO", "Sistema de iluminación"}

RE_NUM = re.compile(r"^\s*(\d{1,3})\s*\)\s*")
# "A. ", "a) ", "A – ", "a- ", "A   Texto" (doble espacio), "• "
RE_OPC = re.compile(
    r"^\s*\.?\s*(?:([A-Ha-h])\s*[\.\)]|([A-Ha-h])\s*[-–]\s|([A-C])\s{2,}(?=\S)|(•))\s*"
)
RE_VF = re.compile(r"^\s*V\s+F\s*$")
RE_ELIM = re.compile(r"\(?\s*Pregunta\s+de\s+carácter\s+eliminatorio\s*\)?", re.I)


def lineas_de_pagina(pg):
    items = []
    for b in pg.get_text("dict")["blocks"]:
        x0, y0, x1, y1 = b["bbox"]
        if b["type"] == 1:
            if y0 >= 70 and y1 <= 775:
                items.append({"t": "img", "y": y0, "x": x0, "bbox": [x0, y0, x1, y1]})
            continue
        for l in b.get("lines", []):
            y = l["bbox"][1]
            if y < 70 or y > 760:
                continue
            spans = [s for s in l["spans"] if s["text"].strip()]
            if not spans:
                continue
            items.append(
                {
                    "t": "txt",
                    "y": y,
                    "x": l["bbox"][0],
                    "spans": [
                        (s["text"].replace("\t", " "), s["color"], "Bold" in s["font"], s["size"])
                        for s in spans
                    ],
                }
            )
    items.sort(key=lambda i: (round(i["y"] / 3), i["x"]))
    return items


def limpiar(t):
    t = re.sub(r"(\w)-\s+(\w)", r"\1\2", t)  # une cortes de palabra por guion
    return re.sub(r"\s+", " ", t).strip()


def main(pdf, salida):
    doc = fitz.open(pdf)
    preguntas, seccion = [], ""
    q = None  # pregunta en curso
    destino = None  # "q" | indice de opcion | None
    cont_pag = {}
    marcar_despues = False

    def cerrar():
        nonlocal q, destino
        if q and (q["texto"].strip() or q["opciones"]):
            preguntas.append(q)
        q, destino = None, None

    def nueva(pag):
        nonlocal q, destino
        cerrar()
        cont_pag[pag] = cont_pag.get(pag, 0) + 1
        q = {
            "id": f"p{pag:03d}-{cont_pag[pag]}",
            "pagina": pag,
            "numero": None,
            "seccion": seccion,
            "texto": "",
            "opciones": [],
            "imagenes": [],
            "eliminatoria": False,
            "notas": [],
        }
        destino = "q"

    for pno in range(PAG_DESDE - 1, PAG_HASTA):
        pag = pno + 1
        items = lineas_de_pagina(doc[pno])
        y_prev = None
        base_x = min((i["x"] for i in items if i["t"] == "txt"), default=85)
        for it in items:
            if marcar_despues and q is not None:
                q["eliminatoria"] = True
            marcar_despues = False
            primera = y_prev is None
            gap = None if primera else it["y"] - y_prev
            if it["t"] == "img":
                if q is None or q["opciones"]:
                    nueva(pag)
                    q["notas"].append("imagen antes del enunciado")
                q["imagenes"].append({"pagina": pag, "bbox": [round(v, 1) for v in it["bbox"]]})
                y_prev = it["bbox"][3] - 13
                continue
            spans = it["spans"]
            y_prev = it["y"]
            if any(c == ROJO for _, c, _, _ in spans):  # leyenda eliminatoria en rojo
                spans = [s for s in spans if s[1] != ROJO]
                if not spans:  # linea solo roja: corresponde a la pregunta en curso
                    if q is None:
                        nueva(pag)
                    q["eliminatoria"] = True
                    continue
                marcar_despues = True  # comparte linea con el enunciado: se marca al procesarlo
            texto = "".join(s[0] for s in spans)
            verde = any(c == VERDE for _, c, _, _ in spans)
            negrita = all(b for _, _, b, _ in spans)
            tam = max(s[3] for s in spans)
            if tam >= 13.5:  # titulo de seccion
                titulo = limpiar(texto)
                if q is None and preguntas and seccion and gap is not None and gap < 25 and not RE_NUM.match(titulo):
                    seccion = limpiar(seccion + " " + titulo)
                elif RE_NUM.match(titulo) and len(titulo) > 40 and "untas para" not in titulo:
                    # la pregunta 78 esta compuesta en cuerpo 14: no es un titulo
                    nueva(pag)
                    m = RE_NUM.match(titulo)
                    q["numero"], q["texto"] = int(m.group(1)), titulo[m.end():]
                else:
                    cerrar()
                    seccion = titulo
                continue
            if texto.strip() in SUBTITULOS or (negrita and texto.strip().isupper() and len(texto) > 12):
                cerrar()
                continue
            if RE_VF.match(texto):  # linea "V      F"
                if q is None:
                    nueva(pag)
                ok = None
                for s, c, _, _ in spans:
                    if c == VERDE:
                        if "V" in s and "F" not in s:
                            ok = "V"
                        elif "F" in s and "V" not in s:
                            ok = "F"
                        else:
                            ok = "?"
                q["opciones"] = [
                    {"texto": "Verdadero", "correcta": ok == "V", "letra": "V"},
                    {"texto": "Falso", "correcta": ok == "F", "letra": "F"},
                ]
                if ok == "?":
                    q["notas"].append("V/F ambos en verde")
                destino = None
                continue
            mnum = RE_NUM.match(texto)
            if mnum and (q is None or q["opciones"] or primera or gap > 15.5):
                nueva(pag)
                q["numero"] = int(mnum.group(1))
                q["texto"] = texto[mnum.end():]
                continue
            mop = RE_OPC.match(texto)
            sangria = it["x"] > base_x + 8
            if mop and q is not None and q["texto"].strip():
                letra = mop.group(1) or mop.group(2) or mop.group(3) or "•"
                q["opciones"].append({"texto": texto[mop.end():], "correcta": verde, "letra": letra})
                destino = len(q["opciones"]) - 1
                continue
            if q is None:
                nueva(pag)
            continua = (gap is not None and gap <= 15.5) or (primera and sangria)
            if primera and not sangria and isinstance(destino, int):
                # salto de pagina sin sangria: continua si la opcion quedo "abierta"
                continua = bool(re.search(r"[a-záéíóúñ,\-]\s*$", q["opciones"][destino]["texto"])) and not re.match(
                    r"^\s*[¿A-ZÁÉÍÓÚ“\"]", texto
                )
            if continua and destino is not None:
                if destino == "q":
                    q["texto"] += " " + texto
                else:
                    o = q["opciones"][destino]
                    if verde != o["correcta"]:
                        q["notas"].append(f"opcion {o.get('letra')} en verde solo parcialmente")
                        o["correcta"] = o["correcta"] or verde
                    o["texto"] += " " + texto
                continue
            if q["opciones"]:
                esperado = "ABCDEFGH"[len(q["opciones"])] if len(q["opciones"]) < 8 else "?"
                m2 = re.match(rf"^\s*{esperado}\s+(?=[A-ZÁÉÍÓÚ])", texto)
                if m2 and gap is not None and gap < 22:  # opcion sin separador: "C Por la esquina"
                    q["opciones"].append({"texto": texto[m2.end():], "correcta": verde, "letra": esperado})
                    q["notas"].append("opcion sin separador")
                    destino = len(q["opciones"]) - 1
                    continue
                nueva(pag)
                q["texto"] = texto
            else:
                q["texto"] += " " + texto
                destino = "q"
    if marcar_despues and q is not None:
        q["eliminatoria"] = True
    cerrar()

    for q in preguntas:
        if RE_ELIM.search(q["texto"]):
            q["eliminatoria"] = True
        q["texto"] = limpiar(RE_ELIM.sub(" ", q["texto"]))
        q["texto"] = re.sub(r"\(\s*$", "", q["texto"]).strip()
        for o in q["opciones"]:
            if RE_ELIM.search(o["texto"]):
                q["eliminatoria"] = True
            o["texto"] = limpiar(RE_ELIM.sub(" ", o["texto"]))
        q["n_correctas"] = sum(o["correcta"] for o in q["opciones"])
    with open(salida, "w", encoding="utf-8") as f:
        json.dump(preguntas, f, ensure_ascii=False, indent=1)
    print(f"{len(preguntas)} preguntas crudas -> {salida}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
