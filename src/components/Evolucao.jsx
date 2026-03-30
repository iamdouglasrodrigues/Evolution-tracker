import { useState, useMemo } from 'react'
import { load } from '../utils/storage'
import { e1rm, formatNum } from '../utils/calc'
import defaultPlan from '../data/defaultPlan'
import defaultHabits from '../data/defaultHabits'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { TrendingUp, Award, Zap, Calendar } from 'lucide-react'

function Card({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border text-center transition-colors">
      <Icon size={20} className="mx-auto text-primary mb-1" />
      <p className="text-xs text-text-muted">{label}</p>
      <p className="font-bold text-xl">{value}</p>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  )
}

function HabitHeatmap({ logs, habits }) {
  const active = habits.filter(h => !h.archived)

  const data = useMemo(() => {
    const today = new Date()
    const result = []
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayLog = logs[dateStr] || {}
      if (active.length === 0) {
        result.push({ date: dateStr, score: -1 })
        continue
      }
      let successes = 0
      let hasAny = false
      for (const h of active) {
        const val = dayLog[h.id]
        if (val === undefined || val === null) continue
        hasAny = true
        if (h.type === 'checklist' && val === true) successes++
        else if (h.type === 'abstinence' && val === 'cumpri') successes++
        else if (h.type === 'quantitative') {
          const v = parseFloat(val)
          const g = parseFloat(h.goal)
          if (!isNaN(v) && !isNaN(g)) {
            if (h.rule === '≥' && v >= g) successes++
            else if (h.rule === '≤' && v <= g) successes++
            else if (h.rule === '=' && v === g) successes++
          }
        } else if (h.type === 'time' && val && h.goal) {
          if (h.rule === '≤' && val <= h.goal) successes++
          else if (h.rule === '≥' && val >= h.goal) successes++
          else if (h.rule === '=' && val === h.goal) successes++
        }
      }
      result.push({
        date: dateStr,
        score: hasAny ? Math.round((successes / active.length) * 100) : -1,
      })
    }
    return result
  }, [logs, active])

  const getColor = (score) => {
    if (score < 0) return 'bg-gray-100 dark:bg-gray-800'
    if (score >= 80) return 'bg-success'
    if (score >= 50) return 'bg-warning'
    if (score > 0) return 'bg-danger'
    return 'bg-danger/40'
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border transition-colors">
      <h4 className="text-sm font-semibold mb-3">Últimos 90 dias</h4>
      <div className="grid grid-cols-[repeat(18,1fr)] gap-1 sm:grid-cols-[repeat(30,1fr)]">
        {data.map((d, i) => (
          <div
            key={i}
            className={`aspect-square rounded-sm ${getColor(d.score)} transition-colors cursor-default`}
            title={`${d.date}: ${d.score < 0 ? 'Sem registro' : `${d.score}%`}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800 inline-block" /> Sem dados</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-danger/40 inline-block" /> 0%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-danger inline-block" /> &lt;50%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-warning inline-block" /> 50–79%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success inline-block" /> 80%+</span>
      </div>
    </div>
  )
}

function TrainingEvolution() {
  const sessions = load('sessions') || []
  const plan = load('plan') || defaultPlan

  const allExercises = useMemo(() => {
    const set = new Set()
    sessions.forEach(s => s.exercises.forEach(e => set.add(e.name)))
    Object.values(plan).forEach(exList => exList.forEach(e => set.add(e.name)))
    return Array.from(set).sort()
  }, [sessions])

  const [selected, setSelected] = useState('__all__')

  const chartData = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))
    return sorted.map(s => {
      const exs = selected === '__all__' ? s.exercises : s.exercises.filter(e => e.name === selected)
      let bestE1rm = 0
      let ton = 0
      for (const ex of exs) {
        for (const set of ex.sets) {
          const w = parseFloat(set.weight) || 0
          const r = parseInt(set.reps) || 0
          const val = e1rm(w, r)
          if (val > bestE1rm) bestE1rm = val
          ton += w * r
        }
      }
      return { date: s.date, e1rm: formatNum(bestE1rm), tonnage: formatNum(ton) }
    }).filter(d => d.e1rm > 0 || d.tonnage > 0)
  }, [sessions, selected])

  const stats = useMemo(() => {
    if (chartData.length === 0) return { count: 0, bestE1rm: 0, bestTon: 0, last: '-' }
    return {
      count: chartData.length,
      bestE1rm: Math.max(...chartData.map(d => d.e1rm)),
      bestTon: Math.max(...chartData.map(d => d.tonnage)),
      last: chartData[chartData.length - 1].date,
    }
  }, [chartData])

  const isDark = document.documentElement.classList.contains('dark')
  const gridColor = isDark ? '#334155' : '#e2e8f0'
  const textColor = isDark ? '#94a3b8' : undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="font-bold text-base">Treino</h3>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="border border-border rounded-lg px-3 py-1.5 text-sm bg-input-bg flex-1"
          aria-label="Filtrar exercício"
        >
          <option value="__all__">Geral — todos os exercícios</option>
          {allExercises.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card icon={Calendar} label="Sessões" value={stats.count} />
        <Card icon={Award} label="Melhor e1RM" value={`${formatNum(stats.bestE1rm)} kg`} />
        <Card icon={Zap} label="Maior Tonnage" value={`${formatNum(stats.bestTon)} kg`} />
        <Card icon={TrendingUp} label="Último Registro" value={stats.last} />
      </div>

      {chartData.length > 0 ? (
        <>
          <div className="bg-card rounded-xl p-4 shadow-sm border border-border transition-colors">
            <h4 className="text-sm font-semibold mb-3">e1RM ao longo do tempo</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: textColor }} />
                <YAxis tick={{ fontSize: 11, fill: textColor }} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: `1px solid ${gridColor}`, borderRadius: 8, color: isDark ? '#e2e8f0' : undefined }} />
                <Line type="monotone" dataKey="e1rm" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="e1RM (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl p-4 shadow-sm border border-border transition-colors">
            <h4 className="text-sm font-semibold mb-3">Tonnage ao longo do tempo</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: textColor }} />
                <YAxis tick={{ fontSize: 11, fill: textColor }} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: `1px solid ${gridColor}`, borderRadius: 8, color: isDark ? '#e2e8f0' : undefined }} />
                <Bar dataKey="tonnage" fill="#6366f1" radius={[4, 4, 0, 0]} name="Tonnage (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="bg-card rounded-xl p-8 shadow-sm border border-border text-center transition-colors">
          <p className="text-text-muted">Sem dados para exibir. Salve sessões de treino primeiro.</p>
        </div>
      )}
    </div>
  )
}

function HabitsEvolution() {
  const habits = load('habits') || defaultHabits
  const logs = load('habitLogs') || {}
  const active = habits.filter(h => !h.archived)

  const [selected, setSelected] = useState('__score__')
  const selectedHabit = habits.find(h => h.id === selected)

  function isSuccess(habit, value) {
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

  const chartData = useMemo(() => {
    const dates = Object.keys(logs).filter(d => d !== '_notes' && d.match(/^\d{4}-\d{2}-\d{2}$/)).sort()
    if (selected === '__score__') {
      return dates.map(date => {
        const dayLog = logs[date] || {}
        if (active.length === 0) return { date, score: 0 }
        let successes = 0
        for (const h of active) {
          if (isSuccess(h, dayLog[h.id])) successes++
        }
        return { date, score: Math.round((successes / active.length) * 100) }
      })
    }
    if (!selectedHabit) return []
    return dates.filter(d => {
      const v = (logs[d] || {})[selected]
      return v !== undefined && v !== null
    }).map(date => {
      const val = (logs[date] || {})[selected]
      if (selectedHabit.type === 'quantitative') {
        return { date, value: parseFloat(val) || 0 }
      }
      if (selectedHabit.type === 'time' && typeof val === 'string') {
        const [h, m] = val.split(':').map(Number)
        return { date, value: h * 60 + (m || 0), label: val }
      }
      return { date, value: isSuccess(selectedHabit, val) ? 1 : 0 }
    })
  }, [logs, selected, habits])

  const stats = useMemo(() => {
    if (chartData.length === 0) return { rate: 0, streak: 0, bestStreak: 0 }

    if (selected === '__score__') {
      const total = chartData.length
      const good = chartData.filter(d => d.score >= 50).length
      let streak = 0, best = 0, cur = 0
      for (const d of chartData) {
        if (d.score >= 50) { cur++; best = Math.max(best, cur) } else cur = 0
      }
      for (let i = chartData.length - 1; i >= 0; i--) {
        if (chartData[i].score >= 50) streak++; else break
      }
      return { rate: total > 0 ? Math.round((good / total) * 100) : 0, streak, bestStreak: best }
    }

    if (!selectedHabit) return { rate: 0, streak: 0, bestStreak: 0 }
    const isOk = (d) => {
      if (selectedHabit.type === 'quantitative') return isSuccess(selectedHabit, d.value)
      if (selectedHabit.type === 'time') return isSuccess(selectedHabit, d.label || d.value)
      return d.value === 1
    }
    const succ = chartData.filter(isOk).length
    let streak = 0, best = 0, cur = 0
    for (const d of chartData) {
      if (isOk(d)) { cur++; best = Math.max(best, cur) } else cur = 0
    }
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (isOk(chartData[i])) streak++; else break
    }
    return {
      rate: chartData.length > 0 ? Math.round((succ / chartData.length) * 100) : 0,
      streak,
      bestStreak: best,
    }
  }, [chartData, selected, selectedHabit])

  const isQuantitative = selectedHabit?.type === 'quantitative'
  const isTime = selectedHabit?.type === 'time'
  const showLineChart = isQuantitative || isTime
  const isDark = document.documentElement.classList.contains('dark')
  const gridColor = isDark ? '#334155' : '#e2e8f0'
  const textColor = isDark ? '#94a3b8' : undefined
  const tooltipStyle = { backgroundColor: isDark ? '#1e293b' : '#fff', border: `1px solid ${gridColor}`, borderRadius: 8, color: isDark ? '#e2e8f0' : undefined }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="font-bold text-base">Hábitos</h3>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="border border-border rounded-lg px-3 py-1.5 text-sm bg-input-bg flex-1"
          aria-label="Filtrar hábito"
        >
          <option value="__score__">Geral — Score do dia</option>
          {active.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card icon={TrendingUp} label="Taxa de Sucesso" value={`${stats.rate}%`} />
        <Card icon={Zap} label="Streak Atual" value={`${stats.streak} dias`} />
        <Card icon={Award} label="Melhor Streak" value={`${stats.bestStreak} dias`} />
      </div>

      <HabitHeatmap logs={logs} habits={habits} />

      {chartData.length > 0 ? (
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border transition-colors">
          <h4 className="text-sm font-semibold mb-3">
            {selected === '__score__' ? 'Score do dia (%)' : selectedHabit?.name}
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            {selected === '__score__' || showLineChart ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: textColor }} />
                <YAxis
                  tick={{ fontSize: 11, fill: textColor }}
                  domain={selected === '__score__' ? [0, 100] : undefined}
                  tickFormatter={isTime ? (v) => `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}` : undefined}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={isTime ? (v) => [`${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`, selectedHabit.name] : undefined}
                />
                {isQuantitative && selectedHabit.goal && (
                  <ReferenceLine y={parseFloat(selectedHabit.goal)} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Meta', fill: textColor }} />
                )}
                {isTime && selectedHabit.goal && (() => {
                  const [h, m] = selectedHabit.goal.split(':').map(Number)
                  return <ReferenceLine y={h * 60 + (m || 0)} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Meta', fill: textColor }} />
                })()}
                <Line
                  type="monotone"
                  dataKey={selected === '__score__' ? 'score' : 'value'}
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name={selected === '__score__' ? 'Score (%)' : selectedHabit.name}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: textColor }} />
                <YAxis tick={{ fontSize: 11, fill: textColor }} domain={[0, 1]} ticks={[0, 1]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} name={selectedHabit?.name || ''} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-card rounded-xl p-8 shadow-sm border border-border text-center transition-colors">
          <p className="text-text-muted">Sem dados de hábitos para exibir.</p>
        </div>
      )}
    </div>
  )
}

export default function Evolucao() {
  return (
    <div className="space-y-8">
      <TrainingEvolution />
      <hr className="border-border" />
      <HabitsEvolution />
    </div>
  )
}
