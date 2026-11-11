/*
 * CONFIGURACIÓN DE LOS 19 CAMPOS DEL CARTEL
 *
 * Coordenadas en porcentaje del cartel completo:
 *   x / y: distancia desde la izquierda y desde arriba.
 *   ancho / alto: tamaño del área editable.
 *   minPt / maxPt: límites del tamaño de letra (puntos de impresión).
 *
 * Para ajustar un cuadro cambia solamente sus valores; para cambiar
 * el funcionamiento del editor revisa js/componentes/EditorCartel.js.
 */
(function () {
  'use strict';
  const app = window.CartelUVM = window.CartelUVM || {};
  app.ANCHO_PLANTILLA = 2550.96;

  app.CAMPOS = Object.freeze([
    // DATOS GENERALES
    { id: "campus", nombre: "Campus", tipo: "cabecera", x: 36.848873, y: 0.999694, ancho: 41.552985, alto: 0.823278, minPt: 13, maxPt: 23 },
    { id: "ciclo", nombre: "Ciclo", tipo: "cabecera", x: 36.848873, y: 1.852375, ancho: 41.552985, alto: 0.823278, minPt: 13, maxPt: 23 },
    { id: "modalidad", nombre: "Modalidad", tipo: "cabecera", x: 36.848873, y: 2.705055, ancho: 41.552985, alto: 0.823278, minPt: 13, maxPt: 23 },
    { id: "carrera", nombre: "Carrera", tipo: "cabecera", x: 36.848873, y: 3.557735, ancho: 41.552985, alto: 0.823278, minPt: 13, maxPt: 23 },
    { id: "ods", nombre: "ODS", tipo: "cabecera", x: 36.848873, y: 4.410416, ancho: 41.552985, alto: 0.823278, minPt: 13, maxPt: 23 },
    { id: "palabras_clave", nombre: "Palabras clave", tipo: "cabecera", x: 36.848873, y: 5.263096, ancho: 41.552985, alto: 0.823278, minPt: 13, maxPt: 23 },
    { id: "autores", nombre: "Autores", tipo: "cabecera", x: 36.848873, y: 6.115776, ancho: 41.552985, alto: 0.823278, minPt: 13, maxPt: 23 },
    { id: "asesor", nombre: "Asesor", tipo: "cabecera", x: 36.848873, y: 6.968457, ancho: 41.552985, alto: 0.823278, minPt: 13, maxPt: 23 },
    { id: "madurez", nombre: "Nivel de madurez científica", tipo: "cabecera", x: 36.848873, y: 7.821137, ancho: 41.552985, alto: 0.823278, minPt: 13, maxPt: 23 },
    { id: "titulo", nombre: "Título del proyecto", tipo: "cabecera", x: 22.344529, y: 10.29097, ancho: 54.489291, alto: 1.764166, minPt: 16, maxPt: 43 },

    // CONTENIDO DEL CARTEL
    { id: "seccion_1", nombre: "Resumen", tipo: "contenido", x: 1.580581, y: 15.617576, ancho: 42.849751, alto: 6.400395, minPt: 12, maxPt: 36 },
    { id: "seccion_2", nombre: "Planteamiento del problema", tipo: "contenido", x: 1.914573, y: 26.047326, ancho: 45.380563, alto: 13.093642, minPt: 12, maxPt: 36 },
    { id: "seccion_3", nombre: "Objetivos y justificación", tipo: "contenido", x: 2.35676, y: 42.761037, ancho: 42.849751, alto: 6.400395, minPt: 12, maxPt: 36 },
    { id: "seccion_4", nombre: "Marco teórico", tipo: "contenido", x: 2.690752, y: 53.162561, ancho: 42.854455, alto: 9.999294, minPt: 12, maxPt: 36 },
    { id: "seccion_5", nombre: "Resultados y Discusión", tipo: "contenido", x: 49.534294, y: 15.617576, ancho: 48.955688, alto: 47.54428, minPt: 12, maxPt: 36 },
    { id: "seccion_6", nombre: "Métodos y materiales / Desarrollo", tipo: "contenido", x: 2.690752, y: 67.568743, ancho: 42.854455, alto: 21.850963, minPt: 12, maxPt: 36 },
    { id: "seccion_7", nombre: "Conclusiones / Aplicación", tipo: "contenido", x: 49.534294, y: 67.568743, ancho: 48.955688, alto: 22.895349, minPt: 12, maxPt: 36 },
    { id: "seccion_8", nombre: "Referencias (formato APA)", tipo: "contenido", x: 1.580581, y: 93.02919, ancho: 75.218742, alto: 6.400395, minPt: 12, maxPt: 36 },

    // IDENTIFICACIÓN
    { id: "id_cartel", nombre: "ID del cartel", tipo: "pie", x: 85.418824, y: 92.736338, ancho: 13.014708, alto: 1.38193, minPt: 16, maxPt: 30 },

  ].map(campo => Object.freeze(campo)));
}());
