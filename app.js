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

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = settings.lang;
  window.speechSynthesis.speak(utterance);
}

/* ------------------ PROCESAR TEXTO ------------------ */
/* Aquí dejamos un procesador local simple.
   Luego aquí mismo conectamos OpenAI por backend seguro. */
function processMentalText(text) {
  if (!text.trim()) return [];

  const rawParts = text
    .split(/\n|,|\.| y /gi)
    .map(t => t.trim())
    .filter(Boolean);

  return rawParts.map(part => {
    let clean = part;
    clean = clean.replace(/^mañana\s+/i, "");
    clean = clean.replace(/^recuérdame\s+/i, "");
    clean = clean.replace(/^tengo que\s+/i, "");
    clean = clean.replace(/^debo\s+/i, "");
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  });
}

processBtn.addEventListener("click", () => {
  const text = mentalDump.value.trim();

  if (!text) {
    alert("Escribe o dicta algo primero.");
    return;
  }

  const tasks = processMentalText(text);

  if (!tasks.length) {
    processedOutput.classList.remove("hidden");
    processedOutput.textContent = "No pude detectar tareas.";
    return;
  }

  processedOutput.classList.remove("hidden");
  processedOutput.textContent =
    "Tareas detectadas:\n\n" + tasks.map((t, i) => `${i + 1}. ${t}`).join("\n");

  speak("Ya organicé tu descarga mental.");
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

    if (processedTasks.length > 1) {
      for (const task of processedTasks) {
        await addDoc(tasksRef, {
          text: task,
          done: false,
          source: "voice_or_text",
          createdAt: serverTimestamp()
        });
      }
    } else {
      await addDoc(tasksRef, {
        text,
        done: false,
        source: "voice_or_text",
        createdAt: serverTimestamp()
      });
    }

    await addDoc(historyRef, {
      text,
      type: "capture",
      createdAt: serverTimestamp()
    });

    mentalDump.value = "";
    processedOutput.classList.add("hidden");
    statusEl.textContent = "Estado: tarea guardada";
    speak("Tu tarea fue guardada.");

    await loadTasks();
    await loadHistory();
  } catch (error) {
    console.error(error);
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

      item.innerHTML = `
        <div class="item-top">
          <div class="item-text">${escapeHtml(data.text || "")}</div>
        </div>
        <small>Estado: ${data.done ? "Completada" : "Pendiente"}</small>
        <div class="item-actions">
          <button class="complete-btn">${data.done ? "↩️ Reabrir" : "✅ Completar"}</button>
          <button class="delete-btn danger">🗑️ Eliminar</button>
        </div>
      `;

      const completeBtn = item.querySelector(".complete-btn");
      const deleteBtn = item.querySelector(".delete-btn");

      completeBtn.addEventListener("click", async () => {
        await updateDoc(doc(db, "tasks", taskDoc.id), {
          done: !data.done
        });

        await addDoc(historyRef, {
          text: `${data.done ? "Reabierta" : "Completada"}: ${data.text}`,
          type: "task_update",
          createdAt: serverTimestamp()
        });

        loadTasks();
        loadHistory();
      });

      deleteBtn.addEventListener("click", async () => {
        await deleteDoc(doc(db, "tasks", taskDoc.id));

        await addDoc(historyRef, {
          text: `Eliminada: ${data.text}`,
          type: "task_delete",
          createdAt: serverTimestamp()
        });

        loadTasks();
        loadHistory();
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

      const item = document.createElement("div");
      item.className = "item";

      item.innerHTML = `
        <div class="item-text">${escapeHtml(data.text || "")}</div>
        <small>Tipo: ${escapeHtml(data.type || "general")}</small>
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
    loadHistory();
  } catch (error) {
    console.error(error);
    alert("No se pudo borrar el historial.");
  }
});

/* ------------------ UTILIDAD ------------------ */
function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ------------------ INICIO ------------------ */
loadTasks();
loadHistory();
