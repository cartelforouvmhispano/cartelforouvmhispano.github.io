/*
 * GUARDADO LOCAL TEMPORAL
 * Los datos se separan por vertical para evitar que un cartel de Salud
 * sobrescriba el borrador de Ingeniería en el mismo navegador.
 * NO envía datos al servidor. La edición no se sincroniza entre equipos.
 */
(function () {
  'use strict';
  const app = window.CartelUVM;

  class GestorBorradores {
    constructor(vertical) {
      this.claveLocal = `cartel_uvm_foro_v3_${vertical}`;
    }

    guardarTemporal(datos) {
      try {
        localStorage.setItem(this.claveLocal, JSON.stringify(datos));
        return true;
      } catch (_) {
        return false;
      }
    }

    recuperarTemporal() {
      try {
        return JSON.parse(localStorage.getItem(this.claveLocal) || 'null');
      } catch (_) {
        return null;
      }
    }
  }

  app.GestorBorradores = GestorBorradores;
}());
