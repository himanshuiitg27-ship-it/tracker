import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, NotebookPen } from 'lucide-react'
import { useData } from '../context/DataContext'
import PeriodModal from '../components/PeriodModal'
import { ConfirmDialog, PageTitle } from '../components/ui'
import { CRAMP_LABELS, ENERGY_LABELS, MOODS } from '../lib/content'
import { addDays, fmtLong, fmtMonth, fmtRange, parseISO, toISO, todayISO } from '../lib/dates'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function* eachDay(start, end) {
  for (let d = start; d <= end; d = addDays(d, 1)) yield d
}

export default function CalendarPage({ go }) {
  const { periods, stats, symptoms, removePeriod, notify } = useData()
  const today = todayISO()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const [selected, setSelected] = useState(today)
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // date -> period (recorded) / predicted range / symptom log
  const { recorded, predicted, symptomByDate } = useMemo(() => {
    const recorded = new Map()
    for (const p of periods) {
      for (const d of eachDay(p.start_date, p.end_date ?? (today > p.start_date ? today : p.start_date))) recorded.set(d, p)
    }
    const predicted = new Map()
    for (const pr of stats.predictions) {
      for (const d of eachDay(pr.start_date, pr.end_date)) if (!recorded.has(d)) predicted.set(d, pr)
    }
    const symptomByDate = new Map(symptoms.map((s) => [s.log_date, s]))
    return { recorded, predicted, symptomByDate }
  }, [periods, stats, symptoms, today])

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1)
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
    const out = Array(first.getDay()).fill(null)
    for (let i = 1; i <= daysInMonth; i++) out.push(toISO(new Date(cursor.y, cursor.m, i)))
    return out
  }, [cursor])

  const shift = (n) => setCursor(({ y, m }) => {
    const d = new Date(y, m + n, 1)
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const goToday = () => {
    const d = new Date()
    setCursor({ y: d.getFullYear(), m: d.getMonth() })
    setSelected(today)
  }

  const selPeriod = recorded.get(selected)
  const selPred = predicted.get(selected)
  const selLog = symptomByDate.get(selected)
  const isFuture = selected > today
  const isOvulation = stats.estimated_ovulation === selected && !selPeriod

  const doDelete = async () => {
    setDeleting(true)
    try {
      await removePeriod(confirm.id)
      setConfirm(null)
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  function dayClasses(d) {
    const p = recorded.get(d)
    const base = 'relative flex aspect-square w-full items-center justify-center text-sm font-medium transition'
    let cls = base
    if (p) {
      const isStart = p.start_date === d
      const isEnd = (p.end_date ?? today) === d
      cls += ' bg-blush-400 text-white hover:bg-blush-500 '
      cls += isStart ? 'rounded-l-full ' : ''
      cls += isEnd ? 'rounded-r-full ' : ''
      if (isStart && isEnd) cls += 'rounded-full '
    } else if (predicted.has(d)) {
      cls += ' rounded-full border-2 border-dashed border-lavender-300 bg-lavender-100 text-lavender-700 hover:bg-lavender-200'
    } else {
      cls += ' rounded-full hover:bg-lavender-100'
    }
    return cls
  }

  return (
    <div>
      <PageTitle
        title="Calendar"
        subtitle="Tap any day to see details"
        action={<button className="btn btn-primary" onClick={() => setModal({})}><Plus size={18} /> Log</button>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <button className="rounded-full p-2 hover:bg-lavender-100" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft /></button>
            <div className="text-center">
              <h2 className="font-display text-xl sm:text-2xl">{fmtMonth(cursor.y, cursor.m)}</h2>
              <button onClick={goToday} className="text-xs font-semibold text-lavender-600 hover:underline">Jump to today</button>
            </div>
            <button className="rounded-full p-2 hover:bg-lavender-100" onClick={() => shift(1)} aria-label="Next month"><ChevronRight /></button>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold text-lavender-600">
            {WEEKDAYS.map((w, i) => <div key={i} className="py-1">{w}</div>)}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${cursor.y}-${cursor.m}`}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
              className="grid grid-cols-7 gap-y-1"
            >
              {cells.map((d, i) =>
                d === null ? <div key={`e${i}`} /> : (
                  <button
                    key={d}
                    onClick={() => setSelected(d)}
                    aria-label={fmtLong(d)}
                    aria-pressed={selected === d}
                    className={`${dayClasses(d)} ${selected === d ? 'z-10 ring-2 ring-lavender-600 ring-offset-2 ring-offset-white' : ''} ${d === today && selected !== d ? 'ring-2 ring-lavender-300' : ''}`}
                  >
                    {parseISO(d).getDate()}
                    {symptomByDate.has(d) && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-lavender-500" />}
                    {stats.estimated_ovulation === d && !recorded.has(d) && <span className="absolute right-1 top-1 text-[10px]">✦</span>}
                  </button>
                ),
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-lavender-700">
            <span className="flex items-center gap-1.5"><i className="h-3 w-5 rounded-full bg-blush-400" /> Period</span>
            <span className="flex items-center gap-1.5"><i className="h-3 w-5 rounded-full border-2 border-dashed border-lavender-300 bg-lavender-100" /> Estimated</span>
            <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-lavender-500" /> Symptoms logged</span>
            <span className="flex items-center gap-1.5"><span className="text-[11px]">✦</span> Est. ovulation</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={selected} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="card h-fit space-y-4 p-5 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-lavender-600">{selected === today ? 'Today' : isFuture ? 'Upcoming' : 'Selected day'}</p>
              <h3 className="font-display text-xl">{fmtLong(selected)}</h3>
            </div>

            {selPeriod && (
              <div className="rounded-2xl bg-blush-50 p-4">
                <p className="text-sm font-semibold text-blush-600">Period recorded</p>
                <p className="mt-1 font-medium">{fmtRange(selPeriod.start_date, selPeriod.end_date)}</p>
                <p className="text-sm text-lavender-700">
                  {selPeriod.duration_days ? `${selPeriod.duration_days} days` : 'Still ongoing'}
                  {selPeriod.cycle_length ? ` · ${selPeriod.cycle_length}-day cycle` : ''}
                </p>
                {selPeriod.notes && <p className="mt-2 rounded-xl bg-white p-3 text-sm">{selPeriod.notes}</p>}
                <div className="mt-3 flex gap-2">
                  <button className="btn btn-soft flex-1 !py-2" onClick={() => setModal({ period: selPeriod })}><Pencil size={15} /> Edit</button>
                  <button className="btn btn-danger flex-1 !py-2" onClick={() => setConfirm(selPeriod)}><Trash2 size={15} /> Delete</button>
                </div>
              </div>
            )}

            {selPred && (
              <div className="rounded-2xl border-2 border-dashed border-lavender-300 bg-lavender-50 p-4">
                <p className="text-sm font-semibold text-lavender-600">Estimated period</p>
                <p className="mt-1 font-medium">{fmtRange(selPred.start_date, selPred.end_date)}</p>
                <p className="text-sm text-lavender-700">Based on your average cycle of {stats.average_cycle_length ?? 28} days. Real cycles vary by a few days.</p>
              </div>
            )}

            {isOvulation && (
              <div className="rounded-2xl bg-lavender-50 p-4 text-sm text-lavender-700">
                ✦ Estimated ovulation day - roughly 14 days before your next period. This is only an estimate.
              </div>
            )}

            {selLog && (
              <div className="rounded-2xl bg-lavender-50 p-4 text-sm">
                <p className="font-semibold text-lavender-600">Mood &amp; symptoms</p>
                <ul className="mt-2 space-y-1">
                  {selLog.mood && <li>{MOODS.find((m) => m.value === selLog.mood)?.emoji} Mood: {selLog.mood}</li>}
                  <li>Cramps: {CRAMP_LABELS[selLog.cramps]}</li>
                  <li>Energy: {ENERGY_LABELS[selLog.energy]}</li>
                  {selLog.flow && <li>Flow: {selLog.flow}</li>}
                  {selLog.notes && <li className="pt-1 italic">“{selLog.notes}”</li>}
                </ul>
              </div>
            )}

            {!selPeriod && !selPred && !selLog && !isOvulation && (
              <p className="text-sm text-lavender-700">{isFuture ? 'Nothing predicted for this day.' : 'No period or symptoms recorded on this day.'}</p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
              {!selPeriod && !isFuture && (
                <button className="btn btn-primary flex-1" onClick={() => setModal({ defaults: { start_date: selected } })}>
                  <Plus size={16} /> Period started here
                </button>
              )}
              {!isFuture && (
                <button className="btn btn-soft flex-1" onClick={() => go('symptoms', selected)}>
                  <NotebookPen size={16} /> {selLog ? 'Edit' : 'Log'} symptoms
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <PeriodModal open={!!modal} onClose={() => setModal(null)} period={modal?.period} defaults={modal?.defaults} />
      <ConfirmDialog
        open={!!confirm}
        busy={deleting}
        title="Delete this period?"
        message={confirm ? `${fmtRange(confirm.start_date, confirm.end_date)} will be permanently removed. Your other records stay untouched.` : ''}
        onCancel={() => setConfirm(null)}
        onConfirm={doDelete}
      />
    </div>
  )
}
