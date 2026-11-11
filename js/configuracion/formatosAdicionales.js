/* Formatos adicionales basados en los PDF oficiales:
 * MULTIDISCIPLINARIO (amarillo) y LICENCIATURA EJECUTIVA (gris).
 * Se añaden a las seis verticales anteriores sin alterar sus definiciones.
 */
(function () {
  'use strict';
  const app = window.CartelUVM = window.CartelUVM || {};
  const extras = {
    multidisciplinario: {
      texto: 'MULTIDISCIPLINARIO', color: '#E1D211',
      plantilla: 'recursos/plantilla-multidisciplinario.svg'
    },
    licenciatura_ejecutiva: {
      texto: 'LICENCIATURA\\nEJECUTIVA'.replace('\\n', '\n'),
      color: '#737373',
      plantilla: 'recursos/plantilla-licenciatura_ejecutiva.svg'
    }
  };
  app.FORMATOS_ADICIONALES = Object.freeze(extras);
  app.VERTICALES = Object.freeze({ ...(app.VERTICALES || {}), ...extras });

  function normalizar(valor) {
    return String(valor || '').trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }
  const alias = {
    multidisciplinario: 'multidisciplinario',
    multidisciplinaria: 'multidisciplinario',
    licenciatura_ejecutiva: 'licenciatura_ejecutiva',
    ejecutiva: 'licenciatura_ejecutiva'
  };
  const params = new URLSearchParams(window.location.search);
  const seleccionado = normalizar(params.get('vertical') || params.get('formato'));
  const especial = alias[seleccionado] || null;
  app.FORMATO_ESPECIAL_ACTUAL = especial;

  // Conserva la validación y las reglas originales para las demás verticales.
  if (app.ConfiguracionURL && typeof app.ConfiguracionURL.obtenerVertical === 'function') {
    const obtenerOriginal = app.ConfiguracionURL.obtenerVertical;
    app.ConfiguracionURL.obtenerVertical = function () {
      return especial || obtenerOriginal.apply(this, arguments);
    };
  }

  if (!especial) return;

  // Ajustes de posiciones medidos en las plantillas PDF (2550.96 x 3401.04).
  // No se cambian las coordenadas de las verticales anteriores.
  const caja = {
    campus:         { x:39.00, y:1.22, ancho:34.5, alto:0.80 },
    ciclo:          { x:39.00, y:2.08, ancho:34.5, alto:0.80 },
    modalidad:      { x:39.00, y:2.94, ancho:34.5, alto:0.80 },
    carrera:        { x:39.00, y:3.80, ancho:34.5, alto:0.80 },
    ods:            { x:39.00, y:4.66, ancho:34.5, alto:0.80 },
    palabras_clave: { x:39.00, y:5.52, ancho:34.5, alto:0.80 },
    autores:        { x:39.00, y:6.38, ancho:34.5, alto:0.80 },
    asesor:         { x:39.00, y:7.24, ancho:34.5, alto:0.80 },
    madurez:        { x:39.00, y:8.10, ancho:34.5, alto:0.80 },
    titulo:         { x:22.35, y:10.70, ancho:54.50, alto:1.58 },
    seccion_1:      { x:2.15, y:15.72, ancho:43.13, alto:6.50 },
    seccion_2:      { x:2.15, y:26.15, ancho:43.13, alto:13.18 },
    seccion_3:      { x:2.15, y:43.00, ancho:43.13, alto:6.55 },
    seccion_4:      { x:2.15, y:53.26, ancho:43.13, alto:10.07 },
    seccion_5:      { x:48.52, y:15.72, ancho:49.19, alto:47.60 },
    seccion_6:      { x:2.15, y:67.50, ancho:43.13, alto:21.92 },
    seccion_7:      { x:48.52, y:67.50, ancho:49.19, alto:21.92 },
    seccion_8:      { x:2.15, y:92.96, ancho:74.42, alto:5.79 },
    id_cartel:      { x:85.30, y:92.80, ancho:12.20, alto:1.26 }
  };
  app.CAMPOS = Object.freeze(app.CAMPOS.map(c => Object.freeze({ ...c, ...(caja[c.id] || {}) })));
}());
