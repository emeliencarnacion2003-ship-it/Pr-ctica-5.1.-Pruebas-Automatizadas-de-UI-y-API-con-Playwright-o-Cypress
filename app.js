// ===== Configuración =====
const URL_MENU = "menu.json";                    // archivo con los datos del menú
const CLAVE_RESERVAS = "reservas_restaurante";   // nombre con el que se guardan las reservas

// ===== Elementos de la página =====
const listaMenu = document.getElementById("menu");
const navMenu = document.getElementById("menu-principal");
const botonMenu = document.getElementById("boton-menu");
const contenido = document.getElementById("contenido");

let datos = null;          // aquí queda guardado todo el contenido de menu.json
let opcionActual = null;   // la opción del menú que se está mostrando

// ===== 1. CARGAR EL JSON =====
// fetch() pide el archivo menu.json; await espera la respuesta;
// .json() convierte el texto en un objeto de JavaScript.
async function cargarDatos() {
  try {
    const respuesta = await fetch(URL_MENU);
    if (!respuesta.ok) {
      throw new Error("Error HTTP " + respuesta.status);
    }
    datos = await respuesta.json();

    document.getElementById("nombre-sitio").textContent = datos.sitio;
    document.title = datos.sitio + " | Reservas de restaurantes";

    construirMenu(datos.menu);
    mostrarOpcion(datos.menu[0]); // muestra "Inicio" al abrir
  } catch (error) {
    console.error(error);
    contenido.innerHTML = "";
    const aviso = document.createElement("p");
    aviso.className = "aviso error";
    aviso.textContent =
      "No se pudo cargar el menú. Abre la página con un servidor local " +
      "(Live Server) y revisa que menu.json esté en la misma carpeta.";
    contenido.appendChild(aviso);
  }
}

// ===== 2. CONSTRUIR EL MENÚ DESDE LOS DATOS =====
function crearBoton(opcion) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.textContent = opcion.titulo;
  boton.addEventListener("click", () => {
    mostrarOpcion(opcion);
    navMenu.classList.remove("abierto");           // cierra el menú en celular
    botonMenu.setAttribute("aria-expanded", "false");
  });
  return boton;
}

function construirMenu(opciones) {
  listaMenu.innerHTML = "";

  opciones.forEach((opcion) => {
    const li = document.createElement("li");

    if (opcion.submenu) {
      // Opción con submenú: el título es una etiqueta y los hijos van en otra lista
      li.classList.add("tiene-submenu");

      const etiqueta = document.createElement("span");
      etiqueta.className = "etiqueta";
      etiqueta.tabIndex = 0;                       // permite llegar con el teclado
      etiqueta.textContent = opcion.titulo;
      li.appendChild(etiqueta);

      const sublista = document.createElement("ul");
      sublista.className = "submenu";
      opcion.submenu.forEach((sub) => {
        const subLi = document.createElement("li");
        subLi.appendChild(crearBoton(sub));
        sublista.appendChild(subLi);
      });
      li.appendChild(sublista);
    } else {
      li.appendChild(crearBoton(opcion));
    }

    listaMenu.appendChild(li);
  });
}

// ===== 3. MOSTRAR LA OPCIÓN ELEGIDA =====
function mostrarOpcion(opcion) {
  opcionActual = opcion;
  contenido.innerHTML = "";

  const titulo = document.createElement("h2");
  titulo.textContent = opcion.titulo;
  contenido.appendChild(titulo);

  if (opcion.tipo === "formulario") {
    mostrarFormulario();
  } else if (opcion.tipo === "reservas") {
    mostrarReservas();
  } else {
    const parrafo = document.createElement("p");
    parrafo.textContent = opcion.contenido;
    contenido.appendChild(parrafo);
  }
}

// ===== 4. GUARDAR Y LEER RESERVAS (localStorage) =====
// localStorage solo guarda texto, por eso se usa JSON.stringify (objeto -> texto)
// al guardar y JSON.parse (texto -> objeto) al leer.
function leerReservas() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_RESERVAS)) || [];
  } catch (error) {
    return [];
  }
}

function guardarReservas(lista) {
  localStorage.setItem(CLAVE_RESERVAS, JSON.stringify(lista));
}

// Fecha de hoy en formato AAAA-MM-DD (para no permitir fechas pasadas)
function fechaHoy() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

function formatoFecha(texto) {
  const [anio, mes, dia] = texto.split("-");
  return dia + "/" + mes + "/" + anio;
}

// ===== 5. FORMULARIO DE RESERVA =====
function mostrarFormulario() {
  const plantilla = document.getElementById("plantilla-formulario");
  const formulario = plantilla.content.cloneNode(true).querySelector("form");

  // Llenar el select de restaurantes con los datos del JSON
  const select = formulario.querySelector("#restaurante");
  datos.restaurantes.forEach((restaurante) => {
    const opcion = document.createElement("option");
    opcion.value = restaurante.id;
    opcion.textContent = restaurante.nombre;
    select.appendChild(opcion);
  });

  formulario.querySelector("#fecha").min = fechaHoy();
  const mensaje = formulario.querySelector("#mensaje");

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault(); // evita que la página se recargue

    const campos = new FormData(formulario);
    const restauranteElegido = datos.restaurantes.find(
      (r) => r.id === campos.get("restaurante")
    );

    const reserva = {
      id: Date.now(), // número único para poder cancelarla después
      restaurante: restauranteElegido.nombre,
      restauranteId: restauranteElegido.id,
      nombre: campos.get("nombre").trim(),
      telefono: campos.get("telefono"),
      fecha: campos.get("fecha"),
      hora: campos.get("hora"),
      personas: Number(campos.get("personas"))
    };

    // Validación 1: no se permiten fechas pasadas
    if (reserva.fecha < fechaHoy()) {
      mensaje.className = "aviso error";
      mensaje.textContent = "La fecha no puede ser anterior a hoy.";
      return;
    }

    // Validación 2: no repetir restaurante, fecha y hora
    const reservas = leerReservas();
    const repetida = reservas.some(
      (r) =>
        r.restauranteId === reserva.restauranteId &&
        r.fecha === reserva.fecha &&
        r.hora === reserva.hora
    );
    if (repetida) {
      mensaje.className = "aviso error";
      mensaje.textContent = "Ya existe una reserva en ese restaurante, fecha y hora.";
      return;
    }

    // Guardar
    reservas.push(reserva);
    guardarReservas(reservas);

    mensaje.className = "aviso exito";
    mensaje.textContent = "¡Reserva confirmada! Puedes verla en \"Mis reservas\".";
    formulario.reset();
    formulario.querySelector("#personas").value = 2;
  });

  contenido.appendChild(formulario);
}

// ===== 6. LISTA DE RESERVAS =====
function mostrarReservas() {
  const reservas = leerReservas();

  if (reservas.length === 0) {
    const vacio = document.createElement("p");
    vacio.textContent = "Todavía no tienes reservas guardadas.";
    contenido.appendChild(vacio);
    return;
  }

  // Ordenar por fecha y hora
  reservas.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  const lista = document.createElement("div");
  lista.className = "lista-reservas";

  reservas.forEach((reserva) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-reserva";

    const nombreRestaurante = document.createElement("h3");
    nombreRestaurante.textContent = reserva.restaurante;

    const detalle = document.createElement("p");
    detalle.textContent =
      formatoFecha(reserva.fecha) + " a las " + reserva.hora +
      " · " + reserva.personas + " persona(s)";

    const cliente = document.createElement("p");
    cliente.textContent = "A nombre de " + reserva.nombre + " · Tel. " + reserva.telefono;

    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.className = "btn-cancelar";
    cancelar.textContent = "Cancelar reserva";
    cancelar.addEventListener("click", () => {
      const restantes = leerReservas().filter((r) => r.id !== reserva.id);
      guardarReservas(restantes);
      mostrarOpcion(opcionActual); // vuelve a dibujar la lista
    });

    tarjeta.append(nombreRestaurante, detalle, cliente, cancelar);
    lista.appendChild(tarjeta);
  });

  contenido.appendChild(lista);
}

// ===== 7. MENÚ HAMBURGUESA (celular) =====
botonMenu.addEventListener("click", () => {
  const abierto = navMenu.classList.toggle("abierto");
  botonMenu.setAttribute("aria-expanded", String(abierto));
});

// ===== Arranque =====
cargarDatos();