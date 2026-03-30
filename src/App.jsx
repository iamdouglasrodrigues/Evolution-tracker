import { useState, useEffect } from 'react'
import { ToastProvider } from './components/Toast'
import SessaoTreino from './components/SessaoTreino'
import Habitos from './components/Habitos'
import Evolucao from './components/Evolucao'
import HistoricoTreino from './components/HistoricoTreino'
import Configuracoes from './components/Configuracoes'
import { Moon, Sun, ClipboardList, Dumbbell, TrendingUp, History, Settings, Download, X } from 'lucide-react'

const TABS = [
  { key: 'habitos', label: 'Hábitos', icon: ClipboardList },
  { key: 'sessao', label: 'Treino', icon: Dumbbell },
  { key: 'evolucao', label: 'Evolução', icon: TrendingUp },
  { key: 'historico', label: 'Histórico', icon: History },
  { key: 'config', label: 'Config', icon: Settings },
]

export default function App() {
  const [tab, setTab] = useState('habitos')
  const [editSession, setEditSession] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [dark, setDark] = useState(() => localStorage.getItem('pplul_dark') === 'true')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const refresh = () => setRefreshKey(k => k + 1)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('pplul_dark', dark)
  }, [dark])

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      if (!localStorage.getItem('pplul_install_dismissed')) {
        setShowInstallBanner(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') {
      setShowInstallBanner(false)
    }
    setInstallPrompt(null)
  }

  const dismissInstall = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pplul_install_dismissed', '1')
  }

  const handleEditSession = (session) => {
    setEditSession(session)
    setTab('sessao')
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg transition-colors duration-300 pb-20 sm:pb-4">
        {/* Desktop header */}
        <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm transition-colors duration-300 hidden sm:block">
          <div className="max-w-4xl mx-auto px-3">
            <div className="flex items-center justify-between py-3">
              <h1 className="text-xl font-bold text-primary m-0">PPLUL Tracker</h1>
              <button
                onClick={() => setDark(d => !d)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-text-muted cursor-pointer transition-colors"
                aria-label={dark ? 'Modo claro' : 'Modo escuro'}
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
            <nav className="flex gap-1 overflow-x-auto pb-2 -mb-px">
              {TABS.map(t => {
                const Icon = t.icon
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5
                      ${tab === t.key
                        ? 'bg-primary text-white shadow-md'
                        : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Icon size={15} />
                    {t.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </header>

        {/* Mobile header (minimal) */}
        <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm transition-colors duration-300 sm:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold text-primary m-0">PPLUL Tracker</h1>
            <button
              onClick={() => setDark(d => !d)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-text-muted cursor-pointer transition-colors"
              aria-label={dark ? 'Modo claro' : 'Modo escuro'}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* PWA install banner */}
        {showInstallBanner && (
          <div className="max-w-4xl mx-auto px-3 pt-3">
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center gap-3 animate-tab-fade">
              <Download size={20} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Instalar app no celular</p>
                <p className="text-xs text-text-muted">Funciona offline, abre como app nativo</p>
              </div>
              <button onClick={handleInstall} className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-primary-dark transition-colors shrink-0">
                Instalar
              </button>
              <button onClick={dismissInstall} className="p-1 text-text-muted cursor-pointer" aria-label="Fechar">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <main className="max-w-4xl mx-auto px-3 py-4 animate-tab-fade" key={tab}>
          {tab === 'habitos' && <Habitos key={refreshKey} />}
          {tab === 'sessao' && (
            <SessaoTreino
              key={refreshKey}
              editSession={editSession}
              onSaved={() => { setEditSession(null); refresh() }}
            />
          )}
          {tab === 'evolucao' && <Evolucao key={refreshKey} />}
          {tab === 'historico' && (
            <HistoricoTreino
              key={refreshKey}
              onEdit={handleEditSession}
              onDelete={refresh}
            />
          )}
          {tab === 'config' && <Configuracoes key={refreshKey} onChanged={refresh} />}
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 sm:hidden transition-colors duration-300">
          <div className="flex justify-around">
            {TABS.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex flex-col items-center gap-0.5 py-2 px-3 cursor-pointer transition-colors flex-1
                    ${tab === t.key ? 'text-primary' : 'text-text-muted'}`}
                >
                  <Icon size={20} strokeWidth={tab === t.key ? 2.5 : 1.5} />
                  <span className="text-[10px] font-medium">{t.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </ToastProvider>
  )
}
