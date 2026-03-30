import { useState, useMemo } from 'react'
import { load, save } from '../utils/storage'
import { sessionTonnage, sessionTopE1RM, sessionTotalSets, formatNum } from '../utils/calc'
import { useToast } from './Toast'
import ConfirmDialog from './ConfirmDialog'
import { Edit, Trash2, Dumbbell, Filter, Search } from 'lucide-react'

const WORKOUTS = ['Todos', 'Pull', 'Push', 'Legs', 'Upper', 'Lower']

export default function HistoricoTreino({ onEdit, onDelete }) {
  const toast = useToast()
  const [sessions, setSessions] = useState(() => load('sessions') || [])
  const [filterWorkout, setFilterWorkout] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = useMemo(() => {
    let list = sessions
    if (filterWorkout !== 'Todos') {
      list = list.filter(s => s.workout === filterWorkout)
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      list = list.filter(s =>
        s.workout.toLowerCase().includes(term) ||
        s.date.includes(term) ||
        (s.notes || '').toLowerCase().includes(term) ||
        s.exercises.some(e => e.name.toLowerCase().includes(term))
      )
    }
    return list
  }, [sessions, filterWorkout, searchTerm])

  const handleDelete = () => {
    if (!deleteTarget) return
    const updated = sessions.filter(s => s.id !== deleteTarget)
    save('sessions', updated)
    setSessions(updated)
    toast('Sessão apagada.', 'success')
    setDeleteTarget(null)
    onDelete?.()
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">Histórico de Treinos</h2>

      {/* Filters */}
      <div className="bg-card rounded-xl p-3 shadow-sm border border-border flex flex-wrap gap-2 items-center transition-colors">
        <Filter size={16} className="text-text-muted" />
        <select
          value={filterWorkout}
          onChange={e => setFilterWorkout(e.target.value)}
          className="border border-border rounded-lg px-3 py-1.5 text-sm bg-input-bg"
          aria-label="Filtrar por treino"
        >
          {WORKOUTS.map(w => <option key={w}>{w}</option>)}
        </select>
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar exercício, data, notas..."
            className="border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm w-full bg-input-bg"
            aria-label="Buscar sessões"
          />
        </div>
        {sessions.length > 0 && (
          <span className="text-xs text-text-muted">
            {filtered.length} de {sessions.length} sessões
          </span>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="bg-card rounded-xl p-8 shadow-sm border border-border text-center transition-colors">
          <Dumbbell size={48} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-muted">
            {sessions.length === 0
              ? 'Nenhuma sessão registrada ainda.'
              : 'Nenhuma sessão encontrada com esses filtros.'}
          </p>
        </div>
      )}

      {filtered.map(session => {
        const ton = sessionTonnage(session)
        const top = sessionTopE1RM(session)
        const sets = sessionTotalSets(session)
        return (
          <div key={session.id} className="bg-card rounded-xl p-4 shadow-sm border border-border transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">
                  <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md font-bold mr-2">{session.workout}</span>
                  <span className="text-text-muted font-normal text-sm">{session.date}</span>
                </h3>
                {session.notes && <p className="text-sm text-text-muted mt-1">{session.notes}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => onEdit?.(session)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary cursor-pointer transition-colors" title="Editar" aria-label="Editar sessão">
                  <Edit size={16} />
                </button>
                <button onClick={() => setDeleteTarget(session.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-danger cursor-pointer transition-colors" title="Apagar" aria-label="Apagar sessão">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="bg-bg rounded-lg p-2 text-center transition-colors">
                <p className="text-xs text-text-muted">Séries</p>
                <p className="font-bold text-lg">{sets}</p>
              </div>
              <div className="bg-bg rounded-lg p-2 text-center transition-colors">
                <p className="text-xs text-text-muted">Tonnage</p>
                <p className="font-bold text-lg">{formatNum(ton)}<span className="text-xs font-normal"> kg</span></p>
              </div>
              <div className="bg-bg rounded-lg p-2 text-center transition-colors">
                <p className="text-xs text-text-muted">Top e1RM</p>
                <p className="font-bold text-lg">{formatNum(top)}<span className="text-xs font-normal"> kg</span></p>
              </div>
            </div>
          </div>
        )
      })}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Apagar sessão"
        message="Tem certeza que deseja apagar esta sessão? Esta ação não pode ser desfeita."
        confirmText="Apagar"
        danger
      />
    </div>
  )
}
