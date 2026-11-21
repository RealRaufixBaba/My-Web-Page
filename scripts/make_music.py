#!/usr/bin/env python3
"""Olgun/dark tema icin lo-fi enstrumantal parca.
80 BPM, Am9 - Fmaj7 - Cmaj7 - G6, yumusak pad + sine bas + firça davul + vinil hisi.
Kullanim: python3 scripts/make_music.py -> assets/audio/night-build.mp3
"""
import os
import numpy as np
import lameenc

SR = 44100
BPM = 80.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT          # 3.0 sn
BARS = 16               # 48 sn
DUR = BARS * BAR
N = int(SR * DUR)
rng = np.random.default_rng(11)

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12.0)

NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def nm(name):
    return 12 * (int(name[-1]) + 1) + NOTE[name[:-1]]

# Am9 / Fmaj7 / Cmaj7 / G6
CHORDS = [
    [nm('A2'), nm('E3'), nm('C4'), nm('G4'), nm('B4')],
    [nm('F2'), nm('C3'), nm('A3'), nm('E4'), nm('G4')],
    [nm('C3'), nm('G3'), nm('E4'), nm('B4'), nm('D5')],
    [nm('G2'), nm('D3'), nm('B3'), nm('E4'), nm('A4')],
]

def env(n, a, d, s, r):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    e = np.full(n, s, dtype=float)
    a_n = min(a_n, n)
    if a_n: e[:a_n] = np.linspace(0, 1, a_n, endpoint=False)
    d_end = min(n, a_n + d_n)
    if d_end > a_n: e[a_n:d_end] = np.linspace(1, s, d_end - a_n, endpoint=False)
    r_n = min(r_n, n)
    if r_n: e[-r_n:] *= np.linspace(1, 0, r_n)
    return e

def pad_tone(freq, n):
    t = np.arange(n) / SR
    vib = 1 + 0.0015 * np.sin(2 * np.pi * 0.23 * t)
    ph = 2 * np.pi * np.cumsum(freq * vib) / SR
    # yumusak sinüs + az harmonik
    return (np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.10 * np.sin(3 * ph)) * env(n, 0.9, 0.6, 0.85, 1.1)

def bass_tone(freq, n):
    t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    return (np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)) * env(n, 0.02, 0.15, 0.6, 0.35)

def pluck_tone(freq, n):
    t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    return (np.sin(ph) + 0.22 * np.sin(2.01 * ph) + 0.07 * np.sin(4.02 * ph)) * np.exp(-t * 2.6)

def noise(n):
    return rng.standard_normal(n)

def kick(n):
    t = np.arange(n) / SR
    f = 52 + 70 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)

def brush(n):
    x = noise(n)
    # yumusak lowpass
    lp = np.zeros(n); acc = 0.0
    for i in range(n):
        acc += 0.22 * (x[i] - acc); lp[i] = acc
    return lp * np.exp(-np.arange(n) / (SR * 0.07))

left = np.zeros(N + 2 * SR)
right = np.zeros(N + 2 * SR)

def add(buf, sig, start, gain=1.0):
    end = min(start + len(sig), len(buf))
    if start < len(buf):
        buf[start:end] += gain * sig[:end - start]

for bar in range(BARS):
    chord = CHORDS[bar % 4]
    t0 = int(bar * BAR * SR)

    # pad: akoru bar boyunca tut (yumusak atak)
    pad_len = int(BAR * SR * 1.12)
    for vi, tone in enumerate(chord[1:]):
        sig = pad_tone(midi(tone + 12), pad_len) * (0.055 + 0.012 * (1 - vi / 4))
        add(left, sig, t0, 1.0)
        add(right, sig, t0 + rng.integers(0, 260), 1.0)

    # bas: ilk iki vurusta
    for b in (0, 2):
        st = t0 + int(b * BEAT * SR)
        add(left, bass_tone(midi(chord[0]), int(BEAT * 1.7 * SR)), st, 0.36)
        add(right, bass_tone(midi(chord[0]), int(BEAT * 1.7 * SR)), st, 0.36)

    # pluck arpej: 3. vurusta seyrek
    for k, tone in enumerate(chord[2:4]):
        st = t0 + int((2 + k * 0.5) * BEAT * SR)
        p = pluck_tone(midi(tone + 12), int(BEAT * 1.2 * SR))
        add(left, p, st, 0.10)
        add(right, p, st + 180, 0.09)

    # davul: lo-fi, geri vurusta
    for b in range(4):
        st = t0 + int(b * BEAT * SR)
        if b in (0, 2) or (bar % 2 == 1 and b == 3):
            k = kick(int(0.42 * SR))
            add(left, k, st, 0.42); add(right, k, st, 0.42)
        if b in (1, 3):
            br = brush(int(0.18 * SR))
            add(left, br, st, 0.12); add(right, br, st + 90, 0.10)
        # shaker
        sh = noise(int(0.045 * SR)) * np.exp(-np.arange(int(0.045 * SR)) / (SR * 0.012))
        add(left, sh, st + int(BEAT * 0.5 * SR), 0.016)
        add(right, sh, st + int(BEAT * 0.5 * SR), 0.014)

# vinil / tape hissi
crackle = np.zeros(N)
for _ in range(900):
    i = rng.integers(0, N)
    crackle[i] = rng.normal(0, 0.05)
# hafif yumusatma
kernel = np.ones(3) / 3
crackle = np.convolve(crackle, kernel, mode='same')
hiss = rng.standard_normal(N) * 0.0035

# hafif stereo genisletme + yumusak limiter
delay = int(0.014 * SR)
l = left[:N]
r = np.concatenate([np.zeros(delay), right[:N - delay]])
mix_l = l + crackle * 0.35 + hiss
mix_r = r + np.concatenate([np.zeros(7), crackle[:N - 7]]) * 0.32 + np.roll(hiss, 311)

stereo = np.stack([mix_l, mix_r], axis=1)
# yumusak doyum
stereo = np.tanh(stereo * 1.1)
# loop kenarlarinda tik olmasin: 30 ms fade
fade = int(0.03 * SR)
stereo[:fade] *= np.linspace(0, 1, fade)[:, None]
stereo[-fade:] *= np.linspace(1, 0, fade)[:, None]
stereo /= np.max(np.abs(stereo)) + 1e-9
stereo *= 0.82

os.makedirs('assets/audio', exist_ok=True)
pcm = (stereo * 32767).astype('<i2')
enc = lameenc.Encoder()
enc.set_bit_rate(112)
enc.set_in_sample_rate(SR)
enc.set_channels(2)
enc.set_quality(3)
mp3 = enc.encode(pcm.tobytes()) + enc.flush()
out = 'assets/audio/night-build.mp3'
open(out, 'wb').write(mp3)
print('sure: %.1f sn | boyut: %.1f KB' % (DUR, len(mp3) / 1024))
