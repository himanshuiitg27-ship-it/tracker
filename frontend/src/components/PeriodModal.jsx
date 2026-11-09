import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Modal, Spinner } from './ui'
import { useData } from '../context/DataContext'
import { addDays, diffDays, todayISO } from '../lib/dates'

/**
 * Add or edit a period.
 * props.period: existing record (edit mode) or null (add mode)
 * props.defaults: { start_date?, end_date? } prefilled values for add mode
 */
export default function PeriodModal({ open, onClose, period, defaults }) {
  const { savePeriod } = useData()
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const today = todayISO()

  useEffect(() => {
    if (!open) return
    setStart(period?.start_date ?? defaults?.start_date ?? today)
    setEnd(period?.end_date ?? defaults?.end_date ?? '')
    setNotes(period?.notes ?? '')
    setError('')
    setSaving(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, period, defaults])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!start) return setError('Please choose when your period started.')
    if (start > today) return setError('Start date cannot be in the future.')
    if (end && end < start) return setError('End date cannot be before the start date.')
    if (end && end > today) return setError('End date cannot be in the future.')
    setSaving(true)
    try {
      await savePeriod(period?.id, { start_date: start, end_date: end || null, notes: notes || null })
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const days = start && end && end >= start ? diffDays(end, start) + 1 : null

  return (
    <Modal open={open} onClose={onClose} title={period ? 'Edit period' : 'Log a period'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="p-start">Start date</label>
            <input id="p-start" type="date" className="input" value={start} max={today} onChange={(e) => setStart(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="p-end">End date</label>
            <input id="p-end" type="date" className="input" value={end} min={start || undefined} max={today} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="chip" onClick={() => setStart(today)}>Started today</button>
          <button type="button" className="chip" onClick={() => setEnd(today)}>Ended today</button>
          {start && (
            <button type="button" className="chip" onClick={() => setEnd(addDays(start, 4) > today ? today : addDays(start, 4))}>
              5 days
            </button>
          )}
          {end && (
            <button type="button" className="chip" onClick={() => setEnd('')}>Still ongoing</button>
          )}
        </div>

        <p className="text-xs text-lavender-700">
          {end
            ? days && `That's ${days} day${days === 1 ? '' : 's'}.`
            : 'Leave the end date empty while your period is still going - you can add it later.'}
        </p>

        <div>
          <label className="label" htmlFor="p-notes">Notes (optional)</label>
          <textarea id="p-notes" rows={3} maxLength={2000} className="input resize-none" placeholder="Anything worth remembering..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-2xl bg-blush-100 p-3 text-sm text-blush-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <button className="btn btn-primary w-full" disabled={saving}>
          {saving && <Spinner className="h-4 w-4" />} {period ? 'Save changes' : 'Save period'}
        </button>
      </form>
    </Modal>
  )
}
