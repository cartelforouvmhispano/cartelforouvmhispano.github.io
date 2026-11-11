/*
 * EDITOR DEL CARTEL
 * Coordina los campos editables, el cálculo de letra, los borradores
 * y la impresión. Las reglas de campos están en configuracion/campos.js.
 */
(function () {
  'use strict';
  const app = window.CartelUVM;

  class EditorCartel {
    constructor() {
      this.cartel = document.getElementById('cartel');
      this.estado = document.getElementById('estado');
      this.nombreVertical = document.getElementById('nombre-vertical');
      // La URL es la única fuente de la vertical; el usuario no la elige aquí.
      this.vertical = app.ConfiguracionURL.obtenerVertical();
      this.ajustador = new app.AjustadorTexto(app.ANCHO_PLANTILLA);
      this.borradores = new app.GestorBorradores(this.vertical);
      this.elementos = new Map();
      this.datos = {};
      this.zoom = 1;
      this.temporizadorGuardado = null;
    }

    iniciar() {
      this.crearEncabezados();
      this.crearCampos();
      this.imagenes = new app.GestorImagenes(this);
      this.aplicarVertical(this.vertical);
      this.evitarCruceConVertical();
      this.conectarBotones();
      this.restaurarBorrador();
      this.actualizarAncho();
      this.imagenes.iniciar();
      window.addEventListener('resize', () => this.actualizarAncho());
      window.addEventListener('beforeprint', () => this.ajustarTodos());
      document.getElementById('zoom-valor').textContent = '100%';
    }

    // Crea las ocho barras temáticas; se actualizan mediante una variable CSS.
    crearEncabezados() {
      for (const encabezado of app.ENCABEZADOS) {
        const barra = document.createElement('div');
        barra.className = 'encabezado-seccion';
        barra.textContent = encabezado.texto;
        barra.style.left = `${encabezado.x}%`;
        barra.style.top = `${encabezado.y}%`;
        barra.style.width = `${encabezado.ancho}%`;
        barra.style.height = `${encabezado.alto}%`;
        this.cartel.append(barra);
      }
    }

    // El diccionario es la única fuente de verdad para nombre y color.
    aplicarVertical(clave) {
      const vertical = app.VERTICALES[clave];
      if (!vertical) return;
      this.cartel.style.setProperty('--color-vertical', vertical.color);
      this.nombreVertical.textContent = vertical.texto;
      const formato = app.FORMATOS_ADICIONALES?.[clave];
      if (formato) {
        this.cartel.dataset.formatoEspecial = clave;
        const plantilla = this.cartel.querySelector('img.plantilla');
        if (plantilla) {
          plantilla.src = formato.plantilla;
          plantilla.alt = `Formato oficial UVM: ${vertical.texto.replace(/\n/g, ' ')}`;
        }
      }
    }

    crearCampos() {
      for (const campo of app.CAMPOS) {
        const editable = document.createElement('textarea');
        editable.className = 'campo-editable';
        editable.setAttribute('aria-label', campo.nombre);
        editable.setAttribute('data-campo', campo.id);
        editable.setAttribute('spellcheck', 'true');

        const impresion = document.createElement('div');
        impresion.className = 'texto-impresion';
        impresion.setAttribute('aria-hidden', 'true');

        for (const elemento of [editable, impresion]) {
          elemento.style.left = `${campo.x}%`;
          elemento.style.top = `${campo.y}%`;
          elemento.style.width = `${campo.ancho}%`;
          elemento.style.height = `${campo.alto}%`;
        }

        editable.addEventListener('input', () => this.cambiarCampo(campo, editable.value));
        this.cartel.append(editable, impresion);
        this.elementos.set(campo.id, { editable, impresion, campo: { ...campo } });
        this.datos[campo.id] = '';
      }
    }

    cambiarCampo(campo, texto, guardar = true) {
      const elementos = this.elementos.get(campo.id);
      const normalizado = String(texto).replace(/\r\n?/g, '\n');
      this.datos[campo.id] = normalizado;
      if (elementos.editable.value !== normalizado) {
        elementos.editable.value = normalizado;
      }
      // textContent, en lugar de innerHTML, evita ejecutar etiquetas pegadas.
      elementos.impresion.textContent = normalizado;
      this.ajustarCampo(campo);
      this.actualizarEstado();
      if (guardar) this.programarGuardado();
    }

    ajustarCampo(campo) {
      const { editable, impresion, campo: geometria } = this.elementos.get(campo.id);
      return this.ajustador.ajustar(
        geometria, impresion, editable, this.cartel.getBoundingClientRect().width
      );
    }

    // Reserva espacio para la vertical sin mover los demás cuadros del cartel.
    evitarCruceConVertical() {
      const lienzo = this.cartel.getBoundingClientRect();
      const rotulo = this.nombreVertical.getBoundingClientRect();
      if (!lienzo.width || !lienzo.height) return;

      const left = (rotulo.left - lienzo.left) / lienzo.width * 100;
      const right = (rotulo.right - lienzo.left) / lienzo.width * 100;
      const top = (rotulo.top - lienzo.top) / lienzo.height * 100;
      const bottom = (rotulo.bottom - lienzo.top) / lienzo.height * 100;

      for (const original of app.CAMPOS) {
        const item = this.elementos.get(original.id);
        if (!item) continue;
        const x = Number(original.x);
        const y = Number(original.y);
        const ancho = Number(original.ancho);
        const alto = Number(original.alto);
        const coincideX = x < right && x + ancho > left;
        const coincideY = y < bottom && y + alto > top;

        let anchoNuevo = ancho;
        if (coincideX && coincideY && x < left) {
          const disponible = left - x - 0.8;
          if (disponible > 2) anchoNuevo = Math.min(ancho, disponible);
        }
        item.campo.ancho = anchoNuevo;
        item.editable.style.width = `${anchoNuevo}%`;
        item.impresion.style.width = `${anchoNuevo}%`;
      }
    }

    ajustarTodos() {
      if (this.imagenes) this.imagenes.distribuir();
      for (const campo of app.CAMPOS) this.ajustarCampo(campo);
      this.actualizarEstado();
    }

    actualizarEstado() {
      const llenos = app.CAMPOS.filter(c => this.datos[c.id].trim()).length;
      const excedidos = [...this.elementos.values()].filter(item =>
        item.editable.classList.contains('excedido')
      ).length;
      this.estado.textContent = excedidos
        ? `${llenos}/${app.CAMPOS.length} campos con texto · ${excedidos} campo(s) con exceso de contenido.`
        : `${llenos}/${app.CAMPOS.length} campos con texto · Listo para editar.`;
      this.estado.style.color = excedidos ? '#b51e29' : '';
    }

    actualizarAncho() {
      // La anchura útil cambia cuando se abre el panel lateral (sin superposición).
      const zona = document.getElementById('zona-desplazamiento');
      const anchoDisponible = zona?.clientWidth || (window.innerWidth - 50);
      const anchoPantalla = Math.max(290, Math.min(1100, anchoDisponible - 28));
      this.cartel.style.width = `${Math.round(anchoPantalla * this.zoom)}px`;
      this.evitarCruceConVertical();
      this.ajustarTodos();
    }

    cambiarZoom(pasos) {
      this.zoom = Math.min(2, Math.max(0.6, this.zoom + pasos * 0.25));
      document.getElementById('zoom-valor').textContent = `${Math.round(this.zoom * 100)}%`;
      this.actualizarAncho();
    }

    programarGuardado() {
      clearTimeout(this.temporizadorGuardado);
      this.temporizadorGuardado = setTimeout(() => {
        this.borradores.guardarTemporal(this.datos);
      }, 300);
    }

    restaurarBorrador() {
      const datos = this.borradores.recuperarTemporal();
      if (datos) this.cargarDatos(datos);
    }

    cargarDatos(datos) {
      // El borrador restaura SOLO textos; jamás puede cambiar la vertical de la URL.
      for (const campo of app.CAMPOS) {
        this.cambiarCampo(campo, typeof datos[campo.id] === 'string' ? datos[campo.id] : '', false);
      }
      this.programarGuardado();
    }

    imprimir() {
      this.ajustarTodos();
      const excedidos = [...this.elementos.values()].filter(item =>
        item.editable.classList.contains('excedido')
      );
      if (excedidos.length) {
        const continuar = confirm(`Hay ${excedidos.length} cuadro(s) con demasiado texto. ` +
          'Podrían cortarse al imprimir. ¿Deseas continuar?');
        if (!continuar) return;
      }
      window.print();
    }

    async descargarPDF() {
      this.ajustarTodos();
      const excedidos = [...this.elementos.values()].filter(
        item => item.editable.classList.contains('excedido')
      );
      if (excedidos.length && !confirm(
        `Hay ${excedidos.length} cuadro(s) con demasiado texto. ` +
        'El contenido podría cortarse en el PDF. ¿Deseas continuar?'
      )) return;

      if (typeof window.html2pdf !== 'function') {
        alert('No se cargó la biblioteca para descargar PDF. ' +
          'Comprueba tu conexión a Internet o usa el botón Imprimir.');
        return;
      }

      const boton = document.getElementById('imprimir');
      if (boton.disabled) return;
      const etiqueta = boton.textContent;
      const anchoAnterior = this.cartel.style.width;
      let descargaIniciada = false;
      boton.disabled = true;
      boton.textContent = 'Preparando PDF...';

      try {
        // Independiente del zoom visible; conserva la proporción 90 x 120 cm.
        this.cartel.style.width = '3402px';
        this.evitarCruceConVertical();
        this.ajustarTodos();
        this.cartel.classList.add('exportando-pdf');

        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        // Espera a que carguen las imágenes antes de capturar el cartel.
        if (this.imagenes) {
          await Promise.all(this.imagenes.obtenerElementosImagen().map(async imagen => {
            if (imagen.decode) {
              try { await imagen.decode(); }
              catch (error) { console.warn('No se pudo decodificar una imagen:', error); }
            }
          }));
        }
        const nombre = `Cartel_UVM_${String(this.vertical || 'general')
          .replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

        await window.html2pdf().set({
          margin: 0,
          filename: nombre,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 1.25, useCORS: true, backgroundColor: '#ffffff',
            windowWidth: 3402, scrollX: 0, scrollY: 0
          },
          jsPDF: {
            unit: 'mm', format: [900, 1200], orientation: 'portrait',
            compress: true
          }
        }).from(this.cartel).save();
        // El navegador recibió la solicitud de descarga sin errores.
        descargaIniciada = true;
      } catch (error) {
        console.error('Error al generar el cartel en PDF:', error);
        alert('No fue posible generar el PDF. Prueba el botón Imprimir.');
      } finally {
        this.cartel.classList.remove('exportando-pdf');
        this.cartel.style.width = anchoAnterior;
        this.evitarCruceConVertical();
        this.ajustarTodos();
        boton.disabled = false;
        boton.textContent = etiqueta;
      }

      // Mostrar el aviso DESPUÉS de restaurar el lienzo del editor.
      // No se muestra si el usuario canceló o si falló la generación.
      if (descargaIniciada) {
        if (app.AvisoDescarga && typeof app.AvisoDescarga.mostrar === 'function') {
          app.AvisoDescarga.mostrar();
        } else {
          console.warn('Falta el archivo js/servicios/AvisoDescarga.js');
        }
      }
    }

    conectarBotones() {
      document.getElementById('alejar').addEventListener('click', () => this.cambiarZoom(-1));
      document.getElementById('acercar').addEventListener('click', () => this.cambiarZoom(1));
      document.getElementById('limpiar').addEventListener('click', () => {
        if (confirm('¿Borrar el contenido de todos los cuadros?')) {
          this.cargarDatos({});
          if (this.imagenes) this.imagenes.borrarTodas();
        }
      });
      
      const botonPDF = document.getElementById('imprimir');
      let botonImprimir = document.getElementById('abrir-impresion');
      if (botonPDF) {
        botonPDF.textContent = 'Descargar PDF';
        if (!botonImprimir) {
          botonImprimir = document.createElement('button');
          botonImprimir.id = 'abrir-impresion';
          botonImprimir.type = 'button';
          botonImprimir.className = 'boton';
          botonImprimir.textContent = 'Imprimir';
          botonPDF.insertAdjacentElement('afterend', botonImprimir);
        }
        botonPDF.addEventListener('click', () => this.descargarPDF());
      }
      if (botonImprimir) {
        botonImprimir.addEventListener('click', () => this.imprimir());
      }
    }
  }

  app.EditorCartel = EditorCartel;
}());
