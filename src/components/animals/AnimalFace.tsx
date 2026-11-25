import type { AnimalId } from '../../game/types'

const CROP: Record<AnimalId, { w: number; x: number; y: number; bg: string }> = {
  fox: { w: 86, x: 12, y: 4, bg: '#FFF4DA' },
  frog: { w: 112, x: -6, y: 4, bg: '#EEF6DC' },
  goat: { w: 100, x: 0, y: 9, bg: '#FFF9EA' },
  koala: { w: 84, x: 6, y: 6, bg: '#EEF1F7' },
}

export function AnimalFace({ animal, size = 32, ring, className = '' }: { animal: AnimalId; size?: number; ring?: string; className?: string }) {
  const c = CROP[animal]
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, background: c.bg, boxShadow: ring ? `0 0 0 ${Math.max(2, size * 0.08)}px ${ring}` : undefined }}
    >
      <img
        src={`/animals/${animal}.svg`}
        alt=""
        draggable={false}
        className="absolute max-w-none"
        style={{ width: `${c.w}%`, left: `${c.x}%`, top: `${c.y}%` }}
      />
    </span>
  )
}
