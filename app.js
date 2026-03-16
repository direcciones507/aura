import {
  db,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy
} from "./firebase.js";

/* ------------------ ELEMENTOS ------------------ */
const tabs = document.querySelectorAll(".tab");
const screens = document.querySelectorAll(".screen");

const statusEl = document.getElementById("status");
const mentalDump = document.getElementById("mentalDump");
const micBtn = document.getElementById("micBtn");
const saveBtn = document.getElementById("saveBtn");
const processBtn = document.getElementById("processBtn");
const processedOutput = document.getElementById("processedOutput");

const tasksList = document.getElementById("tasksList");
const historyList = document.getElementById("historyList");

const voiceReplyToggle = document.getElementById("voiceReplyToggle");
const langSelect = document.getElementById("langSelect");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

/* ------------------ CONFIG LOCAL ------------------ */
const settings = {
  voiceReply: localStorage.getItem("aura_voiceReply") !== "false",
  lang: localStorage.getItem("aura_lang") || "es-ES"
};

voiceReplyToggle.checked = settings.voiceReply;
langSelect.value = settings.lang;

voiceReplyToggle.addEventListener("change", () => {
  settings.voiceReply = voiceReplyToggle.checked;
  localStorage.setItem("aura_voiceReply", settings.voiceReply);
});

langSelect.addEventListener("change", () => {
  settings.lang = langSelect.value;
  localStorage.setItem("aura_lang", settings.lang);
});

/* ------------------ NAVEGACIÓN ------------------ */
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    screens.forEach(s => s.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.screen).classList.add("active");
  });
});

/* ------------------ VOZ ------------------ */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = settings.lang;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  micBtn.addEventListener("click", () => {
    recognition.lang = settings.lang;
    statusEl.textContent = "Estado: escuchando...";
    recognition.start();
  });

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    mentalDump.value = text;
    statusEl.textContent = `Estado: escuché "${text}"`;
    speak("Listo, ya capturé tu mensaje.");
  };

  recognition.onerror = (event) => {
    statusEl.textContent = `Error de voz: ${event.error}`;
  };

  recognition.onend = () => {
    if (statusEl.textContent === "Estado: escuchando...") {
      statusEl.textContent = "Estado: listo";
    }
  };
} else {
  statusEl.textContent = "Tu navegador no soporta reconocimiento de voz.";
  micBtn.disabled = true;
}

function speak(text) {
  if (!settings.voiceReply) return;
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = settings.lang;
  window.speechSynthesis.speak(utterance);
}

/* ------------------ PROCESAR TEXTO ------------------ */
function processMentalText(text) {
  if (!text.trim()) return [];

  const rawParts = text
    .split(/\n|,|\.| y /gi)
    .map(t => t.trim())
    .filter(Boolean);

  return rawParts.map(part => {
    let clean = part;
    clean = clean.replace(/^aura[, ]*/i, "");
    clean = clean.replace(/^mañana\s+/i, "");
    clean = clean.replace(/^recuérdame\s+/i, "");
    clean = clean.replace(/^recordarme\s+/i, "");
    clean = clean.replace(/^tengo que\s+/i, "");
    clean = clean.replace(/^debo\s+/i, "");
    clean = clean.replace(/^agrega(r)?\s+/i, "");
    clean = clean.replace(/^anota(r)?\s+/i, "");
    clean = clean.replace(/^por favor\s+/i, "");
    clean = clean.trim();

    if (!clean) return "";

    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }).filter(Boolean);
}

/* ------------------ FECHA Y HORA ------------------ */
function extractDateTime(text) {
  const now = new Date();
  let date = null;
  let time = null;

  if (/mañana/i.test(text)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    date = tomorrow.toISOString().split("T")[0];
  }

  if (/\bhoy\b/i.test(text)) {
    date = now.toISOString().split("T")[0];
  }

  const hourMatch = text.match(/a las\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);

  if (hourMatch) {
    let hour = parseInt(hourMatch[1], 10);
    const minutes = hourMatch[2] ? hourMatch[2] : "00";
    const period = hourMatch[3] ? hourMatch[3].toLowerCase() : null;

    if (period === "pm" && hour < 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;

    if (hour >= 0 && hour <= 23) {
      time = `${String(hour).padStart(2, "0")}:${minutes}`;
    }
  }

  return { date, time };
}

function buildHumanReply(taskCount, dateInfo) {
  if (taskCount > 1 && dateInfo.date && dateInfo.time) {
    return `He guardado ${taskCount} tareas para ${dateInfo.date} a las ${dateInfo.time}.`;
  }

  if (taskCount > 1 && dateInfo.date) {
    return `He guardado ${taskCount} tareas para esa fecha.`;
  }

  if (taskCount > 1) {
    return `He guardado ${taskCount} tareas.`;
  }

  if (dateInfo.date && dateInfo.time) {
    return "He guardado tu recordatorio con fecha y hora.";
  }

  if (dateInfo.date) {
    return "He guardado tu recordatorio.";
  }

  return "He guardado tu tarea.";
}

processBtn.addEventListener("click", () => {
  const text = mentalDump.value.trim();

  if (!text) {
    alert("Escribe o dicta algo primero.");
    return;
  }

  const tasks = processMentalText(text);
  const dateInfo = extractDateTime(text);

  if (!tasks.length) {
    processedOutput.classList.remove("hidden");
    processedOutput.textContent = "No pude detectar tareas.";
    return;
  }

  let preview = "Tareas detectadas:\n\n";
  preview += tasks.map((t, i) => `${i + 1}. ${t}`).join("\n");

  if (dateInfo.date || dateInfo.time) {
    preview += "\n\n";
    preview += `Fecha: ${dateInfo.date || "No detectada"}\n`;
    preview += `Hora: ${dateInfo.time || "No detectada"}`;
  }

  processedOutput.classList.remove("hidden");
  processedOutput.textContent = preview;

  speak("Ya organicé tu mensaje.");
});

/* ------------------ FIRESTORE ------------------ */
const tasksRef = collection(db, "tasks");
const historyRef = collection(db, "history");

saveBtn.addEventListener("click", async () => {
  const text = mentalDump.value.trim();

  if (!text) {
    alert("No hay nada para guardar.");
    return;
  }

  try {
    const processedTasks = processMentalText(text);
    const dateInfo = extractDateTime(text);

    if (!processedTasks.length) {
      alert("No pude detectar una tarea válida.");
      return;
    }

    for (const task of processedTasks) {
      await addDoc(tasksRef, {
        text: task,
        date: dateInfo.date || null,
        time: dateInfo.time || null,
        done: false,
        source: "voice_or_text",
        createdAt: serverTimestamp()
      });
    }

    await addDoc(historyRef, {
      text,
      type: "capture",
      taskCount: processedTasks.length,
      date: dateInfo.date || null,
      time: dateInfo.time || null,
      createdAt: serverTimestamp()
    });

    mentalDump.value = "";
    processedOutput.classList.add("hidden");
    statusEl.textContent = "Estado: tarea guardada";

    speak(buildHumanReply(processedTasks.length, dateInfo));

    await loadTasks();
    await loadHistory();
  } catch (error) {
    console.error("Error guardando en Firebase:", error);
    alert("Error guardando en Firebase.");
  }
});

async function loadTasks() {
  tasksList.innerHTML = "Cargando tareas...";

  try {
    const q = query(tasksRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      tasksList.innerHTML = "<p>No hay tareas todavía.</p>";
      return;
    }

    tasksList.innerHTML = "";

    snapshot.forEach(taskDoc => {
      const data = taskDoc.data();

      const item = document.createElement("div");
      item.className = "item";

      const extraDate = data.date ? `<small>Fecha: ${escapeHtml(data.date)}</small>` : "";
      const extraTime = data.time ? `<small>Hora: ${escapeHtml(data.time)}</small>` : "";

      item.innerHTML = `
        <div class="item-top">
          <div class="item-text">${escapeHtml(data.text || "")}</div>
        </div>
        <small>Estado: ${data.done ? "Completada" : "Pendiente"}</small>
        ${extraDate}
        ${extraTime}
        <div class="item-actions">
          <button class="complete-btn">${data.done ? "↩️ Reabrir" : "✅ Completar"}</button>
          <button class="delete-btn danger">🗑️ Eliminar</button>
        </div>
      `;

      const completeBtn = item.querySelector(".complete-btn");
      const deleteBtn = item.querySelector(".delete-btn");

      completeBtn.addEventListener("click", async () => {
        try {
          await updateDoc(doc(db, "tasks", taskDoc.id), {
            done: !data.done
          });

          await addDoc(historyRef, {
            text: `${data.done ? "Reabierta" : "Completada"}: ${data.text}`,
            type: "task_update",
            createdAt: serverTimestamp()
          });

          await loadTasks();
          await loadHistory();
        } catch (error) {
          console.error("Error actualizando tarea:", error);
        }
      });

      deleteBtn.addEventListener("click", async () => {
        try {
          await deleteDoc(doc(db, "tasks", taskDoc.id));

          await addDoc(historyRef, {
            text: `Eliminada: ${data.text}`,
            type: "task_delete",
            createdAt: serverTimestamp()
          });

          await loadTasks();
          await loadHistory();
        } catch (error) {
          console.error("Error eliminando tarea:", error);
        }
      });

      tasksList.appendChild(item);
    });
  } catch (error) {
    console.error(error);
    tasksList.innerHTML = "<p>Error cargando tareas.</p>";
  }
}

async function loadHistory() {
  historyList.innerHTML = "Cargando historial...";

  try {
    const q = query(historyRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      historyList.innerHTML = "<p>No hay historial todavía.</p>";
      return;
    }

    historyList.innerHTML = "";

    snapshot.forEach(historyDoc => {
      const data = historyDoc.data();

      const dateLine = data.date ? `<small>Fecha: ${escapeHtml(data.date)}</small>` : "";
      const timeLine = data.time ? `<small>Hora: ${escapeHtml(data.time)}</small>` : "";

      const item = document.createElement("div");
      item.className = "item";

      item.innerHTML = `
        <div class="item-text">${escapeHtml(data.text || "")}</div>
        <small>Tipo: ${escapeHtml(data.type || "general")}</small>
        ${dateLine}
        ${timeLine}
      `;

      historyList.appendChild(item);
    });
  } catch (error) {
    console.error(error);
    historyList.innerHTML = "<p>Error cargando historial.</p>";
  }
}

clearHistoryBtn.addEventListener("click", async () => {
  const ok = confirm("¿Seguro que quieres borrar el historial?");
  if (!ok) return;

  try {
    const snapshot = await getDocs(historyRef);

    const deletions = [];
    snapshot.forEach(item => {
      deletions.push(deleteDoc(doc(db, "history", item.id)));
    });

    await Promise.all(deletions);
    speak("Historial borrado.");
    await loadHistory();
  } catch (error) {
    console.error(error);
    alert("No se pudo borrar el historial.");
  }
});

/* ------------------ UTILIDAD ------------------ */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ------------------ INICIO ------------------ */
loadTasks();
loadHistory();
