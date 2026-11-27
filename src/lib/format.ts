export function initial(name: string): string {
  const number = /^(player|joueur)\s*(\d+)$/i.exec(name.trim())
  if (number) return number[2]
  return (name.trim()[0] ?? '?').toUpperCase()
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
