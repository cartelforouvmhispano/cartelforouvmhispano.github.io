/*
 * GESTOR DE IMÁGENES — Etapa 2, Carteles UVM
 * Hasta 4 figuras por sección; cuadrícula automática y posición configurable.
 * IndexedDB conserva figuras por vertical (compatible con registros de Etapa 1).
 */
(function () {
  'use strict';
  const app = window.CartelUVM;
  const TIPOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const MAX_ARCHIVO = 12 * 1024 * 1024;
  const MAX_POR_SECCION = 4;
  const SECCIONES = app.CAMPOS.filter(c => c.tipo === 'contenido');
  const DB_NOMBRE = 'UVM_Imagenes_Cartel_v1';
  const STORE = 'imagenes';

  class GestorImagenes {
    constructor(editor) {
      this.editor = editor;
      // Map<idCampo, { distribucion, porcentaje, imagenes: [], galeria }>
      this.imagenes = new Map();
      this.seleccion = SECCIONES[0]?.id || null;
      this.imagenSeleccionada = null;
      this.clave = `vertical:${editor.vertical || 'general'}:imagen:`;
      this.db = null;
      this.tareas = new Map();
      this.panel = document.getElementById('panel-imagenes');
      this.estado = document.getElementById('imagen-estado');
    }

    async iniciar() {
      if (!this.panel) return;
      const $ = id => document.getElementById(id);
      this.selector = $('imagen-seccion');
      this.lista = $('imagen-elemento');
      this.distribucion = $('imagen-distribucion');
      this.tamano = $('imagen-tamano');
      this.tamanoValor = $('imagen-tamano-valor');
      this.pie = $('imagen-pie');
      this.archivo = $('imagen-archivo');
      this.contador = $('imagen-contador');
      this.eliminar = $('imagen-eliminar');
      this.arriba = $('imagen-subir');
      this.abajo = $('imagen-bajar');
      this.elegir = $('imagen-elegir');

      this.selector.replaceChildren();
      for (const campo of SECCIONES) {
        const opcion = document.createElement('option');
        opcion.value = campo.id;
        opcion.textContent = campo.nombre;
        this.selector.append(opcion);
      }
      this.selector.value = this.seleccion;

      $('agregar-imagen').addEventListener('click', () => {
        if (this.panel.hidden) this.mostrarPanel(); else this.ocultarPanel();
      });
      $('imagen-cerrar').addEventListener('click', () => this.ocultarPanel());
      this.elegir.addEventListener('click', () => this.archivo.click());
      this.archivo.addEventListener('change', async () => {
        const archivos = [...(this.archivo.files || [])];
        this.archivo.value = '';
        for (const archivo of archivos) await this.agregarArchivo(this.seleccion, archivo);
      });
      this.selector.addEventListener('change', () => {
        this.seleccion = this.selector.value;
        this.imagenSeleccionada = null;
        this.sincronizarPanel();
      });
      this.lista.addEventListener('change', () => {
        this.imagenSeleccionada = this.lista.value;
        this.sincronizarPanel();
        this.destacarSeleccionada();
      });
      this.distribucion.addEventListener('change', () => this.cambiarConfiguracion());
      this.tamano.addEventListener('input', () => {
        this.tamanoValor.textContent = `${this.tamano.value}%`;
        this.cambiarConfiguracion();
      });
      this.pie.addEventListener('input', () => this.cambiarPie());
      this.eliminar.addEventListener('click', () => this.borrarImagen(this.seleccion, this.imagenSeleccionada));
      this.arriba.addEventListener('click', () => this.moverImagen(-1));
      this.abajo.addEventListener('click', () => this.moverImagen(1));

      for (const campo of SECCIONES) {
        const item = this.editor.elementos.get(campo.id);
        if (!item) continue;
        item.editable.addEventListener('focus', () => {
          this.seleccion = campo.id;
          this.imagenSeleccionada = null;
          this.sincronizarPanel();
        });
        item.editable.addEventListener('paste', async evento => {
          const dato = [...(evento.clipboardData?.items || [])].find(
            x => x.kind === 'file' && x.type.startsWith('image/')
          );
          if (!dato) return;
          evento.preventDefault();
          const archivo = dato.getAsFile();
          if (archivo) await this.agregarArchivo(campo.id, archivo);
        });
        item.editable.addEventListener('dragover', evento => {
          if ([...(evento.dataTransfer?.types || [])].includes('Files')) evento.preventDefault();
        });
        item.editable.addEventListener('drop', async evento => {
          const archivo = [...(evento.dataTransfer?.files || [])].find(f => f.type.startsWith('image/'));
          if (!archivo) return;
          evento.preventDefault();
          await this.agregarArchivo(campo.id, archivo);
        });
      }

      this.sincronizarPanel();
      try {
        this.db = await this.abrirBase();
        await this.recuperarImagenes();
        this.informar('Las imágenes se guardan en este navegador.');
      } catch (error) {
        console.warn('No se pudo usar IndexedDB:', error);
        this.informar('El navegador no permite guardar imágenes; podrían perderse al cerrar.', true);
      }
    }

    nuevaSeccion(idCampo) {
      let item = this.imagenes.get(idCampo);
      if (!item) {
        const galeria = document.createElement('div');
        galeria.className = 'galeria-cartel';
        galeria.hidden = true;
        galeria.setAttribute('aria-label', `Imágenes de ${this.nombreSeccion(idCampo)}`);
        this.editor.cartel.append(galeria);
        item = { imagenes: [], distribucion: 'derecha', porcentaje: 40, galeria };
        this.imagenes.set(idCampo, item);
      }
      return item;
    }

    nombreSeccion(idCampo) {
      return SECCIONES.find(c => c.id === idCampo)?.nombre || idCampo;
    }

    informar(mensaje, error = false) {
      if (!this.estado) return;
      this.estado.textContent = mensaje;
      this.estado.classList.toggle('mensaje-advertencia', Boolean(error));
    }

    mostrarPanel(idCampo) {
      if (idCampo && SECCIONES.some(c => c.id === idCampo)) this.seleccion = idCampo;
      this.panel.hidden = false;
      const area = document.querySelector('.area-trabajo');
      area?.classList.add('panel-abierto');
      document.getElementById('agregar-imagen')?.setAttribute('aria-expanded', 'true');
      this.sincronizarPanel();
      this.editor.actualizarAncho();
    }

    ocultarPanel() {
      this.panel.hidden = true;
      document.querySelector('.area-trabajo')?.classList.remove('panel-abierto');
      document.getElementById('agregar-imagen')?.setAttribute('aria-expanded', 'false');
      this.editor.actualizarAncho();
    }

    sincronizarPanel() {
      if (!this.selector) return;
      this.selector.value = this.seleccion;
      const seccion = this.imagenes.get(this.seleccion);
      const imagenes = seccion?.imagenes || [];
      if (!imagenes.some(imagen => imagen.id === this.imagenSeleccionada)) {
        this.imagenSeleccionada = imagenes[imagenes.length - 1]?.id || null;
      }
      const indice = imagenes.findIndex(imagen => imagen.id === this.imagenSeleccionada);
      this.lista.replaceChildren();
      for (const [i, imagen] of imagenes.entries()) {
        const opcion = document.createElement('option');
        opcion.value = imagen.id;
        opcion.textContent = `Figura ${i + 1} · ${imagen.nombre.slice(0, 32)}`;
        this.lista.append(opcion);
      }
      this.lista.value = this.imagenSeleccionada || '';
      this.lista.disabled = !imagenes.length;
      const imagen = imagenes[indice];
      this.pie.value = imagen?.pie || '';
      this.pie.disabled = !imagen;
      this.eliminar.disabled = !imagen;
      this.arriba.disabled = indice <= 0;
      this.abajo.disabled = indice < 0 || indice === imagenes.length - 1;
      this.distribucion.disabled = !imagenes.length;
      this.tamano.disabled = !imagenes.length;
      this.distribucion.value = seccion?.distribucion || 'derecha';
      this.tamano.value = String(seccion?.porcentaje || 40);
      this.tamanoValor.textContent = `${this.tamano.value}%`;
      this.contador.textContent = `${imagenes.length} de ${MAX_POR_SECCION} imágenes`;
      this.elegir.disabled = imagenes.length >= MAX_POR_SECCION;
      this.elegir.textContent = imagenes.length ? '＋ Agregar otra imagen' : '＋ Seleccionar imagen';
      this.destacarSeleccionada();
    }

    destacarSeleccionada() {
      for (const seccion of this.imagenes.values()) {
        for (const imagen of seccion.imagenes) {
          imagen.figura.classList.toggle('figura-seleccionada',
            seccion === this.imagenes.get(this.seleccion) && imagen.id === this.imagenSeleccionada && !this.panel.hidden
          );
        }
      }
    }

    async agregarArchivo(idCampo, archivo) {
      if (!SECCIONES.some(c => c.id === idCampo)) return;
      if (!TIPOS.has(archivo.type)) {
        this.informar('Utiliza imágenes JPG, PNG o WebP.', true);
        return;
      }
      if (archivo.size > MAX_ARCHIVO) {
        this.informar('El archivo supera 12 MB; comprímelo antes de agregarlo.', true);
        return;
      }
      const seccion = this.nuevaSeccion(idCampo);
      if (seccion.imagenes.length >= MAX_POR_SECCION) {
        this.mostrarPanel(idCampo);
        this.informar('Máximo cuatro imágenes por sección. Elimina alguna antes de añadir otra.', true);
        return;
      }
      const imagen = this.crearImagen(idCampo, archivo, { nombre: archivo.name || 'Imagen pegada', pie: '' });
      seccion.imagenes.push(imagen);
      this.seleccion = idCampo;
      this.imagenSeleccionada = imagen.id;
      this.mostrarPanel(idCampo);
      this.editor.ajustarTodos();
      await this.persistir(idCampo);
      this.informar('Imagen agregada. Puedes organizar las figuras y cambiar la distribución.');
    }

    crearImagen(idCampo, blob, datos) {
      const uid = datos.id || (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      const url = URL.createObjectURL(blob);
      const figura = document.createElement('figure');
      figura.className = 'figura-cartel';
      figura.tabIndex = 0;
      figura.setAttribute('role', 'button');
      figura.setAttribute('aria-label', `Editar figura de ${this.nombreSeccion(idCampo)}`);
      figura.title = 'Haz clic para modificar esta figura';
      const imagen = document.createElement('img');
      imagen.src = url;
      imagen.alt = datos.pie || `Imagen de ${this.nombreSeccion(idCampo)}`;
      imagen.draggable = false;
      const leyenda = document.createElement('figcaption');
      leyenda.textContent = datos.pie || '';
      leyenda.hidden = !(datos.pie || '').trim();
      figura.append(imagen, leyenda);
      figura.addEventListener('click', () => this.seleccionarImagen(idCampo, uid));
      figura.addEventListener('keydown', evento => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault();
          this.seleccionarImagen(idCampo, uid);
        }
      });
      imagen.addEventListener('load', () => {
        if (this.seleccion === idCampo && this.imagenSeleccionada === uid) this.revisarResolucion();
      });
      imagen.addEventListener('error', () => this.informar('Una imagen no se pudo mostrar.', true));
      return {
        id: uid, blob, url, figura, imagen, leyenda,
        pie: String(datos.pie || '').slice(0, 220),
        nombre: String(datos.nombre || 'Imagen')
      };
    }

    seleccionarImagen(idCampo, idImagen) {
      this.seleccion = idCampo;
      this.imagenSeleccionada = idImagen;
      this.mostrarPanel(idCampo);
      this.revisarResolucion();
    }

    cambiarConfiguracion() {
      const seccion = this.imagenes.get(this.seleccion);
      if (!seccion?.imagenes.length) return;
      seccion.distribucion = ['derecha', 'izquierda', 'abajo'].includes(this.distribucion.value)
        ? this.distribucion.value : 'derecha';
      seccion.porcentaje = Math.max(25, Math.min(65, Number(this.tamano.value) || 40));
      this.editor.ajustarTodos();
      this.revisarResolucion();
      this.guardarDespues(this.seleccion);
    }

    cambiarPie() {
      const imagen = this.obtenerSeleccionada();
      if (!imagen) return;
      imagen.pie = this.pie.value.slice(0, 220);
      imagen.leyenda.textContent = imagen.pie;
      imagen.leyenda.hidden = !imagen.pie.trim();
      imagen.imagen.alt = imagen.pie || `Imagen de ${this.nombreSeccion(this.seleccion)}`;
      this.guardarDespues(this.seleccion);
    }

    obtenerSeleccionada() {
      const seccion = this.imagenes.get(this.seleccion);
      return seccion?.imagenes.find(imagen => imagen.id === this.imagenSeleccionada) || null;
    }

    moverImagen(direccion) {
      const seccion = this.imagenes.get(this.seleccion);
      if (!seccion) return;
      const i = seccion.imagenes.findIndex(imagen => imagen.id === this.imagenSeleccionada);
      const j = i + direccion;
      if (i < 0 || j < 0 || j >= seccion.imagenes.length) return;
      [seccion.imagenes[i], seccion.imagenes[j]] = [seccion.imagenes[j], seccion.imagenes[i]];
      this.editor.ajustarTodos();
      this.sincronizarPanel();
      this.guardarDespues(this.seleccion);
    }

    async borrarImagen(idCampo, idImagen) {
      const seccion = this.imagenes.get(idCampo);
      if (!seccion) return;
      const indice = seccion.imagenes.findIndex(imagen => imagen.id === idImagen);
      if (indice < 0) return;
      const [imagen] = seccion.imagenes.splice(indice, 1);
      imagen.figura.remove();
      URL.revokeObjectURL(imagen.url);
      this.imagenSeleccionada = seccion.imagenes[Math.min(indice, seccion.imagenes.length - 1)]?.id || null;
      clearTimeout(this.tareas.get(idCampo));
      this.editor.ajustarTodos();
      this.sincronizarPanel();
      await this.persistir(idCampo);
      this.informar('Figura eliminada de la sección.');
    }

    async borrarTodas() {
      for (const [idCampo, seccion] of this.imagenes) {
        clearTimeout(this.tareas.get(idCampo));
        for (const imagen of seccion.imagenes) {
          imagen.figura.remove();
          URL.revokeObjectURL(imagen.url);
        }
        seccion.imagenes = [];
        await this.persistir(idCampo);
      }
      this.imagenSeleccionada = null;
      this.editor.ajustarTodos();
      this.sincronizarPanel();
    }

    distribuir() {
      for (const campo of SECCIONES) {
        const elementos = this.editor.elementos.get(campo.id);
        if (!elementos) continue;
        const geometria = { ...campo };
        const seccion = this.imagenes.get(campo.id);
        if (seccion) {
          const galeria = seccion.galeria;
          galeria.replaceChildren(...seccion.imagenes.map(img => img.figura));
          galeria.hidden = seccion.imagenes.length === 0;
          if (seccion.imagenes.length) {
            const p = seccion.porcentaje / 100;
            let imagenGeo;
            if (seccion.distribucion === 'izquierda') {
              const parte = campo.ancho * p;
              imagenGeo = { x: campo.x, y: campo.y, ancho: parte - 0.35, alto: campo.alto };
              geometria.x = campo.x + parte + 0.35;
              geometria.ancho = campo.ancho - parte - 0.35;
            } else if (seccion.distribucion === 'abajo') {
              const parte = campo.alto * p;
              imagenGeo = { x: campo.x, y: campo.y + campo.alto - parte + 0.18, ancho: campo.ancho, alto: parte - 0.18 };
              geometria.alto = campo.alto - parte - 0.18;
            } else {
              const parte = campo.ancho * p;
              imagenGeo = { x: campo.x + campo.ancho - parte + 0.35, y: campo.y, ancho: parte - 0.35, alto: campo.alto };
              geometria.ancho = campo.ancho - parte - 0.35;
            }
            for (const [nombre, valor] of Object.entries(imagenGeo)) {
              const propiedad = { x: 'left', y: 'top', ancho: 'width', alto: 'height' }[nombre];
              galeria.style[propiedad] = `${valor}%`;
            }
            const n = seccion.imagenes.length;
            const columnas = n === 1 ? 1 : (seccion.distribucion === 'abajo' || n >= 3 ? 2 : 1);
            galeria.style.gridTemplateColumns = `repeat(${columnas}, minmax(0, 1fr))`;
            galeria.style.gridTemplateRows = `repeat(${Math.ceil(n / columnas)}, minmax(0, 1fr))`;
          }
        }
        Object.assign(elementos.campo, geometria);
        for (const nodo of [elementos.editable, elementos.impresion]) {
          nodo.style.left = `${geometria.x}%`;
          nodo.style.top = `${geometria.y}%`;
          nodo.style.width = `${geometria.ancho}%`;
          nodo.style.height = `${geometria.alto}%`;
        }
      }
    }

    revisarResolucion() {
      const imagen = this.obtenerSeleccionada();
      const seccion = this.imagenes.get(this.seleccion);
      if (!imagen?.imagen.naturalWidth || !seccion) return;
      const columnas = seccion.imagenes.length === 1 ? 1 :
        (seccion.distribucion === 'abajo' || seccion.imagenes.length >= 3 ? 2 : 1);
      const anchoPctCartel = parseFloat(seccion.galeria.style.width) / columnas;
      const pulgadas = (900 / 25.4) * anchoPctCartel / 100;
      const ppi = imagen.imagen.naturalWidth / Math.max(pulgadas, 0.01);
      if (ppi < 100) this.informar(`Aviso: esta figura tendrá aproximadamente ${Math.round(ppi)} ppp al imprimir; podría verse borrosa.`, true);
      else this.informar(`Calidad estimada: ${Math.round(ppi)} ppp al tamaño de impresión.`);
    }

    obtenerElementosImagen() {
      return [...this.imagenes.values()].flatMap(seccion => seccion.imagenes.map(item => item.imagen));
    }

    guardarDespues(idCampo) {
      clearTimeout(this.tareas.get(idCampo));
      this.tareas.set(idCampo, setTimeout(() => this.persistir(idCampo), 350));
    }

    async abrirBase() {
      return new Promise((resolver, rechazar) => {
        if (!('indexedDB' in window)) return rechazar(Error('IndexedDB no disponible'));
        const peticion = indexedDB.open(DB_NOMBRE, 1);
        peticion.onupgradeneeded = () => {
          if (!peticion.result.objectStoreNames.contains(STORE))
            peticion.result.createObjectStore(STORE, { keyPath: 'id' });
        };
        peticion.onsuccess = () => resolver(peticion.result);
        peticion.onerror = () => rechazar(peticion.error);
        peticion.onblocked = () => rechazar(Error('Base de imágenes bloqueada'));
      });
    }

    operar(modo, ejecutor) {
      if (!this.db) return Promise.resolve();
      return new Promise((resolver, rechazar) => {
        const tx = this.db.transaction(STORE, modo);
        let solicitud;
        try { solicitud = ejecutor(tx.objectStore(STORE)); }
        catch (error) { rechazar(error); return; }
        tx.oncomplete = () => resolver(solicitud?.result);
        tx.onerror = () => rechazar(tx.error);
        tx.onabort = () => rechazar(tx.error);
      });
    }

    async recuperarImagenes() {
      const filas = await this.operar('readonly', store => store.getAll());
      for (const fila of filas || []) {
        if (!fila.id?.startsWith(this.clave)) continue;
        const idCampo = fila.id.slice(this.clave.length);
        if (!SECCIONES.some(c => c.id === idCampo)) continue;
        const seccion = this.nuevaSeccion(idCampo);
        seccion.distribucion = ['derecha', 'izquierda', 'abajo'].includes(fila.distribucion)
          ? fila.distribucion : 'derecha';
        seccion.porcentaje = Math.max(25, Math.min(65, Number(fila.porcentaje) || 40));
        // Migración desde etapa 1: un registro antiguo llevaba un único blob.
        const datos = Array.isArray(fila.imagenes) ? fila.imagenes :
          (fila.blob instanceof Blob ? [{ blob: fila.blob, nombre: fila.nombre, pie: fila.pie }] : []);
        for (const dato of datos.slice(0, MAX_POR_SECCION)) {
          if (!(dato.blob instanceof Blob)) continue;
          seccion.imagenes.push(this.crearImagen(idCampo, dato.blob, dato));
        }
      }
      this.editor.ajustarTodos();
      this.sincronizarPanel();
    }

    async persistir(idCampo) {
      if (!this.db) return;
      const seccion = this.imagenes.get(idCampo);
      const id = this.clave + idCampo;
      try {
        if (!seccion?.imagenes.length) {
          await this.operar('readwrite', store => store.delete(id));
          return;
        }
        await this.operar('readwrite', store => store.put({
          id, distribucion: seccion.distribucion, porcentaje: seccion.porcentaje,
          imagenes: seccion.imagenes.map(imagen => ({
            id: imagen.id, blob: imagen.blob, nombre: imagen.nombre, pie: imagen.pie
          }))
        }));
      } catch (error) {
        console.error('No se guardaron las imágenes:', error);
        this.informar('No fue posible guardar las imágenes en este navegador.', true);
      }
    }
  }

  app.GestorImagenes = GestorImagenes;
}());
