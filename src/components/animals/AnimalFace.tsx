import type { AnimalId } from '../../game/types'

const BG: Record<AnimalId, string> = {
  fox: '#FFF4DA',
  frog: '#EEF6DC',
  goat: '#FFF9EA',
  koala: '#EEF1F7',
}

export function AnimalFace({ animal, size = 32, ring, className = '' }: { animal: AnimalId; size?: number; ring?: string; className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, background: BG[animal], boxShadow: ring ? `0 0 0 ${Math.max(2, size * 0.08)}px ${ring}` : undefined }}
    >
      <img src={`/animals/faces/${animal}.webp`} alt="" draggable={false} className="size-full" />
    </span>
  )
}
