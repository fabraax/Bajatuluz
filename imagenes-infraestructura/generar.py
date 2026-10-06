#!/usr/bin/env python3
"""Genera las imágenes de infraestructura de energía con MuAPI.

Modelo, formato y prompts están en prompts.json (Nano Banana Pro, 9:16, 2K).

    python3 generar.py              # genera las que falten
    python3 generar.py --dry-run    # enseña las peticiones sin gastar créditos
    python3 generar.py --solo 03    # solo la 03 (acepta varias: --solo 01 04)
    python3 generar.py --solo 02 --rehacer   # vuelve a generar una que ya existe

Necesita MUAPI_API_KEY en el entorno y la skill open-generative-ai (usa su
scripts/muapi.py; si no la encuentra, indica la ruta con MUAPI_PY=...).
Las imágenes se guardan en esta carpeta (01_alta-tension.png, …) y cada
generación queda apuntada en imagenes.json con el modelo, los parámetros,
el prompt completo, el request_id y la URL, para poder repetirla.
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp"}


def find_muapi():
    env = os.environ.get("MUAPI_PY")
    if env and Path(env).is_file():
        return env
    for pattern in (str(Path.home() / ".claude/skills/**/open-generative-ai/scripts/muapi.py"),
                    "/root/.claude/skills/**/open-generative-ai/scripts/muapi.py"):
        hits = glob.glob(pattern, recursive=True)
        if hits:
            return hits[0]
    sys.exit("No encuentro muapi.py de la skill open-generative-ai. "
             "Indica la ruta con MUAPI_PY=/ruta/a/muapi.py")


def main():
    ap = argparse.ArgumentParser(description="Genera las imágenes de prompts.json con MuAPI")
    ap.add_argument("--dry-run", action="store_true", help="mostrar las peticiones sin enviarlas")
    ap.add_argument("--solo", nargs="+", default=[], metavar="NN", help="generar solo estas (por prefijo)")
    ap.add_argument("--rehacer", action="store_true", help="regenerar aunque la imagen ya exista")
    args = ap.parse_args()

    cfg = json.loads((HERE / "prompts.json").read_text(encoding="utf-8"))
    muapi = find_muapi()
    if not args.dry_run and not os.environ.get("MUAPI_API_KEY"):
        sys.exit("Falta MUAPI_API_KEY en el entorno.")

    manifest_path = HERE / "imagenes.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    images = [im for im in cfg["images"] if not args.solo or any(im["slug"].startswith(s) for s in args.solo)]

    for im in images:
        existing = [p for p in sorted(HERE.glob(im["slug"] + ".*")) if p.suffix.lower() in IMAGE_EXT]
        if existing and not args.rehacer and not args.dry_run:
            print(f"· {im['slug']}: ya existe ({existing[0].name}), la salto")
            continue

        prompt = f"{im['subject']} {cfg['style']}"
        cmd = [sys.executable, muapi, "generate", "--task", "t2i", "--model", cfg["model"],
               "--prompt", prompt, "--aspect-ratio", cfg["aspect_ratio"],
               "--resolution", cfg["resolution"], "--quiet"]
        if args.dry_run:
            subprocess.run(cmd + ["--dry-run"], check=True, stderr=subprocess.DEVNULL)
            continue

        print(f"→ {im['slug']}: {im['tema']}", flush=True)
        with tempfile.TemporaryDirectory() as tmp:
            # stderr va directo a la terminal: así el request_id se ve en cuanto existe
            r = subprocess.run(cmd + ["--out", tmp], stdout=subprocess.PIPE, text=True)
            if r.returncode != 0:
                sys.exit("La generación ha fallado. Si arriba aparece un request_id, el trabajo sigue en "
                         f"el servidor: recupéralo con\n  python3 {muapi} poll <request_id> --out {HERE}")
            out = json.loads(r.stdout)
            files = out.get("files") or []
            if not files:
                sys.exit(f"{im['slug']}: la API no ha devuelto ninguna imagen:\n{r.stdout}")
            src = Path(files[0])
            dest = HERE / f"{im['slug']}{src.suffix.lower()}"
            for old in existing:
                old.unlink()
            shutil.move(str(src), dest)

        manifest[im["slug"]] = {
            "archivo": dest.name,
            "tema": im["tema"],
            "modelo": cfg["model"],
            "aspect_ratio": cfg["aspect_ratio"],
            "resolution": cfg["resolution"],
            "prompt": prompt,
            "request_id": out.get("request_id"),
            "url": (out.get("urls") or [None])[0],
        }
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"✓ {dest.name}")


if __name__ == "__main__":
    main()
