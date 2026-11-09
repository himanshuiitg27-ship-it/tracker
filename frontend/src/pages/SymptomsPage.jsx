import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Pencil, Trash2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { ConfirmDialog, PageTitle, Spinner } from '../components/ui'
import { CRAMP_LABELS, ENERGY_LABELS, FLOWS, MOODS } from '../lib/content'
import { fmt, fmtLong, todayISO } from '../lib/dates'

const BLANK = { cramps: 0, energy: 3, mood: null, flow: null, notes: '' }

export default function SymptomsPage({ initialDate }) {
  const { symptoms, saveSymptom, removeSymptom, notify } = useData()
  const today = todayISO()
  const [date, setDate] = useState(initialDate || today)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const existing = symptoms.find((s) => s.log_date === date)

  // Load whatever is already saved for the chosen day.
  useEffect(() => {
    setForm(existing ? { cramps: existing.cramps, energy: existing.energy, mood: existing.mood, flow: existing.flow, notes: existing.notes ?? '' } : BLANK)
    setError('')
  }, [date, existing])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const toggle = (key, value) => set({ [key]: form[key] === value ? null : value })

  const submit = async (e) => {
    e.preventDefault()
    if (date > today) return setError("You can't log a future day.")
    setSaving(true)
    setError('')
    try {
      await saveSymptom({ log_date: date, ...form, notes: form.notes || null })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    setDeleting(true)
    try {
      await removeSymptom(confirm.id)
      setConfirm(null)
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageTitle title="Mood & Symptoms" subtitle="How are you feeling? Your logs help reveal patterns." />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={submit} className="card space-y-6 p-5 sm:p-7">
          <div>
            <label className="label" htmlFor="s-date">Date</label>
            <input id="s-date" type="date" className="input" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
            {existing && <p className="mt-1.5 text-xs text-lavender-600">You already logged this day - saving will update it.</p>}
          </div>

          <div>
            <p className="label">Flow intensity</p>
            <div className="flex flex-wrap gap-2">
              {FLOWS.map((f) => (
                <button type="button" key={f.value} className="chip" aria-pressed={form.flow === f.value} onClick={() => toggle('flow', f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Mood</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button type="button" key={m.value} className="chip" aria-pressed={form.mood === m.value} onClick={() => toggle('mood', m.value)}>
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="s-cramps">Cramps: <span className="font-normal">{CRAMP_LABELS[form.cramps]}</span></label>
            <input id="s-cramps" type="range" min="0" max="5" step="1" value={form.cramps} onChange={(e) => set({ cramps: +e.target.value })} />
          </div>

          <div>
            <label className="label" htmlFor="s-energy">Energy: <span className="font-normal">{ENERGY_LABELS[form.energy]}</span></label>
            <input id="s-energy" type="range" min="1" max="5" step="1" value={form.energy} onChange={(e) => set({ energy: +e.target.value })} />
          </div>

          <div>
            <label className="label" htmlFor="s-notes">Personal notes</label>
            <textarea id="s-notes" rows={3} maxLength={2000} className="input resize-none" placeholder="Headache, cravings, how your day went..." value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-2xl bg-blush-100 p-3 text-sm text-blush-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <button className="btn btn-primary w-full" disabled={saving}>
            {saving && <Spinner className="h-4 w-4" />} {existing ? 'Update log' : 'Save log'}
          </button>
        </form>

        <div className="card h-fit p-5 sm:p-6">
          <h2 className="font-display text-xl">Recent logs</h2>
          {symptoms.length === 0 ? (
            <p className="mt-3 text-sm text-lavender-700">Nothing logged yet. Your entries will appear here.</p>
          ) : (
            <ul className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto pr-1">
              {symptoms.slice(0, 30).map((s) => (
                <motion.li layout key={s.id} className={`rounded-2xl p-3 text-sm ${s.log_date === date ? 'bg-lavender-100' : 'bg-lavender-50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{fmt(s.log_date, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      <p className="text-lavender-700">
                        {[s.mood && `${MOODS.find((m) => m.value === s.mood)?.emoji} ${s.mood}`, s.flow && `${s.flow} flow`, `cramps: ${CRAMP_LABELS[s.cramps].toLowerCase()}`, `energy: ${ENERGY_LABELS[s.energy].toLowerCase()}`].filter(Boolean).join(' · ')}
                      </p>
                      {s.notes && <p className="mt-1 italic">“{s.notes}”</p>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button aria-label={`Edit ${fmtLong(s.log_date)}`} className="rounded-full p-2 text-lavender-600 hover:bg-white" onClick={() => { setDate(s.log_date); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><Pencil size={15} /></button>
                      <button aria-label={`Delete ${fmtLong(s.log_date)}`} className="rounded-full p-2 text-blush-500 hover:bg-white" onClick={() => setConfirm(s)}><Trash2 size={15} /></button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        busy={deleting}
        title="Delete this log?"
        message={confirm ? `Your log for ${fmtLong(confirm.log_date)} will be permanently removed.` : ''}
        onCancel={() => setConfirm(null)}
        onConfirm={doDelete}
      />
    </div>
  )
}
