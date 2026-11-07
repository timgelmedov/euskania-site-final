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
6. **Fotografías propias.** Las dos imágenes de stock de robots generadas por IA se
   sustituyen por fotos reales de la empresa:
   `OG4xOmgWHupxm4osVRKhY17r82Q.jpg` → `/img/solarcleano-m1-limpieza-paneles.jpg`
   `HPXEA5xCJni1R7k6yD5rPRZcCbg.png` → `/img/limpieza-robotizada-cubierta-industrial.jpg`
   Se reemplaza la URL base y los `srcset` resuelven al mismo archivo.
7. **robots.txt y sitemap.xml**, que el export no incluye.

## Pendiente

- El resto de imágenes (unas 26) y las fuentes siguen sirviéndose desde
  `framerusercontent.com`. El sitio depende de ese CDN para la parte visual.
- Varias fotos de la sección «Instalaciones recientes» siguen siendo de stock, con
  textos de proyectos que no corresponden a obras reales.
- Los iconos de la página de contacto se cargan desde `framer.com/m/phosphor-icons/`.
