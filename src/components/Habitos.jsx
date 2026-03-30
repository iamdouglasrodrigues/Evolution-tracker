import { useState, useEffect, useCallback } from 'react'
import { load, save } from '../utils/storage'
import { todayStr } from '../utils/calc'
import defaultHabits from '../data/defaultHabits'
import { useToast } from './Toast'
import ConfirmDialog from './ConfirmDialog'
import { Trash2, CheckCircle, XCircle, MinusCircle, ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react'

const CATEGORY_LABELS = {
  saude: 'Saúde',
  desenvolvimento: 'Desenvolvimento',
  digital: 'Digital',
  sono: 'Sono',
  abstinencia: 'Abstinência',
  outro: 'Outro',
}

const CATEGORY_EMOJI = {
  saude: '💪',
  desenvolvimento: '📖',
  digital: '📱',
  sono: '😴',
  abstinencia: '🚫',
  outro: '📌',
}

function shiftDate(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDateLabel(dateStr) {
  const today = todayStr()
  if (dateStr === today) return 'Hoje'
  if (dateStr === shiftDate(today, -1)) return 'Ontem'
  if (dateStr === shiftDate(today, 1)) return 'Amanhã'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function isHabitSuccess(habit, value) {
  if (value === undefined || value === null) return false
  if (habit.type === 'checklist') return value === true
  if (habit.type === 'abstinence') return value === 'cumpri'
  if (habit.type === 'quantitative') {
    const v = parseFloat(value)
    const g = parseFloat(habit.goal)
    if (isNaN(v) || isNaN(g)) return false
    if (habit.rule === '≥') return v >= g
    if (habit.rule === '≤') return v <= g
    if (habit.rule === '=') return v === g
  }
  if (habit.type === 'time' && value && habit.goal) {
    if (habit.rule === '≤') return value <= habit.goal
    if (habit.rule === '≥') return value >= habit.goal
    if (habit.rule === '=') return value === habit.goal
  }
  return false
}

export default function Habitos() {
  const toast = useToast()
  const [date, setDate] = useState(todayStr())
  const [habits, setHabits] = useState(() => {
    const stored = load('habits')
    if (stored) return stored
    save('habits', defaultHabits)
    return defaultHabits
  })
  const [logs, setLogs] = useState(() => load('habitLogs') || {})
  const [notes, setNotes] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(null)

  const dayLog = logs[date] || {}
  const active = habits.filter(h => !h.archived)

  // reload habits when coming back from config
  useEffect(() => {
    const stored = load('habits')
    if (stored) setHabits(stored)
  }, [])

  useEffect(() => {
    setNotes(dayLog._notes || '')
  }, [date])

  const saveLogs = useCallback((newLogs) => {
    setLogs(newLogs)
    save('habitLogs', newLogs)
  }, [])

  const setHabitValue = (habitId, value) => {
    saveLogs({ ...logs, [date]: { ...logs[date], [habitId]: value } })
    setSavedFeedback(habitId)
    setTimeout(() => setSavedFeedback(null), 600)
  }

  const clearHabitValue = (habitId) => {
    const day = { ...logs[date] }
    delete day[habitId]
    saveLogs({ ...logs, [date]: day })
  }

  const saveNotes = (text) => {
    setNotes(text)
    saveLogs({ ...logs, [date]: { ...logs[date], _notes: text } })
  }

  const deleteDay = () => {
    const updated = { ...logs }
    delete updated[date]
    saveLogs(updated)
    setNotes('')
    setShowDeleteConfirm(false)
    toast('Registro do dia apagado.', 'success')
  }

  // Day score
  const dayScore = (() => {
    if (active.length === 0) return null
    let successes = 0
    for (const h of active) {
      if (isHabitSuccess(h, dayLog[h.id])) successes++
    }
    return Math.round((successes / active.length) * 100)
  })()

  // Group active by category
  const grouped = {}
  for (const h of active) {
    const cat = h.category || 'outro'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(h)
  }
  const categoryOrder = ['saude', 'desenvolvimento', 'digital', 'sono', 'abstinencia', 'outro']
  const sortedCategories = categoryOrder.filter(c => grouped[c])

  // Render helpers
  const ToggleButtons = ({ habitId, options, colors }) => {
    const val = dayLog[habitId]
    const isSaved = savedFeedback === habitId
    return (
      <div className={`flex gap-1.5 flex-wrap transition-all ${isSaved ? 'animate-pulse-success' : ''}`}>
        {options.map(opt => (
          <button
            key={opt.value?.toString() ?? 'clear'}
            onClick={() => opt.value === null ? clearHabitValue(habitId) : setHabitValue(habitId, opt.value)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200
              ${opt.isActive(val)
                ? `${opt.activeClass} shadow-md scale-105`
                : 'bg-gray-100 dark:bg-gray-700 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>
    )
  }

  const renderChecklist = (habit) => (
    <ToggleButtons habitId={habit.id} options={[
      { value: true, label: 'Sim', icon: <CheckCircle size={14} />, isActive: v => v === true, activeClass: 'bg-success text-white' },
      { value: false, label: 'Não', icon: <XCircle size={14} />, isActive: v => v === false, activeClass: 'bg-danger text-white' },
      { value: null, label: '', icon: <MinusCircle size={14} />, isActive: v => v === undefined || v === null, activeClass: 'bg-gray-300 dark:bg-gray-600 text-white' },
    ]} />
  )

  const renderAbstinence = (habit) => (
    <ToggleButtons habitId={habit.id} options={[
      { value: 'cumpri', label: 'Cumpri', icon: <CheckCircle size={14} />, isActive: v => v === 'cumpri', activeClass: 'bg-success text-white' },
      { value: 'quebrei', label: 'Quebrei', icon: <XCircle size={14} />, isActive: v => v === 'quebrei', activeClass: 'bg-danger text-white' },
      { value: null, label: '', icon: <MinusCircle size={14} />, isActive: v => v === undefined || v === null, activeClass: 'bg-gray-300 dark:bg-gray-600 text-white' },
    ]} />
  )

  const renderQuantitative = (habit) => {
    const val = dayLog[habit.id]
    const met = isHabitSuccess(habit, val)
    const isSaved = savedFeedback === habit.id

    return (
      <div className={`flex flex-wrap items-center gap-2 transition-all ${isSaved ? 'animate-pulse-success' : ''}`}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setHabitValue(habit.id, Math.max(0, (parseFloat(val) || 0) - (habit.unit === 'min' ? 5 : 0.5)))}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center cursor-pointer font-bold text-lg transition-colors"
            aria-label="Diminuir"
          >−</button>
          <input
            type="number"
            value={val ?? ''}
            onChange={e => setHabitValue(habit.id, e.target.value === '' ? null : parseFloat(e.target.value))}
            placeholder="0"
            className="border border-border rounded-lg px-2 py-1.5 text-sm w-20 bg-input-bg text-center"
            min="0" step={habit.unit === 'min' ? '5' : '0.1'}
            aria-label={`Valor de ${habit.name}`}
          />
          <button
            onClick={() => setHabitValue(habit.id, (parseFloat(val) || 0) + (habit.unit === 'min' ? 5 : 0.5))}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center cursor-pointer font-bold text-lg transition-colors"
            aria-label="Aumentar"
          >+</button>
        </div>
        <span className="text-sm text-text-muted">{habit.unit || ''}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${val != null ? (met ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger') : 'bg-gray-100 dark:bg-gray-700 text-text-muted'}`}>
          Meta: {habit.rule} {habit.goal} {habit.unit}
        </span>
        <button onClick={() => clearHabitValue(habit.id)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors" aria-label="Limpar">
          <Trash2 size={14} />
        </button>
      </div>
    )
  }

  const renderTime = (habit) => {
    const val = dayLog[habit.id]
    const met = isHabitSuccess(habit, val)
    const isSaved = savedFeedback === habit.id

    return (
      <div className={`flex flex-wrap items-center gap-2 transition-all ${isSaved ? 'animate-pulse-success' : ''}`}>
        <Clock size={16} className="text-text-muted" />
        <input
          type="time"
          value={val || ''}
          onChange={e => setHabitValue(habit.id, e.target.value || null)}
          className="border border-border rounded-lg px-3 py-1.5 text-sm bg-input-bg"
          aria-label={`Horário de ${habit.name}`}
        />
        {habit.goal && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${val ? (met ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger') : 'bg-gray-100 dark:bg-gray-700 text-text-muted'}`}>
            Meta: {habit.rule} {habit.goal}
          </span>
        )}
        {val && (
          <button onClick={() => clearHabitValue(habit.id)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors" aria-label="Limpar">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    )
  }

  const renderHabit = (habit) => {
    if (habit.type === 'checklist') return renderChecklist(habit)
    if (habit.type === 'abstinence') return renderAbstinence(habit)
    if (habit.type === 'quantitative') return renderQuantitative(habit)
    if (habit.type === 'time') return renderTime(habit)
    return null
  }

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border transition-colors">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button onClick={() => setDate(d => shiftDate(d, -1))} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-text-muted cursor-pointer transition-colors" aria-label="Dia anterior">
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setDate(todayStr())}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200
                ${date === todayStr() ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >Hoje</button>
            <button onClick={() => setDate(d => shiftDate(d, 1))} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-text-muted cursor-pointer transition-colors" aria-label="Próximo dia">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-text-muted hidden sm:block" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm bg-input-bg" aria-label="Selecionar data" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold">{formatDateLabel(date)}</span>
            {dayScore !== null && (
              <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${dayScore >= 80 ? 'bg-success/10 text-success' : dayScore >= 50 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                {dayScore}%
              </span>
            )}
          </div>
          <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1 px-3 py-1.5 bg-danger/10 text-danger rounded-lg text-xs font-medium hover:bg-danger/20 cursor-pointer transition-colors">
            <Trash2 size={13} /> Apagar dia
          </button>
        </div>
      </div>

      {active.length === 0 && (
        <div className="bg-card rounded-xl p-8 shadow-sm border border-border text-center transition-colors">
          <p className="text-text-muted">Nenhum hábito cadastrado. Vá em Configurações para criar.</p>
        </div>
      )}

      {/* Habit groups by category */}
      {sortedCategories.map(cat => (
        <div key={cat} className="bg-card rounded-xl shadow-sm border border-border transition-colors overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wide">
              {CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat]}
            </h3>
          </div>
          <div className="divide-y divide-border">
            {grouped[cat].map(habit => (
              <div key={habit.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{habit.name}</h4>
                  {dayLog[habit.id] !== undefined && dayLog[habit.id] !== null && (
                    <span className={`w-2 h-2 rounded-full ${isHabitSuccess(habit, dayLog[habit.id]) ? 'bg-success' : 'bg-danger'}`} />
                  )}
                </div>
                {renderHabit(habit)}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Day notes */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border transition-colors">
        <label className="block text-sm font-medium text-text-muted mb-1" htmlFor="day-notes">Notas do dia</label>
        <textarea
          id="day-notes"
          value={notes}
          onChange={e => saveNotes(e.target.value)}
          placeholder="Observações sobre o dia..."
          rows={3}
          className="border border-border rounded-lg px-3 py-2 text-sm w-full resize-none bg-input-bg"
        />
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={deleteDay}
        title="Apagar registro do dia"
        message={`Apagar todo o registro de ${formatDateLabel(date)} (${date})?`}
        confirmText="Apagar"
        danger
      />
    </div>
  )
}
