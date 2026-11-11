# Editor de Carteles UVM · 25.º Foro de Investigación

Aplicación web _serverless_ diseñada para que futuros alumnos y docentes puedan rellenar el cartel, ajustar texto y guardarlo como PDF desde un navegador web a través de una plantilla intercambiable. Conserva la plantilla y sus **19 campos editables**.

Esta aplicación fue generada mediante CHATGPT, y editada manualmente para corregir algunas funcionalidades e inconsistencias en el código fuente. La documentación del presente archivo también se generó mediante CHATGPT.

## Organización del código

```text
Cartel_UVM_Verticales/
├── index.html                         # Interfaz, sin lógica de aplicación
├── css/
│   └── estilos.css                    # Pantalla y reglas de impresión
├── js/
│   ├── configuracion/
│   │   ├── campos.js                  # Posición, nombre y fuente de cada campo
│   │   ├── verticales.js               # Diccionario de colores y encabezados
│   │   └── ConfiguracionURL.js         # Lee y valida ?vertical=...
│   ├── servicios/
│   │   ├── AjustadorTexto.js           # Calcula la mayor fuente que cabe
│   │   └── GestorBorradores.js         # Conserva datos por vertical en un navegador web
│   ├── componentes/
│   │   └── EditorCartel.js             # Organiza los campos y los botones
│   └── main.js                         # Inicia la aplicación
├── recursos/
│   └── plantilla.svg                   # Diseño original: no modificar sin respaldo
└── documentacion/
    └── MANTENIMIENTO.md                # Guía para futuros desarrolladores
```

## Clases principales

| Clase | Para qué sirve |
| --- | --- |
| `EditorCartel` | Genera los campos, recibe texto, controla zoom y exportación. |
| `AjustadorTexto` | Busca por tamaño (puntos) la mayor fuente que cabe en cada área. |
| `GestorBorradores` | Guarda y recupera datos temporalmente desde el navegador. |

El proyecto usa JavaScript estándar en archivos separados, **sin módulos ES**, porque los módulos suelen necesitar un servidor local cuando se abren desde `file://`. El espacio global se limita a `window.CartelUVM`.

## Cambios comunes

- **Nombre/ubicación de un campo:** `js/configuracion/campos.js`.
- **Color de botones / interfaz:** `css/estilos.css`.
- **Tamaño de fuente mínimo/máximo:** propiedades `minPt` y `maxPt` de ese campo en `campos.js`.
- **Reglas para medir el texto:** `js/servicios/AjustadorTexto.js`.
- **Guardado temporal:** `js/servicios/GestorBorradores.js`.
- **Colores de las verticales:** `js/configuracion/verticales.js`.
- **Diseño institucional de fondo:** `recursos/plantilla.svg`. Los cambios de imagen requieren comprobar las coordenadas.

## Precauciones

- No abras solo `index.html` dentro del ZIP: **extrae toda la carpeta** para que pueda encontrar los archivos `.css`, `.js` y `.svg`.
- La recuperación automática se intenta mediante `localStorage` y depende de la configuración del navegador; **no sustituye una copia final en PDF**.
- Evita cambiar el nombre de las propiedades `id` ya que identifican los datos de los borradores.
- No necesitas instalar Node.js, paquetes, extensiones ni Adobe Acrobat.
- Prueba siempre la exportación en un navegador web como Chrome o Safari, incluso después de cambios visuales pequeños.


## Nuevas verticales académicas
La URL determina la vertical automáticamente. Su nombre y su color se actualizan
encima de la plantilla SVG original y en los ocho encabezados del cartel.
Los colores y las posiciones se configuran en `js/configuracion/verticales.js`.
El color se propaga con la variable CSS `--color-vertical`.

## Enlaces de las verticales

Usa exactamente una de estas claves en la URL:

- `?vertical=sociales`
- `?vertical=diseno`
- `?vertical=ingenieria`
- `?vertical=negocios`
- `?vertical=salud`
- `?vertical=hospitalidad`

Un parámetro ausente o desconocido detiene la edición y muestra un mensaje claro en la página; **no** se asigna otra vertical por accidente.

La vertical se obtiene una sola vez al abrir la página. Cambiarla requiere abrir otro enlace. Los borradores locales se mantienen separados por vertical, pero no se separan por estudiante; si comparten computadora y navegador, las personas de una misma vertical podrían ver el mismo borrador. Si se requiere identidad por alumno, será necesario añadir autenticación/identificadores y un backend.

En un navegador web, para imprimir conserva la opción **Gráficos de fondo**.
