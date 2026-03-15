* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg-1: #0f1020;
  --bg-2: #17182d;
  --card: rgba(255, 255, 255, 0.08);
  --card-strong: rgba(255, 255, 255, 0.12);
  --text: #ffffff;
  --muted: #b9bdd3;
  --primary: #7c6cff;
  --primary-2: #5f8cff;
  --success: #38c172;
  --danger: #ff5f6d;
  --border: rgba(255, 255, 255, 0.1);
  --shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
}

body {
  font-family: Arial, Helvetica, sans-serif;
  background:
    radial-gradient(circle at top, #2d2f68 0%, #15172b 40%, #0b0c17 100%);
  min-height: 100vh;
  color: var(--text);
  padding: 20px;
}

.container {
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
  background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05));
  border: 1px solid var(--border);
  border-radius: 28px;
  padding: 24px 18px 22px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
}

.header {
  text-align: center;
  margin-bottom: 22px;
}

.header h1 {
  font-size: 2.2rem;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.subtitle {
  color: var(--muted);
  font-size: 0.98rem;
}

.hero {
  text-align: center;
  margin-bottom: 18px;
}

.mic-button {
  width: 118px;
  height: 118px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 3rem;
  color: #fff;
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  box-shadow: 0 12px 30px rgba(124, 108, 255, 0.45);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.mic-button:hover {
  transform: scale(1.04);
}

.mic-button:active {
  transform: scale(0.98);
}

.mic-button.listening {
  animation: pulse 1.4s infinite;
  background: linear-gradient(135deg, #ff6aa2, #ff7c5f);
  box-shadow: 0 12px 34px rgba(255, 106, 162, 0.45);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 106, 162, 0.45);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 16px rgba(255, 106, 162, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 106, 162, 0);
  }
}

.status {
  margin-top: 14px;
  color: var(--muted);
  font-weight: 600;
}

.transcript,
.response {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 14px;
  min-height: 64px;
  margin-bottom: 14px;
  line-height: 1.4;
}

.empty-box {
  color: var(--muted);
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 18px;
}

.secondary-btn {
  border: none;
  border-radius: 14px;
  padding: 12px 10px;
  color: #fff;
  background: var(--card-strong);
  border: 1px solid var(--border);
  cursor: pointer;
  font-weight: 700;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.secondary-btn:hover {
  transform: translateY(-1px);
}

.secondary-btn.danger {
  grid-column: 1 / -1;
  background: rgba(255, 95, 109, 0.14);
}

.task-list {
  margin-top: 8px;
}

.task-list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.task-list-head h2 {
  font-size: 1.15rem;
}

.task-count {
  color: var(--muted);
  font-size: 0.9rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 10px;
}

.task-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: var(--success);
  cursor: pointer;
  flex-shrink: 0;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  display: block;
  font-size: 0.98rem;
  word-break: break-word;
}

.task-meta {
  display: block;
  color: var(--muted);
  margin-top: 4px;
  font-size: 0.82rem;
}

.task-item.done .task-title {
  text-decoration: line-through;
  color: #9ea3be;
}

.empty-state {
  text-align: center;
  color: var(--muted);
  padding: 18px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
}

@media (max-width: 480px) {
  body {
    padding: 12px;
  }

  .container {
    padding: 20px 14px 18px;
    border-radius: 22px;
  }

  .mic-button {
    width: 104px;
    height: 104px;
    font-size: 2.7rem;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .secondary-btn.danger {
    grid-column: auto;
  }
}
