# Guía de mantenimiento y evolución

## 1. Arquitectura simple

```text
index.html → js/main.js → EditorCartel
                              ├─ campos.js        (configuración)
                              ├─ verticales.js     (colores y encabezados)
                              ├─ ConfiguracionURL (parámetro de acceso)
                              ├─ AjustadorTexto   (ajuste de letras)
                              └─ GestorBorradores (persistencia JSON)
```

Se separa el **qué editar** (lista de campos), **cómo se ve** (CSS y SVG), **cómo se calcula** (ajustador) y **cómo se guarda** (borradores). El editor conecta estas partes.

## 2. ¿Cómo agregar o mover campos?

En `js/configuracion/campos.js` hay 19 objetos. Ejemplo:

```javascript
{
  "id": "resumen",
  "nombre": "Resumen",
  "tipo": "contenido",
  "x": 1.6,
  "y": 15.6,
  "ancho": 42.8,
  "alto": 6.4,
  "minPt": 12,
  "maxPt": 36
}
```

Los porcentajes representan la posición respecto a toda la plantilla: `x/y` indican el extremo izquierdo/superior; `ancho/alto`, el tamaño. Para un campo nuevo hay que añadir su objeto y procurar que la zona esté realmente vacía en la plantilla. **No cambies IDs existentes**: se utilizan al guardar y recuperar borradores de generaciones anteriores.

## 3. ¿Cómo funciona el ajuste automático de letra?

1. `EditorCartel` actualiza el texto del cuadro y de una copia invisible destinada a impresión.
2. `AjustadorTexto` calcula la proporción entre la vista en Chrome y el ancho original del SVG.
3. Busca por división en dos la mayor fuente, entre `minPt` y `maxPt`, que cabe sin desbordar según `scrollHeight/scrollWidth`.
4. Muestra la fuente en pantalla y almacena el tamaño en puntos para el PDF.
5. Si ni la fuente mínima cabe, el campo aparece con una alerta roja y la impresión muestra una confirmación.

Este método utiliza medidas del navegador; **no es un sistema de maquetación tipográfica perfecta**. Verifica el PDF cuando cambie el navegador, la plantilla o las fuentes.

## 4. Compatibilidad y distribución

Se usan `<script defer>` clásicos para que `index.html` funcione al abrirlo desde una carpeta en Windows. Se evita `import`/`export`, compiladores, librerías y servidores. También puede alojarse tal cual en un sitio web institucional.

Es recomendable compartir a cada generación una copia del ZIP y conservar otra copia institucional de referencia. Para conservar el avance del alumno, guardar el PDF final y, si se requiere una función de respaldo independiente, agregar una exportación controlada de datos.

## 5. Pruebas mínimas antes de publicar una nueva versión

- Abre `index.html?vertical=ingenieria` (disco local o servidor) en Chrome; revisa que aparezcan logotipos, títulos y los 19 campos.
- Escribe en `Campus`, `Título`, `Resumen` y `Resultados y Discusión`.
- Comprueba que el tamaño de texto cambie sin perder contenido, y que `+` y `−` funcionan.
- Prueba las seis URLs `?vertical=...` y verifica que se actualicen el nombre y los ocho encabezados. Sin parámetro se debe mostrar un error visible, sin imprimir.
- Imprime con destino **Guardar como PDF**; verifica una página de 900 × 1200 mm y sin recortes.
- Pega un texto muy largo y comprueba el aviso de exceso de contenido.

## 6. Catálogo de verticales

El archivo `js/configuracion/verticales.js` contiene el diccionario de seis verticales y las posiciones de las ocho barras de título. `EditorCartel` lee este diccionario y modifica `--color-vertical` sobre `#cartel`. El CSS pinta todos los encabezados mediante esa variable y oculta visualmente los títulos fijos de `plantilla.svg`. Si se rediseña el SVG, revisar las coordenadas para evitar duplicados.

## 7. Siguientes mejoras posibles

- Crear un selector de ediciones del foro con plantillas independientes.
- Añadir exportación directa a PDF desde un servidor institucional si se requieren mismas fuentes y tamaño exacto en todos los equipos.
- Añadir pruebas automatizadas de regresión visual con Playwright, sin hacer que la aplicación dependa de él.

## 8. Selección de vertical a través de la URL (sin controles en pantalla)

`ConfiguracionURL.js` obtiene la clave del parámetro `vertical` y confirma que exista en `VERTICALES`. El constructor de `EditorCartel` la conserva en `this.vertical`; `aplicarVertical()` únicamente actualiza el texto y la variable CSS. No existe control `<select>` ni evento `change`. El método `cargarDatos()` restaura textos, pero nunca cambia la vertical.

Para probar una vertical: `index.html?vertical=diseno`. Las claves válidas están en el `README.md`. Si el sistema institucional genera el enlace, debe crear esta URL desde la vertical correspondiente del estudiante y **no** confiar en el parámetro como una validación de permisos: cualquiera podría editar la URL manualmente. Para restringir verticales, validar contra la información del estudiante en el servidor.

`GestorBorradores` utiliza una clave de almacenamiento distinta por vertical. Esto evita mezclas entre verticales en un mismo navegador, pero no entre diferentes alumnos de una misma vertical.
