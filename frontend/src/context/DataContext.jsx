import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { todayISO } from '../lib/dates'

const DataContext = createContext(null)
export const useData = () => useContext(DataContext)

export function DataProvider({ children }) {
  const [periods, setPeriods] = useState([])
  const [stats, setStats] = useState(null)
  const [symptoms, setSymptoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [toast, setToast] = useState(null)

  // Single source of truth is the backend: every screen reads what this loads.
  const refresh = useCallback(async () => {
    try {
      const [p, s, sy] = await Promise.all([api.listPeriods(), api.getStats(todayISO()), api.listSymptoms()])
      setPeriods(p)
      setStats(s)
      setSymptoms(sy)
      setLoadError(null)
    } catch (e) {
      setLoadError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  // Mutations: wait for the server, then re-fetch everything so calendar,
  // dashboard and history are always in sync with the database.
  const actions = useMemo(
    () => ({
      async savePeriod(id, data) {
        if (id) await api.updatePeriod(id, data)
        else await api.createPeriod(data)
        await refresh()
        notify(id ? 'Period updated' : 'Period saved')
      },
      async removePeriod(id) {
        await api.deletePeriod(id)
        await refresh()
        notify('Period deleted')
      },
      async saveSymptom(data) {
        await api.saveSymptom(data)
        await refresh()
        notify('Daily log saved')
      },
      async removeSymptom(id) {
        await api.deleteSymptom(id)
        await refresh()
        notify('Log deleted')
      },
    }),
    [refresh, notify],
  )

  const value = { periods, stats, symptoms, loading, loadError, refresh, toast, notify, ...actions }
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
