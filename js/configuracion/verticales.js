/*
 * CATÁLOGO DE VERTICALES Y POSICIONES DE ENCABEZADOS
 * Los colores se tomaron de los PDF oficiales del Foro 25.
 * Para agregar una vertical, añade una clave aquí y úsala en ?vertical=clave.
 * Coordenadas de encabezados: porcentajes del cartel completo (2550.96 x 3401.04).
 */
(function () {
  'use strict';
  const app = window.CartelUVM = window.CartelUVM || {};

  app.VERTICALES = Object.freeze({
    sociales:     { texto: 'SOCIALES', color: '#FF33CC' },
    diseno:       { texto: 'DISEÑO, ARTE Y\nARQUITECTURA', color: '#7030A0' },
    ingenieria:   { texto: 'INGENIERÍA', color: '#ABB8D3' },
    negocios:     { texto: 'NEGOCIOS', color: '#3E670D' },
    salud:        { texto: 'SALUD', color: '#2D2DB9' },
    hospitalidad: { texto: 'HOSPITALIDAD', color: '#92D050' }
  });

  // Encabezados añadidos como HTML para tapar los encabezados negros del SVG.
  // Las dimensiones están ligeramente ampliadas para cubrir los bordes originales.
  const ANCHO = 2550.96;
  const ALTO = 3401.04;
  const encabezados = [
    ['Resumen',                            158,  426, 843, 74],
    ['Planteamiento del problema',          158,  780, 843, 86],
    ['Objetivos y justificación',           217, 1349, 785, 75],
    ['Marco teórico',                       217, 1703, 785, 79],
    ['Resultados y Discusión',             1535,  425, 771, 87],
    ['Métodos y materiales / Desarrollo',   253, 2193, 672, 75],
    ['Conclusiones / Aplicación',          1535, 2193, 764, 75],
    ['Referencias (formato APA)',            57, 3073, 745, 69]
  ];
  app.ENCABEZADOS = Object.freeze(encabezados.map(([texto, x, y, ancho, alto]) =>
    Object.freeze({ texto, x: x / ANCHO * 100, y: y / ALTO * 100,
      ancho: ancho / ANCHO * 100, alto: alto / ALTO * 100 })
  ));
}());
