/* Inicia la aplicación después de leer el parámetro obligatorio de la URL. */
(function () {
  'use strict';
  try {
    if (userAgentString.indexOf("Safari") > -1) {
      window.location.href="/safari-not-supported.html";
    }
    const editor = new window.CartelUVM.EditorCartel();
    editor.iniciar();

    if (!localStorage.getItem("notFirstTime")){
      // Detecta si es la primera vez que el usuario accede a la aplicación, en cuyo caso manda el mensaje de bienvenida.
      Swal.fire({
	title: "Te damos la bienvenida al generador de Carteles UVM Hispano",
	html: `Puedes editar tu cartel dando click en el cuadro de texto de cada sección. También puedes agregar imágenes dando click al botón "+ Imágenes".<br><br>Tus cambios se guardarán en tu navegador web, por lo que podrás continuar con tu progreso más tarde siempre y cuando accedas desde el mismo navegador.<br><br>Cuando termines, podrás guardar tu cartel dando click al botón "Descargar PDF".`,
	icon: "info"
      })
      localStorage.setItem("notFirstTime", true);
    }
    if (window.screen.width < 768){
      // Manda el aviso si detecta que se accedió desde un celular.
      Swal.fire({
	title: "Se ha detectado que accediste a la aplicación desde un dispositivo móvil",
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
