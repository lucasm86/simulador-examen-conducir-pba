"""Recorta del PDF oficial las imagenes asociadas a cada pregunta.

Uso:
    python -I tools/extraccion/imagenes.py fuentes/cuestionario.pdf tools/extraccion/crudo.json public/img/preguntas

Se renderiza el recorte de la pagina (no el objeto de imagen incrustado) para
conservar las letras y marcas vectoriales superpuestas (A, B, C, circulos rojos).
Si una pregunta tiene mas de una imagen se recorta la union de todas.
"""
import json
import os
import sys

import fitz  # PyMuPDF

ANCHO_MAX = 720


def main(pdf, crudo, destino):
    doc = fitz.open(pdf)
    os.makedirs(destino, exist_ok=True)
    preguntas = json.load(open(crudo, encoding="utf-8"))
    n = 0
    for q in preguntas:
        if not q["imagenes"]:
            continue
        pag = q["imagenes"][0]["pagina"]
        if any(i["pagina"] != pag for i in q["imagenes"]):
            print("AVISO: imagenes en paginas distintas", q["id"])
        rect = fitz.Rect(q["imagenes"][0]["bbox"])
        for i in q["imagenes"][1:]:
            if i["pagina"] == pag:
                rect |= fitz.Rect(i["bbox"])
        rect = fitz.Rect(rect.x0 - 2, rect.y0 - 2, rect.x1 + 2, rect.y1 + 2)
        zoom = min(3.0, ANCHO_MAX / rect.width)
        pix = doc[pag - 1].get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=rect, alpha=False)
        pix.save(os.path.join(destino, q["id"] + ".jpg"), jpg_quality=78)
        n += 1
    print(n, "imagenes ->", destino)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
