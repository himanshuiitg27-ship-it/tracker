// All dates are handled as local-calendar "YYYY-MM-DD" strings to avoid timezone drift.
const pad = (n) => String(n).padStart(2, '0')

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseISO = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const todayISO = () => toISO(new Date())
export const addDays = (iso, n) => {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}
export const diffDays = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 86400000)

export const fmt = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? parseISO(iso).toLocaleDateString(undefined, opts) : ''
export const fmtShort = (iso) => fmt(iso, { day: 'numeric', month: 'short' })
export const fmtLong = (iso) => fmt(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
export const fmtMonth = (year, month) =>
  new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

export const fmtRange = (start, end) =>
  end ? (start === end ? fmt(start) : `${fmtShort(start)} - ${fmt(end)}`) : `${fmt(start)} - ongoing`
