import { useId } from 'react'
import type { EggStage, TeamId } from '../game/types'
import { EGG_COLOR } from '../theme/colors'

export type EggMood = 'idle' | 'hop' | 'sad' | 'shiver' | 'wobble'

const EGG_PATH = 'M60 6 C90 6 112 60 112 96 C112 130 90 156 60 156 C30 156 8 130 8 96 C8 60 30 6 60 6Z'

const CRACKS = ['M64 7 L58 22 L68 30 L61 42', 'M110 82 L96 86 L101 96 L89 101', 'M12 80 L26 86 L21 97 L34 102', 'M48 46 L60 54 L52 62 L66 70 L58 76']

export function EggShape({ team, stage, peek = stage >= 3 }: { team: TeamId; stage: EggStage; peek?: boolean }) {
  const id = useId().replace(/:/g, '')
  const { c, d } = EGG_COLOR[team]
  const cracks = stage <= 1 ? 0 : stage === 2 ? 2 : 4
  return (
    <g>
      <defs>
        <clipPath id={`egg${id}`}>
          <path d={EGG_PATH} />
        </clipPath>
      </defs>
      <path d={EGG_PATH} fill="#FFF4E2" />
      <g clipPath={`url(#egg${id})`}>
        <path d="M74 0 C104 30 118 80 112 120 C106 150 80 166 50 162 C88 150 104 110 96 70 C92 44 84 18 74 0Z" fill="#F3E2C8" />
        <path d="M0 106 C20 96 38 112 60 104 C82 96 100 108 120 100 V170 H0Z" fill={c} />
        <path d="M120 100 C116 132 96 156 60 160 C92 146 106 124 120 100Z" fill={d} opacity=".55" />
        <circle cx="40" cy="62" r="5" fill={c} opacity=".55" />
        <circle cx="78" cy="48" r="3.5" fill={c} opacity=".5" />
        <circle cx="84" cy="80" r="6.5" fill={c} opacity=".45" />
        <circle cx="55" cy="84" r="3" fill={c} opacity=".5" />
      </g>
      <ellipse cx="38" cy="44" rx="9" ry="17" transform="rotate(24 38 44)" fill="#fff" opacity=".9" />
      <circle cx="50" cy="26" r="3.5" fill="#fff" opacity=".9" />
      <g fill="none" stroke="#7A5C45" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {CRACKS.slice(0, cracks).map((p) => (
          <path key={p} d={p} />
        ))}
      </g>
      {peek && (
        <g>
          <path d="M44 60 L52 52 L58 60 L66 51 L74 60 L80 54 L80 72 L44 72Z" fill="#3B2E28" />
          <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'blink 3.6s infinite' }}>
            <ellipse cx="55" cy="64" rx="3.4" ry="4.2" fill="#fff" />
            <ellipse cx="69" cy="64" rx="3.4" ry="4.2" fill="#fff" />
            <circle cx="56" cy="65" r="1.8" fill="#22202A" />
            <circle cx="70" cy="65" r="1.8" fill="#22202A" />
          </g>
        </g>
      )}
    </g>
  )
}

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
          <EggShape team={team} stage={stage} />
        </g>
      </g>
      <image href="/img/nest.webp" x="0" y="-10" width="320" height="320" clipPath={`url(#front${id})`} />
    </svg>
  )
}
