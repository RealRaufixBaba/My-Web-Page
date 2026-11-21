#!/usr/bin/env python3
"""Programci temali minik animasyonlu piksel emoji GIF'leri (48x48 chip'ler).
Cikti: assets/img/emoji/*.gif
"""
import os
from PIL import Image, ImageDraw

SCALE = 3          # 16px sanat -> 48px
PAD = 4
SIZE = 16 * SCALE + PAD * 2
BG = (18, 21, 26)
BORDER = (43, 49, 56)

INK = (214, 220, 212)
DIM = (110, 118, 124)
SAGE = (140, 173, 152)
AMBER = (209, 160, 92)
CREAM = (221, 212, 194)
BROWN = (122, 88, 62)
PANEL = (13, 16, 19)
STEEL = (58, 66, 76)

def canvas():
    im = Image.new('RGB', (16, 16), BG)
    return im, ImageDraw.Draw(im)

def chip(img):
    out = Image.new('RGB', (SIZE, SIZE), BG)
    out.paste(img.resize((16 * SCALE, 16 * SCALE), Image.NEAREST), (PAD, PAD))
    d = ImageDraw.Draw(out)
    d.rectangle([0, 0, SIZE - 1, SIZE - 1], outline=BORDER)
    return out

def save(name, frames, duration=220):
    os.makedirs('assets/img/emoji', exist_ok=True)
    frames = [chip(f) for f in frames]
    frames[0].save(f'assets/img/emoji/{name}.gif', save_all=True, append_images=frames[1:],
                   duration=duration, loop=0, optimize=True, disposal=1)

# ---------------- cursor ----------------
def cursor(open_):
    im, d = canvas()
    d.rectangle([1, 2, 14, 13], fill=PANEL, outline=STEEL)
    d.rectangle([1, 2, 14, 3], fill=STEEL)
    # ">" prompt
    for i in range(3):
        d.point((4 + i, 6 + i), fill=SAGE)
        d.point((4 + i, 10 - i), fill=SAGE)
    # yanip sonen imlec blogu
    if open_:
        d.rectangle([8, 8, 10, 10], fill=AMBER)
    return im
save('cursor', [cursor(True), cursor(False), cursor(True), cursor(False)], 260)

# ---------------- coffee ----------------
def coffee(phase):
    im, d = canvas()
    # fincan
    d.rectangle([4, 8, 10, 12], fill=CREAM)
    d.rectangle([5, 9, 9, 11], fill=BROWN)
    d.rectangle([4, 8, 10, 8], fill=(236, 230, 216))
    d.rectangle([11, 9, 12, 11], fill=None, outline=CREAM)
    d.point((11, 9), fill=CREAM); d.point((12, 10), fill=CREAM); d.point((11, 11), fill=CREAM)
    d.rectangle([2, 13, 12, 13], fill=STEEL)
    # buhar
    steam = [(6, 6, 5), (8, 5, 4), (7, 4, 3)]
    for i, (x, y, h) in enumerate(steam):
        xx = x + ((phase + i) % 3) - 1
        for k in range(2):
            d.point((xx, y - k), fill=DIM)
    return im
save('coffee', [coffee(p) for p in range(3)], 300)

# ---------------- bolt ----------------
def bolt(level):
    im, d = canvas()
    col = {0: (70, 76, 84), 1: AMBER, 2: (245, 214, 158)}[level]
    pts = [(9, 2), (5, 8), (8, 8), (6, 13), (12, 6), (9, 6)]
    d.polygon(pts, fill=col)
    if level == 2:
        for p in [(4, 7), (12, 5), (10, 11)]:
            d.point(p, fill=(255, 240, 210))
    return im
save('bolt', [bolt(2), bolt(1), bolt(2), bolt(0), bolt(1)], 130)

# ---------------- keyboard ----------------
def keyboard(active):
    im, d = canvas()
    d.rectangle([1, 7, 14, 12], fill=(35, 41, 48), outline=STEEL)
    for row in range(2):
        for col in range(5):
            x = 3 + col * 2.4
            y = 8 + row * 2
            d.rectangle([round(x), y, round(x), y], fill=(78, 87, 97))
    keys = [(3, 8), (7, 8), (12, 8), (5, 10), (9, 10)]
    kx, ky = keys[active]
    d.rectangle([kx, ky, kx, ky], fill=AMBER)
    d.rectangle([6, 9, 7, 9], fill=(120, 130, 140))
    return im
save('keyboard', [keyboard(i) for i in range(5)], 180)

# ---------------- chip ----------------
def chip_cpu(phase):
    im, d = canvas()
    d.rectangle([4, 4, 11, 11], fill=(45, 52, 60), outline=STEEL)
    d.rectangle([6, 6, 9, 9], fill=(24, 28, 33), outline=(70, 79, 89))
    for i in range(3):
        y = 5 + i * 2
        d.rectangle([1, y, 3, y], fill=(80, 90, 100))
        d.rectangle([12, y, 14, y], fill=(80, 90, 100))
        x = 5 + i * 2
        d.rectangle([x, 1, x, 3], fill=(80, 90, 100))
        d.rectangle([x, 12, x, 14], fill=(80, 90, 100))
    if phase % 2 == 0:
        d.rectangle([7, 7, 8, 8], fill=AMBER)
    else:
        d.rectangle([7, 7, 8, 8], fill=SAGE)
    return im
save('chip', [chip_cpu(i) for i in range(6)], 160)

# ---------------- bug ----------------
def bug(phase):
    im, d = canvas()
    body = SAGE if phase % 2 == 0 else (126, 158, 138)
    d.rectangle([6, 7, 10, 11], fill=body, outline=(96, 124, 106))
    d.rectangle([7, 6, 9, 6], fill=body)
    d.point((7, 8), fill=(24, 28, 33)); d.point((9, 8), fill=(24, 28, 33))
    d.point((7, 10), fill=(96, 124, 106)); d.point((9, 10), fill=(96, 124, 106))
    # ince bacaklar, ust uste binmesin
    lift = 0 if phase % 2 == 0 else 1
    for i, yy in enumerate((7, 9, 11)):
        off = i % 2
        d.point((4, yy - lift + off), fill=(120, 150, 130)); d.point((5, yy - lift + off), fill=(120, 150, 130))
        d.point((11, yy + lift - off), fill=(120, 150, 130)); d.point((12, yy + lift - off), fill=(120, 150, 130))
    # anten
    for dx, dy in ((-1, -1), (1, -1)):
        d.point((8 + dx + (lift if dx > 0 else -lift), 4 + dy), fill=(150, 180, 158))
        d.point((8 + dx, 5), fill=(150, 180, 158))
    return im
save('bug', [bug(i) for i in range(2)], 420)
print('emoji gifleri hazir:', sorted(os.listdir('assets/img/emoji')))
