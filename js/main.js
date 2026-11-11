/* Inicia la aplicación después de leer el parámetro obligatorio de la URL. */
(function () {
  'use strict';
  try {
    const editor = new window.CartelUVM.EditorCartel();
    editor.iniciar();
    if (window.screen.width < 768){
      Swal.fire({
	title: "",
	text: "Si bien es posible usar esta aplicación desde el celular, te recomendamos acceder desde una computadora para que te sea más fácil la creación de tu cartel.",
	icon: "warning"
      });
    }
  } catch (error) {
    const estado = document.getElementById('estado');
    estado.textContent = error.message;
    estado.style.color = '#b61526';
    document.getElementById('imprimir').disabled = true;
    document.getElementById('cartel').hidden = true;
    console.error(error);
  }
}());
