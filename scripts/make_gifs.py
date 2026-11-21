import math, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

MONO = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 12)
MONO_S = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 10)

BG = (11, 13, 15)
PANEL = (13, 16, 19)
LINE = (40, 46, 52)
INK = (231, 235, 228)
DIM = (122, 130, 137)
SAGE = (152, 189, 165)
AMBER = (226, 178, 108)

os.makedirs('assets/img', exist_ok=True)

W, H = 460, 258
FPS = 10
FRAMES = 88

LINES = [
    ("$ ssh root@raufix.dev", SAGE),
    ("Last login: 04:12 on ttys001", DIM),
    ("$ ls ~/projects", SAGE),
    ("android/   web/   minecraft/   scripts/", INK),
    ("$ uptime", SAGE),
    ("4 years  ·  7/24  ·  rivals: 0", INK),
    ("$ ./mission.sh --build", SAGE),
    ("build  ->  ship  ->  repeat", AMBER),
]

CPS = 34.0
cursor_frame = 0
for li, (text, _) in enumerate(LINES):
    start = cursor_frame + 5
    for ci in range(len(text) + 1):
        schedule.append((start + int(ci * FPS / CPS), li, ci))
    cursor_frame = start + int(len(text) * FPS / CPS) + 5

TOTAL = cursor_frame + 24

def make_terminal(fi):
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([8, 8, W - 9, H - 9], fill=PANEL, outline=LINE)
    d.rectangle([8, 8, W - 9, 30], fill=(18, 21, 25))
    d.line([(8, 30), (W - 9, 30)], fill=LINE)
    for i, col in enumerate([(90, 74, 68), (98, 88, 62), (70, 92, 76)]):
        d.ellipse([18 + i * 14, 16, 24 + i * 14, 22], fill=col)
    d.text((70, 14), "raufix@baba — zsh — 80×24", font=MONO_S, fill=DIM)

    visible = {}
    for f, li, ci in schedule:
        if f <= fi:
            visible[li] = ci
        else:
            break

    y = 42
    last_li = -1
    for li, (text, color) in enumerate(LINES):
        if li not in visible:
            break
        shown = text[:visible[li]]
        if shown.startswith("$ "):
            d.text((20, y), "$", font=MONO, fill=SAGE)
            d.text((34, y), shown[2:], font=MONO, fill=INK)
        else:
            d.text((20, y), shown, font=MONO, fill=color)
        last_li = li
        y += 22

    if last_li >= 0:
        text, color = LINES[last_li]
        shown = text[:visible.get(last_li, 0)]
        cx = 20 + len(shown) * 7.2
        cy = 42 + last_li * 22
        if fi % 10 < 6:
            d.rectangle([cx, cy - 1, cx + 6, cy + 12], fill=AMBER)

    for sy in range(0, H, 3):
        d.line([(0, sy), (W, sy)], fill=(0, 0, 0), width=1)
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for sy in range(0, H, 3):
        od.line([(0, sy), (W, sy)], fill=(0, 0, 0, 16))
    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    return img

frames = [make_terminal(fi) for fi in range(TOTAL)]
frames[0].save('assets/img/terminal.gif', save_all=True, append_images=frames[1:],
               duration=100, loop=0, optimize=True, disposal=1)

S = 300
R = 128
CX, CY = S // 2, S // 2 + 4
RFPS = 12
RFRAMES = 72

def make_radar(fi):
    img = Image.new('RGB', (S, S), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, S - 1, S - 1], outline=LINE)
    d.rectangle([12, 12, S - 13, S - 13], outline=(28, 33, 38))

    for r in (R, R * 0.72, R * 0.45, R * 0.2):
        d.ellipse([CX - r, CY - r, CX + r, CY + r], outline=(46, 54, 60))
    d.line([(CX - R, CY), (CX + R, CY)], fill=(38, 44, 50))
    d.line([(CX, CY - R), (CX, CY + R)], fill=(38, 44, 50))

    angle = (fi / RFRAMES) * 2 * math.pi - math.pi / 2
    sweep = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sweep)
    steps = 26
    for i in range(steps):
        a0 = angle - (i + 1) * 0.045
        a1 = angle - i * 0.045
        alpha = int(70 * (1 - i / steps) ** 2)
        sd.polygon([(CX, CY),
                    (CX + R * math.cos(a0), CY + R * math.sin(a0)),
                    (CX + R * math.cos(a1), CY + R * math.sin(a1))],
                   fill=(140, 173, 152, alpha))
    sd.line([(CX, CY), (CX + R * math.cos(angle), CY + R * math.sin(angle))],
            fill=(196, 216, 200, 210), width=1)
    sweep = sweep.filter(ImageFilter.GaussianBlur(0.4))
    img = Image.alpha_composite(img.convert('RGBA'), sweep).convert('RGB')
    d = ImageDraw.Draw(img)

    targets = [(0.62, 0.22), (-0.35, 0.55), (0.15, -0.68)]
    for ti, (fx, fy) in enumerate(targets):
        tx = CX + R * fx
        ty = CY + R * fy
        phase = ((fi / RFRAMES) + ti * 0.33) % 1.0
        if phase < 0.5:
            rr = 2 + int(phase * 12)
            d.ellipse([tx - rr, ty - rr, tx + rr, ty + rr], outline=AMBER)
        d.ellipse([tx - 2, ty - 2, tx + 2, ty + 2], fill=AMBER)

    d.text((18, S - 28), "SIGNAL / 0x7F", font=MONO_S, fill=DIM)
    d.text((S - 108, S - 28), f"SWEEP {(fi / RFRAMES) * 360:03.0f}°", font=MONO_S, fill=SAGE)
    return img

rframes = [make_radar(fi) for fi in range(RFRAMES)]
rframes[0].save('assets/img/radar.gif', save_all=True, append_images=rframes[1:],
                duration=83, loop=0, optimize=True, disposal=1)

for f in ('assets/img/terminal.gif', 'assets/img/radar.gif'):
    print(f, os.path.getsize(f) // 1024, 'KB')
