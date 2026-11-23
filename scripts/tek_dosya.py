import base64
import mimetypes
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
docs = root / "docs"
html = (docs / "index.html").read_text(encoding="utf-8")

mimetypes.add_type("image/svg+xml", ".svg")

html = html.replace("https://realraufixbaba.github.io/My-Web-Page/assets/img/og-cover.jpg", "__OG__")


def data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    payload = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{payload}"


css = (docs / "assets/css/style.css").read_text(encoding="utf-8")
css = re.sub(
    r'url\("?\.\./img/([^")]+)"?\)',
    lambda m: 'url("' + data_uri(docs / "assets/img" / m.group(1)) + '")',
    css,
)
html = re.sub(
    r'<link[^>]+href="assets/css/style\.css"[^>]*>',
    lambda m: "<style>" + css + "</style>",
    html,
)

js = (docs / "assets/js/main.js").read_text(encoding="utf-8")
html = re.sub(
    r'<script[^>]+src="assets/js/main\.js"[^>]*></script>',
    lambda m: "<script>" + js + "</script>",
    html,
)

for folder in ("img", "img/emoji", "audio"):
    directory = docs / "assets" / folder
    if not directory.exists():
        continue
    for asset in sorted(directory.iterdir()):
        if not asset.is_file():
            continue
        rel = "assets/" + folder + "/" + asset.name
        html = html.replace(rel, data_uri(asset))

html = html.replace("__OG__", "https://realraufixbaba.github.io/og-cover.jpg")

out = root / "koksayfa" / "index.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print(out, round(out.stat().st_size / 1024), "KB")
