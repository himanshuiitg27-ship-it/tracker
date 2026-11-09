import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import { useData } from '../context/DataContext'

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-label="Loading" />
}

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-lavender-900/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] bg-cream-50 p-6 shadow-2xl sm:max-w-md sm:rounded-[2rem]"
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-lavender-600 hover:bg-lavender-100">
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, busy }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="mb-6 text-sm leading-relaxed text-lavender-700">{message}</p>
      <div className="flex gap-3">
        <button className="btn btn-soft flex-1" onClick={onCancel} disabled={busy}>
          Keep it
        </button>
        <button className="btn btn-danger flex-1" onClick={onConfirm} disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />} {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export function Toast() {
  const { toast } = useData()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg ${
              toast.type === 'error' ? 'bg-blush-500 text-white' : 'bg-lavender-700 text-white'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-8 text-center">
      <AlertCircle className="text-blush-500" size={32} />
      <p className="font-medium">We couldn't load your data</p>
      <p className="text-sm text-lavender-700">{message}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function PageTitle({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-lavender-700">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'lavender' }) {
  const tones = {
    lavender: 'bg-lavender-100 text-lavender-600',
    blush: 'bg-blush-100 text-blush-500',
  }
  return (
    <motion.div whileHover={{ y: -3 }} className="card p-4 sm:p-5">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-lavender-600">{label}</p>
      <p className="font-display mt-0.5 text-2xl leading-tight sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-lavender-700/80">{hint}</p>}
    </motion.div>
  )
}
