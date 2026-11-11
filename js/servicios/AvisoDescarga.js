/*
 * Mensaje de seguimiento del Foro de Investigacion UVM.
 * Se muestra solo cuando html2pdf termina su llamada a .save() sin lanzar error.
 * El navegador no comunica si el usuario guardo el archivo fisicamente:
 * por eso el mensaje indica que la descarga se INICIO, no que se completo.
 *
 * Para cambiar el enlace del formulario edita FORMULARIO_URL.
 * Para cambiar el texto edita el contenido de `html` en Swal.fire().
 */
(function () {
  'use strict';
  const app = window.CartelUVM = window.CartelUVM || {};
  const FORMULARIO_URL =
    'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=' +
    'OIIr_ImSX0Kxt7JwA9cR8-Tw9sdd5HhMpdu9YHUJoK5UQ1lBWFBTV1I2UjlSWEFRWFU4R1NaS1VVRS4u';

  function mostrarAviso() {
    // Respaldo para conexiones sin acceso al CDN de SweetAlert2.
    if (!window.Swal || typeof window.Swal.fire !== 'function') {
      const abrir = window.confirm(
        'Se inició la descarga de tu cartel en PDF.\n\n' +
        'Para continuar con el 25.º Foro de Investigación UVM, ' +
        'puedes completar el formulario correspondiente.\n\n' +
        '¿Quieres abrir el formulario ahora?'
      );
      if (abrir) window.open(FORMULARIO_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    // El enlace HTML permite abrir el formulario incluso si el navegador
    // bloquea la apertura de pestanas desde el boton de confirmacion.
    window.Swal.fire({
      icon: 'success',
      title: '¡Tu cartel esta listo!',
      html: `
        <p>Se ha iniciado la descarga de tu cartel en formato PDF.</p>
        <p>Para continuar con el proceso del <strong>25.º Foro de Investigación UVM</strong>,
        te invitamos a registrarte y subir tu cartel en el siguiente formulario.</p>
        <p><a href="${FORMULARIO_URL}" target="_blank" rel="noopener noreferrer">
        Abrir formulario de Microsoft Forms</a></p>
        <p style="font-size:.85em;color:#64748b">Conserva tu PDF para consultarlo cuando lo necesites.</p>
      `,
      confirmButtonText: 'Ir al formulario',
      confirmButtonColor: '#b61526',
      showCancelButton: true,
      cancelButtonText: 'Ahora no',
      showCloseButton: true,
      reverseButtons: true,
      // Se ejecuta al pulsar el boton, para abrir la pagina mediante
      // una interaccion directa del usuario (evita mas bloqueos de ventanas).
      preConfirm: () => {
        window.open(FORMULARIO_URL, '_blank', 'noopener,noreferrer');
      }
    });
  }

  app.AvisoDescarga = Object.freeze({ mostrar: mostrarAviso, url: FORMULARIO_URL });
}());
