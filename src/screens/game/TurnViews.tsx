import { useEffect, useState } from 'react'
import { Board } from '../../components/board/Board'
import { preloadBoard } from '../../components/board/loadBoard3D'
import { DicePair } from '../../components/Dice'
import { DiceIcon } from '../../components/icons'
import { Avatar, BottomPanel, Btn, Pill, Stepper } from '../../components/ui'
import { squareTypeAt } from '../../data/board'
import { teamCanHatch } from '../../game/selectors'
import { POINTS, questionSquare, rollDice, seasonOf, squareOf } from '../../game/rules'
import { boardPawns, eggStages, useLabels, useTurn } from '../../game/useView'
import { GameHeader, SquareIcon, TeamCards } from './parts'
import { SEASON_COLOR } from '../../theme/colors'
import { useGame } from '../../game/useGame'
import { useSettings } from '../../settings/useSettings'

export function RollView() {
  const turn = useTurn()!
  const { game, player, pawn, season } = turn
  const { t, buzz, play } = useSettings()
  const { dispatch } = useGame()
  const labels = useLabels()
  const [rolling, setRolling] = useState<[number, number] | null>(null)
  useEffect(preloadBoard, [])

  const roll = () => {
    if (rolling) return
    const dice = rollDice()
    buzz([18, 40, 18])
    play('dice')
    setRolling(dice)
    window.setTimeout(() => dispatch({ type: 'roll', dice }), 1150)
  }

  const kept = game.teams[player.team].kept.length
  const isClass = game.mode === 'class'
  return (
    <>
      <GameHeader game={game} season={season} />
      <TeamCards game={game} className="mt-4" />
      <div className="glass anim-rise mt-4 flex items-center gap-3 rounded-[20px] px-3 py-2.5" key={player.id}>
        <Avatar name={isClass ? (player.team === 'red' ? 'R' : 'B') : player.name} team={player.team} size={38} ring />
        <div className="min-w-0">
          <div className="text-ink truncate text-[19px] leading-tight">
            {isClass ? t('game.turnOf', { name: labels.team(game, player.team) }) : t('game.turnOf', { name: player.name })}
          </div>
          <div className="text-sub truncate text-[13px]">
            {isClass
              ? t('game.groupDetail')
              : t('game.turnDetail', { team: labels.team(game, player.team), n: squareOf(pawn.distance) + 1, season: t(`season.${season}`) })}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6">
        <DicePair values={rolling} size={78} onRoll={roll} label={t('game.roll')} />
        <span className="glass text-ink rounded-full px-4 py-1.5 text-[14px]">{t('game.tapDice')}</span>
      </div>
      <BottomPanel>
        <Btn shine className="w-full" onClick={roll} disabled={!!rolling}>
          <DiceIcon />
          {t('game.roll')}
        </Btn>
        <p className="text-sub mt-3 text-center text-[13px]">
          {kept > 0
            ? t('game.keptHint', { n: kept })
            : isClass
              ? t('game.classHint')
              : t('game.teamsHint', { name: player.name, team: labels.team(game, player.team) })}
        </p>
      </BottomPanel>
    </>
  )
}

export function MoveView() {
  const turn = useTurn()!
  const { game, player } = turn
  const { t } = useSettings()
  const { land, fixMove } = useGame()
  const labels = useLabels()
  const [fixing, setFixing] = useState(false)
  const phase = game.phase
  if (phase.kind !== 'move') return null
  const landing = squareOf(phase.to)
  const type = squareTypeAt(phase.to)
  const landSeason = seasonOf(phase.to)
  const q = questionSquare(type)
  const hatch = teamCanHatch(game, player.team)
  const name = game.mode === 'class' ? labels.team(game, player.team) : player.name
  const total = phase.dice[0] + phase.dice[1]
  const c = SEASON_COLOR[landSeason]

  return (
    <>
      <GameHeader game={game} season={landSeason} />
      <div className="relative -mx-4 mt-2 h-[38vh] min-h-[230px] lg:hidden">
        <Board pawns={boardPawns(game)} eggs={eggStages(game)} focus={player.pawn} className="absolute inset-0" />
        <div className="pointer-events-none absolute right-4 bottom-2 flex items-center gap-2">
          <DicePair values={phase.dice} size={34} />
          <span className="glass font-display text-ink grid h-10 min-w-10 place-items-center rounded-xl px-2 text-[22px]">{total}</span>
        </div>
      </div>
      <div className="hidden lg:block">
        <TeamCards game={game} className="mt-4" />
        <div className="mt-6 flex items-center justify-center gap-4">
          <DicePair values={phase.dice} size={62} />
          <span className="glass font-display text-ink grid h-14 min-w-14 place-items-center rounded-2xl px-3 text-[30px]">{total}</span>
        </div>
      </div>
      <BottomPanel className="anim-sheet">
        <h2 className="font-display text-ink text-[24px] leading-tight">{t('game.moveTitle', { name, n: total })}</h2>
        <p className="text-sub mt-1 text-[14px]">{t('game.moveDetail', { from: squareOf(phase.from) + 1, to: landing + 1 })}</p>
        <div className="tile mt-4 flex items-center gap-4 px-4 py-3">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl" style={{ background: c.soft }}>
            <SquareIcon type={type} size={46} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="kicker text-sub text-[11px]">{t('game.landOn')}</div>
            <div className="text-ink text-[20px] leading-tight">{t(`square.${type}`)}</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {q && (
                <Pill color={c.f} lip={c.l}>
                  {t('deck')}
                </Pill>
              )}
              {q && (
                <Pill color="#58CC02" lip="#58A700">
                  +{POINTS[q]} {t('common.pts')}
                </Pill>
              )}
            </div>
          </div>
          {fixing && <Stepper label={t('game.fix')} value={landing + 1} onMinus={() => fixMove(-1)} onPlus={() => fixMove(1)} />}
        </div>
        <button type="button" className="text-blue mx-auto mt-3 block text-[14px]" onClick={() => setFixing((f) => !f)}>
          {fixing ? t('game.fixDone') : t('game.fix')}
        </button>
        <Btn shine color={hatch ? 'yellow' : 'green'} className="mt-3 w-full" onClick={land}>
          {hatch ? t('game.hatchNow') : t('game.draw')}
        </Btn>
      </BottomPanel>
    </>
  )
}
