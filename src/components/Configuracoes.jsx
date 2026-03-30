import { useState, useRef } from 'react'
import { load, save, exportAll, importAll, downloadJSON } from '../utils/storage'
import { generateId } from '../utils/calc'
import { useToast } from './Toast'
import Modal from './Modal'
import ConfirmDialog from './ConfirmDialog'
import defaultPlan from '../data/defaultPlan'
import defaultHabits from '../data/defaultHabits'
import { Plus, Trash2, Download, Upload, Archive, RotateCcw, Edit, Check, X, GripVertical, Dumbbell, ClipboardList, Database } from 'lucide-react'

const WORKOUTS = ['Pull', 'Push', 'Legs', 'Upper', 'Lower']

const CATEGORY_LABELS = {
  saude: 'Saúde',
  desenvolvimento: 'Desenvolvimento',
  digital: 'Digital',
  sono: 'Sono',
  abstinencia: 'Abstinência',
  outro: 'Outro',
}

const TYPE_LABELS = {
  checklist: 'Checklist',
  quantitative: 'Quantitativo',
  abstinence: 'Abstinência',
  time: 'Horário',
}

/* ─── Plan Editor ──────────────────────────────────────────── */
function PlanEditor({ onChanged }) {
  const toast = useToast()
  const [plan, setPlan] = useState(() => load('plan') || defaultPlan)
  const [selectedWorkout, setSelectedWorkout] = useState(WORKOUTS[0])
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEx, setNewEx] = useState({ name: '', targetReps: '8–12', defaultSets: 3 })
  const [deleteTarget, setDeleteTarget] = useState(null)

  const exercises = plan[selectedWorkout] || []

  const savePlan = (p) => { setPlan(p); save('plan', p); onChanged?.() }

  const addExercise = () => {
    if (!newEx.name.trim()) { toast('Digite o nome.', 'warning'); return }
    savePlan({ ...plan, [selectedWorkout]: [...exercises, { id: generateId(), ...newEx, name: newEx.name.trim() }] })
    toast(`"${newEx.name.trim()}" adicionado!`, 'success')
    setShowAddModal(false)
    setNewEx({ name: '', targetReps: '8–12', defaultSets: 3 })
  }

  const removeExercise = () => {
    savePlan({ ...plan, [selectedWorkout]: exercises.filter(e => e.id !== deleteTarget) })
    toast('Exercício removido.', 'success')
    setDeleteTarget(null)
  }

  const startEdit = (ex) => { setEditingId(ex.id); setEditValues({ name: ex.name, targetReps: ex.targetReps, defaultSets: ex.defaultSets }) }

  const saveEdit = () => {
    if (!editValues.name.trim()) { toast('Nome vazio.', 'warning'); return }
    savePlan({ ...plan, [selectedWorkout]: exercises.map(e => e.id !== editingId ? e : { ...e, ...editValues, name: editValues.name.trim() }) })
    toast('Atualizado!', 'success')
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Dumbbell size={18} className="text-primary" />
        <h3 className="font-bold text-base">Divisão de Treino</h3>
        <select value={selectedWorkout} onChange={e => setSelectedWorkout(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm bg-input-bg ml-auto" aria-label="Selecionar treino">
          {WORKOUTS.map(w => <option key={w}>{w}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {exercises.map(ex => (
          <div key={ex.id} className="bg-card rounded-xl p-3 shadow-sm border border-border flex items-center gap-3 transition-colors">
            {editingId === ex.id ? (
              <div className="flex-1 flex flex-wrap gap-2 items-center">
                <input value={editValues.name} onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))} className="border border-border rounded-lg px-2 py-1.5 text-sm flex-1 min-w-32 bg-input-bg" autoFocus aria-label="Nome" />
                <input value={editValues.targetReps} onChange={e => setEditValues(v => ({ ...v, targetReps: e.target.value }))} className="border border-border rounded-lg px-2 py-1.5 text-sm w-24 bg-input-bg" placeholder="Reps" aria-label="Reps alvo" />
                <input type="number" value={editValues.defaultSets} onChange={e => setEditValues(v => ({ ...v, defaultSets: parseInt(e.target.value) || 1 }))} className="border border-border rounded-lg px-2 py-1.5 text-sm w-16 bg-input-bg" min="1" aria-label="Séries" />
                <button onClick={saveEdit} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 cursor-pointer transition-colors" aria-label="Salvar"><Check size={16} /></button>
                <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors" aria-label="Cancelar"><X size={16} /></button>
              </div>
            ) : (
              <>
                <GripVertical size={14} className="text-text-muted/40 shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-sm">{ex.name}</span>
                  <span className="text-xs text-text-muted ml-2">{ex.defaultSets}×{ex.targetReps}</span>
                </div>
                <button onClick={() => startEdit(ex)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary cursor-pointer transition-colors" aria-label="Editar"><Edit size={14} /></button>
                <button onClick={() => setDeleteTarget(ex.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-danger cursor-pointer transition-colors" aria-label="Remover"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        ))}
      </div>

      <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 cursor-pointer transition-colors">
        <Plus size={16} /> Adicionar Exercício
      </button>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Novo Exercício">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1" htmlFor="cfg-ex-name">Nome</label>
            <input id="cfg-ex-name" value={newEx.name} onChange={e => setNewEx(v => ({ ...v, name: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg" placeholder="Ex: Supino Inclinado" autoFocus onKeyDown={e => e.key === 'Enter' && addExercise()} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1" htmlFor="cfg-ex-reps">Reps alvo</label>
              <input id="cfg-ex-reps" value={newEx.targetReps} onChange={e => setNewEx(v => ({ ...v, targetReps: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1" htmlFor="cfg-ex-sets">Séries</label>
              <input id="cfg-ex-sets" type="number" value={newEx.defaultSets} onChange={e => setNewEx(v => ({ ...v, defaultSets: parseInt(e.target.value) || 1 }))} className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg" min="1" />
            </div>
          </div>
          <button onClick={addExercise} className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark cursor-pointer transition-colors">Adicionar</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={removeExercise} title="Remover exercício" message="Remover do plano? Histórico preservado." confirmText="Remover" danger />
    </div>
  )
}

/* ─── Habit Editor ─────────────────────────────────────────── */
function HabitEditor({ onChanged }) {
  const toast = useToast()
  const [habits, setHabits] = useState(() => load('habits') || defaultHabits)
  const [showArchived, setShowArchived] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [newH, setNewH] = useState({ name: '', type: 'checklist', goal: '', rule: '≥', unit: '', category: 'outro' })

  // ensure defaults are saved if first load
  useState(() => {
    if (!load('habits')) save('habits', defaultHabits)
  })

  const active = habits.filter(h => !h.archived)
  const archived = habits.filter(h => h.archived)

  const saveHabits = (h) => { setHabits(h); save('habits', h); onChanged?.() }

  const addHabit = () => {
    if (!newH.name.trim()) { toast('Digite o nome.', 'warning'); return }
    const h = {
      id: generateId(),
      name: newH.name.trim(),
      type: newH.type,
      goal: ['quantitative', 'time'].includes(newH.type) ? newH.goal : undefined,
      rule: ['quantitative', 'time'].includes(newH.type) ? newH.rule : undefined,
      unit: newH.type === 'quantitative' ? newH.unit : undefined,
      category: newH.category,
      archived: false,
    }
    saveHabits([...habits, h])
    toast(`"${h.name}" criado!`, 'success')
    setShowAddModal(false)
    setNewH({ name: '', type: 'checklist', goal: '', rule: '≥', unit: '', category: 'outro' })
  }

  const archiveHabit = (id) => { saveHabits(habits.map(h => h.id === id ? { ...h, archived: true } : h)); toast('Arquivado.', 'info') }
  const restoreHabit = (id) => { saveHabits(habits.map(h => h.id === id ? { ...h, archived: false } : h)); toast('Restaurado!', 'success') }

  const startEdit = (h) => {
    setEditingId(h.id)
    setEditValues({ name: h.name, type: h.type, goal: h.goal || '', rule: h.rule || '≥', unit: h.unit || '', category: h.category || 'outro' })
  }

  const saveEdit = () => {
    if (!editValues.name.trim()) { toast('Nome vazio.', 'warning'); return }
    saveHabits(habits.map(h => h.id !== editingId ? h : {
      ...h,
      name: editValues.name.trim(),
      type: editValues.type,
      goal: ['quantitative', 'time'].includes(editValues.type) ? editValues.goal : undefined,
      rule: ['quantitative', 'time'].includes(editValues.type) ? editValues.rule : undefined,
      unit: editValues.type === 'quantitative' ? editValues.unit : undefined,
      category: editValues.category,
    }))
    toast('Atualizado!', 'success')
    setEditingId(null)
  }

  // Group active by category
  const grouped = {}
  for (const h of active) {
    const cat = h.category || 'outro'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(h)
  }

  const renderHabitRow = (h) => (
    <div key={h.id} className="bg-bg rounded-lg p-2.5 flex items-center gap-2 transition-colors">
      {editingId === h.id ? (
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          <input value={editValues.name} onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))} className="border border-border rounded-lg px-2 py-1.5 text-sm flex-1 min-w-28 bg-input-bg" autoFocus aria-label="Nome" />
          <select value={editValues.type} onChange={e => setEditValues(v => ({ ...v, type: e.target.value }))} className="border border-border rounded-lg px-2 py-1.5 text-sm bg-input-bg" aria-label="Tipo">
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={editValues.category} onChange={e => setEditValues(v => ({ ...v, category: e.target.value }))} className="border border-border rounded-lg px-2 py-1.5 text-sm bg-input-bg" aria-label="Categoria">
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {editValues.type === 'quantitative' && (
            <>
              <select value={editValues.rule} onChange={e => setEditValues(v => ({ ...v, rule: e.target.value }))} className="border border-border rounded-lg px-2 py-1.5 text-sm w-14 bg-input-bg" aria-label="Regra"><option>≥</option><option>≤</option><option>=</option></select>
              <input value={editValues.goal} onChange={e => setEditValues(v => ({ ...v, goal: e.target.value }))} className="border border-border rounded-lg px-2 py-1.5 text-sm w-16 bg-input-bg" placeholder="Meta" aria-label="Meta" />
              <input value={editValues.unit} onChange={e => setEditValues(v => ({ ...v, unit: e.target.value }))} className="border border-border rounded-lg px-2 py-1.5 text-sm w-16 bg-input-bg" placeholder="Unid." aria-label="Unidade" />
            </>
          )}
          {editValues.type === 'time' && (
            <>
              <select value={editValues.rule} onChange={e => setEditValues(v => ({ ...v, rule: e.target.value }))} className="border border-border rounded-lg px-2 py-1.5 text-sm w-14 bg-input-bg" aria-label="Regra"><option>≤</option><option>≥</option><option>=</option></select>
              <input type="time" value={editValues.goal} onChange={e => setEditValues(v => ({ ...v, goal: e.target.value }))} className="border border-border rounded-lg px-2 py-1.5 text-sm bg-input-bg" aria-label="Meta" />
            </>
          )}
          <button onClick={saveEdit} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 cursor-pointer transition-colors" aria-label="Salvar"><Check size={16} /></button>
          <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-muted cursor-pointer transition-colors" aria-label="Cancelar"><X size={16} /></button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm">{h.name}</span>
            <span className="text-xs text-text-muted ml-2">
              {TYPE_LABELS[h.type]}
              {h.type === 'quantitative' && ` ${h.rule} ${h.goal} ${h.unit}`}
              {h.type === 'time' && ` ${h.rule} ${h.goal}`}
            </span>
          </div>
          <button onClick={() => startEdit(h)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary cursor-pointer transition-colors" aria-label="Editar"><Edit size={14} /></button>
          {h.archived ? (
            <button onClick={() => restoreHabit(h.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-success cursor-pointer transition-colors" aria-label="Restaurar"><RotateCcw size={14} /></button>
          ) : (
            <button onClick={() => archiveHabit(h.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-warning cursor-pointer transition-colors" aria-label="Arquivar"><Archive size={14} /></button>
          )}
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ClipboardList size={18} className="text-primary" />
        <h3 className="font-bold text-base">Gerenciar Hábitos</h3>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="bg-card rounded-xl p-4 shadow-sm border border-border transition-colors">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">{CATEGORY_LABELS[cat] || cat}</h4>
          <div className="space-y-1.5">
            {items.map(renderHabitRow)}
          </div>
        </div>
      ))}

      <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 cursor-pointer transition-colors">
        <Plus size={16} /> Adicionar Hábito
      </button>

      {archived.length > 0 && (
        <div>
          <button onClick={() => setShowArchived(!showArchived)} className="text-sm text-text-muted hover:text-text cursor-pointer underline">
            {showArchived ? 'Ocultar' : 'Mostrar'} arquivados ({archived.length})
          </button>
          {showArchived && (
            <div className="bg-card rounded-xl p-4 shadow-sm border border-border mt-2 space-y-1.5 transition-colors">
              {archived.map(renderHabitRow)}
            </div>
          )}
        </div>
      )}

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Novo Hábito">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1" htmlFor="cfg-h-name">Nome</label>
            <input id="cfg-h-name" value={newH.name} onChange={e => setNewH(v => ({ ...v, name: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg" placeholder="Ex: Meditação" autoFocus onKeyDown={e => e.key === 'Enter' && !['quantitative', 'time'].includes(newH.type) && addHabit()} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1" htmlFor="cfg-h-type">Tipo</label>
              <select id="cfg-h-type" value={newH.type} onChange={e => setNewH(v => ({ ...v, type: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg">
                <option value="checklist">Checklist</option>
                <option value="quantitative">Quantitativo</option>
                <option value="abstinence">Abstinência</option>
                <option value="time">Horário</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1" htmlFor="cfg-h-cat">Categoria</label>
              <select id="cfg-h-cat" value={newH.category} onChange={e => setNewH(v => ({ ...v, category: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          {newH.type === 'quantitative' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Regra</label>
                <select value={newH.rule} onChange={e => setNewH(v => ({ ...v, rule: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg"><option>≥</option><option>≤</option><option>=</option></select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Meta</label>
                <input value={newH.goal} onChange={e => setNewH(v => ({ ...v, goal: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg" placeholder="30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Unidade</label>
                <input value={newH.unit} onChange={e => setNewH(v => ({ ...v, unit: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg" placeholder="min" />
              </div>
            </div>
          )}
          {newH.type === 'time' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Regra</label>
                <select value={newH.rule} onChange={e => setNewH(v => ({ ...v, rule: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg"><option>≤</option><option>≥</option><option>=</option></select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Horário meta</label>
                <input type="time" value={newH.goal} onChange={e => setNewH(v => ({ ...v, goal: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm w-full bg-input-bg" />
              </div>
            </div>
          )}
          <button onClick={addHabit} className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark cursor-pointer transition-colors">Criar Hábito</button>
        </div>
      </Modal>
    </div>
  )
}

/* ─── Backup ───────────────────────────────────────────────── */
function BackupSection() {
  const toast = useToast()
  const fileRef = useRef(null)
  const [importText, setImportText] = useState('')
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [pendingImport, setPendingImport] = useState(null)

  const handleExport = () => {
    downloadJSON(exportAll(), `pplul-backup-${new Date().toISOString().slice(0, 10)}.json`)
    toast('Backup baixado!', 'success')
  }

  const processImport = (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr)
      if (!data.version) throw new Error('JSON inválido')
      setPendingImport(data)
      setShowImportConfirm(true)
    } catch (err) { toast('Erro: ' + err.message, 'error', 4000) }
  }

  const confirmImport = () => {
    importAll(pendingImport)
    toast('Importado! Recarregando...', 'success')
    setShowImportConfirm(false)
    setTimeout(() => window.location.reload(), 1000)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => processImport(reader.result)
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Database size={18} className="text-primary" />
        <h3 className="font-bold text-base">Backup & Restauração</h3>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark cursor-pointer transition-colors">
          <Download size={16} /> Baixar Backup
        </button>
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-text rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">
          <Upload size={16} /> Importar Arquivo
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1" htmlFor="cfg-import">Ou cole o JSON:</label>
        <textarea id="cfg-import" value={importText} onChange={e => setImportText(e.target.value)} rows={3} className="border border-border rounded-lg px-3 py-2 text-sm w-full resize-none font-mono bg-input-bg" placeholder='{"version":1, ...}' />
        <button onClick={() => importText.trim() && processImport(importText)} disabled={!importText.trim()} className="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Importar
        </button>
      </div>

      <ConfirmDialog open={showImportConfirm} onClose={() => setShowImportConfirm(false)} onConfirm={confirmImport} title="Importar dados" message="Isso substituirá todos os dados atuais. Faça backup antes." confirmText="Importar" />
    </div>
  )
}

/* ─── Main ─────────────────────────────────────────────────── */
export default function Configuracoes({ onChanged }) {
  return (
    <div className="space-y-8">
      <HabitEditor onChanged={onChanged} />
      <hr className="border-border" />
      <PlanEditor onChanged={onChanged} />
      <hr className="border-border" />
      <BackupSection />
    </div>
  )
}
