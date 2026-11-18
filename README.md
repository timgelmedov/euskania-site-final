# Euskania — sitio web

Exportación estática del sitio de Framer. Desplegado en Vercel desde este
repositorio: cada push a `main` publica en **https://euskania.es**.

Framer se usa solo como origen del export (ZIP). **No se publica desde Framer.**

## Estructura

```
index.html            portada
contact/index.html    formulario de contacto
404/index.html        página de error (404.html es la copia que usa Vercel)
img/                  fotografías propias que sustituyen a las de stock
js/lead-form.js       envío del formulario a Web3Forms
js/framer/            módulos JS de Framer, servidos desde aquí y no desde su CDN
robots.txt, sitemap.xml
vercel.json           cleanUrls + cache de /img
```

## Formulario de contacto

Las formularios nativos de Framer solo funcionan en el hosting de Framer: el
`<form>` exportado no tiene `action` y al enviarlo no pasa nada. `js/lead-form.js`
intercepta el submit y manda el lead a Web3Forms. Si se cambian los campos del
formulario en Framer, hay que revisar los selectores de `readLead()`.

## Cambios aplicados al export (hay que repetirlos tras cada export nuevo)

El ZIP que sale de Framer no se puede subir tal cual. Esto es lo que se le hace:

1. **Idioma.** `<html lang="en">` → `lang="es"` en las cuatro páginas. Además, el
   runtime lo reescribe al hidratar, así que en `js/framer/script_main.*.mjs` la
   lista de locales pasa de `` code:`en` `` a `` code:`es` ``.
2. **Dominio.** `canonical` relativo → absoluto a `https://euskania.es`. Todas las
   apariciones de `aqua-experiment-823833.framer.app` (incluido `siteCanonicalURL`
   en `script_main`) → `https://euskania.es`.
3. **Barra de edición de Framer.** El export trae un `<div id="__framer-editorbar-container">`
   y un `<iframe id="__framer-editorbar">` que carga `framer.com/edit`. Se borran del
   HTML, se quita el `modulepreload` de `framer.com/edit/init.mjs` y en `script_main`
   se pone `EditorBar:void 0`, porque si no el runtime la vuelve a crear.
4. **Módulos JS locales.** Los 17 `.mjs` se descargan desde
   `framerusercontent.com/sites/5VMB6kCsTJrMxYnsd5TwGx/` a `js/framer/` y en el HTML
   se reescriben las URLs a `/js/framer/…`. Los imports entre módulos son relativos,
   así que siguen funcionando. Esto es lo que permite editar el contenido que el
   runtime genera en cliente.
5. **Carrusel «Del montaje al mantenimiento».** La diapositiva
   *Proyectos y cálculos a medida* se elimina del array de slides en
   `js/framer/-6xHlvkpZ7-….mjs` (aparece una vez por breakpoint). Euskania no presta
   ese servicio. El texto de ese carrusel **no está en el HTML**, solo en ese módulo.
6. **Fotografías propias.** Las imágenes de stock generadas por IA se sustituyen por
   fotos reales de la empresa. Hay que cambiarlas **en el HTML y en los módulos**
   `js/framer/-6xHlvkpZ7-….mjs` y `js/framer/toplevel-deps.….mjs`: si solo se toca el
   HTML, el runtime vuelve a pintar la de stock al hidratar.

   | Imagen de stock | Sustituida por |
   | --- | --- |
   | `OG4xOmgWHupxm4osVRKhY17r82Q.jpg` robot amarillo | `/img/solarcleano-m1-limpieza-paneles.jpg` |
   | `HPXEA5xCJni1R7k6yD5rPRZcCbg.png` robot negro | `/img/limpieza-robotizada-cubierta-industrial.jpg` |
   | `ZDQTSgPGNxZiYNu6Exvda7fd24s.jpg` robot naranja | `/img/modulos-sucios-limpieza.jpg` |
   | `rZHBE7NR7EEGGrfthPwZc2vDBQ.jpg` operario al atardecer | `/img/montaje-paneles-cubierta-industrial.jpg` |
   | `ZwcTpmaV5uQODbhEfQbJAptkM.jpg` manos con tableta | `/img/inversor-y-baterias.jpg` |
   | `7W0wTflDjUGfLwi6jIKQ35R450.png` marquesina | `/img/marquesina-fotovoltaica.jpg` |

   Se reemplaza la URL base, de modo que todas las variantes del `srcset` apuntan al
   mismo archivo. Conviene revisar también el texto alternativo, que describía la foto
   antigua.

7. **robots.txt y sitemap.xml**, que el export no incluye.


## Euskarazko bertsioa (/eu/)

La versión en euskera se **genera**, no se edita a mano. Todo lo que hay en
`eu/` y en `js/framer-eu/` sale de un script.

```bash
node scripts/extract-strings.mjs     # busca cadenas traducibles -> i18n/eu.json
node scripts/apply-translations.mjs  # vuelca scripts/translations-eu.mjs en la tabla
node scripts/build-eu.mjs            # genera eu/ y js/framer-eu/
```

Tras un export nuevo de Framer hay que ejecutar los tres, en ese orden.

**Por qué hace falta todo esto.** El runtime de Framer vuelve a pintar la
página desde los módulos, así que traducir solo el HTML no sirve: se revierte
al hidratar. Y al revés, los títulos que Framer parte en un `<span>` por
palabra se quedan con el marcado del servidor y no se repintan. Por eso el
script traduce **las dos capas**: los módulos y el HTML, incluidos esos
títulos partidos (`replaceSplitText`).

Qué más hace `build-eu.mjs`:

- quita la sección «Instalaciones recientes», que en euskera no se publica
- apunta el HTML a `js/framer-eu/` en vez de `js/framer/`
- deja el router dentro de `/eu` y marca el locale como `eu`
- traduce title y description, tanto en el `<head>` como en los módulos de
  metadatos que el router usa al navegar
- inyecta `hreflang` y el selector de idioma en las dos versiones
- regenera `sitemap.xml`

Es idempotente: se puede ejecutar las veces que haga falta.

### Traducción

`scripts/translations-eu.mjs` es la fuente. Un hablante puede revisarlo sin
tocar nada más. Euskara Batua, registro zuka, el estándar de uso comercial en
Bilbao.

Las entradas sin traducir no rompen nada: el build las salta y deja el
castellano. `SKIP` lista lo que se deja a propósito (nombres de propiedades
de Framer, unidades, marcas).

**`REVIEW` en ese mismo archivo recoge 10 términos que debería confirmar un
hablante nativo** (autoconsumo, cubierta, marquesina, legalización…). No son
palabras inventadas sino elecciones entre variantes aceptadas, pero nadie del
equipo las ha validado todavía.

Los textos legales (privacidad, cookies, aviso legal) **no se traducen
automáticamente**. Hoy son enlaces vacíos; cuando existan, los redacta una
persona.

## Pendiente

- El resto de imágenes (unas 20) y las fuentes siguen sirviéndose desde
  `framerusercontent.com`. El sitio depende de ese CDN para la parte visual.
- En «Instalaciones recientes» quedan de stock las tarjetas Villa privada, Caserío y
  Hotel en la costa, con descripciones de obras que no corresponden a proyectos reales.
- Las seis ilustraciones de la sección «Soluciones» siguen siendo de stock.
- Los iconos de la página de contacto se cargan desde `framer.com/m/phosphor-icons/`.
- En euskera faltan por revisar los 10 términos de `REVIEW`, y la sección
  «Instalaciones recientes» sigue publicada en castellano con descripciones de
  obras que no corresponden a proyectos reales.
