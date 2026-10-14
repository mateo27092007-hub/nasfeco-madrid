# -*- coding: utf-8 -*-
"""Prepara las imágenes de NASFECO España a partir de los originales que entregó el cliente (raíz del proyecto).

Uso:  python _build/prep_assets.py
- Logo (WhatsApp 7.01.43): quita el fondo gris claro. Versión clara para fondo oscuro: el granate pasa a blanco y el dorado se queda
  (igual que nasfeco-us-white.png en Miami). También la versión a color, el símbolo solo, favicon e icono.
- Kit de bienvenida (WhatsApp 7.02.06) -> assets/img/welcome-kit.webp
- Técnicos con uniforme (Gemini) -> assets/img/tecnico.webp y tecnico-sm.webp
Los originales no se tocan ni se publican (.assetsignore).
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_LOGO = os.path.join(ROOT, "WhatsApp Image 2026-10-13 at 7.01.43 PM.jpeg")
SRC_KIT = os.path.join(ROOT, "WhatsApp Image 2026-10-13 at 7.02.06 PM.jpeg")
SRC_TEC = os.path.join(ROOT, "Gemini_Generated_Image_3qiwn13qiwn13qiw.jpg")
BRAND = os.path.join(ROOT, "assets", "brand"); IMG = os.path.join(ROOT, "assets", "img")
NIGHT = (8, 31, 42)


def cut_background(im):
    """Fondo gris claro -> transparente, sin halo claro en los bordes (des-premultiplica sobre el color del fondo)."""
    im = im.convert("RGB"); W, H = im.size; px = im.load()
    corners = [px[4, 4], px[W - 5, 4], px[4, H - 5], px[W - 5, H - 5]]
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))
    out = Image.new("RGBA", im.size); po = out.load()
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            d = max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2]))
            a = min(1.0, max(0.0, (d - 14) / 70))
            if a <= 0: po[x, y] = (0, 0, 0, 0); continue
            c = [min(255, max(0, round((v - (1 - a) * k) / a))) for v, k in zip((r, g, b), bg)]
            po[x, y] = (*c, round(a * 255))
    return out


def light_version(im):
    """Granate -> blanco; el dorado se mantiene. Mezcla suave según cuánto 'granate' tiene cada píxel."""
    out = im.copy(); po = out.load(); W, H = out.size
    for y in range(H):
        for x in range(W):
            r, g, b, a = po[x, y]
            if not a: continue
            ratio = g / max(r, 1)                       # dorado ≈ 0.7 · granate ≈ 0.1–0.25
            t = min(1.0, max(0.0, (0.48 - ratio) / 0.2))
            po[x, y] = (round(r + (255 - r) * t), round(g + (255 - g) * t), round(b + (255 - b) * t), a)
    return out


def mark_box(im):
    """El símbolo es lo que queda a la izquierda del primer hueco vertical transparente."""
    W, H = im.size; a = im.getchannel("A").load()
    cols = [any(a[x, y] > 40 for y in range(H)) for x in range(W)]
    x0 = cols.index(True); x = x0
    while x < W and cols[x]: x += 1
    return im.crop((x0, 0, x, H)).crop(im.crop((x0, 0, x, H)).getbbox())


def square(im, size, pad=.08, bg=None):
    s = max(im.size); c = Image.new("RGBA", (s, s), bg + (255,) if bg else (0, 0, 0, 0))
    c.alpha_composite(im, ((s - im.width) // 2, (s - im.height) // 2))
    inner = round(size * (1 - 2 * pad)); c = c.resize((inner, inner), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), bg + (255,) if bg else (0, 0, 0, 0)); out.alpha_composite(c, ((size - inner) // 2,) * 2)
    return out


if __name__ == "__main__":
    logo = cut_background(Image.open(SRC_LOGO)); logo = logo.crop(logo.getbbox())
    white = light_version(logo)
    logo.save(os.path.join(BRAND, "nasfeco-es.png"), optimize=True)
    w = 900; white.resize((w, round(w * white.height / white.width)), Image.LANCZOS).save(os.path.join(BRAND, "nasfeco-es-white.png"), optimize=True)
    print("logo", logo.size, "->", w, "x", round(w * white.height / white.width))
    mark_c, mark_w = mark_box(logo), mark_box(white)
    square(mark_w, 256, .04).save(os.path.join(BRAND, "mark-white.png"), optimize=True)
    square(mark_c, 256, .04).save(os.path.join(BRAND, "mark-color.png"), optimize=True)
    square(mark_c, 64, .04).save(os.path.join(ROOT, "favicon.png"), optimize=True)
    square(mark_w, 180, .18, NIGHT).convert("RGB").save(os.path.join(BRAND, "icon-180.png"), optimize=True)
    # foto para compartir (Open Graph): logo claro centrado sobre azul noche
    og = Image.new("RGBA", (1200, 630), NIGHT + (255,)); lw = 760; l2 = white.resize((lw, round(lw * white.height / white.width)), Image.LANCZOS)
    og.alpha_composite(l2, ((1200 - lw) // 2, (630 - l2.height) // 2)); og.convert("RGB").save(os.path.join(IMG, "og.jpg"), quality=86)
    # kit de bienvenida de Madrid
    kit = Image.open(SRC_KIT).convert("RGB"); kit.save(os.path.join(IMG, "welcome-kit.webp"), quality=84, method=6); print("kit", kit.size)
    # técnicos con el uniforme NASFECO España
    tec = Image.open(SRC_TEC).convert("RGB")
    for name, w in (("tecnico.webp", 1600), ("tecnico-sm.webp", 900)):
        t = tec.resize((w, round(w * tec.height / tec.width)), Image.LANCZOS); t.save(os.path.join(IMG, name), quality=82, method=6); print(name, t.size)
