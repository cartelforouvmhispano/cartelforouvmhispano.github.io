/*
 * LECTURA Y VALIDACIÓN DE PARÁMETROS EN LA URL
 * Ejemplo: index.html?vertical=ingenieria
 * Cada clave debe existir en el diccionario de verticales.js.
 */
(function () {
  'use strict';
  const app = window.CartelUVM;

  class ConfiguracionURL {
    static obtenerVertical() {
      const parametros = new URLSearchParams(window.location.search);
      const clave = (parametros.get('vertical') || '').trim().toLowerCase();

      if (!clave) {
        throw new Error('El enlace está incompleto: falta ?vertical=ingenieria (o alguna de las otras cinco verticales).');
      }

      if (!Object.prototype.hasOwnProperty.call(app.VERTICALES, clave)) {
        throw new Error('Vertical no reconocida: "' + clave + '". Revisa el enlace que te compartieron.');
      }

      return clave;
    }
  }

  app.ConfiguracionURL = ConfiguracionURL;
}());
