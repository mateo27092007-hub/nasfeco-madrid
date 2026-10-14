# -*- coding: utf-8 -*-
"""NASFECO España · Madrid — Waterdrop X12 (y X16 en "Próximamente"), en español de España (principal) e inglés.

Web propia de España: colores del logo (crema, granate y dorado), titulares en serif (Fraunces), arcos madrileños.
La web de Miami solo sirvió de guía (PROMPT-ESPANA.md); el diseño y la estructura son distintos.
No inventar datos del negocio: lo que falte va con {P:...}, que en la página se ve como [PENDIENTE: ...].

Uso:  python _build/build_madrid.py
Escribe: index.html / en.html (inicio), x12.html / x12-en.html, x16.html / x16-en.html (redirige mientras esté en SOON),
         aviso-legal, privacidad, cookies y condiciones (+ versión en inglés), sitemap.xml y robots.txt.
"""
import os, re, json, shutil, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = "https://nasfeco.es"      # PENDIENTE: confirmar dominio
VER = "53"
INDEX = False                    # False = noindex en todas las páginas hasta que NASFECO autorice el lanzamiento
WA_NUM = ""                      # PENDIENTE: WhatsApp de España, solo dígitos (ej. 34600000000)
WA_SHOW = ""                     # PENDIENTE: como se muestra (ej. +34 600 00 00 00)
PHONE = ""                       # PENDIENTE: teléfono de España
EMAIL = ""                       # PENDIENTE: correo de contacto
# Datos del titular para el aviso legal (LSSI-CE) y la privacidad (RGPD). Todos PENDIENTES.
TITULAR = {"name": "", "nif": "", "address": "", "registry": ""}
ZONE = ""                        # PENDIENTE: zona de servicio (¿Madrid capital o Comunidad de Madrid? ¿qué códigos postales?)
WA_PATH = re.sub(r'^<path d="|"$', "", open(os.path.join(HERE, "wa_path.txt"), encoding="utf-8").read().strip())

# ------------------------------------------------------------------ pendientes
P_RE = re.compile(r"\{P:([^}]*)\}")
def pend(s): return f'<mark class="pend">[PENDIENTE: {s}]</mark>'
def fill(t, html=True): return P_RE.sub((lambda m: pend(m.group(1))) if html else (lambda m: f"[PENDIENTE: {m.group(1)}]"), t)
def val(v, what, html=True): return v if v else (pend(what) if html else f"[PENDIENTE: {what}]")

# ------------------------------------------------------------------ modelos (ficha europea de Waterdrop, waterdropfilter.eu/es, consultada 13/10/2026)
# price: precio normal en euros, IVA e instalación incluidos (cliente, 13/10/2026: X12 2.539 €, con la oferta 2.239 €). liters: capacidad oficial en L/día (la ficha europea solo da 1200 GPD → PENDIENTE).
MODELS = {
    "x12": {"name": "X12", "price": 2539, "liters": None, "gpd": 1200, "faucets": [("silver", "assets/products/x12-silver.webp")]},
    "x16": {"name": "X16", "price": None, "liters": None, "gpd": 1600, "faucets": [("black", "assets/products/x16-black.webp")]},
}
# Modelos que aún no se venden en España: van en una franja "Próximamente", sin valoración ni página propia.
# PENDIENTE confirmar con NASFECO si en Madrid también se lanza solo el X12. Para lanzarlo, quitarlo de aquí.
SOON = {"x16"}
DIM_CM = (46.23, 15.88, 42.47); KG = 17.5      # ficha europea X12
# Oferta de lanzamiento (cliente, 13/10/2026): −300 € en el X12 → paga 2.239 €. Fecha de fin PROVISIONAL: confirmar con NASFECO.
# Al pasar la fecha, la web vuelve sola al precio normal. Para quitarla: PROMO = None.
PROMO = {"name": ("Launch offer", "Oferta de lanzamiento"), "off": 300, "code": "", "end": "2026-11-30T23:59:59+01:00"}
import datetime
PROMO_ON = bool(PROMO) and datetime.datetime.now(datetime.timezone.utc) < datetime.datetime.fromisoformat(PROMO["end"])
def promo_price(k): return MODELS[k]["price"] - PROMO["off"] if (PROMO and MODELS[k]["price"]) else MODELS[k]["price"]
def promo_end(): return "/".join(reversed(PROMO["end"][:10].split("-")))   # dd/mm/aaaa
def price_now(k, html=True): return money(promo_price(k) if PROMO_ON else MODELS[k]["price"], html, k)
def offer_txt(k="x12"):
    """Texto plano del precio (FAQ, condiciones): con la oferta mientras dure."""
    m = MODELS[k]
    if not PROMO_ON: return L(f"{money(m['price'], False, k)}, VAT and installation included", f"{money(m['price'], False, k)}, IVA e instalación incluidos")
    return L(f"{money(promo_price(k), False, k)} with the launch offer (−{money(PROMO['off'], False)} until {promo_end()}); regular price {money(m['price'], False, k)}. VAT and installation included",
             f"{money(promo_price(k), False, k)} con la oferta de lanzamiento (−{money(PROMO['off'], False)} hasta el {promo_end()}); precio normal {money(m['price'], False, k)}. IVA e instalación incluidos")
def price_html(k, note=True):
    """Precio grande. Con oferta: precio de oferta + precio normal tachado + etiqueta; el JS vuelve al normal al acabar."""
    m = MODELS[k]
    if not PROMO_ON: return f'<span class="pz"><b class="pz-now">{money(m["price"], k=k)}</b></span>'
    tag = f'<span class="pz-tag">{L(*PROMO["name"])} · −{money(PROMO["off"])}</span>'
    end = f'<small class="pz-end">{L("Until", "Hasta el")} {promo_end()} · {L("ends in", "termina en")} <i data-cd>…</i></small>' if note else ""
    return (f'<span class="pz" data-promo-on>{tag}<span class="pz-row"><b class="pz-now">{money(promo_price(k), k=k)}</b><s>{money(m["price"], k=k)}</s></span>{end}</span>'
            f'<span class="pz" data-promo-off hidden><b class="pz-now">{money(m["price"], k=k)}</b></span>')


def num(x, d=0):
    s = f"{x:,.{d}f}"
    return s if LANG == "en" else s.replace(",", "X").replace(".", ",").replace("X", ".")
def money(n, html=True, k="x12"):
    if n is None: return val(None, f"precio {MODELS[k]['name']} en €", html)
    return L(f"€{num(n)}", f"{num(n)} €")
def cap(k, html=True, short=False):
    m = MODELS[k]
    if m["liters"]: return f"{num(m['liters'])} {L('L/day', 'L/día')}"
    return val(None, "L/día" if short else f"capacidad {m['name']} en L/día", html)
def dims_txt(): return " × ".join(num(x, 1) for x in DIM_CM) + " cm"

# ------------------------------------------------------------------ idioma y páginas
LANG = "es"; CUR = "home"
FILES = {"home": ("en.html", "index.html"), "x12": ("x12-en.html", "x12.html"), "x16": ("x16-en.html", "x16.html"),
         "legal": ("legal-notice.html", "aviso-legal.html"), "privacy": ("privacy.html", "privacidad.html"),
         "cookies": ("cookies-en.html", "cookies.html"), "terms": ("terms.html", "condiciones.html")}
def L(en, es): return es if LANG == "es" else en
def page(name=None): return FILES[name or CUR][1 if LANG == "es" else 0]
def other(): return FILES[CUR][0 if LANG == "es" else 1]
def home_(): return "" if CUR == "home" else page("home")
def path_(f): return f.replace("index.html", "").replace(".html", "")
def url_(name=None, lang=None): return SITE + "/" + path_(FILES[name or CUR][1 if (lang or LANG) == "es" else 0])

USED = set()
def a(path):
    if not os.path.exists(os.path.join(ROOT, path)): raise FileNotFoundError(path)
    USED.add(path); return path
def wa(text): return (f"https://wa.me/{WA_NUM}" if WA_NUM else "https://wa.me/") + "?text=" + urllib.parse.quote(text)
def ico(d, w=20, sw=1.6): return f'<svg viewBox="0 0 24 24" width="{w}" height="{w}" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{d}"/></svg>'
I_ARR = "M7 17L17 7M9 7h8v8"; I_RIGHT = "M5 12h14M13 6l6 6-6 6"; I_X = "M6 6l12 12M18 6L6 18"; I_MENU = "M4 8h16M4 16h16"; I_PLUS = "M12 5v14M5 12h14"
I_UP = "M12 19V5M6 11l6-6 6 6"; I_CHAT = "M4 5h16v11H9l-5 4z"; I_HOME = "M3 11l9-7 9 7v9H3zM9 20v-6h6v6"; I_TOOL = "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.8-3.8a6 6 0 01-7.9 7.9l-6.9 6.9a2.1 2.1 0 01-3-3l6.9-6.9a6 6 0 017.9-7.9z"
I_GLOBE = "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"
I_GIFT = "M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2-4-6-4-6-1s4 1 6 1c2 0 6 2 6-1s-4-3-6 1"; I_EURO = "M17 6.5A7 7 0 1 0 17 17.5M4 10h9M4 14h9"
I_CHECK = "M5 12l5 5 9-10"; I_PIN = "M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5"
WA = f'<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="{WA_PATH}"/></svg>'
ROMAN = [f"{i:02d}" for i in range(1, 13)]   # numeración 01, 02… (sin números romanos)
def em(t): return t.replace("[", "<em>").replace("]", "</em>")
def eyebrow(text, light=False): return f'<p class="eb{" lt" if light else ""}"><i></i>{text}</p>'
def btn(text, attrs="", cls="b-wine", href=None, icon=I_ARR):
    inner = f'<span>{text}</span><i>{ico(icon, 15, 1.8)}</i>'
    return f'<a class="btn {cls}" href="{href}" {attrs}>{inner}</a>' if href else f'<button type="button" class="btn {cls}" {attrs}>{inner}</button>'
FIX = {"x12": ("white", "silver"), "x16": ("black", "black")}   # X12 blanco con grifo plateado · X16 negro con grifo negro
def fix_photo(k): return dict(MODELS[k]["faucets"])[FIX[k][1]]
BODY_N = lambda: {"white": L("White", "Blanco"), "black": L("Black", "Negro")}
FAU_N = lambda: {"silver": L("Silver", "Plateado"), "black": L("Black", "Negro")}
def color_txt(k):
    b, f = FIX[k]; return L(f"{BODY_N()[b]} system · {FAU_N()[f].lower()} faucet", f"Equipo {BODY_N()[b].lower()} · grifo {FAU_N()[f].lower()}")
def LIVE(): return [k for k in MODELS if k not in SOON]

# ------------------------------------------------------------------ head / header / footer
def schema():
    biz = {"@type": "LocalBusiness", "@id": SITE + "/#business", "name": "NASFECO España", "url": SITE + "/",
           "logo": SITE + "/assets/brand/icon-180.png", "image": SITE + "/assets/img/og.jpg",
           "description": L("Waterdrop X12 tankless reverse osmosis system in Madrid, with kitchen assessment, professional installation, welcome kit and follow-up.",
                            "Sistema de ósmosis inversa sin depósito Waterdrop X12 en Madrid, con valoración de tu cocina, instalación profesional, kit de bienvenida y seguimiento."),
           "areaServed": [{"@type": "City", "name": "Madrid"}],
           "address": {"@type": "PostalAddress", "addressLocality": "Madrid", "addressCountry": "ES"},
           "knowsLanguage": ["es", "en"], "currenciesAccepted": "EUR",
           "makesOffer": [{"@type": "Offer", "itemOffered": {"@type": "Service", "name": L("Reverse osmosis system installation", "Instalación de sistema de ósmosis inversa"), "areaServed": "Madrid"}}]}
    if EMAIL: biz["email"] = EMAIL
    if PHONE or WA_SHOW: biz["telephone"] = PHONE or WA_SHOW
    g = [biz, {"@type": "WebSite", "@id": SITE + "/#site", "url": SITE + "/", "name": "NASFECO España", "inLanguage": L("en", "es-ES"), "publisher": {"@id": SITE + "/#business"}}]
    if CUR in MODELS:
        m = MODELS[CUR]
        offer = {"@type": "Offer", "url": url_(), "priceCurrency": "EUR", "availability": "https://schema.org/InStock", "areaServed": "Madrid", "seller": {"@id": SITE + "/#business"}}
        if m["price"]: offer["price"] = str(promo_price(CUR) if PROMO_ON else m["price"])
        if m["price"] and PROMO_ON: offer["priceValidUntil"] = PROMO["end"][:10]
        g.append({"@type": "Product", "name": "Waterdrop " + m["name"], "brand": {"@type": "Brand", "name": "Waterdrop"}, "sku": "WD-" + m["name"],
                  "image": [SITE + "/" + fix_photo(CUR)] + [f"{SITE}/assets/products/{CUR}-g{i}.webp" for i in range(1, 5)],
                  "description": L("Tankless reverse osmosis system with remineralization and smart faucet. Price includes VAT, kitchen assessment, standard installation in Madrid and the NASFECO welcome kit.",
                                   "Sistema de ósmosis inversa sin depósito, con remineralización y grifo inteligente. El precio incluye IVA, valoración, instalación estándar en Madrid y el kit de bienvenida NASFECO."),
                  "offers": offer})
        g.append({"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": L("Home", "Inicio"), "item": url_("home")},
                                                                  {"@type": "ListItem", "position": 2, "name": "Waterdrop " + m["name"], "item": url_()}]})
    if CUR == "home" or CUR in MODELS:
        g.append({"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": L(*q), "acceptedAnswer": {"@type": "Answer", "text": fill(L(*x), False)}} for q, x in FAQ()]})
    return {"@context": "https://schema.org", "@graph": g}

UR = {"latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
      "latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"}
# Archivo (Omnibus-Type): una sola familia, variable en peso y anchura. Se sirve desde la propia web.
FONTS = [("Archivo", "ar", "normal", "100 900")]
def font_css():
    out = ""
    for fam, pre, st, w in FONTS:
        for sub in ("latin-ext", "latin"):
            f = a(f"assets/fonts/{pre}-{sub}{'-italic' if st == 'italic' else ''}.woff2")
            out += f"@font-face{{font-family:'{fam}';font-style:{st};font-weight:{w};font-stretch:62% 125%;font-display:swap;src:url({f}) format('woff2');unicode-range:{UR[sub]}}}"
    return out

def head(title, desc):
    ld = schema(); alt_en, alt_es = FILES[CUR]
    return f'''<!doctype html>
<html lang="{L("en", "es-ES")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="{"index, follow" if INDEX else "noindex, nofollow"}">
<link rel="canonical" href="{url_()}">
<meta name="theme-color" content="#F7F1E7">
<link rel="alternate" hreflang="es-ES" href="{SITE}/{path_(alt_es)}"><link rel="alternate" hreflang="en" href="{SITE}/{path_(alt_en)}"><link rel="alternate" hreflang="x-default" href="{SITE}/{path_(alt_es)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="NASFECO España"><meta property="og:locale" content="{L("en_GB", "es_ES")}"><meta name="twitter:card" content="summary_large_image"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:image" content="{SITE}/{a("assets/img/og.jpg")}"><meta property="og:url" content="{url_()}">
<link rel="icon" href="{a("favicon.png")}"><link rel="apple-touch-icon" href="{a("assets/brand/icon-180.png")}">
<link rel="preload" as="font" type="font/woff2" href="assets/fonts/ar-latin.woff2" crossorigin>
<style>{font_css()}</style>
<link rel="stylesheet" href="{a("css/madrid.css")}?v={VER}">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body class="pg-{CUR}{" has-promo" if PROMO_ON else ""}">
<a class="skip" href="#main">{L("Skip to content", "Ir al contenido")}</a>'''

NAV = lambda: [(page("x12"), L("The X12", "El X12")), (home_() + "#why", L("Why NASFECO", "Por qué NASFECO")), (home_() + "#kit", L("Welcome kit", "Kit de bienvenida")),
               (home_() + "#price", L("Price", "Precio")), (home_() + "#faq", L("FAQ", "Preguntas"))]

def header():
    links = "".join(f'<a href="{h}">{t}</a>' for h, t in NAV())
    return promo_bar() + f'''
<header class="hd" id="hd">
  <div class="wrap hd-in">
    <a class="hd-logo" href="{page("home")}" aria-label="NASFECO España"><img src="{a("assets/brand/nasfeco-es.png")}" alt="NASFECO España" width="170" height="41"></a>
    <nav class="hd-nav" aria-label="{L("Main", "Principal")}">{links}</nav>
    <div class="hd-r">
      <a class="hd-lang" href="{other()}" hreflang="{L("es", "en")}" title="{L("Ver en español", "View in English")}"><b class="{"on" if LANG == "es" else ""}">ES</b><b class="{"on" if LANG == "en" else ""}">EN</b></a>
      <button type="button" class="hd-cta" data-book>{L("Book your assessment", "Pide tu valoración")}</button>
      <button type="button" class="hd-menu" data-menu aria-expanded="false" aria-controls="mnav" aria-label="{L("Open menu", "Abrir menú")}">{ico(I_MENU, 22, 1.6)}</button>
    </div>
  </div>
</header>
<div class="mnav" id="mnav" hidden>
  <nav>{links}</nav>
  {btn(L("Book your assessment", "Pide tu valoración"), "data-book", "b-wine")}
  <a class="mnav-lang" href="{other()}">{L("Ver en español", "View in English")}</a>
</div>'''

def footer():
    hello = L("Hello NASFECO! I'd like to know more about the X12 in Madrid.", "¡Hola NASFECO! Quiero saber más del X12 en Madrid.")
    mail = f'<a href="mailto:{EMAIL}">{EMAIL}</a>' if EMAIL else f"<p>{pend('correo de contacto')}</p>"
    return f'''
<footer class="ft">
  <div class="wrap ft-top">
    <div class="ft-brand"><img src="{a("assets/brand/nasfeco-es-white.png")}" alt="NASFECO España" width="210" height="51"><p>{L("Reverse osmosis at home, installed and looked after by people in Madrid.", "Ósmosis inversa en casa, instalada y cuidada por personas en Madrid.")}</p></div>
    <div><h3 class="ft-h">{L("Explore", "Explora")}</h3>{"".join(f'<a href="{h}">{t}</a>' for h, t in NAV())}</div>
    <div><h3 class="ft-h">{L("Contact", "Contacto")}</h3><a href="{wa(hello)}" target="_blank" rel="noopener">WhatsApp {WA_SHOW or pend("WhatsApp +34")}</a>{mail}<p>Madrid · Español · English</p></div>
    <div><h3 class="ft-h">{L("Legal", "Legal")}</h3><a href="{page("legal")}">{L("Legal notice", "Aviso legal")}</a><a href="{page("privacy")}">{L("Privacy", "Privacidad")}</a><a href="{page("cookies")}">{L("Cookies", "Cookies")}</a><a href="{page("terms")}">{L("Terms of sale", "Condiciones de contratación")}</a><button type="button" class="ft-l" data-cookie-settings>{L("Cookie settings", "Configurar cookies")}</button><button type="button" class="ft-l" data-info="scope">{L("Service scope", "Alcance del servicio")}</button></div>
  </div>
  <div class="wrap ft-b"><span>© 2026 NASFECO España · {L("Waterdrop is a registered trademark of its manufacturer.", "Waterdrop es una marca registrada de su fabricante.")} {L("Complaint forms are available to consumers (Community of Madrid).", "Hay hojas de reclamaciones a disposición de los consumidores (Comunidad de Madrid).")}</span><span><a href="{other()}">{L("Ver en español", "View in English")}</a> · <a href="#top">{L("Back to the top", "Volver arriba")} ↑</a></span></div>
</footer>'''

def cookie_bar():
    return f'''
<div class="ck" id="ck" role="dialog" aria-modal="false" aria-labelledby="ck-t" hidden>
  <p id="ck-t"><b>{L("Cookies", "Cookies")}</b>{L("We only use the essential storage this website needs. The YouTube videos set their own cookies, so they only load if you accept. You can change your choice at any time from the footer.", "Solo usamos el almacenamiento imprescindible para que la web funcione. Los vídeos de YouTube colocan sus propias cookies, así que solo se cargan si aceptas. Puedes cambiar tu elección cuando quieras desde el pie de página.")} <a class="ul" href="{page("cookies")}">{L("Cookie policy", "Política de cookies")}</a></p>
  <div class="ck-b"><button type="button" class="btn b-line" data-consent="no"><span>{L("Reject", "Rechazar")}</span></button><button type="button" class="btn b-line" data-consent="yes"><span>{L("Accept", "Aceptar")}</span></button></div>
</div>'''

def promo_bar():
    if not PROMO_ON: return ""
    nm = L(*PROMO["name"]); off = money(PROMO["off"])
    return f'''
<div class="pbar" data-promo data-end="{PROMO["end"]}" role="region" aria-label="{nm}">
  <div class="wrap pbar-in"><b>{nm}</b><span class="pbar-s">−{off}</span><span class="pbar-l">{L(f"−{off} on your Waterdrop X12: you pay {money(promo_price('x12'))}, VAT and installation included", f"−{off} en tu Waterdrop X12: pagas {money(promo_price('x12'))}, IVA e instalación incluidos")}</span><span class="pbar-t"><span class="pbar-d">{L("Until", "Hasta el")} {promo_end()} · </span>{L("ends in", "termina en")} <i data-cd>…</i></span></div>
</div>'''

# ------------------------------------------------------------------ inicio: una guía de preguntas (estructura propia de España)
def CHAPTERS():
    # (id, pregunta, etiqueta corta del índice). Producto y servicio, 50/50: lo que vendemos y lo que damos.
    return [("systems", L("What exactly do you sell?", "¿Qué me vendéis exactamente?"), L("What we sell", "Qué vendemos")),
            ("why", L("Why buy it with NASFECO?", "¿Por qué comprarlo con NASFECO?"), L("Why NASFECO", "Por qué NASFECO")),
            ("kit", L("What do I get besides the system?", "¿Qué me llevo además del equipo?"), L("Kit", "Kit")),
            ("how", L("What are the diagnosis and installation like?", "¿Cómo son el diagnóstico y la instalación?"), L("Diagnosis", "Diagnóstico")),
            ("team", L("Who comes to my home?", "¿Quién viene a casa?"), L("Who comes", "Quién viene")),
            ("measure", L("Will it fit in my kitchen?", "¿Cabe en mi cocina?"), L("Will it fit?", "¿Cabe?")),
            ("price", L("How much does it cost?", "¿Cuánto cuesta?"), L("Price", "Precio")),
            ("faq", L("Any other questions?", "¿Alguna otra duda?"), L("Questions", "Dudas"))]

I_SEARCH = "M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5"
def PILLARS():
    return [(I_SEARCH, L("Diagnosis", "Diagnóstico"), L("Before installing anything we check your kitchen and the water in your home, and tell you in writing what you need.", "Antes de instalar nada revisamos tu cocina y el agua de tu casa, y te decimos por escrito qué necesitas."), "{P:qué se mide en el agua y cómo}"),
            (I_TOOL, L("Installation", "Instalación"), L("A NASFECO technician installs it in one visit, tests it with you and shows you the smart faucet.", "Un técnico NASFECO lo instala en una visita, lo prueba contigo y te enseña el grifo inteligente."), ""),
            (I_GIFT, L("Welcome", "Bienvenida"), L("Your NASFECO España kit: tote bag, personalized bottle, embroidered towel and two filter cartridges.", "Tu kit NASFECO España: bolso, botella personalizada, toalla bordada y dos cartuchos filtrantes."), ""),
            (I_CHAT, L("Follow-up", "Seguimiento"), L("Afterwards we stay with you: questions and maintenance reminders, in Spanish or English.", "Después seguimos contigo: dudas y recordatorios de mantenimiento, en español o en inglés."), "")]

def ch_why():
    cards = "".join(f'<article class="pl rv"><span class="pl-n">{n+1:02d}</span><i>{ico(i, 24, 1.6)}</i><h3>{t}</h3><p>{d}</p>{f"<p class=\"fine\">{fill(p)}</p>" if p else ""}</article>' for n, (i, t, d, p) in enumerate(PILLARS()))
    rows = [(L("Before buying", "Antes de comprar"), L("You measure and hope it fits", "Mides y esperas que quepa"), L("Diagnosis of your kitchen and your water", "Diagnóstico de tu cocina y de tu agua")),
            (L("Installation", "Instalación"), L("You or a plumber", "Tú o un fontanero"), L("A NASFECO technician", "Un técnico NASFECO")),
            (L("If something doesn't fit", "Si algo no encaja"), L("You find out when installing", "Lo descubres al instalar"), L("We tell you beforehand, in writing", "Te lo decimos antes, por escrito")),
            (L("Welcome", "Bienvenida"), "—", L("NASFECO España kit", "Kit NASFECO España")),
            (L("Afterwards", "Después"), L("Manufacturer support", "Servicio técnico del fabricante"), L("A NASFECO person, in your language", "Una persona de NASFECO, en tu idioma"))]
    tr = "".join(f'<tr><th scope="row">{r}</th><td>{x}</td><td><i>{ico(I_CHECK, 15, 2.4)}</i>{y}</td></tr>' for r, x, y in rows)
    return f'''
<section class="ch why" id="why" data-ch>
  <div class="wrap">
    {ch_head("why", L("Because the system is only half of it. NASFECO diagnoses, installs, welcomes you and stays with you.", "Porque el equipo es solo la mitad. NASFECO diagnostica, instala, te da la bienvenida y sigue contigo."))}
    <div class="pl-g">{cards}</div>
    <h3 class="d3 why-t rv">{em(L("Buying it on your own [vs. with NASFECO]", "Comprarlo por tu cuenta [o con NASFECO]"))}</h3>
    <div class="tbl rv"><table><thead><tr><th></th><th scope="col">{L("On your own", "Por tu cuenta")}</th><th scope="col"><img src="{a("assets/brand/mark-color.png")}" alt="">{L("With NASFECO", "Con NASFECO")}</th></tr></thead><tbody>{tr}</tbody></table></div>
  </div>
</section>'''

def CH(cid): return next((n, q) for n, (i, q, _) in enumerate(CHAPTERS()) if i == cid)
def ch_head(cid, answer, light=False):
    n, q = CH(cid)
    return (f'<header class="ch-h rv"><span class="ch-n">{n+1:02d}</span><div><h2 class="q{" lt" if light else ""}">{q}</h2>'
            f'<p class="ans{" lt" if light else ""}"><b>{L("Short answer", "Respuesta corta")}.</b> {answer}</p></div></header>')

def rail():
    li = "".join(f'<li><a href="#{i}" data-rail="{i}"><span>{n+1:02d}</span><em>{s}</em></a></li>' for n, (i, _, s) in enumerate(CHAPTERS()))
    return f'<nav class="rail" aria-label="{L("Guide index", "Índice de la guía")}"><ol>{li}</ol></nav>'

def zone_form(compact=False):
    return f'''<form class="zona-f{" zona-c" if compact else ""}" data-zone novalidate>
      <label for="z-cp">{L("Do we cover your home? Type your postcode", "¿Llegamos a tu casa? Escribe tu código postal")}</label>
      <div class="zona-in"><span>{ico(I_PIN, 20, 1.6)}</span><input id="z-cp" name="cp" inputmode="numeric" maxlength="5" autocomplete="postal-code" placeholder="28001"><button type="submit" class="btn b-wine"><span>{L("Check", "Comprobar")}</span><i>{ico(I_RIGHT, 15, 1.8)}</i></button></div>
      <div class="zona-r" data-zone-r aria-live="polite"></div>
      <p class="fine">{ZONE or pend("zona de servicio y códigos postales")}</p>
    </form>'''

def hero():
    buy = [L("Tankless reverse osmosis", "Ósmosis inversa sin depósito"), L("Smart faucet on the worktop", "Grifo inteligente en la encimera"), L("Purified, remineralized water", "Agua purificada y remineralizada")]
    give = [L("Diagnosis of your kitchen and water", "Diagnóstico de tu cocina y tu agua"), L("Installation by NASFECO", "Instalación NASFECO"), L("Welcome kit and follow-up", "Kit de bienvenida y seguimiento")]
    tick = lambda xs: "".join(f"<li>{ico(I_CHECK, 14, 2.4)}<span>{x}</span></li>" for x in xs)
    return f'''
<section class="mh mh-5" id="top">
  <div class="wrap mh-g">
    <div class="mh-c">
      {eyebrow("NASFECO España · Madrid")}
      <h1 class="d1">{em(L("Reverse osmosis water in your kitchen. [With the full NASFECO service.]", "Agua de ósmosis en tu cocina. [Con todo el servicio NASFECO.]"))}</h1>
      <p class="lead">{L("We sell you the Waterdrop X12, a tankless reverse osmosis system with a smart faucet. And we hand it to you done: diagnosis, installation, welcome kit and follow-up.", "Te vendemos el Waterdrop X12, un equipo de ósmosis inversa sin depósito con grifo inteligente. Y te lo dejamos todo hecho: diagnóstico, instalación, kit de bienvenida y seguimiento.")}</p>
      {zone_form(True)}
      <div class="row">{btn(L("Book your assessment", "Pide tu valoración"), "data-book", "b-wine")}<a class="ul" href="#guia">{L("Start the guide", "Empezar la guía")} ↓</a></div>
    </div>
    <div class="mh-duo">
      <a class="hc hc-buy" href="{page("x12")}">
        <span class="hc-k">{L("What you buy", "Lo que compras")}</span>
        <span class="arch hc-a"><img src="{a(fix_photo("x12"))}" alt="Waterdrop X12" fetchpriority="high"></span>
        <b class="hc-t">Waterdrop X12</b>
        <ul>{tick(buy)}</ul>
      </a>
      <span class="hc-plus" aria-hidden="true">+</span>
      <a class="hc hc-give" href="#why">
        <span class="hc-k">{L("What we give you", "Lo que te damos")}</span>
        <span class="arch hc-a"><img src="{a("assets/img/welcome-kit.webp")}" alt="{L("NASFECO España welcome kit", "Kit de bienvenida NASFECO España")}"></span>
        <b class="hc-t">{L("NASFECO service", "Servicio NASFECO")}</b>
        <ul>{tick(give)}</ul>
      </a>
      <p class="hc-eq"><b>Waterdrop X12</b> + <b>{L("NASFECO service", "servicio NASFECO")}</b> = {L("one price, VAT and installation included", "un solo precio, IVA e instalación incluidos")}</p>
      <div class="hc-price">{price_html("x12", False)}</div>
    </div>
  </div>
</section>
<section class="toc" id="guia">
  <div class="wrap">
    <p class="toc-t">{L(f"This guide answers {len(CHAPTERS())} questions", f"Esta guía responde a {len(CHAPTERS())} preguntas")}</p>
    <ol class="toc-l">{"".join(f'<li><a href="#{i}"><span>{n+1:02d}</span><b>{q}</b></a></li>' for n, (i, q, _) in enumerate(CHAPTERS()))}</ol>
  </div>
</section>'''

def systems():
    cards = ""
    for k in MODELS:
        m = MODELS[k]
        if k in SOON:
            ask = wa(L(f"Hello NASFECO! Please let me know when the Waterdrop {m['name']} arrives in Madrid.", f"¡Hola NASFECO! Avisadme cuando llegue el Waterdrop {m['name']} a Madrid."))
            cards += f'''
    <div class="eq-soon rv"><span class="tag">{L("Coming soon", "Próximamente")}</span><b>Waterdrop {m["name"]}</b><span>{L("More capacity, the same service. Coming soon to Madrid.", "Más capacidad, el mismo servicio. Muy pronto en Madrid.")}</span><a class="ul" href="{ask}" target="_blank" rel="noopener">{L("Let me know when it arrives", "Avísame cuando llegue")} {ico(I_ARR, 14, 1.8)}</a></div>'''
            continue
        dl = [(L("Capacity", "Capacidad"), cap(k)), (L("Pure / drain", "Pura / desagüe"), "3:1"), (L("Size", "Medidas"), dims_txt()), (L("Faucet", "Grifo"), L("Smart, with TDS and filter alerts", "Inteligente, con TDS y aviso de filtros"))]
        cards += f'''
    <article class="eq-card rv">
      <a class="arch eq-img" href="{page(k)}" aria-label="{L("See", "Ver")} Waterdrop {m["name"]}"><img src="{a(fix_photo(k))}" alt="Waterdrop {m["name"]}" loading="lazy"></a>
      <div class="eq-b">
        <p class="eq-k">Waterdrop · {L("tankless reverse osmosis", "ósmosis inversa sin depósito")}</p>
        <h3 class="eq-n">{m["name"]}</h3>
        <p class="eq-d">{L("Water passes through its filters and comes out of its own faucet on the worktop, remineralized. No tank: the system stands slim and upright under the sink.", "El agua pasa por sus filtros y sale por su propio grifo en la encimera, remineralizada. Sin depósito: el equipo queda estrecho y de pie bajo el fregadero.")}</p>
        <dl class="eq-dl">{"".join(f"<div><dt>{x}</dt><dd>{y}</dd></div>" for x, y in dl)}</dl>
        <div class="row">{btn(L("See the " + m["name"] + " in detail", "Ver el " + m["name"] + " a fondo"), "", "b-wine", page(k))}</div>
      </div>
    </article>'''
    return f'''
<section class="ch eq" id="systems" data-ch>
  <div class="wrap">
    {ch_head("systems", L("The Waterdrop X12, a tankless reverse osmosis system that gives you purified water from its own faucet. And with it, the full NASFECO service.", "El Waterdrop X12, un equipo de ósmosis inversa sin depósito que te da agua purificada por su propio grifo. Y con él, todo el servicio NASFECO."))}
    {cards}
  </div>
</section>'''

def ch_measure():
    return f'''
<section class="ch ms" id="measure" data-ch>
  <div class="wrap">
    {ch_head("measure", L(f"It needs a space of {dims_txt()} under the sink. Check it here with your cabinet's measurements.", f"Necesita un hueco de {dims_txt()} bajo el fregadero. Compruébalo aquí con las medidas de tu mueble."))}
    {measure_grid("x12")}
  </div>
</section>'''

def ch_how():
    you = [L("Write to us or book your assessment", "Escribirnos o pedir tu valoración"), L("Choose your X12", "Elegir tu X12"), L("Enjoy your water", "Disfrutar de tu agua")]
    us = [L("We listen and help you choose", "Te escuchamos y te ayudamos a elegir"), L("We diagnose your kitchen and your water", "Diagnosticamos tu cocina y tu agua"),
          L("We put the result and the scope in writing", "Te damos el resultado y el alcance por escrito"), L("We arrange the visit at your time", "Organizamos la visita cuando mejor te venga"),
          L("We install it and check it works", "Lo instalamos y comprobamos que funciona"), L("We show you the smart faucet", "Te enseñamos el grifo inteligente"),
          L("We hand you your welcome kit", "Te entregamos tu kit de bienvenida"), L("We follow up and remind you about maintenance", "Hacemos seguimiento y te recordamos el mantenimiento")]
    return f'''
<section class="ch duo" id="how" data-ch>
  <div class="wrap">
    {ch_head("how", L("First the diagnosis of your kitchen and your water. Then one visit: we fit the system and the faucet, test it with you and show you how to use it.", "Primero, el diagnóstico de tu cocina y de tu agua. Después, una sola visita: colocamos el equipo y el grifo, lo probamos contigo y te enseñamos a usarlo."))}
    <div class="duo-g">
      <article class="duo-you rv"><p class="duo-n">3</p><p class="duo-t">{L("What you do", "Lo que haces tú")}</p><ol>{"".join(f"<li>{x}</li>" for x in you)}</ol></article>
      <article class="duo-us rv"><p class="duo-n">8</p><p class="duo-t">{L("What NASFECO does", "Lo que hace NASFECO")}</p><ol>{"".join(f"<li><i>{n+1:02d}</i>{x}</li>" for n, x in enumerate(us))}</ol></article>
    </div>
  </div>
</section>''' + install3d("x12")

def team(compact=False):
    pts = [("ES·EN", L("Spanish and English", "Español e inglés"), L("You explain what you need in your language; they explain everything back in yours.", "Le explicas lo que necesitas en tu idioma y te lo explican todo en el tuyo.")),
           ("RO", L("Reverse osmosis specialists", "Especialistas en ósmosis inversa"), L("Space, connections, smart faucet and the first test.", "Espacio, conexiones, grifo inteligente y la primera prueba.")),
           ("ID", L("Uniform and ID badge", "Uniforme y acreditación"), L("NASFECO España uniform and a badge with their name and number.", "Uniforme NASFECO España y acreditación con su nombre y número.")),
           ("1:1", L("The same team, start to finish", "El mismo equipo de principio a fin"), L("The same people assess, install, teach you and follow up.", "Las mismas personas valoran, instalan, te enseñan y hacen el seguimiento."))]
    head = (ch_head("team", L("A NASFECO technician in uniform and with an ID badge, who speaks Spanish and English. The same team from start to finish.", "Un técnico NASFECO con uniforme y acreditación, que habla español e inglés. El mismo equipo de principio a fin."))
            if not compact else f'<header class="sh rv">{eyebrow(L("Who comes to your home", "Quién llega a tu casa"))}<h2 class="d2">{em(L("Your NASFECO technician, [with a name and a badge.]", "Tu técnico NASFECO, [con nombre y acreditación.]"))}</h2></header>')
    return f'''
<section class="{"ch " if not compact else ""}team{" team-c" if compact else ""}" id="team"{" data-ch" if not compact else ""}>
  <div class="wrap">
    {head}
    <figure class="team-f rv"><img src="{a("assets/img/tecnico.webp")}" srcset="{a("assets/img/tecnico-sm.webp")} 900w, assets/img/tecnico.webp 1600w" sizes="(max-width:1100px) 100vw, 1180px" alt="{L("Three NASFECO España team members in uniform", "Tres personas del equipo NASFECO España con uniforme")}" loading="lazy" width="1600" height="800">
      <figcaption>{L("NASFECO España uniform · illustrative image", "Uniforme NASFECO España · imagen ilustrativa")}</figcaption></figure>
    <ul class="team-l">{"".join(f'<li class="rv"><i>{i}</i><b>{t}</b><p>{d}</p></li>' for i, t, d in pts)}</ul>
  </div>
</section>'''

def KIT():
    # Kit de bienvenida de Madrid (foto del cliente, 13/10/2026). pos: punto sobre la foto (x %, y %)
    return [("tote", L("NASFECO tote bag", "Bolso NASFECO"), L("Canvas with burgundy handles and our logo.", "De lona, con asas granate y nuestro logo."), (31, 45)),
            ("bottle", L("Personalized bottle", "Botella personalizada"), L("Insulated, with NASFECO España personalization.", "Térmica, con la personalización NASFECO España."), (53, 62)),
            ("filters", L("Two filter cartridges", "Dos cartuchos filtrantes"), L("Your first change, ready. References confirmed in your proposal.", "Tu primer cambio, ya preparado. Las referencias van en tu propuesta."), (75, 37)),
            ("towel", L("Embroidered towel", "Toalla bordada"), L("Soft, with the NASFECO España embroidery.", "Suave, con el bordado NASFECO España."), (79, 74))]

def kit_photo():
    items = KIT()
    li = "".join(f'<li><button type="button" class="kit-i{" on" if n == 0 else ""}" data-kit-i="{n}" aria-pressed="{"true" if n == 0 else "false"}"><i>{n+1:02d}</i><span><b>{t}</b><small>{d}</small></span></button></li>' for n, (_, t, d, _) in enumerate(items))
    dots = "".join(f'<button type="button" class="kit-dot{" on" if n == 0 else ""}" data-kit-i="{n}" style="left:{x}%;top:{y}%" aria-label="{t}"><span>{n+1}</span></button>' for n, (_, t, _, (x, y)) in enumerate(items))
    return f'''
<section class="ch kitm" id="kit" data-ch>
  <div class="wrap">
    {ch_head("kit", L("A welcome kit: tote bag, personalized bottle, embroidered towel and two filter cartridges. At no extra cost.", "Un kit de bienvenida: bolso, botella personalizada, toalla bordada y dos cartuchos filtrantes. Sin coste adicional."), True)}
    <div class="kitm-g">
      <figure class="kitm-f rv"><div class="arch kitm-a"><img src="{a("assets/img/welcome-kit.webp")}" alt="{L("NASFECO España welcome kit: tote bag, bottle, towel and two filter cartridges", "Kit de bienvenida NASFECO España: bolso, botella, toalla y dos cartuchos filtrantes")}" loading="lazy" width="1536" height="1024">{dots}</div>
        <figcaption>{L("Illustrative image · final finishes to be confirmed · tap each piece", "Imagen ilustrativa · acabados finales por confirmar · pulsa en cada pieza")}</figcaption></figure>
      <ol class="kit-l rv">{li}</ol>
    </div>
  </div>
</section>'''

def ch_price():
    k = "x12"; m = MODELS[k]
    inc = [L("Waterdrop X12 with its original smart faucet", "Waterdrop X12 con su grifo inteligente original"), L("Diagnosis of your kitchen and your water", "Diagnóstico de tu cocina y de tu agua"),
           L("Standard professional installation", "Instalación profesional estándar"), L("Operation check and training", "Prueba de funcionamiento y explicación de uso"),
           L("NASFECO España welcome gifts", "Regalos de bienvenida NASFECO España"), L("Two filter cartridges", "Dos cartuchos filtrantes"), L("Follow-up and maintenance reminders", "Seguimiento y recordatorios de mantenimiento")]
    return f'''
<section class="ch pr" id="price" data-ch>
  <div class="wrap">
    {ch_head("price", L("One final price with VAT: the system plus everything NASFECO does (diagnosis, installation, kit and follow-up).", "Un precio final con IVA: el equipo y todo lo que hace NASFECO (diagnóstico, instalación, kit y seguimiento)."), True)}
    <div class="pr-card rv">
      <div class="pr-l"><p class="pr-k">Waterdrop {m["name"]} · {L("installed in Madrid", "instalado en Madrid")}</p><div class="pr-amt">{price_html(k)}</div><p class="pr-vat">{L("VAT (21%) and installation included. Nothing is charged on this website.", "IVA (21 %) e instalación incluidos. En esta web no se cobra nada.")}</p>
        <div class="row">{btn(L("Book your assessment", "Pide tu valoración"), f'data-book="{k}"', "b-wine")}</div></div>
      <div class="pr-r"><p class="pr-k">{L("What the price includes", "Qué incluye el precio")}</p><ul>{"".join(f"<li>{ico(I_CHECK, 15, 2.4)}<span>{x}</span></li>" for x in inc)}</ul>
        <p class="fine">{L("Any extra work (for example, drilling the worktop) is agreed with you beforehand, in writing.", "Cualquier trabajo adicional (por ejemplo, perforar la encimera) se acuerda contigo antes, por escrito.")}</p></div>
    </div>
  </div>
</section>'''

# Shorts de YouTube (no enseñan a instalarlo uno mismo). Se cargan desde youtube-nocookie.com y solo con consentimiento;
# antes se ve la portada guardada en assets/img/yt/.
SHORTS = [("3Z4LCVjQJZ8", ("Is it worth it?", "¿Merece la pena?"), "Waterdrop Filter"),
          ("J7rUkXoGZrQ", ("More space under the sink", "Más espacio bajo el fregadero"), "DailyTested"),
          ("WAuQn4B7gns", ("A real review", "Una reseña real"), "Things We Bought Reviews")]
PSHORT = {"x12": ("3Z4LCVjQJZ8", "Waterdrop Filter")}
def yt_box(i, label):
    return (f'<div class="yt-s" role="figure" data-ytauto="{i}" aria-label="{label}"><img src="{a(f"assets/img/yt/{i}.webp")}" alt="" loading="lazy">'
            f'<div class="yt-gate"><p>{L("This video is on YouTube, which uses cookies.", "Este vídeo está en YouTube, que usa cookies.")}</p><button type="button" class="btn b-gold" data-consent="yes"><span>{L("Accept and watch", "Aceptar y ver")}</span></button></div></div>')
def shorts(inner=False):
    skip = PSHORT[CUR][0] if CUR in PSHORT else None
    c = "".join(f'<article class="short rv">{yt_box(i, L(*t))}<h3>{L(*t)}</h3><small>{by} · YouTube</small></article>' for i, t, by in SHORTS if i != skip)
    return f'''<div class="sht" id="watch"><div class="sht-h rv"><h3 class="d3">{em(L("See it in [real homes.]", "Míralo en [casas reales.]"))}</h3><p>{L("Shorts by Waterdrop and by owners. With your consent they play on their own, muted.", "Vídeos cortos de Waterdrop y de usuarios, en YouTube. Si aceptas las cookies, se reproducen solos y sin sonido.")}</p></div><div class="sht-l">{c}</div></div>'''

def FAQ():
    return [(("What is the NASFECO diagnosis?", "¿Qué es el diagnóstico NASFECO?"),
             ("Before installing, we check your kitchen (space, water supply, drain, socket and where the faucet goes) and the water in your home, and tell you in writing what you need. What we measure in the water: {P:qué se mide en el agua y cómo}.",
              "Antes de instalar revisamos tu cocina (espacio, toma de agua, desagüe, enchufe y dónde irá el grifo) y el agua de tu casa, y te decimos por escrito qué necesitas. Qué medimos en el agua: {P:qué se mide en el agua y cómo}.")),
            (("What is included in the price?", "¿Qué incluye el precio?"),
             ("Your system with its original faucet, kitchen assessment, standard installation and the welcome kit: tote bag, personalized bottle, embroidered towel and two filter cartridges. VAT (21%) is included. The final scope is confirmed in writing. Price: " + offer_txt() + ".",
              "El equipo con su grifo original, la valoración de tu cocina, la instalación estándar y el kit de bienvenida: bolso, botella personalizada, toalla bordada y dos cartuchos filtrantes. El IVA (21 %) está incluido. El alcance final se confirma por escrito. Precio: " + offer_txt() + ".")),
            (("When will the X16 be available?", "¿Cuándo llega el X16?"),
             ("The X16 is coming soon to Madrid. For now NASFECO installs the X12. Write to us on WhatsApp and we will let you know when it arrives.",
              "El X16 llega pronto a Madrid. Por ahora NASFECO instala el X12. Escríbenos por WhatsApp y te avisamos cuando llegue.")),
            (("What do you check before installing?", "¿Qué revisáis antes de instalar?"),
             ("Under-sink space, drinking water supply, drain, a socket and where the faucet will go. We also check whether the worktop needs drilling or your building needs to be told. Any extra work is agreed before we start.",
              "El espacio bajo el fregadero, la toma de agua potable, el desagüe, el enchufe y dónde irá el grifo. También vemos si hay que perforar la encimera o avisar a la comunidad de vecinos. Cualquier trabajo adicional se acuerda antes de empezar.")),
            (("When are the included filters replaced?", "¿Cuándo se cambian los filtros incluidos?"),
             ("Two filter cartridges are included; their exact references are confirmed in writing. Timing depends on use and the manufacturer's limits. They are not unlimited filters or free future visits.",
              "Se incluyen dos cartuchos filtrantes; sus referencias exactas quedan por escrito. Cuándo se cambian depende del uso y de los límites del fabricante. No son filtros ilimitados ni visitas futuras gratis.")),
            (("When and how do I pay?", "¿Cuándo y cómo pago?"),
             ("The price shown is final, with VAT included. Payment methods and timing are confirmed with you before the visit and written into your proposal: {P:formas y momento de pago}. You receive an invoice. Nothing is charged on this website.",
              "El precio que ves es final, con IVA incluido. Las formas y el momento de pago se confirman contigo antes de la visita y quedan en tu propuesta: {P:formas y momento de pago}. Recibes factura. En esta web no se cobra nada.")),
            (("What guarantee do I have?", "¿Qué garantía tengo?"),
             ("Under Spanish consumer law you have a 3-year legal guarantee on the goods. Because the installation is part of the contract, a fault caused by incorrect installation is also covered. Any additional manufacturer warranty is detailed in your proposal.",
              "Por ley tienes 3 años de garantía legal sobre el equipo. Como la instalación forma parte del contrato, un fallo por una instalación incorrecta también está cubierto. Si el fabricante da una garantía adicional, se detalla en tu propuesta.")),
            (("Can I change my mind?", "¿Puedo echarme atrás?"),
             ("If you sign the contract away from our premises or at a distance, you have 14 calendar days to withdraw without giving a reason. If you ask us to install within those 14 days, you will pay the proportional part of the service already provided, and the right to withdraw ends once the service has been fully provided with your prior express consent. See the terms of sale.",
              "Si contratas a distancia o fuera de nuestro establecimiento, tienes 14 días naturales para desistir sin dar explicaciones. Si nos pides instalar dentro de esos 14 días, pagas la parte proporcional del servicio ya prestado, y el derecho termina cuando el servicio se ha prestado por completo con tu consentimiento expreso previo. Lo tienes en las condiciones de contratación.")),
            (("Does the system treat all the water in my home?", "¿El equipo trata toda el agua de casa?"),
             ("No. The X12 is designed for drinking water in the kitchen, through its own faucet. It is not a whole-home softener or a system for every tap.",
              "No. El X12 está pensado para el agua de beber en la cocina, mediante su propio grifo. No es un descalcificador para toda la vivienda ni un sistema para todos los grifos."))]

def faq():
    q = "".join(f'<details class="rv"><summary><i>{n+1:02d}</i><span>{L(*x)}</span><b>{ico(I_PLUS, 16, 1.8)}</b></summary><p>{fill(L(*y))}</p></details>' for n, (x, y) in enumerate(FAQ()))
    wabtn = btn(L("Ask on WhatsApp", "Preguntar por WhatsApp"), 'target="_blank" rel="noopener"', "b-line", wa(L("Hello NASFECO! I have a question about the X12 in Madrid.", "¡Hola NASFECO! Tengo una pregunta sobre el X12 en Madrid.")))
    if CUR == "home":
        return f'''
<section class="ch faq" id="faq" data-ch>
  <div class="wrap">
    {ch_head("faq", L("Here are the most common ones. If yours isn't here, a person answers you on WhatsApp.", "Aquí tienes las más habituales. Si la tuya no está, te responde una persona por WhatsApp."))}
    <div class="faq-g"><div class="faq-r">{q}</div><aside class="faq-l rv">{wabtn}</aside></div>
    {shorts()}
  </div>
</section>'''
    return f'''
<section class="faq" id="faq">
  <div class="wrap">
    <header class="sh rv">{eyebrow(L("Questions", "Preguntas"))}<h2 class="d2">{em(L("Before you decide, [ask us.]", "Antes de decidir, [pregúntanos.]"))}</h2></header>
    <div class="faq-g"><div class="faq-r">{q}</div><aside class="faq-l rv">{wabtn}</aside></div>
  </div>
</section>'''

def closing():
    return f'''
<section class="cta" id="cta">
  <div class="wrap cta-g">
    <div class="cta-c rv">{eyebrow(L("That's the guide", "Hasta aquí la guía"), True)}
      <h2 class="d1 lt">{em(L("Leave the rest [to us.]", "Déjanos el resto [a nosotros.]"))}</h2>
      <p class="lead lt">{L("Book your assessment and we will plan your installation with you, step by step.", "Pide tu valoración y planificamos contigo la instalación, paso a paso.")}</p>
      <div class="row">{btn(L("Book your assessment", "Pide tu valoración"), "data-book", "b-gold")}<a class="btn b-ghost" href="{wa(L("Hello NASFECO! I would like to know more about the X12 in Madrid.", "¡Hola NASFECO! Quiero saber más del X12 en Madrid."))}" target="_blank" rel="noopener"><span>WhatsApp</span><i>{WA}</i></a></div></div>
    <div class="arch cta-a rv"><img src="{a(fix_photo("x12"))}" alt="Waterdrop X12" loading="lazy"></div>
  </div>
</section>'''

# ------------------------------------------------------------------ página de producto
def pd_hero(k):
    m = MODELS[k]; b, f = FIX[k]
    chips = [cap(k, short=True), "3:1", L("Tankless", "Sin depósito"), L("Remineralization", "Remineralización")]
    inc = [(I_SEARCH, L("Diagnosis of your kitchen and water", "Diagnóstico de tu cocina y tu agua")), (I_TOOL, L("NASFECO installation", "Instalación NASFECO")), (I_GIFT, L("NASFECO welcome kit", "Kit de bienvenida NASFECO")), (I_CHAT, L("Follow-up in Spanish or English", "Seguimiento en español o inglés"))]
    return f'''
<section class="pd" id="top" data-h3 data-pdp="{k}">
  <div class="wrap pd-g">
    <div class="pd-v">
      <div class="arch pd-arch"><div class="mh-3d" data-3d-hero data-k="{k}" data-body="{b}" data-faucet="{f}"><img class="h3-fb" src="{a(fix_photo(k))}" alt="Waterdrop {m["name"]}" fetchpriority="high" width="900" height="900"></div></div>
      <p class="mh-hint">{L("Drag to rotate", "Arrastra para girar")}</p>
    </div>
    <div class="pd-c">
      <p class="crumb"><a href="{page("home")}">{L("Home", "Inicio")}</a> / Waterdrop {m["name"]}</p>
      {eyebrow(L("Diagnosed, installed and looked after by NASFECO · Madrid", "Diagnosticado, instalado y cuidado por NASFECO · Madrid"))}
      <h1 class="d1">Waterdrop <em>{m["name"]}</em></h1>
      <div class="chips">{"".join(f"<span>{c}</span>" for c in chips)}</div>
      <p class="lead">{L("Tankless reverse osmosis with remineralization and a smart faucet. Assessed, installed and looked after by NASFECO.", "Ósmosis inversa sin depósito, con remineralización y grifo inteligente. Valorado, instalado y cuidado por NASFECO.")}</p>
      <p class="pd-col">{color_txt(k)}</p>
      <div class="pd-p">{price_html(k)}<span class="pd-vat">{L("VAT (21%) and installation included · everything below included", "IVA (21 %) e instalación incluidos · todo lo de abajo incluido")}</span></div>
      <div class="row">{btn(L("Book your assessment", "Pide tu valoración"), f'data-book="{k}"', "b-wine")}<a class="btn b-line" href="{wa(L(f"Hello NASFECO! I'm interested in the Waterdrop {m['name']} in Madrid.", f"¡Hola NASFECO! Me interesa el Waterdrop {m['name']} en Madrid."))}" target="_blank" rel="noopener"><span>WhatsApp</span><i>{WA}</i></a></div>
      <ul class="pd-inc">{"".join(f"<li>{ico(i, 18, 1.6)}<span>{t}</span></li>" for i, t in inc)}</ul>
    </div>
  </div>
</section>
<nav class="sub" aria-label="Waterdrop {m["name"]}"><div class="wrap sub-in"><b>{m["name"]}</b><a href="#kit">{L("Welcome kit", "Kit")}</a><a href="#photos">{L("Photos", "Fotos")}</a><a href="#video">{L("Video", "Vídeo")}</a><a href="#features">{L("Overview", "Resumen")}</a><a href="{page("home")}#how">{L("Diagnosis and installation", "Diagnóstico e instalación")}</a><a href="#measure">{L("Will it fit?", "¿Cabe?")}</a><a href="#specs">{L("Specs", "Ficha técnica")}</a><a href="#faq">{L("FAQ", "Preguntas")}</a><button type="button" class="hd-cta" data-book="{k}">{L("Book", "Pedir cita")}</button></div></nav>'''

def gallery(k):
    m = MODELS[k]
    gal = [fix_photo(k)] + [f"assets/products/{k}-g{i}.webp" for i in range(1, 5)]
    th = "".join(f'<button type="button" class="pdp-th{" on" if i == 0 else ""}" data-photo="{a(g)}" aria-label="{L("Photo", "Foto")} {i+1}"><img src="{g}" alt="" loading="lazy"></button>' for i, g in enumerate(gal))
    return f'''
<section class="gal" id="photos">
  <div class="wrap gal-g">
    <div class="gal-main rv"><img id="pdp-photo" src="{a(fix_photo(k))}" alt="Waterdrop {m["name"]}"></div>
    <div class="gal-ths rv">{th}</div>
    <p class="fine">{L("Official Waterdrop photos.", "Fotos oficiales de Waterdrop.")}</p>
  </div>
</section>'''

def pshort(k):
    i, by = PSHORT[k]; m = MODELS[k]
    pts = [L("Real home, real kitchen", "Casa real, cocina real"), L("Under the sink, slim and upright", "Bajo el fregadero, estrecho y de pie"), L("Smart faucet on the worktop", "Grifo inteligente en la encimera")]
    return f'''
<section class="psh" id="video">
  <div class="wrap psh-g">
    <article class="short rv">{yt_box(i, "Waterdrop " + m["name"])}<small>{by} · YouTube</small></article>
    <div class="rv">{eyebrow(L("Watch it", "Míralo"))}
      <h2 class="d2">{em(L(f"The {m['name']}, [in a minute.]", f"El {m['name']}, [en un minuto.]"))}</h2>
      <p class="lead">{L("A short from a real home, so you can see the system working before your assessment.", "Un vídeo corto grabado en una casa real, para que veas el equipo funcionando antes de tu valoración.")}</p>
      <ul class="ticks">{"".join(f"<li>{ico(I_CHECK, 15, 2.4)}{x}</li>" for x in pts)}</ul></div>
  </div>
</section>'''

def xv(name):
    return f'<video muted playsinline loop preload="none" data-auto poster="{a("assets/x12/" + name + "-poster.jpg")}"><source src="{a("assets/x12/" + name + ".mp4")}" type="video/mp4"></video>'

def features(k):
    items = [(xv("x12-tds"), L("A faucet that informs you", "Un grifo que te informa"), L("It shows your water's TDS and when each filter is due.", "Muestra el TDS de tu agua y cuándo toca cambiar cada filtro.")),
             (xv("x12-pour"), L("A cup in about 3 seconds", "Una taza en unos 3 segundos"), L("No tank to fill: water goes through the filters straight to your glass.", "Sin depósito que llenar: el agua pasa por los filtros directa a tu vaso.")),
             (xv("x12-cabinet"), L("Your cabinet, back", "Más sitio en tu mueble"), L("Slim and upright, it frees up space under the sink.", "Estrecho y de pie, libera espacio bajo el fregadero.")),
             (xv("x12-inside"), L("Filters in seconds", "Filtros en segundos"), L("Three filters that twist out and in, no tools.", "Tres filtros que se giran y se cambian, sin herramientas."))]
    c = "".join(f'<article class="ft-c rv"><div class="arch ft-m">{mm}</div><i>{ROMAN[n]}</i><h3>{t}</h3><p>{d}</p></article>' for n, (mm, t, d) in enumerate(items))
    return f'''
<section class="feat" id="features"><div class="wrap">
  <header class="sh rv">{eyebrow(L("What it does", "Lo que hace"))}<h2 class="d2">{em(L(f"Everything the {MODELS[k]['name']} does, [without asking.]", f"Todo lo que hace el {MODELS[k]['name']}, [sin pedirte nada.]"))}</h2></header>
  <div class="feat-g">{c}</div>
  <p class="fine">{L("Official Waterdrop clips.", "Vídeos oficiales de Waterdrop.")}</p></div></section>'''

def install3d(k="x12"):
    fb, ff = FIX[k]
    steps = [(L("We open and measure your cabinet", "Abrimos y medimos tu mueble"), L("Space, water supply, drain and socket are checked first.", "Revisamos espacio, toma de agua, desagüe y enchufe antes de nada.")),
             (L("The system goes in", "Colocamos el equipo"), L("It stands slim and tidy under your sink.", "Queda de pie, estrecho y ordenado bajo tu fregadero.")),
             (L("The smart faucet", "El grifo inteligente"), L("It sits on your worktop. In your assessment we agree where.", "Va sobre tu encimera. En la valoración acordamos dónde.")),
             (L("We connect everything", "Conectamos todo"), L("Water in, purified water to the faucet, drain and power.", "Entrada de agua, agua purificada al grifo, desagüe y corriente.")),
             (L("We test it with you", "Lo probamos contigo"), L("We pour the first glass together and show you the faucet.", "Servimos juntos el primer vaso y te enseñamos el grifo.")),
             (L("Done. And we stay close.", "Hecho. Y seguimos a tu lado."), L("Your welcome kit, follow-up and maintenance reminders.", "Tu kit de bienvenida, seguimiento y recordatorios de mantenimiento."))]
    li = "".join(f'<li data-i="{i}"><span>{ROMAN[i]}</span><div><b>{t}</b><p>{d}</p></div></li>' for i, (t, d) in enumerate(steps))
    return f'''
<section class="ins" id="install" data-install>
  <div class="ins-st">
    <div class="ins-3d" data-3d-install data-k="{k}" data-body="{fb}" data-faucet="{ff}"></div>
    <div class="ins-c">
      {eyebrow(L("How NASFECO installs", "Así instala NASFECO"))}
      <h2 class="d3">{em(L("Your kitchen, [ready in one visit.]", "Tu cocina, [lista en una visita.]"))}</h2>
      <ol class="ins-steps">{li}</ol>
      <div class="ins-bar"><i></i></div>
      <p class="fine">{L("Illustrative animation. Scope and any adaptation are confirmed in your assessment.", "Animación ilustrativa. El alcance y cualquier adaptación se confirman en tu valoración.")}</p>
    </div>
    <p class="ins-hint">{L("Keep scrolling", "Sigue bajando")} ↓</p>
  </div>
</section>'''

def measure(k="x12"):
    return f'''
<section class="ms" id="measure">
  <div class="wrap">
    <header class="sh rv">{eyebrow(L("Your kitchen, in 3D", "Tu cocina, en 3D"))}<h2 class="d2">{em(L("Will it fit [your cabinet?]", "¿Cabe en tu [mueble?]"))}</h2>
      <p class="lead">{L("Rotate the system, see its real size and type your under-sink space in centimetres. We tell you right away.", "Gira el equipo, mira sus medidas reales y escribe en centímetros el espacio de tu mueble bajo el fregadero. Te lo decimos al momento.")}</p></header>
    {measure_grid(k)}
  </div>
</section>'''

def measure_grid(k="x12"):
    b, f = FIX[k]
    return f'''<div class="ms-g">
      <div class="ms-view" data-3d-measure data-k="{k}" data-body="{b}" data-faucet="{f}">
        <p class="ms-help">{L("Drag to rotate · scroll or pinch to zoom", "Arrastra para girar · rueda o pellizca para acercar")}</p>
      </div>
      <div class="ms-side">
        <div class="ms-card"><p class="eb"><i></i>{L("Official size", "Medidas oficiales")}</p>
          <div class="spec"><span>{L("Width", "Ancho")}</span><b data-dim="w"></b><span>{L("Depth", "Fondo")}</span><b data-dim="d"></b><span>{L("Height", "Alto")}</span><b data-dim="h"></b><span>{L("Weight", "Peso")}</span><b data-dim="kg"></b></div>
          <p class="fine">{L("Waterdrop's European product sheet.", "Ficha europea de Waterdrop.")}</p></div>
        <div class="ms-card"><h3>{L("Your cabinet", "Tu mueble")}</h3><p class="fine">{L("Measure the free space inside, under the sink.", "Mide el espacio libre por dentro, bajo el fregadero.")}</p>
          <div class="fit-f"><label><span>{L("Width", "Ancho")} (cm)</span><input data-cab="w" type="number" inputmode="decimal" min="0" step="0.1"></label><label><span>{L("Depth", "Fondo")} (cm)</span><input data-cab="d" type="number" inputmode="decimal" min="0" step="0.1"></label><label><span>{L("Height", "Alto")} (cm)</span><input data-cab="h" type="number" inputmode="decimal" min="0" step="0.1"></label></div>
          <div class="fit-r" data-fit aria-live="polite"></div>
          {btn(L("Confirm it in my assessment", "Confirmarlo en mi valoración"), f'data-book="{k}"', "b-wine")}</div>
      </div>
    </div>'''

def specs(k):
    m = MODELS[k]
    rows = [(L("Model", "Modelo"), "Waterdrop " + m["name"]),
            (L("Rated capacity", "Capacidad nominal"), cap(k) + f' <small>({L("European sheet", "ficha europea")}: {num(m["gpd"])} GPD)</small>'),
            (L("Pure / drain", "Pura / desagüe"), "3:1"),
            (L("Technology", "Tecnología"), L("Tankless reverse osmosis + alkaline remineralization", "Ósmosis inversa sin depósito + remineralización alcalina")),
            (L("Faucet", "Grifo"), L("Smart: TDS, filter life, adjustable volume", "Inteligente: TDS, vida de los filtros, volumen programable")),
            (L("Filters", "Filtros"), L("F1A · 12 months, F2 · 6 months, F3 · 24 months (depending on use)", "F1A · 12 meses, F2 · 6 meses, F3 · 24 meses (según uso)")),
            (L("Certification", "Certificación"), L("NSF/ANSI 42, 58 and 372 (Waterdrop European sheet)", "NSF/ANSI 42, 58 y 372 (ficha europea de Waterdrop)") + " · " + pend(L("CE marking", "marcado CE"))),
            (L("Size", "Medidas"), dims_txt()), (L("Weight", "Peso"), num(KG, 1) + " kg"),
            (L("Power", "Electricidad"), L("Socket under the sink", "Enchufe bajo el fregadero") + " · " + pend(L("confirm EU 230 V version and plug", "confirmar versión europea 230 V y enchufe"))),
            (L("Colour", "Color"), color_txt(k))]
    return f'''
<section class="spx" id="specs"><div class="wrap spx-g">
  <header class="sh rv">{eyebrow(L("Spec sheet", "Ficha técnica"))}<h2 class="d2">{em(L("The details, [clear.]", "Los detalles, [claros.]"))}</h2></header>
  <dl class="spx-l rv">{"".join(f"<div><dt>{x}</dt><dd>{y}</dd></div>" for x, y in rows)}</dl>
</div></section>'''

def kit3d():
    items = KIT()
    labels = json.dumps({k: t for k, t, _, _ in items}, ensure_ascii=False).replace('"', "&quot;")
    return f'''
<section class="k3" id="kit">
  <div class="wrap k3-g">
    <header class="sh rv">{eyebrow(L("Only with NASFECO", "Solo con NASFECO"))}<h2 class="d2">{em(L("Your welcome kit. [Open your box.]", "Tu kit de bienvenida. [Abre tu caja.]"))}</h2>
      <p class="lead">{L("Included with your X12, at no extra cost: tote bag, personalized bottle, embroidered towel and two filter cartridges.", "Incluido con tu X12, sin coste adicional: bolso, botella personalizada, toalla bordada y dos cartuchos filtrantes.")}</p>
      <button type="button" class="btn b-line" data-kit-replay><span>{L("Open it again", "Abrirla otra vez")}</span><i>{ico("M4 12a8 8 0 1 0 3-6.2M4 4v4h4", 15, 1.8)}</i></button>
      <p class="fine">{L("Illustrative 3D · final finishes to be confirmed.", "3D ilustrativo · acabados finales por confirmar.")}</p></header>
    <div class="kit-3d" data-3d-kit data-mw="{a("assets/brand/mark-white.png")}" data-mc="{a("assets/brand/mark-color.png")}" data-lw="{a("assets/brand/nasfeco-es-white.png")}" data-lc="{a("assets/brand/nasfeco-es.png")}" data-labels="{labels}"><img class="kit-fb" src="{a("assets/img/welcome-kit.webp")}" alt="{L("NASFECO España welcome kit", "Kit de bienvenida NASFECO España")}" loading="lazy"></div>
  </div>
</section>'''

# ------------------------------------------------------------------ ventanas, concierge y cookies
def cfg():
    return {"wa": WA_NUM, "email": EMAIL, "lang": LANG, "privacy": page("privacy"), "zone": ZONE,
            "pend": {"wa": "[PENDIENTE: WhatsApp +34]", "email": "[PENDIENTE: correo]", "zone": "[PENDIENTE: zona de servicio]", "pay": "[PENDIENTE: formas de pago]"},
            "models": {k: {"name": m["name"], "price": money(m["price"], False, k), "promo": (money(promo_price(k), False, k) if PROMO and m["price"] else None), "cap": cap(k, False), "faucets": {FIX[k][1]: a(fix_photo(k))}, "body": FIX[k][0], "faucet": FIX[k][1]} for k, m in MODELS.items()},
            "soon": sorted(SOON), "promo": ({"name": L(*PROMO["name"]), "code": PROMO["code"], "end": PROMO["end"], "off": money(PROMO["off"], False)} if PROMO_ON else None),
            "kit": [t for _, t, _, _ in KIT()]}

def dialogs():
    x = lambda: f'<button type="button" class="dx" data-close aria-label="{L("Close", "Cerrar")}">{ico(I_X, 20, 1.6)}</button>'
    return f'''
<dialog class="dlg dlg-book" id="d-book" aria-labelledby="bk-title">{x()}
  <aside class="bk-side"><img class="bk-logo" src="{a("assets/brand/nasfeco-es-white.png")}" alt="NASFECO España" width="150" height="36"><h3>{em(L("Your home. Your details. [Your assessment.]", "Tu casa. Tus detalles. [Tu valoración.]"))}</h3>
    <div class="bk-sum"><img id="bk-img" src="{a("assets/products/x12-silver.webp")}" alt=""><div><b id="bk-model">Waterdrop X12</b><span id="bk-price">{price_now("x12", False)}</span><small>{L("VAT, standard installation and welcome kit included.", "IVA, instalación estándar y kit de bienvenida incluidos.")}</small></div></div></aside>
  <div class="bk-main"><div class="bk-prog"><span class="on"></span><span></span><span></span><b id="bk-step">01 / 03</b></div>
    <h2 class="d3" id="bk-title"></h2><p class="bk-sub" id="bk-sub"></p>
    <form id="bk-form" novalidate><div id="bk-fields"></div><p class="bk-err" id="bk-err" role="alert"></p>
      <div class="row bk-btns"><button type="button" class="btn b-line" id="bk-back"><span>{L("Back", "Atrás")}</span></button><button type="submit" class="btn b-wine" id="bk-next"><span></span><i>{ico(I_RIGHT, 15, 1.8)}</i></button></div></form></div>
</dialog>
<dialog class="dlg" id="d-info" aria-labelledby="in-title">{x()}<div id="in-body"></div></dialog>
<button type="button" class="cc-btn" data-cc aria-label="{L("Questions? Ask us", "¿Dudas? Pregúntanos")}" aria-expanded="false" aria-controls="cc">{ico(I_CHAT, 18, 1.6)}<span>{L("Questions?", "¿Dudas?")}</span></button>
<div class="cc" id="cc" hidden role="dialog" aria-label="{L("Questions? Ask us", "¿Dudas? Pregúntanos")}">
  <div class="cc-h"><img src="{a("assets/brand/mark-color.png")}" alt="" width="34" height="34"><div><small>NASFECO · Madrid</small><b>{L("How can we help?", "¿En qué te ayudamos?")}</b></div><button type="button" class="dx" data-cc-close aria-label="{L("Close", "Cerrar")}">{ico(I_X, 18, 1.6)}</button></div>
  <div class="cc-t">{"".join(f'<button type="button" data-cc-topic="{k}">{t}</button>' for k, t in [("models", L("About the X12 and X16", "Sobre el X12 y el X16")), ("gift", L("Everything that is included", "Todo lo que está incluido")), ("kitchen", L("Would it work in my kitchen?", "¿Funcionaría en mi cocina?")), ("care", L("Care after installation", "Atención después de instalar"))])}</div>
  <p class="cc-a" id="cc-a" aria-live="polite"></p>
  <div class="cc-f"><a class="btn b-wine" href="{wa(L("Hello NASFECO! I have a question about the X12 in Madrid.", "¡Hola NASFECO! Tengo una pregunta sobre el X12 en Madrid."))}" target="_blank" rel="noopener"><span>{L("Talk to a person on WhatsApp", "Hablar con una persona por WhatsApp")}</span><i>{WA}</i></a>{btn(L("Book my assessment", "Pedir mi valoración"), "data-book", "b-line")}</div>
  <small>{L("Prepared answers. For anything else, a person replies on WhatsApp.", "Respuestas preparadas. Para todo lo demás, te responde una persona por WhatsApp.")}</small>
</div>{cookie_bar()}
<script>window.NF_CFG = {json.dumps(cfg(), ensure_ascii=False)};</script>
<script src="{a("js/site.js")}?v={VER}"></script>
<script>(function(){{var go=function(){{import('./js/x3d-init.js?v={VER}');}};var idle=function(){{(window.requestIdleCallback||function(f){{setTimeout(f,200)}})(go,{{timeout:1500}});}};if(document.readyState==='complete')idle();else addEventListener('load',idle);}})();</script>
</body>
</html>'''

# ------------------------------------------------------------------ páginas legales (texto base: revisarlo con un abogado antes de publicar)
def tit(html=True):
    t = TITULAR
    return {"name": val(t["name"], "razón social", html), "nif": val(t["nif"], "NIF/CIF", html), "address": val(t["address"], "domicilio social", html),
            "registry": val(t["registry"], "datos de inscripción en el Registro Mercantil", html), "email": val(EMAIL, "correo de contacto", html)}

def LEGAL():
    T = tit()
    return {
     "legal": (L("Legal notice", "Aviso legal"), L("Legal notice of NASFECO España, under Spanish Law 34/2002 (LSSI-CE).", "Aviso legal de NASFECO España conforme a la Ley 34/2002 (LSSI-CE)."), [
        (L("Website owner", "Titular de la web"), f'<ul><li>{L("Company name", "Razón social")}: {T["name"]}</li><li>NIF/CIF: {T["nif"]}</li><li>{L("Registered address", "Domicilio")}: {T["address"]}</li><li>{L("Registration", "Inscripción registral")}: {T["registry"]}</li><li>{L("Email", "Correo")}: {T["email"]}</li><li>WhatsApp: {WA_SHOW or pend("WhatsApp +34")}</li></ul>'),
        (L("Purpose", "Objeto"), L("<p>This website presents the NASFECO service in Madrid: assessment, installation, welcome kit and follow-up for the Waterdrop reverse osmosis system. No purchases or payments are made on this website.</p>", "<p>Esta web presenta el servicio de NASFECO en Madrid: valoración, instalación, kit de bienvenida y seguimiento del sistema de ósmosis inversa Waterdrop. En esta web no se compra ni se paga nada.</p>")),
        (L("Intellectual property", "Propiedad intelectual e industrial"), L("<p>The NASFECO brand, logo and the content of this website belong to the owner. Waterdrop is a registered trademark of its manufacturer; product photos and clips are official Waterdrop material. The 3D models, the kit and team images are illustrative.</p>", "<p>La marca y el logotipo NASFECO y los contenidos de esta web pertenecen a su titular. Waterdrop es una marca registrada de su fabricante; las fotos y vídeos del producto son material oficial de Waterdrop. Los modelos 3D y las imágenes del kit y del equipo son ilustrativos.</p>")),
        (L("Liability", "Responsabilidad"), L("<p>We try to keep the information accurate and up to date. Final prices, scope and conditions are those stated in your written proposal.</p>", "<p>Procuramos que la información sea correcta y esté actualizada. El precio, el alcance y las condiciones finales son los que figuran en tu propuesta por escrito.</p>")),
        (L("Law and jurisdiction", "Ley aplicable"), L("<p>Spanish law applies. If you are a consumer, you may go to the courts of your place of residence.</p>", "<p>Se aplica la legislación española. Si eres consumidor, puedes acudir a los tribunales de tu domicilio.</p>"))]),
     "privacy": (L("Privacy policy", "Política de privacidad"), L("How NASFECO España processes your personal data (GDPR and Spanish Organic Law 3/2018).", "Cómo trata NASFECO España tus datos personales (RGPD y LOPDGDD)."), [
        (L("Data controller", "Responsable"), f'<p>{T["name"]} · NIF/CIF {T["nif"]} · {T["address"]} · {T["email"]}</p>'),
        (L("What data and where from", "Qué datos y de dónde"), L("<p>Only the data you choose to send us: name, email, phone (optional), postcode, type of home, details about your kitchen and your preferred date. This website does not store them on any server: the assessment form prepares a message that you decide whether to send by WhatsApp, or a summary you download to your device. The postcode checker works only in your browser.</p>", "<p>Solo los que tú decides enviarnos: nombre, correo, teléfono (opcional), código postal, tipo de vivienda, datos de tu cocina y fecha preferida. Esta web no los guarda en ningún servidor: el formulario de valoración prepara un mensaje que tú decides si envías por WhatsApp, o un resumen que descargas en tu dispositivo. El comprobador de código postal funciona solo en tu navegador.</p>")),
        (L("Purpose", "Finalidad"), L("<p>To answer your request, assess your kitchen, prepare your proposal and, if you hire us, carry out the installation, the follow-up and maintenance reminders.</p>", "<p>Responder a tu solicitud, valorar tu cocina, preparar tu propuesta y, si nos contratas, hacer la instalación, el seguimiento y los recordatorios de mantenimiento.</p>")),
        (L("Legal basis", "Base legal"), L("<p>Steps taken at your request before entering into a contract and, where applicable, performance of the contract (art. 6.1.b GDPR). Your consent, which you give by ticking the box in the form (art. 6.1.a GDPR) and can withdraw at any time.</p>", "<p>La aplicación de medidas precontractuales a petición tuya y, en su caso, la ejecución del contrato (art. 6.1.b RGPD). Tu consentimiento, que das al marcar la casilla del formulario (art. 6.1.a RGPD) y puedes retirar cuando quieras.</p>")),
        (L("How long we keep it", "Cuánto tiempo"), L("<p>While we handle your request and, if you hire us, for the duration of the contract and the legal periods that apply (for example, tax obligations). {P:plazo de conservación si no llegas a contratar}</p>", "<p>Mientras atendemos tu solicitud y, si nos contratas, durante el contrato y los plazos legales que correspondan (por ejemplo, obligaciones fiscales). {P:plazo de conservación si no llegas a contratar}</p>")),
        (L("Who receives it", "Destinatarios"), L("<p>We do not sell your data. If you write to us by WhatsApp, the service is provided by WhatsApp Ireland Ltd. (Meta), which may transfer data outside the EU under its own safeguards (EU–US Data Privacy Framework and standard contractual clauses). Public authorities only when required by law.</p>", "<p>No vendemos tus datos. Si nos escribes por WhatsApp, el servicio lo presta WhatsApp Ireland Ltd. (Meta), que puede transferir datos fuera de la UE con sus propias garantías (Marco de Privacidad de Datos UE-EE. UU. y cláusulas contractuales tipo). Autoridades públicas, solo cuando la ley lo exija.</p>")),
        (L("Your rights", "Tus derechos"), L(f"<p>You can access, rectify or erase your data, object to or restrict its processing, request portability and withdraw your consent, by writing to {T['email']} with a copy of your ID. If you are not satisfied, you can complain to the Spanish Data Protection Agency (<a class=\"ul\" href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener\">aepd.es</a>).</p>", f"<p>Puedes acceder, rectificar o suprimir tus datos, oponerte o limitar su tratamiento, pedir la portabilidad y retirar tu consentimiento, escribiendo a {T['email']} con una copia de tu documento de identidad. Si no quedas conforme, puedes reclamar ante la Agencia Española de Protección de Datos (<a class=\"ul\" href=\"https://www.aepd.es\" target=\"_blank\" rel=\"noopener\">aepd.es</a>).</p>")),
        (L("Analytics and cookies", "Analítica y cookies"), L(f'<p>We do not use analytics or advertising. See the <a class="ul" href="{page("cookies")}">cookie policy</a>.</p>', f'<p>No usamos analítica ni publicidad. Consulta la <a class="ul" href="{page("cookies")}">política de cookies</a>.</p>'))]),
     "cookies": (L("Cookie policy", "Política de cookies"), L("Which cookies this website uses and how to manage them.", "Qué cookies usa esta web y cómo gestionarlas."), [
        (L("Essential storage", "Almacenamiento imprescindible"), L("<p>We save your cookie choice in your browser (localStorage, key <code>nf-consent</code>) so we don't ask you again. It is exempt from consent because it is needed to respect your decision. It is not shared with anyone.</p>", "<p>Guardamos tu elección sobre cookies en tu navegador (localStorage, clave <code>nf-consent</code>) para no volver a preguntarte. Está exenta de consentimiento porque es necesaria para respetar tu decisión. No se comparte con nadie.</p>")),
        (L("Third-party cookies: YouTube", "Cookies de terceros: YouTube"), L("<p>The videos are YouTube Shorts embedded in privacy-enhanced mode (youtube-nocookie.com). Even so, YouTube (Google Ireland Ltd.) may set cookies or similar technologies when the video plays. That is why they only load if you accept; until then you see a still image stored on our website.</p>", "<p>Los vídeos son Shorts de YouTube insertados en modo de privacidad mejorada (youtube-nocookie.com). Aun así, YouTube (Google Ireland Ltd.) puede colocar cookies o tecnologías similares cuando el vídeo se reproduce. Por eso solo se cargan si aceptas; hasta entonces ves una imagen fija guardada en nuestra web.</p>")),
        (L("No analytics or advertising", "Sin analítica ni publicidad"), L("<p>We do not use analytics, advertising or social media tracking cookies. The typefaces are served from our own website.</p>", "<p>No usamos cookies de analítica, de publicidad ni de redes sociales. Las tipografías se sirven desde nuestra propia web.</p>")),
        (L("Change your choice", "Cambiar tu elección"), L('<p>You can accept or reject at any time: <button type="button" class="ul" data-cookie-settings>open cookie settings</button>. You can also delete the stored data from your browser settings.</p>', '<p>Puedes aceptar o rechazar cuando quieras: <button type="button" class="ul" data-cookie-settings>abrir la configuración de cookies</button>. También puedes borrar los datos guardados desde la configuración de tu navegador.</p>'))]),
     "terms": (L("Terms of sale", "Condiciones de contratación"), L("Conditions of the NASFECO service in Madrid: price, withdrawal, guarantee and complaints.", "Condiciones del servicio NASFECO en Madrid: precio, desistimiento, garantía y reclamaciones."), [
        (L("Provider", "Prestador"), f'<p>{T["name"]} · NIF/CIF {T["nif"]} · {T["address"]} · {T["email"]}</p>'),
        (L("What you hire", "Qué contratas"), L("<p>The Waterdrop system with its original faucet, the kitchen assessment, the standard installation, the welcome kit and the follow-up. The exact scope, any extra work and the date are confirmed in a written proposal before installing.</p>", "<p>El equipo Waterdrop con su grifo original, la valoración de tu cocina, la instalación estándar, el kit de bienvenida y el seguimiento. El alcance exacto, cualquier trabajo adicional y la fecha se confirman en una propuesta por escrito antes de instalar.</p>")),
        (L("Price and payment", "Precio y pago"), L("<p>Waterdrop X12: " + offer_txt() + ". Prices are final and include VAT (21%). Payment methods and timing: {P:formas y momento de pago}. You receive an invoice. Nothing is charged on this website.</p>", "<p>Waterdrop X12: " + offer_txt() + ". Los precios son finales e incluyen el IVA (21 %). Formas y momento de pago: {P:formas y momento de pago}. Recibes factura. En esta web no se cobra nada.</p>")),
        (L("Service area", "Zona de servicio"), f'<p>{ZONE or pend("zona de servicio y códigos postales")}</p>'),
        (L("Right of withdrawal (14 days)", "Derecho de desistimiento (14 días)"), L("<p>If you sign the contract at a distance or away from our premises, you can withdraw within 14 calendar days without giving reasons, by any clear statement (for example, an email). For the goods, the period counts from the day you receive them; for the service, from the day the contract is signed. If you expressly ask us to install within the 14 days, you will pay the proportional part of the service already provided; once the installation has been fully carried out with your express consent and your acknowledgement, you lose the right of withdrawal for the service. If you withdraw from the goods, you are only responsible for any loss in value caused by handling them beyond what is necessary to check them. We refund what you paid within 14 days of being informed. {P:formulario de desistimiento y quién paga la retirada del equipo}</p>",
                                                                                        "<p>Si contratas a distancia o fuera de nuestro establecimiento, puedes desistir en 14 días naturales sin dar explicaciones, con cualquier declaración clara (por ejemplo, un correo). Para el equipo, el plazo cuenta desde el día en que lo recibes; para el servicio, desde que firmas el contrato. Si nos pides de forma expresa instalar dentro de esos 14 días, pagas la parte proporcional del servicio ya prestado; cuando la instalación se ha hecho por completo con tu consentimiento expreso y tu reconocimiento, pierdes el derecho de desistimiento sobre el servicio. Si desistes del equipo, solo respondes de la pérdida de valor por manipularlo más de lo necesario para comprobarlo. Te devolvemos lo pagado en 14 días desde que nos lo comunicas. {P:formulario de desistimiento y quién paga la retirada del equipo}</p>")),
        (L("Legal guarantee", "Garantía legal"), L("<p>You have a 3-year legal guarantee on the goods (Spanish General Law for the Defence of Consumers and Users). As the installation is part of the contract, a lack of conformity caused by incorrect installation is also covered. Any commercial warranty from the manufacturer is added to the legal guarantee and is detailed in your proposal.</p>", "<p>Tienes 3 años de garantía legal sobre el equipo (Ley General para la Defensa de los Consumidores y Usuarios). Como la instalación forma parte del contrato, la falta de conformidad por una instalación incorrecta también está cubierta. Si el fabricante da una garantía comercial, se suma a la legal y se detalla en tu propuesta.</p>")),
        (L("Complaints", "Reclamaciones"), L(f"<p>Complaint forms are available to consumers (Community of Madrid); ask us for one or write to {T['email']}. We reply as soon as possible and within one month at the latest.</p>", f"<p>Hay hojas de reclamaciones a disposición de los consumidores (Comunidad de Madrid); pídenos una o escríbenos a {T['email']}. Te respondemos lo antes posible y, como máximo, en un mes.</p>"))]),
    }

def page_legal(key):
    title, desc, secs = LEGAL()[key]
    toc = "".join(f'<a href="#s{n}">{h}</a>' for n, (h, _) in enumerate(secs))
    body = "".join(f'<section class="lg-s" id="s{n}"><h2><i>{ROMAN[n]}</i>{h}</h2>{fill(t)}</section>' for n, (h, t) in enumerate(secs))
    return (head(f"{title} | NASFECO España", desc) + header() + f'''<main id="main" class="lg">
<div class="wrap lg-g">
  <aside class="lg-a"><p class="crumb"><a href="{page("home")}">{L("Home", "Inicio")}</a> / {title}</p><h1 class="d2">{title}</h1><p class="fine">{L("Last updated", "Última actualización")}: 13/10/2026<br>{pend(L("legal review before publishing", "revisión legal antes de publicar"))}</p><nav class="lg-toc">{toc}</nav></aside>
  <div class="lg-b">{body}</div>
</div>
</main>''' + footer() + dialogs())

# ------------------------------------------------------------------ páginas
def page_home():
    t = L("Reverse Osmosis with Installation in Madrid | Waterdrop · NASFECO", "Ósmosis inversa con instalación en Madrid | Waterdrop · NASFECO")
    d = L("Waterdrop X12 tankless reverse osmosis system, installed in your Madrid kitchen by NASFECO. Assessment, VAT and welcome kit included.",
          "Ósmosis inversa Waterdrop X12 instalada en tu cocina de Madrid por NASFECO. Valoración, IVA y kit de bienvenida incluidos.")
    return (head(t, d) + header() + rail() + '<main id="main">' + hero() + systems() + ch_why() + kit_photo() + ch_how() + team() + ch_measure() + ch_price() + faq() + closing()
            + "</main>" + footer() + dialogs())

def page_product(k):
    m = MODELS[k]
    t = L(f"Waterdrop {m['name']} Reverse Osmosis, Installed in Madrid | NASFECO", f"Waterdrop {m['name']}: ósmosis inversa instalada en Madrid | NASFECO")
    d = L(f"Waterdrop {m['name']} tankless reverse osmosis installed in Madrid by NASFECO. VAT, installation and welcome kit included. See it in 3D.",
          f"Waterdrop {m['name']}, ósmosis inversa sin depósito, instalado en Madrid por NASFECO. IVA, instalación y kit de bienvenida incluidos. Míralo en 3D.")
    return (head(t, d) + header() + '<main id="main">' + pd_hero(k) + kit3d() + gallery(k) + features(k) + pshort(k) + measure(k) + specs(k) + team(True) + faq() + closing()
            + "</main>" + footer() + dialogs())

def page_soon(k):
    # modelo en "Próximamente": su URL lleva a la franja del inicio y no aparece en buscadores
    to = page("home") + "#systems"
    return f'''<!doctype html>
<html lang="{L("en", "es-ES")}"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url={to}">
<title>Waterdrop {MODELS[k]["name"]} · {L("Coming soon", "Próximamente")} | NASFECO</title><link rel="canonical" href="{url_("home")}"></head>
<body style="background:#F7F1E7;color:#2B1A1C;font-family:system-ui,sans-serif"><p><a href="{to}" style="color:#6B0F1A">Waterdrop {MODELS[k]["name"]} · {L("Coming soon", "Próximamente")}</a></p></body></html>'''

def sitemap():
    keys = ["home"] + LIVE() + ["legal", "privacy", "cookies", "terms"]
    out = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for k in keys:
        for lang in ("es", "en"):
            out.append(f'  <url><loc>{url_(k, lang)}</loc><xhtml:link rel="alternate" hreflang="es-ES" href="{url_(k, "es")}"/><xhtml:link rel="alternate" hreflang="en" href="{url_(k, "en")}"/></url>')
    out.append("</urlset>")
    return "\n".join(out) + "\n"

if __name__ == "__main__":
    PAGES = [("home", page_home)] + [(k, (lambda k=k: page_soon(k) if k in SOON else page_product(k))) for k in MODELS] + [(k, (lambda k=k: page_legal(k))) for k in ("legal", "privacy", "cookies", "terms")]
    for LANG in ("es", "en"):
        for CUR, fn in PAGES:
            with open(os.path.join(ROOT, page()), "w", encoding="utf-8", newline="\n") as f:
                f.write(fn())
            print("ok", page())
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f: f.write(sitemap())
    with open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8", newline="\n") as f: f.write(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
    # Recursos que la web ya no usa -> _archivo/assets-sin-uso (nunca se borran)
    keep = USED | {"assets/brand/icon-180.png", "assets/x12/x12-film.mp4", "assets/x12/x12-film-poster.jpg", "assets/x12/x12-film-mo.mp4", "assets/x12/x12-film-mo-poster.jpg"}  # prototipos/
    keep |= {f"assets/products/{k}-g{i}.webp" for k in SOON for i in range(1, 5)}  # fotos del modelo en "Próximamente", para cuando se lance
    moved = 0
    for d, _, fs in os.walk(os.path.join(ROOT, "assets")):
        for fn in fs:
            rel = os.path.relpath(os.path.join(d, fn), ROOT).replace(os.sep, "/")
            if rel not in keep:
                dst = os.path.join(ROOT, "_archivo", "assets-sin-uso", os.path.relpath(rel, "assets"))
                os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.move(os.path.join(ROOT, rel), dst); moved += 1
    for d, ds, fs in os.walk(os.path.join(ROOT, "assets"), topdown=False):
        if not os.listdir(d): os.rmdir(d)
    print(len(USED), "recursos en uso ·", moved, "movidos a _archivo/assets-sin-uso")
