import type { ReactNode } from 'react'
import type { AnimalId, EggStage, TeamId } from '../game/types'
import { AnimalFace } from './animals/AnimalFace'
import { CARD_PALETTE } from '../theme/colors'
import { EggInNest, type EggMood } from './Egg'
import { StarIcon } from './icons'

export function CardFrame({ team, className = '' }: { team: TeamId; className?: string }) {
  return <img src={`/cards/team-${team}.svg`} alt="" className={`absolute inset-0 size-full ${className}`} />
}

export function NestRing({
  team,
  stage,
  mood,
  moodKey,
  className = '',
}: {
  team: TeamId
  stage: EggStage
  mood?: EggMood
  moodKey?: string | number
  className?: string
}) {
  const p = CARD_PALETTE[team]
  return (
    <div className={`relative aspect-square ${className}`}>
      <div
        className="absolute inset-[15%] rotate-45 rounded-[30%]"
        style={{ background: p.ringFill, boxShadow: `0 0 0 clamp(6px,7.5cqw,12px) ${p.ringIn}, 0 0 0 clamp(9px,11cqw,17px) ${p.ring}` }}
      />
      <EggInNest team={team} stage={stage} mood={mood} moodKey={moodKey} className="absolute inset-x-[2%] top-[4%] w-[96%]" />
    </div>
  )
}

export function ScoreText({ team, children, className = '' }: { team: TeamId; children: ReactNode; className?: string }) {
  return (
    <span
      className={`font-display text-white tabular-nums ${className}`}
      style={{ WebkitTextStroke: `5px ${CARD_PALETTE[team].ringIn}`, paintOrder: 'stroke fill', letterSpacing: '.02em' }}
    >
      {children}
    </span>
  )
}

export interface CardPawn {
  id: string
  name: string
  animal: AnimalId
  active: boolean
}

export function TeamCard({
  team,
  label,
  score,
  goal,
  stage,
  pawns,
  kept,
  current,
  turnLabel,
  mood,
  moodKey,
  onKept,
  onClick,
}: {
  team: TeamId
  label: string
  score: number
  goal: number
  stage: EggStage
  pawns: CardPawn[]
  kept: number
  current: boolean
  turnLabel: string
  mood?: EggMood
  moodKey?: string | number
  onKept?: () => void
  onClick?: () => void
}) {
  const p = CARD_PALETTE[team]
  return (
    <div
      className={`[container-type:inline-size] relative aspect-[171/239] w-full transition-[transform,opacity,filter] duration-300 ${current ? '-translate-y-1' : 'opacity-90 saturate-[.85]'}`}
      style={{
        transitionTimingFunction: 'cubic-bezier(.3,1.5,.5,1)',
        filter: current ? 'drop-shadow(0 10px 18px rgba(40,60,40,.18))' : 'drop-shadow(0 6px 12px rgba(40,60,40,.1))',
      }}
      onClick={onClick}
    >
      <CardFrame team={team} />
      {current && (
        <span className="gloss bg-yellow font-display anim-pop absolute -top-[4.5%] right-[6%] z-10 rounded-[9px] px-[6%] py-[1.5%] text-[clamp(9px,6.5cqw,13px)] whitespace-nowrap text-white uppercase shadow-[0_2px_0_#E0A800]">
          {turnLabel}
        </span>
      )}
      <span
        className="font-display absolute top-[4.2%] left-[8.5%] max-w-[78%] truncate rounded-full px-[5%] py-[1%] text-[clamp(9px,6.4cqw,13px)] text-white uppercase"
        style={{ background: p.pill, boxShadow: `inset 0 0 0 1px ${p.pillLine}` }}
      >
        {label}
      </span>
      <NestRing team={team} stage={stage} mood={mood} moodKey={moodKey} className="absolute top-[14%] left-[11%] w-[78%]" />
      <div className="absolute inset-x-0 top-[58%] text-center leading-none">
        <ScoreText team={team} className="text-[clamp(18px,14cqw,30px)]">
          <span key={score} className={score ? 'score-bump' : ''}>
            {score}
          </span>
          /{goal}
        </ScoreText>
      </div>
      <div className="bg-line absolute top-[80%] right-[8%] left-[8%] h-[6%] overflow-hidden rounded-full">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
          style={{ width: `${Math.min(1, score / goal) * 100}%`, background: p.bar, transitionTimingFunction: 'cubic-bezier(.3,1.3,.5,1)' }}
        >
          <div className="absolute top-[28%] right-[5px] left-[5px] h-[24%] rounded-full bg-white/50" />
        </div>
      </div>
      <div className="absolute bottom-[2.5%] left-[6%] flex gap-[3%]">
        {pawns.map((pawn) => (
          <span
            key={pawn.id}
            className={`block aspect-square w-[clamp(22px,18cqw,32px)] rounded-full ${pawn.active ? 'anim-pop' : ''}`}
            style={{ boxShadow: pawn.active ? `0 0 0 2px ${p.ring}, 0 0 0 4px #fff, 0 0 0 6px #FFC800` : `0 0 0 2px ${p.ring}, 0 0 0 4px #fff` }}
            title={pawn.name}
          >
            <AnimalFace animal={pawn.animal} className="!size-full" />
          </span>
        ))}
      </div>
      {kept > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onKept?.()
          }}
          className="font-display absolute right-[6%] bottom-[3.5%] flex items-center gap-1 rounded-full bg-[#FFF5D3] px-2 py-0.5 text-[clamp(10px,7cqw,13px)] text-[#C88A00] shadow-[inset_0_0_0_1.5px_#FFE07A]"
          aria-label={`Bonus ${kept}`}
        >
          <StarIcon className="text-yellow size-[1.1em]" />
          {kept}
        </button>
      )}
    </div>
  )
}
