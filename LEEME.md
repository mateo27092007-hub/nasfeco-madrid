# NASFECO España · Madrid

Web de la experiencia Waterdrop X12 con el servicio NASFECO en Madrid. Español de España como idioma principal (`index.html`) e inglés como segundo (`en.html`).
Tiene identidad propia de España. La web de Miami (`Escritorio\Miami Web`) y `PROMPT-ESPANA.md` solo sirvieron de guía de contenido y funciones. **No está publicada.**

## Identidad de España (distinta de Miami y de Ecuador)
- Colores del logo de España: crema `#F7F1E7`, granate `#6B0F1A`, dorado `#C9A15B`. Tema claro (Miami es azul noche y oscuro).
- Tipografía: **Archivo** (Omnibus-Type), una sola familia; titulares en negrita y algo ensanchados. Sin cursivas ni números romanos. Se sirve desde `assets/fonts/` (sin llamar a Google).
- Motivo madrileño: **arcos** como los de los soportales de la Plaza Mayor (portada, equipo, kit, Shorts, cierre).
- **50/50: lo que vendemos y lo que damos.** Portada: "Agua de ósmosis en tu cocina. Con todo el servicio NASFECO." y dos tarjetas unidas por un "+": **Lo que compras** (Waterdrop X12) y **Lo que te damos** (servicio NASFECO: diagnóstico, instalación, kit y seguimiento), con la línea "Waterdrop X12 + servicio NASFECO = un solo precio, IVA incluido".
- **Estructura propia: una guía de preguntas.** Portada con el comprobador "¿Llegamos a tu casa?" y un índice. Luego, 8 capítulos, cada uno con su pregunta y una "respuesta corta":
  01 ¿Qué me vendéis exactamente? (X12) · 02 ¿Por qué comprarlo con NASFECO? (4 pilares + tabla "por tu cuenta / con NASFECO") · 03 ¿Qué me llevo además del equipo? (kit) · 04 ¿Cómo son el diagnóstico y la instalación? · 05 ¿Quién viene a casa? · 06 ¿Cabe en mi cocina? · 07 ¿Cuánto cuesta? · 08 ¿Alguna otra duda?
  En pantallas anchas, un índice lateral marca el capítulo que se está leyendo. Capítulos: `CHAPTERS()`; pilares: `PILLARS()` en el generador.- Página del X12: portada con 3D y precio · kit en 3D (justo después) · fotos · lo que hace · short · ¿cabe? · ficha · equipo · preguntas.
## Vista previa en GitHub Pages (para enseñarla)
- Enlace: https://mateo27092007-hub.github.io/nasfeco-madrid/ · repositorio público: https://github.com/mateo27092007-hub/nasfeco-madrid
- Es solo una vista previa (con `noindex`); el lanzamiento real será en Cloudflare con el dominio de España.
- Para actualizarla después de un cambio: `python _build/build_madrid.py`, luego `git add -A`, `git commit -m "..."` y `git push`. Tarda 1 o 2 minutos en verse.

## Ver la página en local
Doble clic en `ABRIR-PAGINA.bat`, o `python _build/serve.py` y abrir http://127.0.0.1:8765. Solo se ve en esta computadora.

## Dónde se cambia cada cosa
- **Todo (textos, precios, modelos, contacto, datos legales):** `_build/build_madrid.py`. Las páginas HTML no se editan a mano. Después: `python _build/build_madrid.py`.
  - Contacto: `WA_NUM`, `WA_SHOW`, `PHONE`, `EMAIL`. Titular (aviso legal y privacidad): `TITULAR`. Zona: `ZONE`. Dominio: `SITE`.
  - Precios: `MODELS[...]["price"]` = precio normal en euros con IVA e instalación (X12: 2539 → "2.539 €"). Oferta: `PROMO` (−300 € hasta el 30/11/2026). Capacidad: `MODELS[...]["liters"]` en L/día.
  - Modelos en "Próximamente": `SOON` (ahora `{"x16"}`). Oferta de lanzamiento: `PROMO` (ahora −300 € hasta el 30/11/2026, provisional).
  - Textos bilingües: `L("english", "español")`. Un dato que falta se escribe `{P:qué falta}` y en la página sale como **[PENDIENTE: qué falta]** en amarillo.
- **Diseño:** `css/madrid.css` (propio de España; el CSS y el fondo vivo de Miami están en `_archivo/miami-diseno`).
- **Comportamiento:** `js/site.js` (valoración, kit, comprobador de código postal, botón de dudas, cookies, Shorts). 3D: `js/x3d.js`, `js/x3d-init.js`, `js/x3d-scenes.js`.
- Si cambias CSS o JS, sube `VER` en el generador.
- **Imágenes de España** (originales del cliente en la raíz, no se publican): `python _build/prep_assets.py` crea el logo claro para fondo oscuro, el símbolo, el favicon, `og.jpg`, `welcome-kit.webp` (kit de Madrid) y `tecnico.webp` (equipo con uniforme).

## Páginas
Inicio · X12 · X16 (redirige al inicio mientras esté en "Próximamente", con `noindex`) · Aviso legal · Privacidad · Cookies · Condiciones de contratación. Cada una en español (`x12.html`, `aviso-legal.html`…) e inglés (`x12-en.html`, `legal-notice.html`…).

## España: qué cambia respecto a Miami
- Euros con IVA (21 %) incluido, solo sistema métrico (cm, kg), coma decimal. Medidas y peso de la **ficha europea** de Waterdrop: 46,2 × 15,9 × 42,5 cm, 17,5 kg.
- Formulario: código postal de 5 dígitos que empieza por 28, casilla de privacidad **sin marcar**, fecha en dd/mm/aaaa.
- Cookies: banner con "Rechazar" y "Aceptar" iguales. Los Shorts se cargan desde `youtube-nocookie.com` y **solo si se acepta**; antes se ve la portada guardada en `assets/img/yt/`. La letra se sirve desde la propia web (no se llama a Google).
- Sin reseñas (no hay reseñas reales de España). Sin oferta (la de Miami no se copia).
- `noindex` en todas las páginas (meta + cabecera en `_headers`) hasta autorizar el lanzamiento.

## PENDIENTE — datos que tiene que dar NASFECO (no publicar sin ellos)
1. **Dominio** (¿`nasfeco.es`?). Ahora está puesto `nasfeco.es` como provisional en `SITE` y `wrangler.jsonc`.
2. **WhatsApp y teléfono de España (+34)** y **correo de contacto**. Mientras falten, los botones de WhatsApp abren WhatsApp sin destinatario.
3. **Razón social, NIF/CIF, domicilio e inscripción registral** (aviso legal, privacidad y condiciones).
4. **Modelos que se venden en Madrid**: ¿solo el X12, con el X16 en "Próximamente", como en Miami?
5. (Resuelto 13/10/2026) X12: precio normal **2.539 €**, IVA e instalación incluidos. Incluye los regalos del kit y dos cartuchos filtrantes.
6. **Zona de servicio**: ¿Madrid capital o toda la Comunidad? ¿Qué códigos postales?
7. **Oferta de lanzamiento: −300 € → 2.239 €.** Fecha de fin **provisional: 30/11/2026** (`PROMO` en el generador): confirmarla. Al pasar la fecha, la web vuelve sola a 2.539 €. Ojo legal (directiva Ómnibus): el precio tachado debe ser el más bajo aplicado en los 30 días anteriores; revisarlo antes de publicar.
8. **Idiomas**: confirmar español de España principal + inglés.
9. **Capacidad en L/día**: la ficha europea solo da 1200 GPD; falta la equivalencia oficial del fabricante.
10. **Marcado CE y versión europea (230 V, enchufe europeo)** del X12 que se venda: la ficha europea no lo indica. La ficha europea sí muestra NSF/ANSI 42, 58 y 372.
11. **Formas y momento de pago.** · **Diagnóstico del agua:** qué se mide (p. ej. TDS, dureza) y cómo.
12. **Plazo de conservación de datos** si el cliente no llega a contratar; **formulario de desistimiento** y quién paga la retirada del equipo si desiste.
13. **Revisión legal** del aviso legal, la privacidad, las cookies y las condiciones antes de publicar (los textos son una base, no asesoría jurídica).
14. (Resuelto: ya no se usa la cocina de Miami; la portada muestra el X12 en 3D dentro de un arco.)
15. **Shorts**: revisar que ninguno enseñe a instalar el equipo uno mismo (por título no lo parece). Uno muestra precios en dólares.

## Publicar (Cloudflare) — solo cuando NASFECO lo autorice
Proyecto **nuevo** `nasfeco-madrid` (en `wrangler.jsonc`). **Nunca** publicar encima de `nasfeco-miami`. `npx wrangler deploy`.
Al lanzar: `INDEX = True` en el generador, borrar `_headers`, regenerar y publicar.
`_build/`, `_archivo/`, `prototipos/`, los originales del cliente y `PROMPT-ESPANA.md` no se publican (`.assetsignore`).
Lo que la web ya no usa está en `_archivo/` (logos de Miami, cocina X16, páginas viejas de Miami).
