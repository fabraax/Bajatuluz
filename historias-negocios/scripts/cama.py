"""Genera la cama musical suave (acordes I-vi-IV-V en La) para el vídeo completo y cada historia.

    python3 scripts/cama.py   ->  assets/audio/cama-*.wav

Reutiliza el sintetizador de historias-empieza/fuente/sonido.py.
"""
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "historias-empieza" / "fuente"))
import sonido  # noqa: E402

OUT = HERE.parent / "assets" / "audio"
OUT.mkdir(parents=True, exist_ok=True)


def write(name, L, R):
    st = np.stack([L, R], 1)
    st = st / (np.abs(st).max() + 1e-9) * 0.5          # pico a -6 dBFS; el volumen final lo pone data-volume
    wavfile.write(OUT / name, sonido.SR, (st * 32767).astype(np.int16))
    print("✓", OUT / name)


# vídeo completo: un acorde por historia, se corta en seco con el clic del interruptor
L, R = sonido.bed(30.0, [(0.0, 0), (6.4, 1), (12.8, 2), (19.2, 3)], end_cut=28.8)
write("cama-completo.wav", L, R)
for i, (name, dur) in enumerate([("hosteleria", 7.0), ("comercios", 7.0), ("oficinas", 7.0), ("varios-locales", 9.0)]):
    L, R = sonido.bed(dur, [(0.0, i)])
    write(f"cama-{name}.wav", L, R)
