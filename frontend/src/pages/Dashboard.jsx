import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, CalendarHeart, Droplets, Flower2, Repeat2, Sparkles, Plus, Check } from 'lucide-react'
import { useData } from '../context/DataContext'
import PeriodModal from '../components/PeriodModal'
import { PageTitle, StatCard } from '../components/ui'
import { PHASES, TIPS, DISCLAIMER } from '../lib/content'
import { fmt, fmtShort, todayISO } from '../lib/dates'

function Ring({ day, total }) {
  const r = 78
  const c = 2 * Math.PI * r
  const pct = Math.min(1, Math.max(0, day / total))
  return (
    <div className="relative h-52 w-52 shrink-0">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a98fe3" />
            <stop offset="100%" stopColor="#ee89a6" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={r} fill="none" stroke="#eee8fa" strokeWidth="16" />
        <motion.circle
          cx="100" cy="100" r={r} fill="none" stroke="url(#ring)" strokeWidth="16" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-medium uppercase tracking-widest text-lavender-600">Cycle day</span>
        <span className="font-display text-6xl leading-none">{day}</span>
        <span className="mt-1 text-xs text-lavender-700">of ~{total}</span>
      </div>
    </div>
  )
}

function nextLabel(stats) {
  const n = stats.days_until_next_period
  if (n == null) return { value: '-', hint: 'Log a period to see this' }
  if (n > 1) return { value: fmtShort(stats.next_period_start), hint: `in ${n} days` }
  if (n === 1) return { value: fmtShort(stats.next_period_start), hint: 'tomorrow' }
  if (n === 0) return { value: 'Today', hint: 'expected to start' }
  return { value: fmtShort(stats.next_period_start), hint: `${-n} day${n === -1 ? '' : 's'} late - cycles vary` }
}

function headline(stats, ongoing) {
  const n = stats.days_until_next_period
  if (ongoing) return 'Your period is on'
  if (n == null) return ''
  if (n < 0) return 'Your period may be late'
  if (n === 0) return 'Your period is expected today'
  if (n === 1) return 'Next period tomorrow'
  return `Next period in ${n} days`
}

export default function Dashboard({ go }) {
  const { stats, periods } = useData()
  const [modal, setModal] = useState(null) // { period?, defaults? }

  const empty = stats.total_periods === 0
  const last = periods[periods.length - 1]
  const ongoing = stats.is_period_ongoing
  const cycleTotal = stats.average_cycle_length || 28
  const phase = stats.phase ? PHASES[stats.phase] : null
  const next = nextLabel(stats)
  const tip = TIPS[new Date().getDate() % TIPS.length]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      <PageTitle title={`${greeting} 🌸`} subtitle={fmt(todayISO(), { weekday: 'long', day: 'numeric', month: 'long' })} />

      {empty ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col items-center p-8 text-center sm:p-12">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-lavender-100 to-blush-100">
            <Flower2 className="text-lavender-500" size={36} />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl">Welcome to Bloom</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-lavender-700">
            Log your first period and Bloom will start learning your rhythm - predicting your next period, tracking your cycle length and spotting patterns.
            Everything you save is kept safely in your database.
          </p>
          <button className="btn btn-primary mt-6" onClick={() => setModal({})}>
            <Plus size={18} /> Log your first period
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col items-center gap-6 bg-gradient-to-br from-white to-lavender-50 p-6 sm:flex-row sm:p-8">
            <Ring day={stats.current_cycle_day ?? 1} total={cycleTotal} />
            <div className="flex-1 text-center sm:text-left">
              {phase && (
                <span className="inline-block rounded-full bg-blush-100 px-3 py-1 text-xs font-semibold text-blush-600">{phase.name}</span>
              )}
              <h2 className="font-display mt-3 text-2xl sm:text-3xl">
                {headline(stats, ongoing)}
              </h2>
              {phase && <p className="mt-2 text-sm leading-relaxed text-lavender-700">{phase.blurb}</p>}
              <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
                {ongoing ? (
                  <button className="btn btn-primary" onClick={() => setModal({ period: last })}>
                    <Check size={18} /> Period ended - add end date
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={() => setModal({})}>
                    <Plus size={18} /> Log period
                  </button>
                )}
                <button className="btn btn-soft" onClick={() => go('symptoms')}>
                  <Droplets size={18} /> Log how I feel
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {[
              <StatCard key="a" icon={CalendarHeart} label="Last period" value={fmtShort(stats.last_period_start)} hint={stats.last_period_end ? `until ${fmtShort(stats.last_period_end)}` : 'ongoing'} />,
              <StatCard key="b" icon={Sparkles} label="Cycle day" value={stats.current_cycle_day ?? '-'} hint={ongoing ? 'period in progress' : undefined} tone="blush" />,
              <StatCard key="c" icon={Repeat2} label="Avg. cycle" value={`${cycleTotal} days`} hint={stats.average_cycle_is_estimate ? 'default - log 2+ periods' : `last ${Math.min(6, stats.total_periods - 1)} cycles`} />,
              <StatCard key="d" icon={CalendarClock} label="Next period" value={next.value} hint={next.hint} tone="blush" />,
              <StatCard key="e" icon={Flower2} label="Periods logged" value={stats.total_cycles} hint={stats.total_cycles === 1 ? 'cycle tracked' : 'cycles tracked'} />,
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }} className={i === 4 ? 'col-span-2 lg:col-span-1' : ''}>
                {card}
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="grid gap-4 md:grid-cols-2">
            {phase && (
              <div className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-lavender-600">For your phase</p>
                <p className="mt-2 text-sm leading-relaxed">{phase.tip}</p>
              </div>
            )}
            <button onClick={() => go('tips')} className="card p-5 text-left transition hover:shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-blush-500">Tip of the day</p>
              <p className="mt-2 font-medium">{tip.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-lavender-700">{tip.body}</p>
            </button>
          </motion.div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-lavender-700/70">{DISCLAIMER}</p>
      <PeriodModal open={!!modal} onClose={() => setModal(null)} period={modal?.period} defaults={modal?.defaults} />
    </div>
  )
}
