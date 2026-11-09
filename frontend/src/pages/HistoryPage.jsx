import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData } from '../context/DataContext'
import PeriodModal from '../components/PeriodModal'
import { ConfirmDialog, PageTitle } from '../components/ui'
import { fmt, fmtRange, fmtShort } from '../lib/dates'

const tooltipStyle = { borderRadius: 14, border: '1px solid #ddd1f5', boxShadow: '0 8px 24px -10px rgba(116,82,187,.3)' }

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="mb-4 text-xs text-lavender-700">{subtitle}</p>
      <div className="h-56">{children}</div>
    </div>
  )
}

export default function HistoryPage() {
  const { periods, stats, removePeriod, notify } = useData()
  const [newestFirst, setNewestFirst] = useState(true)
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const rows = useMemo(() => (newestFirst ? [...periods].reverse() : periods), [periods, newestFirst])
  const cycleData = stats.cycle_lengths.map((c) => ({ date: fmtShort(c.start_date), cycle: c.cycle_length, period: c.period_length }))
  const periodData = periods.filter((p) => p.duration_days).map((p) => ({ date: fmtShort(p.start_date), days: p.duration_days }))
  const variation = stats.longest_cycle != null ? stats.longest_cycle - stats.shortest_cycle : null

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

  return (
    <div>
      <PageTitle
        title="History & Insights"
        subtitle={`${periods.length} period${periods.length === 1 ? '' : 's'} saved`}
        action={<button className="btn btn-primary" onClick={() => setModal({})}><Plus size={18} /> Add</button>}
      />

      {periods.length === 0 ? (
        <div className="card p-10 text-center text-sm text-lavender-700">No periods recorded yet. Add your first one to see your history and charts.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Average cycle', stats.average_cycle_is_estimate ? '-' : `${stats.average_cycle_length} d`],
              ['Shortest', stats.shortest_cycle ? `${stats.shortest_cycle} d` : '-'],
              ['Longest', stats.longest_cycle ? `${stats.longest_cycle} d` : '-'],
              ['Avg. period', stats.average_period_length ? `${stats.average_period_length} d` : '-'],
            ].map(([label, value]) => (
              <div key={label} className="card p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-lavender-600">{label}</p>
                <p className="font-display text-2xl">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Cycle length"
              subtitle={variation != null ? `Varies by ${variation} day${variation === 1 ? '' : 's'} between your shortest and longest cycle` : 'Add one more period to see your first cycle'}
            >
              {cycleData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-lavender-700">Needs at least 2 periods</div>
              ) : (
                <ResponsiveContainer>
                  <LineChart data={cycleData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#eee8fa" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7452bb' }} tickLine={false} axisLine={false} />
                    <YAxis domain={['dataMin - 4', 'dataMax + 4']} allowDecimals={false} tick={{ fontSize: 11, fill: '#7452bb' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} days`, 'Cycle']} labelFormatter={(l) => `Started ${l}`} />
                    {stats.average_cycle_length && <ReferenceLine y={stats.average_cycle_length} stroke="#ee89a6" strokeDasharray="5 4" label={{ value: 'avg', fill: '#e26488', fontSize: 11, position: 'insideTopRight' }} />}
                    <Line type="monotone" dataKey="cycle" stroke="#8d6fd4" strokeWidth={3} dot={{ r: 4, fill: '#8d6fd4', strokeWidth: 0 }} activeDot={{ r: 6 }} animationDuration={900} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Period length" subtitle="Number of days each period lasted">
              {periodData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-lavender-700">Add end dates to see this</div>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={periodData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#eee8fa" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7452bb' }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} domain={[0, 'dataMax + 2']} tick={{ fontSize: 11, fill: '#7452bb' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f7f4fd' }} formatter={(v) => [`${v} days`, 'Length']} labelFormatter={(l) => `Started ${l}`} />
                    <Bar dataKey="days" fill="#ee89a6" radius={[8, 8, 0, 0]} animationDuration={900} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">All periods</h2>
              <button className="btn btn-soft !py-1.5 !text-xs" onClick={() => setNewestFirst((v) => !v)}>
                <ArrowDownUp size={14} /> {newestFirst ? 'Newest first' : 'Oldest first'}
              </button>
            </div>
            <ul className="space-y-3">
              {rows.map((p, i) => (
                <motion.li
                  layout key={p.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}
                  className="flex items-start gap-3 rounded-2xl bg-gradient-to-r from-blush-50 to-lavender-50 p-4"
                >
                  <div className="mt-1 h-10 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-blush-400 to-lavender-400" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{fmtRange(p.start_date, p.end_date)}</p>
                    <p className="text-sm text-lavender-700">
                      {p.duration_days ? `${p.duration_days} days` : 'Ongoing'}
                      {p.cycle_length ? ` · ${p.cycle_length}-day cycle` : ' · first recorded'}
                    </p>
                    {p.notes && <p className="mt-1 break-words text-sm italic">“{p.notes}”</p>}
                    <p className="mt-1 text-[11px] text-lavender-600/70">Saved {fmt(p.created_at.slice(0, 10))}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button aria-label="Edit period" className="rounded-full p-2 text-lavender-600 hover:bg-white" onClick={() => setModal({ period: p })}><Pencil size={16} /></button>
                    <button aria-label="Delete period" className="rounded-full p-2 text-blush-500 hover:bg-white" onClick={() => setConfirm(p)}><Trash2 size={16} /></button>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
