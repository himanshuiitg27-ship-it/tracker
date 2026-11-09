import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PageTitle } from '../components/ui'
import { DISCLAIMER, TIPS, TIP_CATEGORIES } from '../lib/content'

export default function TipsPage() {
  const [cat, setCat] = useState('all')
  const shown = cat === 'all' ? TIPS : TIPS.filter((t) => t.cat === cat)

  return (
    <div>
      <PageTitle title="Health & Hygiene" subtitle="Gentle, practical guidance for every phase of your cycle" />

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        <button className="chip shrink-0" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>All</button>
        {TIP_CATEGORIES.map((c) => (
          <button key={c.id} className="chip shrink-0" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <motion.div layout className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((t) => {
            const c = TIP_CATEGORIES.find((x) => x.id === t.cat)
            const urgent = t.cat === 'doctor'
            return (
              <motion.article
                layout key={t.title}
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                className={`card p-5 ${urgent ? '!border-blush-200 !bg-blush-50' : ''}`}
              >
                <div className="mb-2 text-2xl">{c.emoji}</div>
                <p className={`text-xs font-semibold uppercase tracking-wide ${urgent ? 'text-blush-500' : 'text-lavender-600'}`}>{c.label}</p>
                <h3 className="mt-1 font-semibold">{t.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-lavender-700">{t.body}</p>
              </motion.article>
            )
          })}
        </AnimatePresence>
      </motion.div>

      <p className="mt-8 text-center text-xs text-lavender-700/70">{DISCLAIMER}</p>
    </div>
  )
}
