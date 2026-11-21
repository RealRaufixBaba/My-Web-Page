#!/usr/bin/env python3
"""RaufixBaba bio sitesi icin 8-bit chiptune tema ureticisi.
Kullanim: python3 scripts/make_music.py  ->  assets/audio/coder-theme.mp3
"""
import math, os, struct, wave
import numpy as np
import lameenc

SR = 44100
BPM = 132.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
BARS = 16
DUR = BARS * BAR
N = int(SR * DUR)

def t_axis(n):
    return np.arange(n) / SR

def adsr(n, a=0.005, d=0.06, s=0.6, r=0.02):
    a_n = max(1, int(a * SR)); d_n = max(1, int(d * SR)); r_n = max(1, int(r * SR))
    env = np.ones(n) * s
    a_n = min(a_n, n)
    env[:a_n] = np.linspace(0, 1, a_n, endpoint=False)
    d_end = min(n, a_n + d_n)
    if d_end > a_n:
        env[a_n:d_end] = np.linspace(1, s, d_end - a_n, endpoint=False)
    rel = min(n, r_n)
    env[-rel:] *= np.linspace(1, 0, rel)
    return env

def phase(freq, n, vib=0.0):
    t = t_axis(n)
    f = freq * (1.0 + vib * np.sin(2 * np.pi * 5.2 * t))
    return 2 * np.pi * np.cumsum(f) / SR

def square(freq, n, duty=0.5, **kw):
    ph = phase(freq, n)
    return np.where((ph / (2 * np.pi)) % 1.0 < duty, 1.0, -1.0) * adsr(n, **kw)

def triangle(freq, n, **kw):
    ph = (phase(freq, n) / (2 * np.pi)) % 1.0
    return (4 * np.abs(ph - 0.5) - 1) * adsr(n, **kw)

def saw(freq, n, **kw):
    ph = (phase(freq, n) / (2 * np.pi)) % 1.0
    return (2 * ph - 1) * adsr(n, **kw)

def noise_hit(n, decay=0.05, cutoff=0.6):
    rng = np.random.default_rng(7)
    x = rng.standard_normal(n)
    # basit tek kutuplu lowpass
    y = np.zeros(n); acc = 0.0
    for i in range(n):
        acc += cutoff * (x[i] - acc)
        y[i] = acc
    env = np.exp(-np.arange(n) / (SR * decay))
    return y * env

def add(buf, sig, start):
    end = start + len(sig)
    if start >= len(buf):
        return
    end = min(end, len(buf))
    buf[start:end] += sig[:end - start]

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12.0)

NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def nm(name):
    p, o = name[:-1], int(name[-1])
    return 12 * (o + 1) + NOTE[p]

# Am - F - C - G  (4 bar dongu, 16 bar)
prog = [
    ('A', [nm('A2'), nm('C3'), nm('E3')]),
    ('F', [nm('F2'), nm('A2'), nm('C3')]),
    ('C', [nm('C3'), nm('E3'), nm('G3')]),
    ('G', [nm('G2'), nm('B2'), nm('D3')]),
]

mix = np.zeros(N + SR)

lead_pat = [0, 2, 1, 2, 0, 2, 1, 2]
for bar in range(BARS):
    chord = prog[bar % 4][1]
    bar_start = int(bar * BAR * SR)

    # --- bass: sekizlik square
    root = chord[0] - 12
    for eighth in range(8):
        st = bar_start + int(eighth * BEAT / 2 * SR)
        ln = int(BEAT / 2 * SR * 0.92)
        add(mix, 0.30 * square(midi(root + (12 if eighth % 4 == 3 else 0)), ln, duty=0.42, a=0.004, d=0.05, s=0.55, r=0.02), st)

    # --- arpej: onaltilik pulse lead, 2 oktav yukari
    for k in range(16):
        st = bar_start + int(k * BEAT / 4 * SR)
        ln = int(BEAT / 4 * SR * 0.85)
        tone = chord[lead_pat[k % len(lead_pat)]] + 12
        if bar % 4 == 3 and k >= 12:
            tone += 12
        add(mix, 0.20 * square(midi(tone), ln, duty=0.25, a=0.003, d=0.04, s=0.45, r=0.015), st)

    # --- pad: triangle akor
    for tone in chord:
        ln = int(BAR * SR * 0.98)
        add(mix, 0.075 * triangle(midi(tone + 12), ln, a=0.12, d=0.2, s=0.75, r=0.25), bar_start)

    # --- davul
    for beat in range(4):
        st = bar_start + int(beat * BEAT * SR)
        # kick
        ln = int(0.20 * SR)
        tt = t_axis(ln)
        kick = np.sin(2 * np.pi * np.cumsum(120 * np.exp(-tt * 22) + 45) / SR) * np.exp(-tt * 16)
        add(mix, 0.55 * kick, st)
        # snare (2 ve 4)
        if beat in (1, 3):
            add(mix, 0.20 * noise_hit(int(0.16 * SR), decay=0.045, cutoff=0.35), st)
        # hihat sekizlik
        for h in range(2):
            hst = st + int(h * BEAT / 2 * SR)
            add(mix, 0.075 * noise_hit(int(0.05 * SR), decay=0.012, cutoff=0.9), hst)

# son 4 barda lead'i bir oktav yuksek katmanla guclendir (final enerjisi)
final_start = int(12 * BAR * SR)
rng = np.random.default_rng(3)
mix = mix[:N]

# hafif stereo genisletme + limiter
delay = int(0.012 * SR)
left = mix.copy()
right = np.concatenate([np.zeros(delay), mix[:-delay]])
stereo = np.stack([left * 0.96 + right * 0.16, right * 0.96 + left * 0.16], axis=1)
stereo = np.tanh(stereo * 1.25)
stereo /= np.max(np.abs(stereo)) + 1e-9
stereo *= 0.92

os.makedirs('assets/audio', exist_ok=True)
pcm = (stereo * 32767).astype('<i2')
enc = lameenc.Encoder()
enc.set_bit_rate(128)
enc.set_in_sample_rate(SR)
enc.set_channels(2)
enc.set_quality(2)
mp3 = enc.encode(pcm.tobytes()) + enc.flush()
open('assets/audio/coder-theme.mp3', 'wb').write(mp3)
print('sure: %.1f sn, boyut: %.1f KB' % (DUR, len(mp3) / 1024))
