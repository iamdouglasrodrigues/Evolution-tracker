import { useState, useEffect, useMemo } from 'react'
import { load, save } from '../utils/storage'
import { todayStr, generateId, formatNum, e1rm } from '../utils/calc'
import defaultPlan from '../data/defaultPlan'
import { useToast } from './Toast'
import { Plus, Minus, Trash2, Save, RotateCcw, Clock, ChevronDown, ChevronUp } from 'lucide-react'

const WORKOUTS = ['Pull', 'Push', 'Legs', 'Upper', 'Lower']

function buildExercises(plan, workoutName) {
  const exList = plan[workoutName] || []
  return exList.map(ex => ({
    exerciseId: ex.id,
    name: ex.name,
    targetReps: ex.targetReps,
    sets: Array.from({ length: ex.defaultSets }, () => ({ weight: '', reps: '' })),
  }))
}

function getLastSession(sessions, workoutName) {
  return sessions.find(s => s.workout === workoutName)
}

function getLastExerciseData(sessions, exerciseName) {
  for (const s of sessions) {
    const ex = s.exercises.find(e => e.name === exerciseName)
    if (ex && ex.sets.some(set => set.weight || set.reps)) return ex
  }
  return null
}

function RestTimer() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [running])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return (
    <div className="flex items-center gap-2">
      <Clock size={14} className="text-text-muted" />
      <span className="text-sm font-mono font-medium min-w-12">
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
      <button
        onClick={() => setRunning(r => !r)}
        className={`px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${running ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}
      >
        {running ? 'Parar' : 'Iniciar'}
      </button>
      <button
        onClick={() => { setSeconds(0); setRunning(false) }}
        className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-text-muted cursor-pointer"
      >
        Reset
      </button>
    </div>
  )
}

export default function SessaoTreino({ editSession, onSaved }) {
  const toast = useToast()
  const plan = load('plan') || defaultPlan
  const sessions = load('sessions') || []
  const [workout, setWorkout] = useState(editSession?.workout || WORKOUTS[0])
  const [date, setDate] = useState(editSession?.date || todayStr())
  const [notes, setNotes] = useState(editSession?.notes || '')
  const [exercises, setExercises] = useState(
    editSession?.exercises || buildExercises(plan, workout)
  )
  const [editId, setEditId] = useState(editSession?.id || null)
  const [collapsedExercises, setCollapsedExercises] = useState({})

  const lastSession = useMemo(() => getLastSession(sessions, workout), [workout])
  const daysSinceLast = useMemo(() => {
    if (!lastSession) return null
    const diff = Math.floor((new Date(todayStr()) - new Date(lastSession.date)) / 86400000)
    return diff
  }, [lastSession])

  useEffect(() => {
    if (!editSession) {
      setExercises(buildExercises(plan, workout))
    }
  }, [workout])

  const fillFromLast = () => {
    if (!lastSession) return
    setExercises(prev => prev.map(ex => {
      const lastEx = lastSession.exercises.find(e => e.name === ex.name)
      if (!lastEx) return ex
      return {
        ...ex,
        sets: lastEx.sets.map(s => ({ weight: s.weight, reps: s.reps })),
      }
    }))
    toast('Dados do último treino carregados!', 'info')
  }

  const toggleCollapse = (idx) => {
    setCollapsedExercises(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const updateSet = (exIdx, setIdx, field, value) => {
    setExercises(prev => prev.map((e, i) => i !== exIdx ? e : {
      ...e,
      sets: e.sets.map((s, j) => j !== setIdx ? s : { ...s, [field]: value })
    }))
  }

  const addSet = (exIdx) => {
    setExercises(prev => prev.map((e, i) =>
      i !== exIdx ? e : { ...e, sets: [...e.sets, { weight: '', reps: '' }] }
    ))
  }

  const removeSet = (exIdx) => {
    setExercises(prev => prev.map((e, i) =>
      i !== exIdx || e.sets.length <= 1 ? e : { ...e, sets: e.sets.slice(0, -1) }
    ))
  }

  const clearSets = (exIdx) => {
    setExercises(prev => prev.map((e, i) =>
      i !== exIdx ? e : { ...e, sets: e.sets.map(() => ({ weight: '', reps: '' })) }
    ))
  }

  const handleSave = () => {
    const hasData = exercises.some(ex => ex.sets.some(s => s.weight || s.reps))
    if (!hasData) {
      toast('Preencha pelo menos uma série antes de salvar.', 'warning')
      return
    }

    const allSessions = load('sessions') || []
    const session = {
      id: editId || generateId(),
      workout,
      date,
      notes,
      exercises: exercises.map(ex => ({
        ...ex,
        sets: ex.sets.filter(s => s.weight || s.reps)
      })),
      savedAt: new Date().toISOString(),
    }

    if (editId) {
      const idx = allSessions.findIndex(s => s.id === editId)
      if (idx >= 0) allSessions[idx] = session
      else allSessions.unshift(session)
    } else {
      allSessions.unshift(session)
    }

    save('sessions', allSessions)
    toast(editId ? 'Sessão atualizada!' : 'Sessão salva!', 'success')
    setEditId(null)
    setNotes('')
    setExercises(buildExercises(plan, workout))
    onSaved?.()
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border transition-colors">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1" htmlFor="workout-select">Treino</label>
            <select
              id="workout-select"
              value={workout}
              onChange={e => { setWorkout(e.target.value); setEditId(null) }}
              className="border border-border rounded-lg px-3 py-2 bg-input-bg text-sm"
              disabled={!!editSession}
            >
              {WORKOUTS.map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1" htmlFor="session-date">Data</label>
            <input
              id="session-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-input-bg"
            />
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-text-muted mb-1" htmlFor="session-notes">Notas</label>
            <input
              id="session-notes"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas da sessão..."
              className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg"
            />
          </div>
        </div>

        {/* Context info + repeat last */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border">
          {daysSinceLast !== null && (
            <span className="text-xs text-text-muted">
              Último {workout}: <strong>{daysSinceLast === 0 ? 'hoje' : `${daysSinceLast} dia${daysSinceLast > 1 ? 's' : ''} atrás`}</strong>
            </span>
          )}
          {lastSession && !editSession && (
            <button
              onClick={fillFromLast}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 cursor-pointer transition-colors"
            >
              <RotateCcw size={13} /> Repetir último treino
            </button>
          )}
          <div className="ml-auto">
            <RestTimer />
          </div>
        </div>
      </div>

      {/* Exercises */}
      {exercises.map((ex, exIdx) => {
        const lastData = getLastExerciseData(sessions, ex.name)
        const collapsed = collapsedExercises[exIdx]
        const filledSets = ex.sets.filter(s => s.weight || s.reps).length

        return (
          <div key={exIdx} className="bg-card rounded-xl shadow-sm border border-border transition-colors overflow-hidden">
            <div
              className="flex justify-between items-center p-4 cursor-pointer select-none"
              onClick={() => toggleCollapse(exIdx)}
            >
              <div className="flex items-center gap-2">
                <button className="text-text-muted" aria-label={collapsed ? 'Expandir' : 'Recolher'}>
                  {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
                <div>
                  <h3 className="font-semibold text-base">{ex.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">Alvo: {ex.targetReps} reps</span>
                    {collapsed && filledSets > 0 && (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                        {filledSets} série{filledSets > 1 ? 's' : ''} preenchida{filledSets > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => addSet(exIdx)} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors" title="Adicionar série" aria-label="Adicionar série">
                  <Plus size={16} />
                </button>
                <button onClick={() => removeSet(exIdx)} className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 cursor-pointer transition-colors" title="Remover série" aria-label="Remover série">
                  <Minus size={16} />
                </button>
                <button onClick={() => clearSets(exIdx)} className="p-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 cursor-pointer transition-colors" title="Limpar" aria-label="Limpar séries">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {!collapsed && (
              <div className="px-4 pb-4 space-y-2">
                {/* Last session hint */}
                {lastData && (
                  <div className="text-xs text-text-muted bg-bg rounded-lg px-3 py-2 mb-1">
                    Último: {lastData.sets.filter(s => s.weight || s.reps).map((s, i) =>
                      <span key={i} className="inline-block mr-2">{s.weight}kg×{s.reps}</span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs text-text-muted font-medium">
                  <span className="w-8 text-center">Série</span>
                  <span>Peso (kg)</span>
                  <span>Reps</span>
                  <span className="w-12 text-center">e1RM</span>
                </div>
                {ex.sets.map((set, setIdx) => {
                  const setE1rm = e1rm(parseFloat(set.weight) || 0, parseInt(set.reps) || 0)
                  return (
                    <div key={setIdx} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                      <span className="w-8 text-center text-sm font-medium text-text-muted">{setIdx + 1}</span>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={e => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                        placeholder={lastData?.sets[setIdx]?.weight || '0'}
                        className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg"
                        min="0"
                        step="0.5"
                        aria-label={`Peso série ${setIdx + 1} de ${ex.name}`}
                      />
                      <input
                        type="number"
                        value={set.reps}
                        onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                        placeholder={lastData?.sets[setIdx]?.reps || '0'}
                        className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg"
                        min="0"
                        aria-label={`Reps série ${setIdx + 1} de ${ex.name}`}
                      />
                      <span className="w-12 text-center text-xs text-text-muted font-mono">
                        {setE1rm > 0 ? formatNum(setE1rm) : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <button
        onClick={handleSave}
        className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98]"
      >
        <Save size={18} />
        {editId ? 'Atualizar Sessão' : 'Salvar Sessão'}
      </button>
    </div>
  )
}
