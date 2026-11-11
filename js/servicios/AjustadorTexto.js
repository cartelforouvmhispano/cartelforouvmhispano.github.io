/*
 * AJUSTADOR DE TEXTO
 * Responsabilidad única: buscar la fuente más grande que cabe en un campo.
 * La prueba usa el mismo elemento que se imprimirá, evitando diferencias
 * de salto de línea entre un textarea y un párrafo.
 */
(function () {
  'use strict';
  const app = window.CartelUVM;

  class AjustadorTexto {
    constructor(anchoPlantilla) {
      this.anchoPlantilla = anchoPlantilla;
    }

    ajustar(campo, elementoTexto, elementoEditable, anchoCartel) {
      const escala = anchoCartel / this.anchoPlantilla;
      const contenido = elementoEditable.value.trim();
      let mejorTamano = campo.minPt;
      let cabe = !contenido;

      // Búsqueda binaria: más eficiente que probar 36, 35, 34... por separado.
      if (!contenido) {
        mejorTamano = campo.maxPt;
      } else {
        let inferior = campo.minPt;
        let superior = campo.maxPt;

        while (inferior <= superior) {
          const medio = Math.floor((inferior + superior) / 2);
          elementoTexto.style.fontSize = `${medio * escala}px`;
          if (this.cabeEnElCuadro(elementoTexto)) {
            mejorTamano = medio;
            cabe = true;
            inferior = medio + 1; // Intentar una fuente más grande.
          } else {
            superior = medio - 1; // La fuente no cabe: reducirla.
          }
        }
      }

      // El tamaño en pantalla se escala con el ancho del cartel.
      elementoEditable.style.fontSize = `${mejorTamano * escala}px`;
      elementoTexto.style.fontSize = `${mejorTamano * escala}px`;

      // Al imprimir, el papel se fija en 90 x 120 cm.
      elementoTexto.style.setProperty('--fuente-impresion', `${mejorTamano}pt`);
      elementoEditable.classList.toggle('excedido', !cabe);
      elementoEditable.title = !cabe
        ? `${campo.nombre}: demasiado contenido. Reduce el texto antes de imprimir.`
        : `${campo.nombre} · ${mejorTamano} pt`;
      return cabe;
    }

    cabeEnElCuadro(elemento) {
      return elemento.scrollHeight <= elemento.clientHeight + 1 &&
             elemento.scrollWidth <= elemento.clientWidth + 1;
    }
  }

  app.AjustadorTexto = AjustadorTexto;
}());
