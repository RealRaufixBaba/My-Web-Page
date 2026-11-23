from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

root = Path(__file__).resolve().parent.parent
img_dir = root / "assets" / "img"
W, H = 1200, 630

serif = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
mono = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

IN = (238, 240, 241)
ACC = (215, 169, 123)
SAGE = (157, 184, 168)
DIM = (122, 130, 136)

bg = Image.open(img_dir / "og-bg.jpg").convert("RGB")
scale = max(W / bg.width, H / bg.height)
bg = bg.resize((round(bg.width * scale), round(bg.height * scale)), Image.LANCZOS)
x = round((bg.width - W) * 0.72)
y = round((bg.height - H) * 0.45)
canvas = bg.crop((x, y, x + W, y + H)).convert("RGBA")

scrim = Image.new("L", (W, H), 0)
sd = ImageDraw.Draw(scrim)
for i in range(W):
    p = i / W
    v = int(232 * max(0.0, 1 - (p / 0.72)) ** 1.35)
    sd.line([(i, 0), (i, H)], fill=v)
scrim = scrim.filter(ImageFilter.GaussianBlur(60))
dark = Image.new("RGBA", (W, H), (8, 9, 10, 255))
canvas = Image.composite(dark, canvas, scrim)

top = Image.new("L", (W, H), 0)
td = ImageDraw.Draw(top)
for j in range(H):
    v = int(110 * max(0.0, 1 - (j / (H * 0.55))) ** 1.6)
    td.line([(0, j), (W, j)], fill=v)
canvas = Image.composite(Image.new("RGBA", (W, H), (8, 9, 10, 255)), canvas, top)

d = ImageDraw.Draw(canvas)

f_name = ImageFont.truetype(serif, 96)
f_kicker = ImageFont.truetype(mono, 20)
f_sub = ImageFont.truetype(mono, 22)
f_foot = ImageFont.truetype(mono, 18)

pad = 78

d.line([(pad, 148), (pad + 56, 148)], fill=ACC + (255,), width=2)
d.text((pad + 72, 136), "YAZILIM GELİŞTİRİCİ · İSTANBUL", font=f_kicker, fill=DIM + (255,))

d.text((pad - 4, 186), "Raufix", font=f_name, fill=IN + (255,))
name_w = d.textlength("Raufix", font=f_name)
d.text((pad - 4 + name_w, 186), "Baba", font=f_name, fill=ACC + (255,))

sub_y = 316
d.text((pad, sub_y), "android · web · minecraft modlama", font=f_sub, fill=SAGE + (255,))
d.text((pad, sub_y + 44), "4 yıl, ondan fazla dil, 7/24 kod modu", font=f_sub, fill=DIM + (255,))

line_y = 452
d.line([(pad, line_y), (pad + 420, line_y)], fill=(255, 255, 255, 26), width=1)

d.ellipse([(pad, line_y + 34), (pad + 9, line_y + 43)], fill=SAGE + (255,))
d.text((pad + 22, line_y + 24), "şu an kod yazıyor", font=f_kicker, fill=DIM + (255,))

d.text((pad, H - 70), "realraufixbaba.github.io", font=f_foot, fill=(138, 145, 153, 255))

out = img_dir / "og-cover.jpg"
canvas.convert("RGB").save(out, quality=87, optimize=True, progressive=True)
print(out, round(out.stat().st_size / 1024), "KB", canvas.size)
