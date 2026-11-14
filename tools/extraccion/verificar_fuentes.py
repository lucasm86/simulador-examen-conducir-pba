"""Comprueba si los PDF oficiales cambiaron respecto de la copia usada para construir el banco.

Uso:
    python -I tools/extraccion/verificar_fuentes.py            # solo compara
    python -I tools/extraccion/verificar_fuentes.py --guardar  # ademas guarda lo descargado en fuentes/nuevas/

Baja cada documento de su URL oficial (gba.gob.ar) y compara el SHA-256 con el de
fuentes/*.pdf. No reemplaza nada por si solo: si hay cambios, revisar el documento
nuevo, copiarlo a fuentes/ y volver a ejecutar `npm run banco` (y la curaduria).

Codigos de salida: 0 = sin cambios, 1 = hay cambios, 2 = no se pudo comprobar.
"""
import gzip
import hashlib
import os
import sys
import urllib.error
import urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOCUMENTOS = {
    "cuestionario.pdf": "https://www.gba.gob.ar/static/seguridadvial/docs/cuestionario.pdf",
    "manual_del_conductor.pdf": "https://www.gba.gob.ar/static/seguridadvial/docs/manual_del_conductor.pdf",
}
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"


def sha(datos):
    return hashlib.sha256(datos).hexdigest()


def descargar(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        datos = r.read()
    if datos[:2] == b"\x1f\x8b":
        datos = gzip.decompress(datos)
    return datos


def main():
    guardar = "--guardar" in sys.argv
    cambios = fallas = 0
    for nombre, url in DOCUMENTOS.items():
        local = os.path.join(RAIZ, "fuentes", nombre)
        sha_local = sha(open(local, "rb").read()) if os.path.exists(local) else None
        try:
            datos = descargar(url)
        except (urllib.error.URLError, OSError) as e:
            print(f"[NO DISPONIBLE] {nombre}: {e}")
            fallas += 1
            continue
        if datos[:5] != b"%PDF-":
            print(f"[NO DISPONIBLE] {nombre}: el sitio no devolvio un PDF (puede estar en mantenimiento).")
            fallas += 1
            continue
        sha_nuevo = sha(datos)
        if sha_nuevo == sha_local:
            print(f"[SIN CAMBIOS]   {nombre}  sha256={sha_nuevo[:16]}...")
        else:
            cambios += 1
            print(f"[CAMBIO]        {nombre}\n    local:   {sha_local}\n    oficial: {sha_nuevo}  ({len(datos)} bytes)")
            if guardar:
                destino = os.path.join(RAIZ, "fuentes", "nuevas")
                os.makedirs(destino, exist_ok=True)
                with open(os.path.join(destino, nombre), "wb") as f:
                    f.write(datos)
                print(f"    guardado en fuentes/nuevas/{nombre}")
    if fallas:
        print("\nNo se pudo comprobar todo. Reintentar mas tarde.")
        sys.exit(2)
    if cambios:
        print("\nHay documentos actualizados: revisar, reemplazar en fuentes/ y ejecutar `npm run banco`.")
        sys.exit(1)
    print("\nLas fuentes locales coinciden con las publicadas.")


if __name__ == "__main__":
    main()
