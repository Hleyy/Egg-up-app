import { useId } from 'react'
import type { EggStage, TeamId } from '../game/types'

export type EggMood = 'idle' | 'hop' | 'sad' | 'shiver' | 'wobble'

const MOOD_CLASS: Record<EggMood, string> = {
  idle: 'anim-breathe',
  hop: 'anim-hop',
  sad: 'anim-sad',
  shiver: 'anim-shiver',
  wobble: 'anim-wobble',
}

export function EggInNest({
  team,
  stage,
  mood = 'idle',
  moodKey,
  className = '',
  label,
}: {
  team: TeamId
  stage: EggStage
  mood?: EggMood
  moodKey?: string | number
  className?: string
  label?: string
}) {
  const id = useId().replace(/:/g, '')
  const effective = mood === 'idle' && stage === 1 ? 'wobble' : mood
  return (
    <svg
      viewBox="0 0 320 300"
      className={`block overflow-visible ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <clipPath id={`front${id}`}>
          <path d="M10 112 L88 146 Q160 206 234 146 L310 112 L310 300 L10 300Z" />
        </clipPath>
      </defs>
      <ellipse cx="160" cy="236" rx="118" ry="12" fill="#3C3A45" opacity=".08" />
      <image href="/img/nest.webp" x="0" y="-10" width="320" height="320" />
      <g transform="translate(100 18) scale(1)">
        <g key={moodKey} className={MOOD_CLASS[effective]} style={{ transformBox: 'fill-box' }}>
          <image href={`/eggs/${team}-${stage}.svg`} x="-10" y="-9" width="140" height="174" />
        </g>
      </g>
      <image href="/img/nest.webp" x="0" y="-10" width="320" height="320" clipPath={`url(#front${id})`} />
    </svg>
  )
}
