import { useState } from 'react'
import { Animal } from '../../components/animals/Animal'
import { EggInNest } from '../../components/Egg'
import { BottomPanel, Btn, PauseButton, Progress, Scene, TopBar } from '../../components/ui'
import { teamPawns } from '../../game/selectors'
import { HATCH_SEASON, SQUARES_PER_SEASON, STAGE_STEP, eggStageOf, squaresToSeason } from '../../game/rules'
import { useLabels, useTurn } from '../../game/useView'
import type { EggStage } from '../../game/types'
import { GameHeader, TeamCards } from './parts'
import { TEAM_COLOR } from '../../theme/colors'
import { useGame } from '../../game/useGame'
import { useSettings } from '../../settings/useSettings'

function Glow({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{ background: 'radial-gradient(circle, rgba(255,224,140,.75), rgba(255,224,140,0) 62%)', animation: 'pop-in 1s cubic-bezier(.2,.8,.3,1) both' }}
    />
  )
}

export function EvolveView() {
  const turn = useTurn()!
  const { game } = turn
  const { t } = useSettings()
  const { next } = useGame()
  const labels = useLabels()
  if (game.phase.kind !== 'evolve') return null
  const { team, stage } = game.phase
  const score = game.teams[team].score
  const names = t('evolve.stages').split('|')
  const c = TEAM_COLOR[team]
  return (
    <>
      <Scene strong />
      <TopBar left={<PauseButton />} />
      <div className="mt-6 text-center">
        <div className="kicker text-sub">{t('evolve.kicker', { team: labels.team(game, team), n: score })}</div>
        <h1 className="anim-pop font-display text-ink mt-2 text-[28px] leading-tight">{t(`evolve.title${stage}` as 'evolve.title1')}</h1>
      </div>
      <div className="relative mx-auto mt-4 w-[80%] max-w-[320px]">
        <Glow className="inset-[-20%]" />
        <EggInNest team={team} stage={stage} mood="hop" moodKey={stage} className="relative w-full" />
      </div>
      <div className="mx-auto mt-6 w-full max-w-[340px]">
        <div className="relative flex items-center justify-between px-2">
          <div className="bg-line absolute inset-x-4 top-1/2 h-1.5 -translate-y-1/2 rounded-full" />
          <div
            className="absolute top-1/2 left-4 h-1.5 -translate-y-1/2 rounded-full transition-[width] duration-700"
            style={{ width: `calc((100% - 2rem) * ${stage / 4})`, background: c.f }}
          />
          {[0, 1, 2, 3, 4].map((s) => (
            <span
              key={s}
              className={`relative z-10 size-5 rounded-full ${s === stage ? 'anim-pop' : ''}`}
              style={{ background: s <= stage ? c.f : '#E5E5E5', boxShadow: s === stage ? `0 0 0 4px #fff, 0 0 0 7px ${c.f}` : '0 0 0 3px #fff' }}
            />
          ))}
        </div>
        <div className="text-sub mt-3 flex justify-between text-[12px]">
          {names.map((n) => (
            <span key={n} className="w-12 text-center">
              {n}
            </span>
          ))}
        </div>
      </div>
      <p className="text-sub mt-5 text-center text-[15px]">{t('evolve.detail', { n: Math.max(0, (stage + 1) * STAGE_STEP - score) })}</p>
      <BottomPanel className="mt-6">
        <Btn shine className="w-full" onClick={next}>
          {t('common.continue')}
        </Btn>
      </BottomPanel>
    </>
  )
}

export function SpringView() {
  const turn = useTurn()!
  const { game, season } = turn
  const { t } = useSettings()
  const { next } = useGame()
  if (game.phase.kind !== 'spring') return null
  const team = game.phase.team
  const score = game.teams[team].score
  const left = Math.min(...teamPawns(game, team).map((p) => squaresToSeason(p.distance, HATCH_SEASON)))
  const total = 3 * SQUARES_PER_SEASON
  return (
    <>
      <GameHeader game={game} season={season} />
      <TeamCards game={game} moods={{ [team]: 'hop' }} moodKey="spring" className="mt-4" />
      <div className="anim-rise mt-5 flex items-center gap-3 rounded-[24px] bg-[#E3FFCF] p-4 shadow-[inset_0_0_0_2px_#B8F28B,0_4px_0_#B8F28B]">
        <Animal animal="frog" cue="hello" cueKey="spring" className="w-[30%] max-w-[120px] shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] leading-snug text-[#3D8A00]">{t(game.mode === 'class' ? 'spring.groupTitle' : 'spring.title', { n: score })}</p>
          <div className="mt-3 flex items-center gap-2">
            <Progress value={1 - left / total} color="#58CC02" lip="#58A700" height={14} className="flex-1" />
            <span className="font-display text-[14px] text-[#3D8A00]">{t('spring.left', { n: left })}</span>
          </div>
        </div>
      </div>
      <BottomPanel className="mt-6">
        <Btn shine className="w-full" onClick={next}>
          {t('common.continue')}
        </Btn>
      </BottomPanel>
    </>
  )
}

export function HatchView() {
  const turn = useTurn()!
  const { game } = turn
  const { t, buzz } = useSettings()
  const { hatch } = useGame()
  const labels = useLabels()
  const [taps, setTaps] = useState(0)
  if (game.phase.kind !== 'hatch') return null
  const team = game.phase.team
  const score = game.teams[team].score
  const inSpring =
    game.players.find((p) => p.team === team && teamPawns(game, team).some((pw) => pw.id === p.pawn && squaresToSeason(pw.distance, HATCH_SEASON) === 0)) ??
    game.players.find((p) => p.team === team)!
  const name = game.mode === 'class' ? labels.team(game, team) : inSpring.name
  const stage = Math.min(4, eggStageOf(score)) as EggStage

  const tap = () => {
    if (taps >= 3) return
    const n = taps + 1
    buzz(n === 3 ? [40, 60, 80] : 30)
    setTaps(n)
    if (n === 3) window.setTimeout(hatch, 900)
  }

  return (
    <>
      <Scene season="spring" strong />
      <div className="mt-[8vh] text-center">
        <div className="kicker text-sub">{t('hatch.kicker', { n: score })}</div>
        <h1 className="font-display text-ink mt-2 text-[30px] leading-tight">{t('hatch.title')}</h1>
        <p className="text-sub mt-2 text-[15px]">{t('hatch.detail', { name })}</p>
      </div>
      <button type="button" onClick={tap} className="relative mx-auto mt-6 w-[86%] max-w-[360px]" aria-label={t('hatch.tap')}>
        <Glow className={`inset-[-18%] transition-transform duration-700 ${taps ? 'scale-110' : ''}`} />
        <EggInNest team={team} stage={taps >= 2 ? 4 : stage} mood={taps ? 'shiver' : 'wobble'} moodKey={taps} className="relative w-full" />
      </button>
      <div className="mt-6 flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-3 rounded-full transition-all"
            style={{ background: i < taps ? '#FFC800' : '#E5E5E5', transform: i < taps ? 'scale(1.25)' : undefined }}
          />
        ))}
      </div>
      <p className="font-display text-sub mt-3 text-center text-[15px] tracking-[.1em] uppercase">{t('hatch.tap')}</p>
    </>
  )
}
