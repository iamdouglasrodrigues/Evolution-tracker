const KEYS = {
  plan: 'pplul_plan',
  sessions: 'pplul_sessions',
  habits: 'pplul_habits',
  habitLogs: 'pplul_habitLogs',
}

export function load(key) {
  try {
    const raw = localStorage.getItem(KEYS[key] || key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function save(key, data) {
  localStorage.setItem(KEYS[key] || key, JSON.stringify(data))
}

export function exportAll() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    plan: load('plan'),
    sessions: load('sessions'),
    habits: load('habits'),
    habitLogs: load('habitLogs'),
  }
}

export function importAll(data) {
  if (data.plan) save('plan', data.plan)
  if (data.sessions) save('sessions', data.sessions)
  if (data.habits) save('habits', data.habits)
  if (data.habitLogs) save('habitLogs', data.habitLogs)
}

export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
