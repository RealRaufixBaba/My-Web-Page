#!/usr/bin/env python3
"""Programci temali animasyonlu arka plan GIF'i uretir.
Kullanim: python3 scripts/make_bg_gif.py -> assets/img/bg-code-rain.gif
"""
import math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 640, 360
FPS = 12
FRAMES = 48
FONT_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
FONT = ImageFont.truetype(FONT_PATH, 15)
BIG = ImageFont.truetype(FONT_PATH, 190)
rng = random.Random(1337)
np_rng = np.random.default_rng(1337)

CHARS = list("01{}[]()<>;=+*/#&|$%ABCDEFabcdef:._!?^~") + list("λΣΔπ√≈≠∞")
WORDS = ["async", "await", "fun", "val", "class", "let", "kt", "php", "js", "css", "npm", "git",
         "build()", "0x1F", "APK", "root@", "sudo", "func", "for(;;)", "return", "null", "void",
         "intent", "gradle", "asm", "mod", "yarn", "commit", "push"]

# ---------- arka plan gradyani ----------
y = np.linspace(0, 1, H)[:, None]
top = np.array([7, 6, 22], dtype=float)
mid = np.array([18, 10, 40], dtype=float)
bot = np.array([4, 22, 34], dtype=float)
grad = np.zeros((H, W, 3), dtype=float)
for c in range(3):
    upper = top[c] + (mid[c] - top[c]) * np.clip(y / 0.62, 0, 1)
    lower = mid[c] + (bot[c] - mid[c]) * np.clip((y - 0.62) / 0.38, 0, 1)
    grad[:, :, c] = np.where(y < 0.62, upper, lower)

# kose isiklari (vignette tersi)
yy, xx = np.mgrid[0:H, 0:W]
glow1 = np.exp(-(((xx - W * 0.08) ** 2) / (2 * (W * 0.34) ** 2) + ((yy - H * 0.12) ** 2) / (2 * (H * 0.42) ** 2)))
glow2 = np.exp(-(((xx - W * 0.95) ** 2) / (2 * (W * 0.32) ** 2) + ((yy - H * 0.85) ** 2) / (2 * (H * 0.5) ** 2)))
grad[:, :, 2] += glow1 * 70 + glow2 * 30
grad[:, :, 1] += glow1 * 26
grad[:, :, 0] += glow2 * 55
grad[:, :, 1] += glow2 * 10

# vignette
vig = np.clip(1.25 - (((xx - W / 2) / (W * 0.72)) ** 2 + ((yy - H / 2) / (H * 0.80)) ** 2), 0.0, 1.0)
base_arr = np.clip(grad * (0.42 + 0.72 * vig)[:, :, None], 0, 255).astype(np.uint8)
BASE = Image.fromarray(base_arr, 'RGB')

# ---------- kod yagmuru sutunlari ----------
CELL_W, CELL_H = 16, 17
COLS = W // CELL_W + 1
ROWS = H // CELL_H + 3
COLORS = [(34, 240, 214), (120, 220, 255), (167, 108, 255), (66, 255, 166), (255, 92, 200)]

class Column:
    def __init__(self):
        self.color = rng.choices(COLORS, weights=[5, 4, 3, 2, 1])[0]
        self.speed = rng.uniform(0.035, 0.16)          # satir/frame
        self.head = rng.uniform(-ROWS, ROWS)
        self.trail = rng.randint(4, 13)
        self.chars = [rng.choice(CHARS) for _ in range(ROWS + 16)]
        self.word_at = rng.randrange(-6, ROWS)
        self.word = rng.choice(WORDS)
        self.glow = rng.random() < 0.35

cols = [Column() for _ in range(COLS)]

def hexline(draw, x, y0, y1, fill, alpha):
    draw.line([(x, y0), (x, y1)], fill=fill + (alpha,), width=1)

def build_frame(fi):
    img = BASE.copy()
    over = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(over)

    # --- synthwave perspektif izgara (alt bant) ---
    horizon = int(H * 0.70)
    grid = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    phase = (fi / FRAMES) % 1.0
    for i in range(9):
        p = ((i / 9.0) + phase) % 1.0
        gy = horizon + int((p ** 2.1) * (H - horizon) * 1.05)
        if gy < H:
            a = int(28 + 55 * p)
            gd.line([(0, gy), (W, gy)], fill=(120, 90, 255, a), width=1)
    for i in range(-9, 10):
        gx_top = W / 2 + i * 16
        gx_bot = W / 2 + i * 118
        gd.line([(gx_top, horizon), (gx_bot, H)], fill=(90, 200, 255, 34), width=1)
    grid = grid.filter(ImageFilter.GaussianBlur(0.4))
    over.alpha_composite(grid)

    # --- kod yagmuru ---
    for ci, col in enumerate(cols):
        x = ci * CELL_W + 2
        head_row = col.head + col.speed * fi
        for k in range(col.trail):
            row = int(math.floor(head_row)) - k
            if row < -1 or row > ROWS:
                continue
            yy = row * CELL_H
            if yy < -CELL_H or yy > H:
                continue
            fade = 1.0 - (k / col.trail)
            a = int(255 * (fade ** 1.7))
            if k == 0:
                a = 255
            ch = col.chars[(row + 7) % len(col.chars)]
            if row == col.word_at:
                txt, font = col.word, FONT
                if k != 0:
                    a = int(a * 0.72)
            else:
                txt, font = ch, FONT
            if k == 0:
                fill = (235, 255, 252, a)
            else:
                fill = col.color + (a,)
            d.text((x, yy), txt, font=font, fill=fill)
            if col.glow and k < 3:
                d.text((x, yy), txt, font=font, fill=col.color + (int(a * 0.30),))

    # --- dev "</>" filigran ---
    wm = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    wd = ImageDraw.Draw(wm)
    wd.text((W * 0.5, H * 0.44), "</>", font=BIG, fill=(150, 120, 255, 30), anchor='mm')
    wd.text((W * 0.5, H * 0.44), "</>", font=BIG, fill=(70, 240, 220, 16), anchor='mm')
    wm = wm.filter(ImageFilter.GaussianBlur(0.6))
    over.alpha_composite(wm)

    # --- yatay tarama cizgileri + parlak tarama ---
    scan = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scan)
    for sy in range(0, H, 3):
        sd.line([(0, sy), (W, sy)], fill=(0, 0, 0, 26))
    band_y = int(((fi / FRAMES) * (H + 120)) - 60)
    for i in range(12):
        a = int(20 * (1 - abs(i - 6) / 6))
        sd.line([(0, band_y + i * 4), (W, band_y + i * 4)], fill=(120, 255, 235, a))
    over.alpha_composite(scan)

    img = Image.alpha_composite(img.convert('RGBA'), over).convert('RGB')
    return img

os.makedirs('assets/img', exist_ok=True)
frames = [build_frame(fi) for fi in range(FRAMES)]

master = frames[6].quantize(colors=64, method=Image.Quantize.MEDIANCUT)
pal_frames = [f.quantize(palette=master, dither=Image.Dither.NONE) for f in frames]
pal_frames[0].save('assets/img/bg-code-rain.gif', save_all=True, append_images=pal_frames[1:],
                   duration=int(1000 / FPS), loop=0, optimize=True, disposal=1)
frames[0].resize((960, 540), Image.LANCZOS).save('assets/img/bg-poster.jpg', quality=82, optimize=True)
print('gif:', os.path.getsize('assets/img/bg-code-rain.gif') // 1024, 'KB')
