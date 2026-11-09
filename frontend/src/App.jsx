import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Flower2, HeartPulse, LayoutDashboard, LineChart, NotebookPen } from 'lucide-react'
import { DataProvider, useData } from './context/DataContext'
import { ErrorBanner, Spinner, Toast } from './components/ui'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/CalendarPage'
import SymptomsPage from './pages/SymptomsPage'
import TipsPage from './pages/TipsPage'
import HistoryPage from './pages/HistoryPage'

const NAV = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'symptoms', label: 'Symptoms', icon: NotebookPen },
  { id: 'history', label: 'History', icon: LineChart },
  { id: 'tips', label: 'Care', icon: HeartPulse },
]

function Shell() {
  const { loading, loadError, refresh, stats } = useData()
  const [page, setPage] = useState('dashboard')
  const [symptomDate, setSymptomDate] = useState(null)

  const go = useCallback((id, param) => {
    setSymptomDate(id === 'symptoms' ? param ?? null : null)
    setPage(id)
    window.scrollTo({ top: 0 })
  }, [])

  let content
  if (loading) {
    content = (
      <div className="flex h-[60dvh] items-center justify-center text-lavender-500">
        <Spinner className="h-8 w-8" />
      </div>
    )
  } else if (loadError || !stats) {
    content = <ErrorBanner message={loadError} onRetry={refresh} />
  } else {
    const pages = {
      dashboard: <Dashboard go={go} />,
      calendar: <CalendarPage go={go} />,
      symptoms: <SymptomsPage key={symptomDate ?? 'today'} initialDate={symptomDate} />,
      history: <HistoryPage />,
      tips: <TipsPage />,
    }
    content = (
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          {pages[page]}
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-6xl md:flex md:gap-8 md:px-6">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col py-8 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-lavender-400 to-blush-400 text-white">
            <Flower2 size={22} />
          </div>
          <span className="font-display text-2xl">Bloom</span>
        </div>
        <nav className="space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => go(id)}
              aria-current={page === id ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                page === id ? 'bg-white text-lavender-700 shadow-sm' : 'text-lavender-700/80 hover:bg-white/60'
              }`}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-0 md:pb-12 md:pt-10">
        <div className="mb-4 flex items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-lavender-400 to-blush-400 text-white">
            <Flower2 size={17} />
          </div>
          <span className="font-display text-xl">Bloom</span>
        </div>
        {content}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-lavender-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
        <div className="mx-auto flex max-w-md justify-around px-2 py-1.5">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => go(id)}
              aria-current={page === id ? 'page' : undefined}
              className={`flex min-w-14 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[11px] font-medium transition ${
                page === id ? 'text-lavender-600' : 'text-lavender-700/60'
              }`}
            >
              <span className={`rounded-full px-4 py-1 transition ${page === id ? 'bg-lavender-100' : ''}`}><Icon size={20} /></span>
              {label}
            </button>
          ))}
        </div>
      </nav>

      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  )
}
