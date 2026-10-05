"""Diseño de sonido sintetizado para las historias.

Lee las marcas (cues) que exporta historias.html y genera un WAV estéreo de 48 kHz:
una cama armónica muy suave + efectos (whoosh, ticks, sello, burbujas de chat
y el clic del interruptor, que deja el final en silencio).

    python3 sonido.py cues.json salida.wav
"""
import json
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, stft, istft

SR = 48000
rng = np.random.default_rng(7)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def filt(x, lo=None, hi=None, order=4):
    if lo and hi:
        sos = butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    elif lo:
        sos = butter(order, lo, btype="high", fs=SR, output="sos")
    else:
        sos = butter(order, hi, btype="low", fs=SR, output="sos")
    return sosfilt(sos, x)


def glide(f0, f1, dur, curve="exp"):
    t = t_axis(dur)
    u = t / dur
    f = f0 * (f1 / f0) ** u if curve == "exp" else f0 + (f1 - f0) * u
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def decay(dur, tau):
    return np.exp(-t_axis(dur) / tau)


def noise(dur):
    return rng.standard_normal(int(dur * SR))


# ---------------------------------------------------------------- efectos
def tick(v=1):
    d = 0.09
    s = (np.sin(2 * np.pi * 2300 * t_axis(d)) + 0.4 * np.sin(2 * np.pi * 3450 * t_axis(d))) * decay(d, 0.016)
    s += 0.5 * filt(noise(d), lo=3000) * decay(d, 0.003)
    return 0.10 * v * s


def marker(v=1):
    d = 0.5
    env = np.sin(np.pi * np.clip(t_axis(d) / d, 0, 1)) ** 1.5
    return 0.05 * v * filt(noise(d), 1800, 7000) * env


def rise(v=1):
    d = 1.05
    u = t_axis(d) / d
    env = np.clip(u / 0.25, 0, 1) * np.clip((1 - u) / 0.3, 0, 1)
    s = glide(170, 680, d) + 0.25 * glide(340, 1360, d)
    s += 0.6 * filt(noise(d), 600, 4000) * u ** 2
    return 0.055 * v * s * env


def drop(v=1):
    d = 1.5
    u = t_axis(d) / d
    k = np.where(u < 0.5, 4 * u ** 3, 1 - (-2 * u + 2) ** 3 / 2)  # ease in-out
    f = 680 * (240 / 680) ** k
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.2 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    env = np.clip(u / 0.08, 0, 1) * np.clip((1 - u) / 0.35, 0, 1)
    return 0.05 * v * s * env


def spark(v=1):
    d = 0.35
    s = filt(noise(d), 2500, 9000) * decay(d, 0.04)
    crack = np.zeros(int(d * SR))
    for _ in range(14):
        i = int(rng.uniform(0, 0.12) * SR)
        crack[i:i + 40] += rng.uniform(-1, 1) * np.hanning(40)[: len(crack[i:i + 40])]
    s += 1.5 * filt(crack, lo=1500)
    s += 0.8 * np.sin(2 * np.pi * 120 * t_axis(d)) * decay(d, 0.09)
    return 0.16 * v * s


def thump(v=1):
    d = 0.5
    s = glide(96, 46, d) * decay(d, 0.12)
    s += 0.25 * filt(noise(d), hi=2500) * decay(d, 0.006)
    return 0.32 * v * s


def paper(v=1):
    d = 0.55
    u = t_axis(d) / d
    am = 0.6 + 0.4 * filt(noise(d), hi=25) * 6
    env = np.sin(np.pi * np.clip(u, 0, 1)) ** 2
    return 0.06 * v * filt(noise(d), 900, 5500) * env * am


_checks = {"n": 0}


def check(v=1):
    f = [1174.7, 1318.5, 1480.0, 1568.0][_checks["n"] % 4]
    _checks["n"] += 1
    d = 0.22
    s = (np.sin(2 * np.pi * f * t_axis(d)) + 0.35 * np.sin(2 * np.pi * f * 1.5 * t_axis(d))) * decay(d, 0.05)
    return 0.085 * v * s


def stamp(v=1):
    d = 0.6
    s = 1.2 * glide(72, 38, d) * decay(d, 0.17)
    s += 0.6 * filt(noise(d), hi=1200) * decay(d, 0.04)
    s += 0.5 * filt(noise(d), 300, 1400) * decay(d, 0.02)
    return 0.42 * v * s


def send(v=1):
    d = 0.22
    s = glide(480, 1150, d) * decay(d, 0.06)
    s += 0.4 * filt(noise(d), 2000, 8000) * np.sin(np.pi * t_axis(d) / d)
    return 0.09 * v * s


def pop(v=1):
    d = 0.09
    return 0.09 * v * glide(720, 420, d) * decay(d, 0.03)


def receive(v=1):
    a = np.sin(2 * np.pi * 880 * t_axis(0.09)) * decay(0.09, 0.03)
    b = np.sin(2 * np.pi * 1318.5 * t_axis(0.3)) * decay(0.3, 0.07)
    out = np.zeros(int(0.38 * SR))
    out[: len(a)] += a
    out[int(0.075 * SR): int(0.075 * SR) + len(b)] += b
    return 0.085 * v * out


def type_(v=1):
    d = 0.05
    s = filt(noise(d), 1500, 6000) * decay(d, 0.006) + 0.5 * np.sin(2 * np.pi * 320 * t_axis(d)) * decay(d, 0.008)
    return 0.07 * v * s * rng.uniform(0.7, 1.0)


def whoosh(v=1, dur=0.9, stereo=True):
    n = int(dur * SR)
    t = t_axis(dur)
    env = np.exp(-0.5 * ((t - dur * 0.5) / (dur * 0.17)) ** 2)
    chans = []
    for _ in range(2 if stereo else 1):
        x = noise(dur)
        f, tt, Z = stft(x, fs=SR, nperseg=1024)
        e = np.interp(tt, t, env)
        centre = 350 + 2800 * e
        mask = np.exp(-0.5 * ((f[:, None] - centre[None, :]) / (300 + 900 * e[None, :])) ** 2)
        _, y = istft(Z * mask, fs=SR, nperseg=1024)
        y = y[:n]
        y = np.pad(y, (0, n - len(y)))
        chans.append(y / (np.abs(y).max() + 1e-9) * env)
    sub = np.sin(2 * np.pi * 55 * t) * env ** 2
    return [0.24 * v * (c + 0.35 * sub) for c in chans]


def click(v=1):
    d = 0.25
    out = np.zeros(int(d * SR))

    def hit(at, amp):
        s = filt(noise(0.04), lo=1500) * decay(0.04, 0.0025)
        s += 0.6 * np.sin(2 * np.pi * 2400 * t_axis(0.04)) * decay(0.04, 0.005)
        s += 0.5 * np.sin(2 * np.pi * 950 * t_axis(0.04)) * decay(0.04, 0.01)
        i = int(at * SR)
        out[i:i + len(s)] += amp * s

    hit(0.0, 1.0)
    hit(0.013, 0.45)
    out += 0.35 * np.sin(2 * np.pi * 110 * t_axis(d)) * decay(d, 0.03)
    return 0.55 * v * out


FX = {
    "tick": tick, "marker": marker, "rise": rise, "drop": drop, "spark": spark, "thump": thump,
    "paper": paper, "check": check, "stamp": stamp, "send": send, "pop": pop, "receive": receive,
    "type": type_,
}

# ---------------------------------------------------------------- cama armónica
# I – vi – IV – V en La mayor, una por historia (Amaj9, F#m9, Dmaj9, Eadd9)
CHORDS = [
    [110.0, 164.81, 246.94, 277.18, 329.63],
    [92.50, 138.59, 207.65, 220.00, 329.63],
    [73.42, 146.83, 220.00, 277.18, 369.99],
    [82.41, 123.47, 207.65, 246.94, 369.99],
]


def pad(chord, dur, seed):
    r = np.random.default_rng(seed)
    t = t_axis(dur)
    L = np.zeros_like(t)
    R = np.zeros_like(t)
    for k, f in enumerate(chord):
        lfo = 0.75 + 0.25 * np.sin(2 * np.pi * (0.11 + 0.03 * k) * t + r.uniform(0, 6.28))
        amp = 1.0 / (1 + 0.35 * k)
        for ch, det in ((L, 0.9985), (R, 1.0015)):
            ph = r.uniform(0, 6.28)
            ch += amp * lfo * (np.sin(2 * np.pi * f * det * t + ph) + 0.12 * np.sin(2 * np.pi * 2 * f * det * t + ph))
    return filt(L, hi=1800, order=2), filt(R, hi=1800, order=2)


def bed(duration, segments, end_cut=None):
    """segments: lista de (inicio, índice_de_acorde)."""
    n = int(duration * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    xf = 0.8
    for j, (start, ci) in enumerate(segments):
        end = segments[j + 1][0] + xf if j + 1 < len(segments) else duration
        a, b = int(start * SR), min(n, int(end * SR))
        pl, pr = pad(CHORDS[ci], (b - a) / SR, 11 + j)
        m = b - a
        env = np.ones(m)
        fi = int((xf if j else 1.4) * SR)
        env[:fi] = np.linspace(0, 1, fi) ** 1.5
        if j + 1 < len(segments):
            env[-int(xf * SR):] *= np.linspace(1, 0, int(xf * SR)) ** 1.5
        L[a:b] += pl[:m] * env
        R[a:b] += pr[:m] * env
    t = t_axis(duration)
    hum = sum(a * np.sin(2 * np.pi * f * t) for f, a in ((100, 1.0), (150, 0.3), (200, 0.45), (300, 0.15)))
    hum *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.21 * t)
    air = filt(noise(duration), hi=900, order=2)
    air /= np.abs(air).max()
    L = 0.016 * L + 0.006 * hum + 0.008 * air
    R = 0.016 * R + 0.006 * hum + 0.008 * np.roll(air, 4800)
    fade_out = int(0.6 * SR)
    if end_cut is None:
        L[-fade_out:] *= np.linspace(1, 0, fade_out)
        R[-fade_out:] *= np.linspace(1, 0, fade_out)
    else:
        c = int(end_cut * SR)
        L[c:] = 0
        R[c:] = 0
        k = int(0.004 * SR)
        L[c - k:c] *= np.linspace(1, 0, k)
        R[c - k:c] *= np.linspace(1, 0, k)
    return L, R


def main(cues_path, out_path):
    data = json.load(open(cues_path))
    duration, cues = data["duration"], data["cues"]
    n = int(duration * SR) + SR
    L = np.zeros(n)
    R = np.zeros(n)

    def add(sig, at, pan=0.0):
        i = int(at * SR)
        if isinstance(sig, list):
            l, r = sig
        else:
            l = r = sig
        m = min(len(l), n - i)
        if m <= 0:
            return
        L[i:i + m] += l[:m] * (1 - max(0, pan))
        R[i:i + m] += r[:m] * (1 + min(0, pan))

    click_t = None
    for c in cues:
        name, at, v = c["n"], c["t"], c.get("v", 1)
        if name == "whoosh":
            add(whoosh(v), at)
        elif name == "click":
            click_t = at
            add(click(v), at)
        elif name in FX:
            pan = {"send": 0.25, "receive": -0.25, "pop": -0.2, "type": -0.15}.get(name, 0.0)
            add(FX[name](v), at, pan)

    if data.get("master"):
        starts = [0.0] + [c["t"] for c in cues if c["n"] == "whoosh"]
        segments = [(s, i % 4) for i, s in enumerate(starts)]
    else:
        segments = [(0.0, data.get("story", 0))]
    bl, br = bed(duration, segments, click_t)
    L[: len(bl)] += bl
    R[: len(br)] += br

    if click_t is not None:  # tras el clic, solo queda la cola del propio clic
        c = int((click_t + 0.25) * SR)
        L[c:] = 0
        R[c:] = 0

    L, R = L[: int(duration * SR)], R[: int(duration * SR)]
    st = np.stack([L, R], 1)
    st = filt(st.T, lo=28, order=2).T
    st = np.tanh(st * 1.6) / np.tanh(1.6)  # limitador suave
    peak = np.abs(st).max()
    st *= 0.89 / peak if peak > 0.89 else 1.0
    wavfile.write(out_path, SR, (st * 32767).astype(np.int16))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
