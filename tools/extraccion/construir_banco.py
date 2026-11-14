"""Construye el banco de preguntas de la app a partir de crudo.json + curaduria.py.

Uso:
    python -I tools/extraccion/construir_banco.py

Salidas:
    src/data/banco/oficial.json     preguntas verificadas (las unicas que usa el motor)
    src/data/banco/excluidas.json   preguntas descartadas o pendientes, con motivo
    src/data/banco/meta.json        categorias, conteos y datos de la fuente

La construccion FALLA (exit 1) si:
  * una pregunta no excluida no tiene tema asignado,
  * una pregunta incluida no tiene exactamente una opcion correcta,
  * una cita normativa no aparece en el texto de la norma (fuentes/normativa/),
  * falta la imagen de una pregunta que la requiere.
"""
import hashlib
import json
import os
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
sys.path.insert(0, AQUI)
import curaduria as C  # noqa: E402

DOC = "Batería de preguntas y respuestas – Examen teórico Licencia de Conducir (IF-2019-33101289-GDEBA-DPPYSVMGGP)"
CLASES_TODAS = ["A", "B1", "B2", "C", "D", "E", "G"]
CLASES_AUTO = ["B1", "B2"]


def norm(t):
    return re.sub(r"\s+", " ", t).strip()


def verificar_referencias():
    textos, errores = {}, []
    for clave, archivo in C.NORMAS.items():
        ruta = os.path.join(RAIZ, "fuentes", "normativa", archivo)
        textos[clave] = norm(open(ruta, encoding="utf-8").read())
    for tema, (_, _, _, ref, evidencia, _) in C.TEMAS.items():
        if ref and not evidencia:
            errores.append(f"tema {tema}: referencia sin evidencia")
        for clave, patron in evidencia:
            if not re.search(patron, textos[clave], re.I):
                errores.append(f"tema {tema}: no se encontro en {C.NORMAS[clave]}: {patron}")
    return errores


def expandir_asignacion(ids_orden):
    pos = {i: n for n, i in enumerate(ids_orden)}
    tema_de, errores = {}, []
    for linea in C.ASIGNACION.strip().splitlines():
        tema, _, resto = linea.partition(":")
        tema = tema.strip()
        if tema not in C.TEMAS:
            errores.append(f"tema inexistente: {tema}")
            continue
        for tok in resto.split():
            if ".." in tok:
                a, b = tok.split("..")
                if a not in pos or b not in pos:
                    errores.append(f"rango invalido: {tok}")
                    continue
                ids = ids_orden[pos[a]: pos[b] + 1]
            else:
                if tok not in pos:
                    errores.append(f"id inexistente: {tok}")
                    continue
                ids = [tok]
            for i in ids:
                if i in C.EXCLUIDAS:
                    continue
                if i in tema_de and (".." not in tok):
                    errores.append(f"{i} asignada dos veces ({tema_de[i]} y {tema})")
                # una asignacion explicita pisa a la de un rango
                if i not in tema_de or ".." not in tok:
                    tema_de[i] = tema
    return tema_de, errores


def limpiar_enunciado(t):
    for pat in C.QUITAR_DEL_TEXTO:
        t = re.sub(pat, " ", t, flags=re.I)
    t = t.replace("””", "”").replace("““", "“").replace("}", "")
    t = re.sub(r"\s+([?:.,;])", r"\1", norm(t))
    t = re.sub(r":\s*:", ":", t)
    t = re.sub(r"\?\s*:$", "?", t)      # "...marcha atras?:" -> "...marcha atras?"
    return t[0].upper() + t[1:] if t else t


def limpiar_opcion(t):
    t = norm(t.replace("}", ""))
    t = re.sub(r"\s+X$", "", t)          # marca manuscrita "X" que quedo en el PDF
    t = re.sub(r"\s+\.$", ".", t)
    t = re.sub(r"\s+([?:.,;])", r"\1", t)
    return t[0].upper() + t[1:] if t else t


def main():
    crudo = json.load(open(os.path.join(AQUI, "crudo.json"), encoding="utf-8"))
    ids_orden = [q["id"] for q in crudo]
    errores = verificar_referencias()
    tema_de, e2 = expandir_asignacion(ids_orden)
    errores += e2
    for i in C.EXCLUIDAS:
        if i not in ids_orden:
            errores.append(f"EXCLUIDAS: id inexistente {i}")

    sha = hashlib.sha256(open(os.path.join(RAIZ, "fuentes", "cuestionario.pdf"), "rb").read()).hexdigest()
    banco, excluidas, vistos = [], [], {}
    for q in crudo:
        qid = q["id"]
        parche = C.PARCHES.get(qid, {})
        texto = parche.get("texto", q["texto"])
        opciones = [(o["texto"], o["correcta"]) for o in q["opciones"]]
        if "opciones" in parche:
            opciones = parche["opciones"]
        for idx, nuevo in parche.get("opcion_texto", {}).items():
            opciones[idx] = (nuevo, opciones[idx][1])
        texto = limpiar_enunciado(texto)
        opciones = [(limpiar_opcion(t), ok) for t, ok in opciones]

        if qid in C.EXCLUIDAS:
            motivo, detalle = C.EXCLUIDAS[qid]
            excluidas.append({
                "id": "of-" + qid, "pagina": q["pagina"], "numeroOriginal": q["numero"],
                "enunciado": texto, "motivo": motivo, "motivoDescripcion": C.MOTIVOS[motivo],
                "detalle": detalle, "eliminatoriaEnOriginal": q["eliminatoria"],
                "estado": "pendiente" if motivo == "pendiente" else "excluida",
            })
            continue
        if qid not in tema_de:
            errores.append(f"{qid} sin tema ni exclusion: {texto[:60]}")
            continue
        n_ok = sum(ok for _, ok in opciones)
        if n_ok != 1 or len(opciones) < 2 or any(not t for t, _ in opciones) or len(texto) < 10:
            errores.append(f"{qid} invalida (opciones={len(opciones)}, correctas={n_ok}): {texto[:60]}")
            continue
        cat, subcat, fundamento, ref, _, ref_manual = C.TEMAS[tema_de[qid]]
        es_vf = [t.rstrip(".").lower() for t, _ in opciones] == ["verdadero", "falso"]
        ops = [{"id": "abcdefgh"[n], "texto": t} for n, (t, _) in enumerate(opciones)]
        correcta = ops[[ok for _, ok in opciones].index(True)]
        explic = f"Respuesta correcta según el cuestionario oficial: «{correcta['texto'].rstrip('.')}»."
        if qid in C.EXPLICACIONES:
            explic += " " + C.EXPLICACIONES[qid]
        explic += " " + fundamento
        imagen = None
        if q["imagenes"]:
            rel = f"img/preguntas/{qid}.jpg"
            if not os.path.exists(os.path.join(RAIZ, "public", rel)):
                errores.append(f"{qid}: falta la imagen {rel}")
            imagen = {"src": rel, "alt": f"Imagen de la pregunta, tomada del cuestionario oficial (página {q['pagina']}). {subcat}."}
        clave_dup = norm(texto.lower()) + "|" + "|".join(sorted(t.lower() for t, _ in opciones)) + "|" + (imagen["src"] if imagen else "")
        if clave_dup in vistos:
            errores.append(f"{qid} duplica a {vistos[clave_dup]}: {texto[:60]}")
        vistos[clave_dup] = qid
        en_auto = "Auto y Camioneta" in q["seccion"]
        banco.append({
            "id": "of-" + qid,
            "enunciado": texto,
            "opciones": ops,
            "respuestaCorrecta": correcta["id"],
            "explicacion": explic,
            "categoria": cat,
            "subcategoria": subcat,
            "clases": CLASES_AUTO if en_auto else CLASES_TODAS,
            "dificultad": None,
            "imagen": imagen,
            "tipo": "verdadero-falso" if es_vf else "opcion-multiple",
            "ordenFijo": es_vf or any(re.search(C.RE_ORDEN_FIJO, t, re.I) for t, _ in opciones),
            "fuente": {"documento": DOC, "pagina": q["pagina"], "numeroOriginal": q["numero"], "seccion": q["seccion"]},
            "referenciaNormativa": ref,
            "referenciaManual": ref_manual,
            "fechaRevision": C.FECHA_REVISION,
            "estado": "verificada",
            "nivelVerificacion": "norma" if ref else "clave-oficial",
            "eliminatoria": bool(q["eliminatoria"]),
            "origen": "oficial",
        })

    if errores:
        print("ERRORES DE CONSTRUCCION:")
        for e in errores:
            print("  -", e)
        sys.exit(1)

    dest = os.path.join(RAIZ, "src", "data", "banco")
    os.makedirs(dest, exist_ok=True)
    por_cat = {}
    for p in banco:
        por_cat[p["categoria"]] = por_cat.get(p["categoria"], 0) + 1
    por_motivo = {}
    for e in excluidas:
        por_motivo[e["motivo"]] = por_motivo.get(e["motivo"], 0) + 1
    meta = {
        "fechaRevision": C.FECHA_REVISION,
        "fuente": {
            "documento": DOC,
            "urlOficial": "https://www.gba.gob.ar/static/seguridadvial/docs/cuestionario.pdf",
            "obtenidoDe": "https://web.archive.org/web/20260916145504/https://www.gba.gob.ar/static/seguridadvial/docs/cuestionario.pdf",
            "sha256": sha,
            "paginasProcesadas": "2 a 178 (secciones generales y «Auto y Camioneta»)",
        },
        "categorias": [{"id": k, "nombre": v, "preguntas": por_cat.get(k, 0)} for k, v in C.CATEGORIAS.items()],
        "totales": {
            "transcriptas": len(crudo), "verificadas": len(banco), "excluidas": len(excluidas),
            "eliminatorias": sum(p["eliminatoria"] for p in banco),
            "conImagen": sum(1 for p in banco if p["imagen"]),
            "porMotivoDeExclusion": por_motivo,
        },
    }
    for nombre, datos in (("oficial.json", banco), ("excluidas.json", excluidas), ("meta.json", meta)):
        with open(os.path.join(dest, nombre), "w", encoding="utf-8") as f:
            json.dump(datos, f, ensure_ascii=False, indent=1)
    # borra imagenes de preguntas que no entraron al banco
    usadas = {os.path.basename(p["imagen"]["src"]) for p in banco if p["imagen"]}
    carpeta = os.path.join(RAIZ, "public", "img", "preguntas")
    for f in os.listdir(carpeta):
        if f not in usadas:
            os.remove(os.path.join(carpeta, f))
    print(json.dumps(meta["totales"], ensure_ascii=False))
    print({c["id"]: c["preguntas"] for c in meta["categorias"]})


if __name__ == "__main__":
    main()
