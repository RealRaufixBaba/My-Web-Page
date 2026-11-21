import math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 640, 360
FPS = 12
FRAMES = 48
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 14)
rng = random.Random(2026)

CHARS = list("01{}[]()<>;=+*/#&|$%ABCDEFabcdef:._!?^~")
WORDS = ["async", "await", "fun", "val", "class", "let", "kt", "php", "js", "css", "npm", "git",
         "build()", "0x1F", "APK", "root@", "sudo", "func", "for(;;)", "return", "null", "void",
         "intent", "gradle", "asm", "mod", "yarn", "commit", "push", "endif", "sudo -i"]

y = np.linspace(0, 1, H)[:, None]
top = np.array([8, 9, 10], dtype=float)
mid = np.array([11, 13, 14], dtype=float)
bot = np.array([7, 9, 8], dtype=float)
grad = np.zeros((H, W, 3), dtype=float)
for c in range(3):
    upper = top[c] + (mid[c] - top[c]) * np.clip(y / 0.6, 0, 1)
    lower = mid[c] + (bot[c] - mid[c]) * np.clip((y - 0.6) / 0.4, 0, 1)
    grad[:, :, c] = np.where(y < 0.6, upper, lower)

yy, xx = np.mgrid[0:H, 0:W]
warm = np.exp(-(((xx - W * 0.78) ** 2) / (2 * (W * 0.34) ** 2) + ((yy - H * 0.20) ** 2) / (2 * (H * 0.42) ** 2)))
cool = np.exp(-(((xx - W * 0.14) ** 2) / (2 * (W * 0.30) ** 2) + ((yy - H * 0.78) ** 2) / (2 * (H * 0.38) ** 2)))
grad[:, :, 0] += warm * 20 + cool * 4
grad[:, :, 1] += warm * 15 + cool * 8
grad[:, :, 2] += warm * 9 + cool * 12

vig = np.clip(1.15 - (((xx - W / 2) / (W * 0.78)) ** 2 + ((yy - H / 2) / (H * 0.86)) ** 2), 0.0, 1.0)
base_arr = np.clip(grad * (0.55 + 0.55 * vig)[:, :, None], 0, 255).astype(np.uint8)
BASE = Image.fromarray(base_arr, 'RGB')

CELL_W, CELL_H = 18, 18
COLS = W // CELL_W + 1
ROWS = H // CELL_H + 3
COLORS = [(126, 158, 138), (144, 156, 164), (156, 140, 108), (110, 138, 128), (172, 176, 168)]

class Column:
    def __init__(self):
        self.color = rng.choices(COLORS, weights=[5, 4, 2, 3, 2])[0]
        self.speed = rng.uniform(0.022, 0.09)
        self.head = rng.uniform(-ROWS, ROWS)
        self.trail = rng.randint(5, 14)
        self.chars = [rng.choice(CHARS) for _ in range(ROWS + 16)]
        self.word_at = rng.randrange(-6, ROWS)
        self.word = rng.choice(WORDS)

cols = [Column() for _ in range(COLS)]

def build_frame(fi):
    img = BASE.copy()
    over = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(over)

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
            a = int(150 * (fade ** 1.9))
            if k == 0:
                a = 190
            txt = col.word if row == col.word_at else col.chars[(row + 7) % len(col.chars)]
            if k == 0:
                fill = (208, 214, 206, a)
            else:
                fill = col.color + (a,)
            d.text((x, yy), txt, font=FONT, fill=fill)

    scan = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scan)
    for sy in range(0, H, 3):
        sd.line([(0, sy), (W, sy)], fill=(0, 0, 0, 30))
    band_y = int(((fi / FRAMES) * (H + 160)) - 80)
    for i in range(10):
        a = int(10 * (1 - abs(i - 5) / 5))
        sd.line([(0, band_y + i * 6), (W, band_y + i * 6)], fill=(210, 220, 210, a))
    over.alpha_composite(scan)

    img = Image.alpha_composite(img.convert('RGBA'), over).convert('RGB')
    return img

os.makedirs('assets/img', exist_ok=True)
frames = [build_frame(fi) for fi in range(FRAMES)]
master = frames[6].quantize(colors=64, method=Image.Quantize.MEDIANCUT)
pal = [f.quantize(palette=master, dither=Image.Dither.NONE) for f in frames]
pal[0].save('assets/img/bg-code-rain.gif', save_all=True, append_images=pal[1:],
            duration=int(1000 / FPS), loop=0, optimize=True, disposal=1)
frames[0].resize((960, 540), Image.LANCZOS).save('assets/img/bg-poster.jpg', quality=82, optimize=True)
print('gif:', os.path.getsize('assets/img/bg-code-rain.gif') // 1024, 'KB')
