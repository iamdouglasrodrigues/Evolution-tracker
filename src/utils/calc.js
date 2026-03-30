// Epley formula: e1RM = weight * (1 + reps/30)
export function e1rm(weight, reps) {
  if (!weight || weight <= 0 || !reps || reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export function tonnage(sets) {
  return sets.reduce((sum, s) => {
    const w = parseFloat(s.weight) || 0
    const r = parseInt(s.reps) || 0
    return sum + w * r
  }, 0)
}

export function sessionTonnage(session) {
  return session.exercises.reduce((sum, ex) => sum + tonnage(ex.sets), 0)
}

export function sessionTopE1RM(session) {
  let best = 0
  for (const ex of session.exercises) {
    for (const s of ex.sets) {
      const val = e1rm(parseFloat(s.weight) || 0, parseInt(s.reps) || 0)
      if (val > best) best = val
    }
  }
  return best
}

export function sessionTotalSets(session) {
  return session.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.weight || s.reps).length, 0)
}

export function formatNum(n) {
  return Number(n.toFixed(1))
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
