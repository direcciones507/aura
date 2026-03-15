const micButton = document.getElementById("micButton");
const statusDiv = document.getElementById("status");
const transcriptDiv = document.getElementById("transcript");
const responseDiv = document.getElementById("response");
const taskListDiv = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const btnHoy = document.getElementById("btnHoy");
const btnVaciar = document.getElementById("btnVaciar");
const btnLimpiar = document.getElementById("btnLimpiar");

const STORAGE_KEY = "aura_tareas_v1";
const GREETING_KEY = "aura_ultimo_saludo_v1";

let recognition = null;
let isListening = false;

const frases = {
  saludoManana: [
    "Buenos días. ¿Qué quieres organizar hoy?",
    "Buen día. Estoy lista para ayudarte.",
    "Buenos días. Vamos paso a paso."
  ],
  saludoTarde: [
    "Buenas tardes. ¿Qué te ayudo a ordenar?",
    "Hola. Seguimos con lo pendiente.",
    "Buenas tardes. Vamos a organizar el resto del día."
  ],
  saludoNoche: [
    "Buenas noches. ¿Qué quieres dejar listo?",
    "Hola. Cerramos el día con orden.",
    "Buenas noches. Dime qué falta por resolver."
  ],
  tareaCreada: [
    "Listo, ya lo anoté.",
    "Perfecto, quedó guardado.",
    "Anotado.",
    "Bien, lo agregué."
  ],
  tareaCompletada: [
    "Bien hecho.",
    "Perfecto, una menos.",
    "Excelente, seguimos.",
    "Eso ya quedó."
  ],
  vaciarMente: [
    "Dime todo, yo lo ordeno.",
    "Estoy escuchando. Suelta todo lo pendiente.",
    "Vamos, dime qué tienes en mente."
  ],
  mostrarHoy: [
    "Aquí tienes tus pendientes.",
    "Este es tu día por ahora.",
    "Estas son las cosas que tienes anotadas."
  ],
  noEntiendo: [
    "No entendí bien. Prueba diciendo una tarea.",
    "Creo que no lo capté. Dímelo más directo.",
    "No lo tomé bien. Intenta otra vez."
  ]
};

function elegir(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function cargarTareas() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error leyendo tareas:", error);
    return [];
  }
}

function guardarTareas(tareas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
}

function hablar(texto) {
  responseDiv.textContent = `AURA: ${texto}`;
  responseDiv.classList.remove("empty-box");

  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "es-ES";
  utterance.rate = 0.96;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const vozEspanol = voices.find(v => v.lang && v.lang.toLowerCase().startsWith("es"));
  if (vozEspanol) utterance.voice = vozEspanol;

  window.speechSynthesis.speak(utterance);
}

function formatearFechaTexto(tipoFecha) {
  if (tipoFecha === "mañana") return "Mañana";
  if (tipoFecha === "hoy") return "Hoy";
  return "Sin fecha";
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTareas() {
  const tareas = cargarTareas();
  taskListDiv.innerHTML = "";

  const activas = tareas.filter(t => !t.completada).length;
  const total = tareas.length;
  taskCount.textContent = `${activas} pendiente${activas === 1 ? "" : "s"} · ${total} total`;

  if (tareas.length === 0) {
    taskListDiv.innerHTML = `
      <div class="empty-state">
        No tienes tareas todavía. Prueba diciendo:
        <br><br>
        “Recuérdame comprar leche mañana”
      </div>
    `;
    return;
  }

  tareas.forEach((tarea) => {
    const item = document.createElement("div");
    item.className = `task-item ${tarea.completada ? "done" : ""}`;

    item.innerHTML = `
      <input type="checkbox" data-id="${tarea.id}" ${tarea.completada ? "checked" : ""}>
      <div class="task-content">
        <span class="task-title">${escapeHtml(tarea.titulo)}</span>
        <span class="task-meta">${formatearFechaTexto(tarea.fecha)}</span>
      </div>
    `;

    const checkbox = item.querySelector("input");
    checkbox.addEventListener("change", () => toggleTarea(tarea.id));

    taskListDiv.appendChild(item);
  });
}

function crearTareaDesdeTexto(textoOriginal) {
  let texto = textoOriginal.trim();
  let fecha = "hoy";

  texto = texto.replace(/^aura[, ]*/i, "").trim();

  if (/mañana/i.test(texto)) {
    fecha = "mañana";
    texto = texto.replace(/mañana/gi, "").trim();
  }

  texto = texto.replace(/recu[eé]rdame/gi, "").trim();
  texto = texto.replace(/anota(r)?/gi, "").trim();
  texto = texto.replace(/agrega(r)?/gi, "").trim();
  texto = texto.replace(/tarea/gi, "").trim();
  texto = texto.replace(/\s{2,}/g, " ").trim();

  if (!texto) {
    hablar("No me dijiste qué tarea guardar.");
    return;
  }

  const tareas = cargarTareas();
  const nuevaTarea = {
    id: Date.now().toString(),
    titulo: texto.charAt(0).toUpperCase() + texto.slice(1),
    fecha,
    completada: false,
    creadaEn: new Date().toISOString()
  };

  tareas.unshift(nuevaTarea);
  guardarTareas(tareas);
  renderTareas();
  hablar(elegir(frases.tareaCreada));
}

function toggleTarea(id) {
  const tareas = cargarTareas();
  const actualizadas = tareas.map((t) =>
    t.id === id ? { ...t, completada: !t.completada } : t
  );

  guardarTareas(actualizadas);
  renderTareas();

  const tarea = actualizadas.find(t => t.id === id);
  if (tarea?.completada) {
    hablar(elegir(frases.tareaCompletada));
  }
}

function borrarTodo() {
  const confirmar = window.confirm("¿Seguro que quieres borrar todas las tareas?");
  if (!confirmar) return;

  localStorage.removeItem(STORAGE_KEY);
  renderTareas();
  hablar("Listo. Borré todas las tareas.");
}

function mostrarHoy() {
  renderTareas();

  const tareas = cargarTareas();
  const pendientes = tareas.filter(t => !t.completada);

  if (pendientes.length === 0) {
    hablar("Hoy no tienes pendientes.");
    return;
  }

  hablar(`${elegir(frases.mostrarHoy)} Tienes ${pendientes.length} pendiente${pendientes.length === 1 ? "" : "s"}.`);
}

function iniciarDescargaMental() {
  hablar(elegir(frases.vaciarMente));
}

function procesarComando(texto) {
  const t = texto.toLowerCase().trim();

  if (!t) {
    hablar(elegir(frases.noEntiendo));
    return;
  }

  if (t.includes("qué tengo hoy") || t.includes("que tengo hoy") || t.includes("mis tareas") || t.includes("pendientes")) {
    mostrarHoy();
    return;
  }

  if (t.includes("vaciar mi mente") || t.includes("tengo muchas cosas") || t.includes("mil cosas")) {
    iniciarDescargaMental();
    return;
  }

  if (t.includes("hola") || t.includes("buenos días") || t.includes("buenos dias") || t.includes("buenas tardes") || t.includes("buenas noches")) {
    hablar("Hola. Estoy aquí para ayudarte.");
    return;
  }

  if (
    t.includes("recuérdame") ||
    t.includes("recuerdame") ||
    t.includes("mañana") ||
    t.includes("anota") ||
    t.includes("agrega") ||
    t.includes("tarea")
  ) {
    crearTareaDesdeTexto(texto);
    return;
  }

  if (t.length > 3) {
    crearTareaDesdeTexto(texto);
    return;
  }

  hablar(elegir(frases.noEntiendo));
}

function saludoDelDia() {
  const hoy = new Date().toDateString();
  const ultimo = localStorage.getItem(GREETING_KEY);

  if (ultimo === hoy) return;

  const hora = new Date().getHours();
  let mensaje = "";

  if (hora < 12) {
    mensaje = elegir(frases.saludoManana);
  } else if (hora < 20) {
    mensaje = elegir(frases.saludoTarde);
  } else {
    mensaje = elegir(frases.saludoNoche);
  }

  const tareas = cargarTareas();
  const pendientes = tareas.filter(t => !t.completada).length;

  if (pendientes > 0) {
    mensaje += ` Tienes ${pendientes} pendiente${pendientes === 1 ? "" : "s"} hoy.`;
  }

  setTimeout(() => hablar(mensaje), 700);
  localStorage.setItem(GREETING_KEY, hoy);
}

function configurarReconocimiento() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    statusDiv.textContent = "Este navegador no soporta reconocimiento de voz. Usa Chrome.";
    micButton.disabled = true;
    micButton.style.opacity = "0.5";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "es-ES";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    statusDiv.textContent = "Escuchando...";
    micButton.classList.add("listening");
  };

  recognition.onend = () => {
    isListening = false;
    statusDiv.textContent = "Toca para hablar";
    micButton.classList.remove("listening");
  };

  recognition.onresult = (event) => {
    const texto = event.results[0][0].transcript;
    transcriptDiv.textContent = `Tú: "${texto}"`;
    transcriptDiv.classList.remove("empty-box");
    procesarComando(texto.trim());
  };

  recognition.onerror = (event) => {
    console.error("Error de reconocimiento:", event.error);

    if (event.error === "not-allowed") {
      statusDiv.textContent = "Micrófono bloqueado. Permítelo en el navegador.";
      hablar("No tengo permiso para usar el micrófono.");
    } else if (event.error === "no-speech") {
      statusDiv.textContent = "No escuché nada. Intenta de nuevo.";
    } else if (event.error === "audio-capture") {
      statusDiv.textContent = "No encuentro el micrófono del equipo.";
      hablar("No encuentro un micrófono disponible.");
    } else {
      statusDiv.textContent = `Error: ${event.error}`;
    }

    isListening = false;
    micButton.classList.remove("listening");
  };
}

function iniciarReconocimiento() {
  if (!recognition) {
    alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome.");
    return;
  }

  try {
    recognition.start();
  } catch (error) {
    console.error("No se pudo iniciar el micrófono:", error);
    statusDiv.textContent = "No pude iniciar el micrófono.";
  }
}

micButton.addEventListener("click", iniciarReconocimiento);
btnHoy.addEventListener("click", mostrarHoy);
btnVaciar.addEventListener("click", iniciarDescargaMental);
btnLimpiar.addEventListener("click", borrarTodo);

renderTareas();
configurarReconocimiento();
saludoDelDia();
